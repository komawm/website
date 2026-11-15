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
  "_redirects",
  "_headers",
]) {
  await access(join(DIST, asset));
}

try {
  await access(join(DIST, "_worker.js"));
  throw new Error("Unexpected _worker.js bundle inside ./dist");
} catch (err) {
  if ((err as NodeJS.ErrnoException)?.code !== "ENOENT") throw err;
}

const searchRecords = JSON.parse(
  await readFile(join(DIST, "search-index.json"), "utf8"),
);
if (!Array.isArray(searchRecords) || searchRecords.length !== 30) {
  throw new Error(
    `Expected 30 search-index records, found ${searchRecords?.length ?? 0}`,
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
  }
}

await auditAllHtml(DIST);

console.log(
  `Validated ${HERO_ROUTES.length} Hero routes + ${REQUIRED_MANUAL_HTML.length} tri-lingual manual routes + search/sitemap/Worker assets.`,
);
