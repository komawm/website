import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "astro/config";

import { buildSearchIndexJson, writeSitemap } from "./src/lib/sitemap.ts";

const SITE_URL = "https://komawm.org";

function staticSearchAndSitemap() {
  return {
    name: "komawm-static-artifacts",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const searchJson = await buildSearchIndexJson();
        await writeFile(join(outDir, "search-index.json"), searchJson, "utf8");
        const routes = await writeSitemap(outDir, SITE_URL);
        const redirectsSrc = fileURLToPath(
          new URL("./public/_redirects", import.meta.url),
        );
        await writeFile(
          join(outDir, "_redirects"),
          await readFile(redirectsSrc, "utf8"),
          "utf8",
        );
        logger.info(`emitted search-index.json and ${routes.length} sitemap routes`);
      },
    },
  };
}

export default defineConfig({
  site: SITE_URL,
  output: "static",
  outDir: "./dist",
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  vite: {
    define: {
      "import.meta.env.PUBLIC_CDN_BASE_URL": JSON.stringify("https://cdn.komawm.org"),
    },
  },
  integrations: [staticSearchAndSitemap()],
});
