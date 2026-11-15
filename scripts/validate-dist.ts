#!/usr/bin/env bun
/**
 * Verify static Astro output parity across `en`, `zh-CN`, and `ja` for:
 * - Dedicated Hero routes (`/`, `/zh-CN/`, `/ja/`, `/jiku/`, `/zh-CN/jiku/`, `/ja/jiku/`)
 *   with interactive install tabs and NO `<ManualPage>` sidebar;
 * - Manual entry and article routes (`/docs/...`, `/jiku/docs/...`) with Reader-Mode
 *   `<article itemscope itemtype="https://schema.org/TechArticle">` presence;
 * - `404.html`, `search-index.json`, `sitemap.xml`, `_redirects`, `_headers`,
 *   design stylesheet loading, scrollable tables, and absence of `_worker.js`.
 */
import { access, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = fileURLToPath(new URL("../dist", import.meta.url));
const MANUAL_ROOT = fileURLToPath(new URL("../src/content/manual", import.meta.url));
const LOCALES = ["en", "zh-CN", "ja"] as const;

const HERO_ROUTES = [
  "index.html",
  "zh-CN/index.html",
  "ja/index.html",
  "jiku/index.html",
  "zh-CN/jiku/index.html",
  "ja/jiku/index.html",
] as const;

for (const rel of HERO_ROUTES) {
  const html = await readFile(join(DIST, rel), "utf8");
  if (!html.includes('role="tablist"') || !html.includes('id="main-content"')) {
    throw new Error(
      `Hero route ${rel} is missing interactive install tabs or #main-content`,
    );
  }
  if (html.includes('class="wiki-sidebar"')) {
    throw new Error(`Hero route ${rel} must not render ManualPage sidebar`);
  }
}

const REQUIRED_MANUAL_HTML = [
  "docs/index.html",
  "zh-CN/docs/index.html",
  "ja/docs/index.html",
  "jiku/docs/index.html",
  "zh-CN/jiku/docs/index.html",
  "ja/jiku/docs/index.html",
];

for (const surface of ["koma", "jiku"] as const) {
  const manifest = JSON.parse(
    await readFile(join(MANUAL_ROOT, surface, "manifest.json"), "utf8"),
  ) as {
    sections: Array<{ id: string; items: Array<{ slug: string }> }>;
  };
  for (const sec of manifest.sections) {
    for (const item of sec.items) {
      for (const locale of LOCALES) {
        const prefix = locale === "en" ? "" : `${locale}/`;
        const surf = surface === "jiku" ? "jiku/" : "";
        REQUIRED_MANUAL_HTML.push(
          `${prefix}${surf}docs/${sec.id}/${item.slug}/index.html`,
        );
      }
    }
  }
}

for (const rel of REQUIRED_MANUAL_HTML) {
  const full = join(DIST, rel);
  await access(full);
  const html = await readFile(full, "utf8");
  if (!html.includes('itemtype="https://schema.org/TechArticle"')) {
    throw new Error(`Missing Reader-View TechArticle microdata in ${rel}`);
  }
}

for (const asset of [
  "404.html",
  "search-index.json",
  "sitemap.xml",
  "shiki-tokens.css",
  "scripts/theme-init.js",
  "_redirects",
  "_headers",
]) {
  await access(join(DIST, asset));
}

const headersText = await readFile(join(DIST, "_headers"), "utf8");
if (/unsafe-inline|unsafe-eval/iu.test(headersText)) {
  throw new Error("_headers CSP must not contain unsafe-inline or unsafe-eval");
}
if (
  !headersText.includes("style-src 'self'") ||
  !headersText.includes("script-src 'self'")
) {
  throw new Error(
    "_headers CSP must enforce strict style-src 'self' and script-src 'self'",
  );
}

const shikiCss = await readFile(join(DIST, "shiki-tokens.css"), "utf8");
if (!shikiCss.includes(".shk-")) {
  throw new Error("shiki-tokens.css must emit external .shk- token rules");
}

try {
  await access(join(DIST, "_worker.js"));
  throw new Error("Unexpected _worker.js bundle inside ./dist");
} catch (err) {
  if ((err as NodeJS.ErrnoException)?.code !== "ENOENT") throw err;
}

const expectedSearchRecords = REQUIRED_MANUAL_HTML.length - 6;
const searchRecords = JSON.parse(
  await readFile(join(DIST, "search-index.json"), "utf8"),
);
if (!Array.isArray(searchRecords) || searchRecords.length !== expectedSearchRecords) {
  throw new Error(
    `Expected ${expectedSearchRecords} search-index records, found ${searchRecords?.length ?? 0}`,
  );
}

const sitemapXml = await readFile(join(DIST, "sitemap.xml"), "utf8");
for (const expectedLoc of [
  "https://komawm.org/",
  "https://komawm.org/zh-CN/",
  "https://komawm.org/ja/",
  "https://komawm.org/jiku/",
  "https://komawm.org/docs/",
  "https://komawm.org/jiku/docs/",
]) {
  if (!sitemapXml.includes(`<loc>${expectedLoc}</loc>`)) {
    throw new Error(`sitemap.xml missing required route ${expectedLoc}`);
  }
}

const cssDir = join(DIST, "_astro");
const designSheets = new Set<string>();
for (const entry of await readdir(cssDir, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".css")) continue;
  const css = await readFile(join(cssDir, entry.name), "utf8");
  if (css.includes("--bg-header")) {
    designSheets.add(`/_astro/${entry.name}`);
  }
}
if (designSheets.size === 0) {
  throw new Error("No global design stylesheet emitted under _astro/");
}

async function auditAllHtml(dir: string): Promise<void> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await auditAllHtml(full);
      continue;
    }
    if (!entry.name.endsWith(".html")) continue;
    const html = await readFile(full, "utf8");
    const tables = (html.match(/<table\b/gu) ?? []).length;
    const wrappers = (html.match(/class="table-scroll"/gu) ?? []).length;
    if (tables !== wrappers) {
      throw new Error(
        `${full}: ${tables} table(s) vs ${wrappers} .table-scroll wrapper(s)`,
      );
    }
    const links = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/gu)].map(
      (m) => m[1] ?? "",
    );
    const loadedDesign = links.filter((href) => designSheets.has(href)).length;
    if (loadedDesign !== 1) {
      throw new Error(`${full}: expected 1 design stylesheet, found ${loadedDesign}`);
    }
    if (!links.includes("/shiki-tokens.css")) {
      throw new Error(`${full}: missing external /shiki-tokens.css stylesheet link`);
    }
    const inlineScripts = html.match(/<script(?![^>]*\bsrc=)[^>]*>/giu);
    if (inlineScripts) {
      throw new Error(
        `${full}: found ${inlineScripts.length} prohibited inline <script> tag(s)`,
      );
    }
    if (/<style\b/iu.test(html)) {
      throw new Error(`${full}: found prohibited inline <style> tag`);
    }
    if (/\sstyle\s*=/iu.test(html)) {
      throw new Error(`${full}: found prohibited inline style= attribute`);
    }
    for (const match of html.matchAll(/\b(shk-[0-9a-f]{8})\b/gu)) {
      const cls = match[1] ?? "";
      if (!shikiCss.includes(`.${cls}{`)) {
        throw new Error(`${full}: references .${cls} missing from shiki-tokens.css`);
      }
    }
  }
}

await auditAllHtml(DIST);

console.log(
  `Validated ${HERO_ROUTES.length} Hero routes + ${REQUIRED_MANUAL_HTML.length} tri-lingual manual routes + search/sitemap/Worker assets.`,
);
