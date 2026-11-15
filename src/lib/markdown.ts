/**
 * Build-time Markdown -> Pre-rendered HTML compiler using unified + remark + rehype + Shiki.
 *
 * Runs at build time before deployment to Cloudflare Workers Static Assets so clients
 * receive ready-to-paint semantic HTML (with GitHub-style Warning/Note callouts,
 * heading IDs, keyboard-scrollable tables, and dual-theme syntax highlighting) with
 * zero client-side Markdown parsing cost and zero inline `style="..."` attributes.
 */

import { createHash } from "node:crypto";

import rehypeShiki from "@shikijs/rehype";
import GithubSlugger from "github-slugger";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeRaw from "rehype-raw";
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

interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

const shikiTokenDecls = new Map<string, string>();
const renderedHtmlCache = new Map<string, Promise<string>>();

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
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      walkShikiElements(child);
    }
  }
}

const ALLOWED_HTML_TAGS = new Set([
  "a",
  "annotation",
  "blockquote",
  "br",
  "code",
  "del",
  "details",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "img",
  "input",
  "kbd",
  "li",
  "math",
  "menclose",
  "mfrac",
  "mi",
  "mn",
  "mo",
  "mover",
  "mroot",
  "mrow",
  "ms",
  "mspace",
  "msqrt",
  "msub",
  "msubsup",
  "msup",
  "mtable",
  "mtd",
  "mtext",
  "mtr",
  "munder",
  "munderover",
  "ol",
  "p",
  "pre",
  "semantics",
  "span",
  "strong",
  "sub",
  "summary",
  "sup",
  "svg",
  "path",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "ul",
]);

function isSafeUrl(raw: unknown): boolean {
  if (typeof raw !== "string") return false;
  const trimmed = raw.trim();
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../")
  ) {
    return true;
  }
  return /^https?:\/\//iu.test(trimmed) || /^mailto:/iu.test(trimmed);
}

function sanitizeNodeList(nodes: HastNode[]): HastNode[] {
  const clean: HastNode[] = [];
  for (const node of nodes) {
    if (node.type === "comment" || node.type === "raw") {
      continue;
    }
    if (node.type === "element") {
      const tag = node.tagName?.toLowerCase() ?? "";
      if (!ALLOWED_HTML_TAGS.has(tag)) {
        continue;
      }
      if (node.properties) {
        for (const key of Object.keys(node.properties)) {
          const lower = key.toLowerCase();
          if (lower === "style" || lower.startsWith("on")) {
            delete node.properties[key];
            continue;
          }
          if (
            (lower === "href" || lower === "src") &&
            !isSafeUrl(node.properties[key])
          ) {
            delete node.properties[key];
          }
        }
      }
    }
    if (Array.isArray(node.children)) {
      node.children = sanitizeNodeList(node.children);
    }
    clean.push(node);
  }
  return clean;
}

function rehypeSanitizeSafeHtml() {
  return (tree: HastNode): void => {
    if (Array.isArray(tree.children)) {
      tree.children = sanitizeNodeList(tree.children);
    }
  };
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
    const text = (match[2] ?? "").replace(/[`*_]/gu, "").trim();
    if (text) {
      headings.push({ depth, id: slugger.slug(text), text });
    }
  }
  return headings;
}

async function compileMarkdown(markdown: string): Promise<string> {
  // Strip top H1 because ManualPage renders `<h1 itemprop="headline">` cleanly in the header
  const bodyMd = markdown.replace(/^#\s+.+\n+/u, "");
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkAlert)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitizeSafeHtml)
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
    .process(bodyMd);

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
