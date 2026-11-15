import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { ProductSurface, SiteLocale } from "./i18n.ts";
import { extractHeadings, renderMarkdownToHtml, type TocHeading } from "./markdown.ts";

export interface ManualManifestItem {
  readonly slug: string;
  readonly path: string;
  readonly title: Readonly<Record<SiteLocale, string>>;
}

export interface ManualManifestSection {
  readonly id: string;
  readonly title: Readonly<Record<SiteLocale, string>>;
  readonly items: readonly ManualManifestItem[];
}

export interface ManualManifest {
  readonly schema: 1;
  readonly surface: ProductSurface;
  readonly version: string;
  readonly locales: readonly SiteLocale[];
  readonly sections: readonly ManualManifestSection[];
}

export interface RenderedManualDoc {
  readonly surface: ProductSurface;
  readonly locale: SiteLocale;
  readonly fullSlug: string;
  readonly title: string;
  readonly sectionTitle: string;
  readonly html: string;
  readonly headings: readonly TocHeading[];
  readonly rawMarkdown: string;
  readonly prev: { readonly title: string; readonly href: string } | null;
  readonly next: { readonly title: string; readonly href: string } | null;
}

const MANUAL_BASE = join(process.cwd(), "src/content/manual");

/**
 * Resolve the canonical route for a manual page under `/docs/...` or `/jiku/docs/...`.
 * Dedicated product hero pages live at `/` and `/jiku/`, so manual routes never jump back to Hero.
 */
export function docRouteHref(
  surface: ProductSurface,
  locale: SiteLocale,
  fullSlug: string,
): string {
  const prefix = locale === "en" ? "" : `/${locale}`;
  const surf = surface === "jiku" ? "/jiku" : "";
  return `${prefix}${surf}/docs/${fullSlug}/`;
}

export async function loadManifest(surface: ProductSurface): Promise<ManualManifest> {
  const raw = await readFile(join(MANUAL_BASE, surface, "manifest.json"), "utf8");
  return JSON.parse(raw) as ManualManifest;
}

export async function listSurfaceSlugs(surface: ProductSurface): Promise<string[]> {
  const manifest = await loadManifest(surface);
  const slugs: string[] = [];
  for (const section of manifest.sections) {
    for (const item of section.items) {
      slugs.push(`${section.id}/${item.slug}`);
    }
  }
  return slugs;
}

export async function loadRenderedDoc(
  surface: ProductSurface,
  locale: SiteLocale,
  fullSlug: string,
): Promise<RenderedManualDoc> {
  const manifest = await loadManifest(surface);
  const flat: {
    fullSlug: string;
    path: string;
    title: string;
    sectionTitle: string;
  }[] = [];

  for (const sec of manifest.sections) {
    for (const item of sec.items) {
      flat.push({
        fullSlug: `${sec.id}/${item.slug}`,
        path: item.path,
        title: item.title[locale],
        sectionTitle: sec.title[locale],
      });
    }
  }

  const index = flat.findIndex((entry) => entry.fullSlug === fullSlug);
  if (index === -1) {
    throw new Error(`Unknown manual slug ${surface}:${locale}:${fullSlug}`);
  }
  const current = flat[index]!;
  const mdPath = join(MANUAL_BASE, surface, locale, current.path);
  const rawMarkdown = await readFile(mdPath, "utf8");
  const headings = extractHeadings(rawMarkdown);
  const html = await renderMarkdownToHtml(rawMarkdown);

  const prevEntry = index > 0 ? flat[index - 1] : undefined;
  const nextEntry = index + 1 < flat.length ? flat[index + 1] : undefined;

  return {
    surface,
    locale,
    fullSlug,
    title: current.title,
    sectionTitle: current.sectionTitle,
    html,
    headings,
    rawMarkdown,
    prev: prevEntry
      ? {
          title: prevEntry.title,
          href: docRouteHref(surface, locale, prevEntry.fullSlug),
        }
      : null,
    next: nextEntry
      ? {
          title: nextEntry.title,
          href: docRouteHref(surface, locale, nextEntry.fullSlug),
        }
      : null,
  };
}
