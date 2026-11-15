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

  test("loads koma (7) and jiku (3) manifests and renders all 30 localized pages", async () => {
    const komaManifest = await loadManifest("koma");
    const jikuManifest = await loadManifest("jiku");
    expect(komaManifest.schema).toBe(1);
    expect(jikuManifest.schema).toBe(1);
    expect(komaManifest.locales).toEqual(["en", "zh-CN", "ja"]);
    expect(jikuManifest.locales).toEqual(["en", "zh-CN", "ja"]);

    const komaSlugs = await listSurfaceSlugs("koma");
    const jikuSlugs = await listSurfaceSlugs("jiku");
    expect(komaSlugs).toHaveLength(7);
    expect(jikuSlugs).toHaveLength(3);

    for (const locale of SUPPORTED_LOCALES) {
      for (const slug of komaSlugs) {
        const doc = await loadRenderedDoc("koma", locale, slug);
        expect(doc.title.length).toBeGreaterThan(0);
        expect(doc.html.length).toBeGreaterThan(0);
      }
      for (const slug of jikuSlugs) {
        const doc = await loadRenderedDoc("jiku", locale, slug);
        expect(doc.title.length).toBeGreaterThan(0);
        expect(doc.html.length).toBeGreaterThan(0);
      }
    }
  });
});
