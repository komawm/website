#!/usr/bin/env bun
/**
 * Pure Bun 1.4.4 repository lint & policy checks (zero ESLint, Prettier, esbuild, or bunx).
 */

import { access, readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors: string[] = [];

const BANNED_TOOLCHAIN_RE = /\b(?:eslint|prettier|esbuild|bunx|npx|pipx\s+run|uvx)\b/iu;

async function walkFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (
      entry.name === "node_modules" ||
      entry.name === "dist" ||
      entry.name === ".astro" ||
      entry.name === ".git"
    ) {
      continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walkFiles(full)));
    } else {
      results.push(full);
    }
  }
  return results;
}

const pkg = JSON.parse(await readFile(join(ROOT, "package.json"), "utf8")) as {
  packageManager?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

if (pkg.packageManager !== "bun@1.4.4") {
  errors.push(
    `package.json: expected packageManager bun@1.4.4, got ${pkg.packageManager}`,
  );
}

for (const depMap of [pkg.dependencies ?? {}, pkg.devDependencies ?? {}]) {
  for (const name of Object.keys(depMap)) {
    if (/eslint|prettier|esbuild/iu.test(name)) {
      errors.push(`package.json: prohibited toolchain dependency ${name}`);
    }
  }
}

for (const [scriptName, cmd] of Object.entries(pkg.scripts ?? {})) {
  if (BANNED_TOOLCHAIN_RE.test(cmd)) {
    errors.push(
      `package.json script ${scriptName}: uses prohibited runner/tool (${cmd})`,
    );
  }
}

for (const docName of ["README.md", "AGENTS.md"]) {
  const md = await readFile(join(ROOT, docName), "utf8");
  for (const match of md.matchAll(/\]\(([^)]+)\)/gu)) {
    const target = match[1] ?? "";
    if (
      !target.startsWith("https://") &&
      !target.startsWith("mailto:") &&
      !target.startsWith("#")
    ) {
      errors.push(`${docName}: non-canonical link ${target}`);
    }
  }
}

const checkDirs = ["src", "scripts", "public", ".github"];
const UNSAFE_CSP_RE = /unsafe-inline|unsafe-eval/iu;
const UNSAFE_DOM_RE =
  /\.(?:innerHTML|outerHTML)\b|insertAdjacentHTML\b|\beval\s*\(|new\s+Function\b/u;
const ANY_TYPE_RE = /(?::\s*any\b|\bas\s+any\b)/u;
const UNSAFE_MARKDOWN_RE = /\ballowDangerousHtml\b|\brehype-raw\b|\brehypeRaw\b/u;
const ASTRO_INLINE_RE = /\bdefine:vars\b|\sstyle\s*=/u;
const ASTRO_INLINE_SCRIPT_RE = /<script(?![^>]*\bsrc="\/scripts\/)[^>]*\bis:inline\b/u;

for (const relFile of ["astro.config.mjs"]) {
  const text = await readFile(join(ROOT, relFile), "utf8");
  if (BANNED_TOOLCHAIN_RE.test(text)) {
    errors.push(`${relFile}: references prohibited tool/runner`);
  }
  if (UNSAFE_DOM_RE.test(text) || ANY_TYPE_RE.test(text)) {
    errors.push(`${relFile}: contains prohibited unsafe DOM/eval/any construct`);
  }
}

for (const relDir of checkDirs) {
  for (const file of await walkFiles(join(ROOT, relDir))) {
    if (file.endsWith("lint.ts")) continue;
    if (
      !/\.(?:ts|astro|mjs|js|yml|yaml|json)$/u.test(file) &&
      !file.endsWith("_headers")
    ) {
      continue;
    }
    const text = await readFile(file, "utf8");
    const rel = file.slice(ROOT.length + 1);
    if (BANNED_TOOLCHAIN_RE.test(text)) {
      errors.push(
        `${rel}: references prohibited tool/runner (eslint/prettier/esbuild/bunx/npx)`,
      );
    }
    if (/\b(?:TODO|FIXME)\b/u.test(text) && !rel.startsWith("src/content/")) {
      errors.push(`${rel}: contains unresolved TODO/FIXME placeholder`);
    }
    if (
      UNSAFE_CSP_RE.test(text) &&
      !rel.startsWith("src/content/") &&
      !file.endsWith(".test.ts") &&
      !file.endsWith("validate-dist.ts")
    ) {
      errors.push(`${rel}: references prohibited unsafe-inline/unsafe-eval`);
    }
    if (!rel.startsWith("src/content/") && /\.(?:ts|astro|mjs|js)$/u.test(file)) {
      if (UNSAFE_DOM_RE.test(text)) {
        errors.push(`${rel}: contains prohibited innerHTML/eval construct`);
      }
      if (ANY_TYPE_RE.test(text)) {
        errors.push(`${rel}: contains prohibited ': any' or 'as any'`);
      }
      if (UNSAFE_MARKDOWN_RE.test(text) && !file.endsWith(".test.ts")) {
        errors.push(
          `${rel}: contains prohibited allowDangerousHtml / rehype-raw raw HTML parsing`,
        );
      }
    }
    if (
      file.endsWith(".astro") &&
      (ASTRO_INLINE_RE.test(text) || ASTRO_INLINE_SCRIPT_RE.test(text))
    ) {
      errors.push(
        `${rel}: contains prohibited inline style=, define:vars, or inline <script>`,
      );
    }
  }
}

const dependabotText = await readFile(join(ROOT, ".github/dependabot.yml"), "utf8");
if (
  /interval:\s*weekly/u.test(dependabotText) ||
  !/interval:\s*monthly/u.test(dependabotText)
) {
  errors.push(".github/dependabot.yml: expected interval: monthly for all ecosystems");
}

for (const surface of ["koma", "jiku"] as const) {
  const manifestPath = join(ROOT, "src/content/manual", surface, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
    schema?: number;
    surface?: string;
    locales?: string[];
    sections?: Array<{
      id: string;
      items: Array<{ path: string; slug: string }>;
    }>;
  };
  if (manifest.schema !== 1 || manifest.surface !== surface) {
    errors.push(`manifest ${surface}: invalid schema or surface`);
  }
  const locales = manifest.locales ?? [];
  if (locales.join(",") !== "en,zh-CN,ja") {
    errors.push(`manifest ${surface}: unexpected locales ${locales.join(",")}`);
  }
  for (const sec of manifest.sections ?? []) {
    for (const item of sec.items) {
      for (const loc of locales) {
        const mdFile = join(ROOT, "src/content/manual", surface, loc, item.path);
        await access(mdFile);
        const content = (await readFile(mdFile, "utf8")).trim();
        if (!content.startsWith("# ")) {
          errors.push(`${surface}/${loc}/${item.path}: must start with H1 heading`);
        }
      }
    }
  }
}

if (errors.length > 0) {
  for (const err of errors) {
    console.error(`LINT ERROR: ${err}`);
  }
  process.exit(1);
}

console.log(
  "Pure-Bun lint passed (toolchain invariants, canonical links, and manual parity verified).",
);
