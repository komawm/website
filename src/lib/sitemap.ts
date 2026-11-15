import { readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { type ProductSurface, SUPPORTED_LOCALES } from "./i18n.ts";
import { docRouteHref, listSurfaceSlugs, loadRenderedDoc } from "./manualDocs.ts";

export async function buildSearchIndexJson(): Promise<string> {
  const records: object[] = [];
  const surfaces: readonly ProductSurface[] = ["koma", "jiku"];
  for (const surface of surfaces) {
    const slugs = await listSurfaceSlugs(surface);
    for (const locale of SUPPORTED_LOCALES) {
      for (const slug of slugs) {
        const doc = await loadRenderedDoc(surface, locale, slug);
        records.push({
          surface,
          locale,
          href: docRouteHref(surface, locale, slug),
          title: doc.title,
          section: doc.sectionTitle,
          headings: doc.headings.map((h) => h.text),
          excerpt: doc.rawMarkdown
            .replace(/\[!(?:WARNING|NOTE|TIP)\]/gu, " ")
            .replace(/[#>`*_|[\]()]/gu, " ")
            .replace(/\s+/gu, " ")
            .trim()
            .slice(0, 360),
        });
      }
    }
  }
  return `${JSON.stringify(records)}\n`;
}

async function collectHtmlRoutes(dir: string, base = ""): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      out.push(
        ...(await collectHtmlRoutes(join(dir, entry.name), `${base}/${entry.name}`)),
      );
    } else if (entry.name === "index.html") {
      out.push(`${base}/`);
    }
  }
  return out.sort();
}

export async function writeSitemap(outDir: string, siteUrl: string): Promise<string[]> {
  const routes = await collectHtmlRoutes(outDir);
  const urls = routes
    .map((r) => `  <url><loc>${siteUrl.replace(/\/$/u, "")}${r}</loc></url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  await writeFile(join(outDir, "sitemap.xml"), xml, "utf8");
  return routes;
}
