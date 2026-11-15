/**
 * Build-time Markdown -> Pre-rendered HTML compiler using unified + remark + rehype + Shiki.
 *
 * Runs at build time before deployment to Cloudflare Workers Static Assets so clients
 * receive ready-to-paint semantic HTML (with GitHub-style Warning/Note callouts,
 * HTML5 MathML formulas rendered directly as safe HAST AST nodes without raw HTML,
 * heading IDs, keyboard-scrollable tables, and dual-theme syntax highlighting) with
 * zero client-side Markdown/LaTeX parsing cost and zero inline `style="..."` attributes.
 */

import { createHash } from "node:crypto";

import rehypeShiki from "@shikijs/rehype";
import GithubSlugger from "github-slugger";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import { remarkAlert } from "remark-github-blockquote-alert";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

export interface TocHeading {
  readonly depth: 2 | 3;
  readonly id: string;
  readonly text: string;
}

interface HastText {
  type: "text";
  value: string;
}

interface HastElement {
  type: "element";
  tagName: string;
  properties?: Record<string, unknown>;
  children: HastNode[];
}

interface HastParent {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

type HastNode = HastElement | HastText | HastParent;

interface MathToken {
  readonly block: boolean;
  readonly expr: string;
}

interface PreparedMarkdown {
  readonly prefix: string;
  readonly markdown: string;
  readonly tokens: readonly MathToken[];
}

const MATHML_NS = "http://www.w3.org/1998/Math/MathML";

const TEX_SYMBOLS: Readonly<Record<string, string>> = {
  Delta: "\u0394",
  Gamma: "\u0393",
  Theta: "\u0398",
  Lambda: "\u039b",
  Pi: "\u03a0",
  Sigma: "\u03a3",
  Phi: "\u03a6",
  Omega: "\u03a9",
  alpha: "\u03b1",
  beta: "\u03b2",
  gamma: "\u03b3",
  delta: "\u03b4",
  epsilon: "\u03b5",
  varepsilon: "\u03b5",
  zeta: "\u03b6",
  eta: "\u03b7",
  theta: "\u03b8",
  lambda: "\u03bb",
  mu: "\u03bc",
  pi: "\u03c0",
  rho: "\u03c1",
  sigma: "\u03c3",
  tau: "\u03c4",
  phi: "\u03c6",
  omega: "\u03c9",
  infty: "\u221e",
  cdot: "\u00b7",
  times: "\u00d7",
  pm: "\u00b1",
  le: "\u2264",
  leq: "\u2264",
  ge: "\u2265",
  geq: "\u2265",
  neq: "\u2260",
  approx: "\u2248",
  in: "\u2208",
  notin: "\u2209",
  subset: "\u2282",
  subseteq: "\u2286",
  cup: "\u222a",
  cap: "\u2229",
  to: "\u2192",
  rightarrow: "\u2192",
  leftarrow: "\u2190",
  Rightarrow: "\u21d2",
  Leftarrow: "\u21d0",
  lceil: "\u2308",
  rceil: "\u2309",
  lfloor: "\u230a",
  rfloor: "\u230b",
  sum: "\u2211",
  prod: "\u220f",
  lim: "lim",
  ",": "\u2009",
  ";": "\u2005",
  quad: "\u2001",
  qquad: "\u2001\u2001",
  "{": "{",
  "}": "}",
  "|": "|",
};

const OPERATOR_CMDS = new Set([
  "cdot",
  "times",
  "pm",
  "le",
  "leq",
  "ge",
  "geq",
  "neq",
  "approx",
  "in",
  "notin",
  "subset",
  "subseteq",
  "cup",
  "cap",
  "to",
  "rightarrow",
  "leftarrow",
  "Rightarrow",
  "Leftarrow",
  "lceil",
  "rceil",
  "lfloor",
  "rfloor",
  "sum",
  "prod",
  "lim",
  "{",
  "}",
  "|",
]);

const SPACE_CMDS = new Set([",", ";", "quad", "qquad"]);
const UNDER_OVER_CMDS = new Set(["sum", "prod", "lim"]);

const ACCENT_CMDS: Readonly<Record<string, string>> = {
  dot: "\u02d9",
  ddot: "\u00a8",
  bar: "\u00af",
  hat: "^",
  vec: "\u2192",
  tilde: "~",
};

const VARIANT_CMDS: Readonly<Record<string, string>> = {
  mathcal: "script",
  mathbf: "bold",
  mathrm: "normal",
};

const shikiTokenDecls = new Map<string, string>();
const renderedHtmlCache = new Map<string, Promise<string>>();

function hEl(
  tagName: string,
  children: HastNode[] = [],
  properties: Record<string, unknown> = {},
): HastElement {
  return { type: "element", tagName, properties, children };
}

function hText(value: string): HastText {
  return { type: "text", value };
}

interface ParsedAtom {
  readonly node: HastElement;
  readonly command?: string;
}

class TexAstParser {
  private readonly src: string;
  private pos = 0;

  constructor(src: string) {
    this.src = src;
  }

  private skipWs(): void {
    while (this.pos < this.src.length && /\s/u.test(this.src[this.pos] ?? "")) {
      this.pos += 1;
    }
  }

  private parseGroupText(): string {
    this.skipWs();
    if (this.pos < this.src.length && this.src[this.pos] === "{") {
      this.pos += 1;
      let depth = 1;
      const start = this.pos;
      while (this.pos < this.src.length && depth > 0) {
        const ch = this.src[this.pos];
        if (ch === "{") {
          depth += 1;
        } else if (ch === "}") {
          depth -= 1;
          if (depth === 0) {
            const text = this.src.slice(start, this.pos);
            this.pos += 1;
            return text;
          }
        }
        this.pos += 1;
      }
      return this.src.slice(start);
    }
    if (this.pos < this.src.length) {
      const ch = this.src[this.pos] ?? "";
      this.pos += 1;
      return ch;
    }
    return "";
  }

  private parseDelimiter(): HastElement | null {
    this.skipWs();
    if (this.pos >= this.src.length) return null;
    const ch = this.src[this.pos] ?? "";
    if (ch === ".") {
      this.pos += 1;
      return null;
    }
    if (ch === "\\") {
      this.pos += 1;
      const start = this.pos;
      if (this.pos < this.src.length && !/[A-Za-z]/u.test(this.src[this.pos] ?? "")) {
        this.pos += 1;
      } else {
        while (
          this.pos < this.src.length &&
          /[A-Za-z]/u.test(this.src[this.pos] ?? "")
        ) {
          this.pos += 1;
        }
      }
      const cmd = this.src.slice(start, this.pos);
      const sym = TEX_SYMBOLS[cmd] ?? cmd;
      return hEl("mo", [hText(sym)], { stretchy: "true" });
    }
    this.pos += 1;
    return hEl("mo", [hText(ch)], { stretchy: "true" });
  }

  parseExpr(stopOnBrace = false): HastElement {
    const nodes: HastElement[] = [];
    while (this.pos < this.src.length) {
      this.skipWs();
      if (this.pos >= this.src.length) break;
      if (stopOnBrace && this.src[this.pos] === "}") {
        this.pos += 1;
        break;
      }
      const node = this.parseScriptedAtom();
      if (node) nodes.push(node);
    }
    if (nodes.length === 0) return hEl("mrow");
    if (nodes.length === 1 && nodes[0]) return nodes[0];
    return hEl("mrow", nodes);
  }

  private parseScriptedAtom(): HastElement | null {
    const parsed = this.parseAtom();
    if (!parsed) return null;
    let sub: HastElement | null = null;
    let sup: HastElement | null = null;
    while (this.pos < this.src.length) {
      this.skipWs();
      if (this.pos >= this.src.length) break;
      const marker = this.src[this.pos];
      if (marker === "_" && sub === null) {
        this.pos += 1;
        sub = this.parseAtom()?.node ?? hEl("mrow");
      } else if (marker === "^" && sup === null) {
        this.pos += 1;
        sup = this.parseAtom()?.node ?? hEl("mrow");
      } else {
        break;
      }
    }
    const useLimits =
      parsed.command !== undefined && UNDER_OVER_CMDS.has(parsed.command);
    if (sub && sup) {
      return hEl(useLimits ? "munderover" : "msubsup", [parsed.node, sub, sup]);
    }
    if (sub) {
      return hEl(useLimits ? "munder" : "msub", [parsed.node, sub]);
    }
    if (sup) {
      return hEl(useLimits ? "mover" : "msup", [parsed.node, sup]);
    }
    return parsed.node;
  }

  private parseAtom(): ParsedAtom | null {
    this.skipWs();
    if (this.pos >= this.src.length) return null;
    const ch = this.src[this.pos] ?? "";
    if (ch === "{") {
      this.pos += 1;
      return { node: this.parseExpr(true) };
    }
    if (ch === "\\") {
      this.pos += 1;
      if (this.pos >= this.src.length) return null;
      let cmd: string;
      if (!/[A-Za-z]/u.test(this.src[this.pos] ?? "")) {
        cmd = this.src[this.pos] ?? "";
        this.pos += 1;
      } else {
        const start = this.pos;
        while (
          this.pos < this.src.length &&
          /[A-Za-z]/u.test(this.src[this.pos] ?? "")
        ) {
          this.pos += 1;
        }
        cmd = this.src.slice(start, this.pos);
      }
      if (cmd === "frac") {
        const num = this.parseAtom()?.node ?? hEl("mrow");
        const den = this.parseAtom()?.node ?? hEl("mrow");
        return { node: hEl("mfrac", [num, den]) };
      }
      if (cmd === "sqrt") {
        const body = this.parseAtom()?.node ?? hEl("mrow");
        return { node: hEl("msqrt", [body]) };
      }
      if (cmd === "text") {
        return { node: hEl("mtext", [hText(this.parseGroupText())]) };
      }
      if (cmd === "operatorname") {
        return { node: hEl("mo", [hText(this.parseGroupText())]) };
      }
      const variant = VARIANT_CMDS[cmd];
      if (variant) {
        return {
          node: hEl("mi", [hText(this.parseGroupText())], {
            mathvariant: variant,
          }),
        };
      }
      if (cmd === "left" || cmd === "right") {
        const delim = this.parseDelimiter();
        return delim ? { node: delim } : { node: hEl("mrow") };
      }
      const accent = ACCENT_CMDS[cmd];
      if (accent) {
        const base = this.parseAtom()?.node ?? hEl("mrow");
        return {
          node: hEl("mover", [base, hEl("mo", [hText(accent)], { accent: "true" })]),
        };
      }
      const sym = TEX_SYMBOLS[cmd];
      if (sym !== undefined) {
        const tag = OPERATOR_CMDS.has(cmd)
          ? "mo"
          : SPACE_CMDS.has(cmd)
            ? "mtext"
            : "mi";
        return { node: hEl(tag, [hText(sym)]), command: cmd };
      }
      return { node: hEl("mi", [hText(cmd)]), command: cmd };
    }
    if (/[0-9]/u.test(ch)) {
      const start = this.pos;
      while (this.pos < this.src.length && /[0-9.]/u.test(this.src[this.pos] ?? "")) {
        this.pos += 1;
      }
      return { node: hEl("mn", [hText(this.src.slice(start, this.pos))]) };
    }
    if (/[A-Za-z]/u.test(ch)) {
      this.pos += 1;
      return { node: hEl("mi", [hText(ch)]) };
    }
    this.pos += 1;
    return { node: hEl("mo", [hText(ch)]) };
  }
}

function texToMathmlHast(expr: string, block: boolean): HastElement {
  const body = new TexAstParser(expr.trim()).parseExpr(false);
  if (block) {
    return hEl("div", [hEl("math", [body], { display: "block", xmlns: MATHML_NS })], {
      className: ["math-block"],
    });
  }
  return hEl("span", [hEl("math", [body], { xmlns: MATHML_NS })], {
    className: ["math-inline"],
  });
}

function replaceMathInProse(
  segment: string,
  prefix: string,
  tokens: MathToken[],
): string {
  const codeSpans: string[] = [];
  let masked = segment.replace(/(`+)([\s\S]*?)\1/gu, (whole) => {
    const id = codeSpans.length;
    codeSpans.push(whole);
    return `${prefix}C${id}END`;
  });

  const allocMath = (expr: string, block: boolean): string => {
    const id = tokens.length;
    tokens.push({ block, expr });
    return `${prefix}M${id}END`;
  };

  masked = masked.replace(
    /(?<!\\)\$\$\s*([\s\S]+?)\s*(?<!\\)\$\$/gu,
    (_whole, expr: string) => allocMath(expr, true),
  );
  masked = masked.replace(
    /(?<!\\)(?<!\$)\$(?!\s)([^\n$]+?)(?<!\s)(?<!\\)\$(?!\$|\d)/gu,
    (_whole, expr: string) => allocMath(expr, false),
  );

  return masked.replace(
    new RegExp(`${prefix}C(\\d+)END`, "gu"),
    (_whole, rawIdx: string) => codeSpans[Number(rawIdx)] ?? "",
  );
}

function prepareMarkdownWithMathTokens(markdown: string): PreparedMarkdown {
  let prefix = "KOMAMATH";
  while (markdown.includes(prefix)) {
    prefix += "X";
  }
  const tokens: MathToken[] = [];
  const outParts: string[] = [];
  const proseBuf: string[] = [];
  let fenceChar: "`" | "~" | null = null;
  let fenceLen = 0;

  const flushProse = (): void => {
    if (proseBuf.length === 0) return;
    outParts.push(replaceMathInProse(proseBuf.join(""), prefix, tokens));
    proseBuf.length = 0;
  };

  for (const line of markdown.split(/(?<=\n)/u)) {
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/u);
    if (fenceChar === null) {
      if (fenceMatch) {
        const marker = fenceMatch[1] ?? "";
        const rest = fenceMatch[2] ?? "";
        const char = marker[0] as "`" | "~";
        if (char !== "`" || !rest.includes("`")) {
          flushProse();
          fenceChar = char;
          fenceLen = marker.length;
          outParts.push(line);
          continue;
        }
      }
      proseBuf.push(line);
    } else {
      outParts.push(line);
      if (fenceMatch) {
        const marker = fenceMatch[1] ?? "";
        const rest = fenceMatch[2] ?? "";
        if (
          marker[0] === fenceChar &&
          marker.length >= fenceLen &&
          rest.trim() === ""
        ) {
          fenceChar = null;
          fenceLen = 0;
        }
      }
    }
  }
  flushProse();

  return {
    prefix,
    markdown: outParts.join(""),
    tokens,
  };
}

const CDN_VIDEO_URL_RE = /^https:\/\/cdn\.komawm\.org\/.+\.(mp4|webm)(?:[?#].*)?$/iu;

function isMathBlockElement(node: HastNode): boolean {
  if (node.type !== "element" || node.tagName !== "div") return false;
  const classes = node.properties?.className;
  return Array.isArray(classes) && classes.includes("math-block");
}

function isVideoFigureElement(node: HastNode): boolean {
  if (node.type !== "element" || node.tagName !== "figure") return false;
  const classes = node.properties?.className;
  return Array.isArray(classes) && classes.includes("doc-video");
}

function hasVisibleContent(nodes: HastNode[]): boolean {
  return nodes.some(
    (child) =>
      child.type !== "text" ||
      (typeof child.value === "string" && child.value.trim().length > 0),
  );
}

function splitParagraphOnBlocks(
  node: HastNode,
  isBlock: (child: HastNode) => boolean,
): HastNode[] | null {
  if (
    node.type !== "element" ||
    node.tagName !== "p" ||
    !Array.isArray(node.children) ||
    !node.children.some(isBlock)
  ) {
    return null;
  }
  const parts: HastNode[] = [];
  let currentInline: HastNode[] = [];
  const flushParagraph = (): void => {
    if (hasVisibleContent(currentInline)) {
      parts.push(hEl("p", currentInline, { ...node.properties }));
    }
    currentInline = [];
  };
  for (const child of node.children) {
    if (isBlock(child)) {
      flushParagraph();
      parts.push(child);
    } else {
      currentInline.push(child);
    }
  }
  flushParagraph();
  return parts;
}

function expandMathInNodeList(
  nodes: HastNode[],
  tokenRe: RegExp,
  tokens: readonly MathToken[],
  inCode: boolean,
): HastNode[] {
  const expanded: HastNode[] = [];
  for (const node of nodes) {
    if (node.type === "text" && typeof node.value === "string" && !inCode) {
      let lastIndex = 0;
      tokenRe.lastIndex = 0;
      for (const match of node.value.matchAll(tokenRe)) {
        const matchStart = match.index ?? 0;
        if (matchStart > lastIndex) {
          expanded.push(hText(node.value.slice(lastIndex, matchStart)));
        }
        const token = tokens[Number(match[1])];
        if (token) {
          expanded.push(texToMathmlHast(token.expr, token.block));
        }
        lastIndex = matchStart + match[0].length;
      }
      if (lastIndex < node.value.length) {
        expanded.push(hText(node.value.slice(lastIndex)));
      }
      continue;
    }

    const childInCode =
      inCode ||
      (node.type === "element" && (node.tagName === "pre" || node.tagName === "code"));
    if ("children" in node && Array.isArray(node.children)) {
      node.children = expandMathInNodeList(node.children, tokenRe, tokens, childInCode);
    }

    const split = splitParagraphOnBlocks(node, isMathBlockElement);
    if (split) {
      expanded.push(...split);
      continue;
    }

    expanded.push(node);
  }
  return expanded;
}

function rehypeAstMath(prepared: PreparedMarkdown) {
  const tokenRe = new RegExp(`${prepared.prefix}M(\\d+)END`, "gu");
  return (tree: HastNode): void => {
    if (
      prepared.tokens.length === 0 ||
      !("children" in tree) ||
      !Array.isArray(tree.children)
    ) {
      return;
    }
    tree.children = expandMathInNodeList(
      tree.children,
      tokenRe,
      prepared.tokens,
      false,
    );
  };
}

function createVideoFigure(node: HastNode): HastElement | null {
  if (node.type !== "element" || node.tagName !== "img" || !node.properties) {
    return null;
  }
  const src = node.properties.src;
  if (typeof src !== "string") return null;
  const match = src.match(CDN_VIDEO_URL_RE);
  if (!match) return null;

  const ext = (match[1] ?? "mp4").toLowerCase();
  const mime = ext === "webm" ? "video/webm" : "video/mp4";
  const alt = typeof node.properties.alt === "string" ? node.properties.alt.trim() : "";
  const title =
    typeof node.properties.title === "string" ? node.properties.title.trim() : "";

  const videoProps: Record<string, unknown> = {
    className: ["doc-video-player"],
    controls: true,
    playsInline: true,
    preload: "metadata",
  };
  if (alt) {
    videoProps.ariaLabel = alt;
  }

  const video = hEl(
    "video",
    [
      hEl("source", [], { src, type: mime }),
      hEl("a", [hText(alt || src)], { href: src }),
    ],
    videoProps,
  );
  const figureChildren: HastNode[] = [video];
  if (title) {
    figureChildren.push(
      hEl("figcaption", [hText(title)], { className: ["doc-video-caption"] }),
    );
  }
  return hEl("figure", figureChildren, { className: ["doc-video"] });
}

function transformCdnMediaInNodeList(nodes: HastNode[], inCode: boolean): HastNode[] {
  const transformed: HastNode[] = [];
  for (const node of nodes) {
    if (!inCode) {
      const figure = createVideoFigure(node);
      if (figure) {
        transformed.push(figure);
        continue;
      }
    }

    const childInCode =
      inCode ||
      (node.type === "element" && (node.tagName === "pre" || node.tagName === "code"));
    if ("children" in node && Array.isArray(node.children)) {
      node.children = transformCdnMediaInNodeList(node.children, childInCode);
    }

    const split = splitParagraphOnBlocks(node, isVideoFigureElement);
    if (split) {
      transformed.push(...split);
      continue;
    }

    transformed.push(node);
  }
  return transformed;
}

function rehypeCdnMedia() {
  return (tree: HastNode): void => {
    if (!("children" in tree) || !Array.isArray(tree.children)) {
      return;
    }
    tree.children = transformCdnMediaInNodeList(tree.children, false);
  };
}

function registerShikiStyle(rawStyle: string): string {
  const decl = rawStyle.trim().replace(/;+$/u, "");
  const hex = createHash("sha256").update(decl).digest("hex").slice(0, 8);
  const className = `shk-${hex}`;
  if (!shikiTokenDecls.has(className)) {
    shikiTokenDecls.set(className, decl);
  }
  return className;
}

function appendClassName(
  properties: Record<string, unknown>,
  tokenClass: string,
): void {
  const existing = properties.className;
  if (Array.isArray(existing)) {
    const tokens = existing.filter((v): v is string => typeof v === "string");
    if (!tokens.includes(tokenClass)) tokens.push(tokenClass);
    properties.className = tokens;
    return;
  }
  if (typeof existing === "string") {
    const tokens = existing.split(/\s+/u).filter(Boolean);
    if (!tokens.includes(tokenClass)) tokens.push(tokenClass);
    properties.className = tokens;
    return;
  }
  properties.className = [tokenClass];
}

function walkShikiElements(node: HastNode): void {
  if (node.type === "element" && node.properties) {
    const rawStyle = node.properties.style;
    if (
      typeof rawStyle === "string" &&
      rawStyle.includes("--shiki-") &&
      (node.tagName === "pre" || node.tagName === "span")
    ) {
      const tokenClass = registerShikiStyle(rawStyle);
      appendClassName(node.properties, tokenClass);
      delete node.properties.style;
    }
  }
  if ("children" in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      walkShikiElements(child);
    }
  }
}

function rehypeShikiTokenClasses() {
  return (tree: HastNode): void => {
    walkShikiElements(tree);
  };
}

export function extractHeadings(markdown: string): TocHeading[] {
  const slugger = new GithubSlugger();
  const headings: TocHeading[] = [];
  let inFence = false;
  for (const rawLine of markdown.split("\n")) {
    if (rawLine.trimStart().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = rawLine.match(/^(#{2,3})\s+(.+)$/u);
    if (!match) continue;
    const depth = (match[1]?.length ?? 2) as 2 | 3;
    const text = (match[2] ?? "")
      .replace(/[`*_]/gu, "")
      .replace(/\$([^$]+)\$/gu, "$1")
      .trim();
    if (text) {
      headings.push({ depth, id: slugger.slug(text), text });
    }
  }
  return headings;
}

async function compileMarkdown(markdown: string): Promise<string> {
  // Strip top H1 because ManualPage renders `<h1 itemprop="headline">` cleanly in the header
  const bodyMd = markdown.replace(/^#\s+.+\n+/u, "");
  const prepared = prepareMarkdownWithMathTokens(bodyMd);
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkAlert)
    .use(remarkRehype)
    .use(rehypeAstMath, prepared)
    .use(rehypeCdnMedia)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: "wrap" })
    .use(rehypeShiki, {
      themes: {
        light: "github-light",
        dark: "nord",
      },
      defaultColor: false,
    })
    .use(rehypeShikiTokenClasses)
    .use(rehypeStringify)
    .process(prepared.markdown);

  // Wrap tables in keyboard-scrollable regions for mobile & accessibility
  return String(file).replace(
    /<table>([\s\S]*?)<\/table>/gu,
    '<div class="table-scroll" tabindex="0"><table>$1</table></div>',
  );
}

export function renderMarkdownToHtml(markdown: string): Promise<string> {
  const key = createHash("sha256").update(markdown).digest("hex");
  const cached = renderedHtmlCache.get(key);
  if (cached) return cached;
  const pending = compileMarkdown(markdown);
  renderedHtmlCache.set(key, pending);
  return pending;
}

export function getShikiTokensCss(): string {
  const rules = [...shikiTokenDecls.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cls, decl]) => `.${cls}{${decl}}`);
  return `${rules.join("\n")}\n`;
}
