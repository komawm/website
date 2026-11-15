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

const checkDirs = ["src", "scripts", ".github"];
for (const relDir of checkDirs) {
  for (const file of await walkFiles(join(ROOT, relDir))) {
    if (file.endsWith("lint.ts")) continue;
    if (!/\.(?:ts|astro|mjs|js|yml|yaml|json)$/u.test(file)) continue;
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
  }
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
