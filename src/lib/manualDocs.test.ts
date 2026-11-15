import { describe, expect, test } from "bun:test";

import { SUPPORTED_LOCALES } from "./i18n.ts";
import {
  docRouteHref,
  listSurfaceSlugs,
  loadManifest,
  loadRenderedDoc,
} from "./manualDocs.ts";

describe("manualDocs schema and tri-lingual parity", () => {
  test("docRouteHref routes every manual slug under /docs/ or /jiku/docs/", () => {
    expect(docRouteHref("koma", "en", "getting-started/home")).toBe(
      "/docs/getting-started/home/",
    );
    expect(docRouteHref("koma", "zh-CN", "getting-started/installation")).toBe(
      "/zh-CN/docs/getting-started/installation/",
    );
    expect(docRouteHref("jiku", "ja", "getting-started/overview")).toBe(
      "/ja/jiku/docs/getting-started/overview/",
    );
  });

  test(
    "loads koma (>=7) and jiku (>=3) manifests and renders all localized pages",
    async () => {
      const komaManifest = await loadManifest("koma");
      const jikuManifest = await loadManifest("jiku");
      expect(komaManifest.schema).toBe(1);
      expect(jikuManifest.schema).toBe(1);
      expect(komaManifest.locales).toEqual(["en", "zh-CN", "ja"]);
      expect(jikuManifest.locales).toEqual(["en", "zh-CN", "ja"]);

      const komaSlugs = await listSurfaceSlugs("koma");
      const jikuSlugs = await listSurfaceSlugs("jiku");
      expect(komaSlugs.length).toBeGreaterThanOrEqual(7);
      expect(jikuSlugs.length).toBeGreaterThanOrEqual(3);
      expect(new Set(komaSlugs).size).toBe(komaSlugs.length);
      expect(new Set(jikuSlugs).size).toBe(jikuSlugs.length);

      const rendered = await Promise.all([
        ...SUPPORTED_LOCALES.flatMap((locale) =>
          komaSlugs.map((slug) => loadRenderedDoc("koma", locale, slug)),
        ),
        ...SUPPORTED_LOCALES.flatMap((locale) =>
          jikuSlugs.map((slug) => loadRenderedDoc("jiku", locale, slug)),
        ),
      ]);
      for (const doc of rendered) {
        expect(doc.title.length).toBeGreaterThan(0);
        expect(doc.html.length).toBeGreaterThan(0);
      }
    },
    { timeout: 20_000 },
  );
});
