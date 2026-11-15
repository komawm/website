import type { APIRoute } from "astro";

import { type ProductSurface, SUPPORTED_LOCALES } from "../lib/i18n.ts";
import { listSurfaceSlugs, loadRenderedDoc } from "../lib/manualDocs.ts";
import { getShikiTokensCss } from "../lib/markdown.ts";

export const GET: APIRoute = async () => {
  const surfaces: readonly ProductSurface[] = ["koma", "jiku"];
  for (const surface of surfaces) {
    const slugs = await listSurfaceSlugs(surface);
    for (const locale of SUPPORTED_LOCALES) {
      for (const slug of slugs) {
        await loadRenderedDoc(surface, locale, slug);
      }
    }
  }

  return new Response(getShikiTokensCss(), {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
    },
  });
};
