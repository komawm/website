/**
 * Ultra-thin Cloudflare Edge Worker for IP-based Geo-Locale Routing (`en`, `zh-CN`, `ja`).
 *
 * - Markdown is ALREADY pre-rendered to static HTML at Astro build time inside `./dist`
 *   (served directly from `env.ASSETS` with zero runtime Markdown parsing overhead).
 * - On a human visitor's first navigation without a `komawm_locale` cookie, reads
 *   Cloudflare's zero-cost `request.cf.country` header:
 *     - `JP` -> `/ja/...`
 *     - `CN` -> `/zh-CN/...`
 *     - Otherwise falls back to `Accept-Language`, defaulting to English `/...`.
 * - Search engine crawlers and static assets (`/_astro/*`, `/icons/*`, `*.json`, `*.xml`)
 *   bypass Geo redirection so every locale route is indexed cleanly.
 */

export interface Env {
  readonly ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

export type SiteLocale = "en" | "zh-CN" | "ja";

const STATIC_PREFIXES = ["/_astro/", "/icons/", "/media/"];
const HSTS_HEADER = "max-age=31536000; includeSubDomains";

function withHsts(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Strict-Transport-Security", HSTS_HEADER);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
const BOT_RE =
  /bot|crawl|spider|slurp|lighthouse|facebookexternalhit|twitterbot|slackbot|discordbot/iu;

export function parseCookieLocale(cookieHeader: string | null): SiteLocale | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)komawm_locale=(en|zh-CN|ja)(?:;|$)/u);
  return (match?.[1] as SiteLocale | undefined) ?? null;
}

export function currentPathLocale(pathname: string): SiteLocale {
  if (pathname === "/zh-CN" || pathname.startsWith("/zh-CN/")) return "zh-CN";
  if (pathname === "/ja" || pathname.startsWith("/ja/")) return "ja";
  return "en";
}

export function localizePathname(pathname: string, target: SiteLocale): string {
  const stripped = pathname.replace(/^\/(?:zh-CN|ja)(?=\/|$)/u, "") || "/";
  if (target === "en") return stripped;
  return stripped === "/" ? `/${target}/` : `/${target}${stripped}`;
}

export function inferGeoLocale(request: Request): SiteLocale {
  const cf = (request as Request & { cf?: { country?: string } }).cf;
  const country = cf?.country?.toUpperCase() ?? "";
  if (country === "JP") return "ja";
  if (country === "CN") return "zh-CN";

  const accept = request.headers.get("accept-language") ?? "";
  for (const part of accept.split(",")) {
    const tag = part.split(";")[0]?.trim().toLowerCase() ?? "";
    if (tag.startsWith("ja")) return "ja";
    if (tag.startsWith("zh")) return "zh-CN";
    if (tag.startsWith("en")) return "en";
  }
  return "en";
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return withHsts(await env.ASSETS.fetch(request));
    }

    const url = new URL(request.url);
    const hostname = url.hostname.toLowerCase();
    const isLocalHost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".workers.dev");
    if (!isLocalHost && (url.protocol === "http:" || hostname === "www.komawm.org")) {
      return new Response(null, {
        status: 301,
        headers: {
          Location: `https://komawm.org${url.pathname}${url.search}`,
          "Strict-Transport-Security": HSTS_HEADER,
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    const { pathname } = url;

    // Serve static binaries, media, CSS/JS chunks, sitemaps, and search indices directly.
    if (
      STATIC_PREFIXES.some((p) => pathname.startsWith(p)) ||
      /\.(?:css|js|json|xml|ico|svg|png|webp|jpg|webm|mp4|woff2|txt)$/iu.test(pathname)
    ) {
      return withHsts(await env.ASSETS.fetch(request));
    }

    const ua = request.headers.get("user-agent") ?? "";
    if (BOT_RE.test(ua)) {
      return withHsts(await env.ASSETS.fetch(request));
    }

    const cookieLocale = parseCookieLocale(request.headers.get("cookie"));
    const pathLocale = currentPathLocale(pathname);

    // Only auto-redirect when the user has NOT explicitly chosen a language yet
    // and is landing on an unprefixed English entry path (`/` or `/jiku/` or `/docs/...`).
    if (!cookieLocale && pathLocale === "en") {
      const preferred = inferGeoLocale(request);
      if (preferred !== "en") {
        const dest = new URL(request.url);
        if (!isLocalHost) {
          dest.protocol = "https:";
          dest.hostname = "komawm.org";
        }
        dest.pathname = localizePathname(pathname, preferred);
        return new Response(null, {
          status: 302,
          headers: {
            Location: dest.toString(),
            "Strict-Transport-Security": HSTS_HEADER,
            Vary: "Cookie, CF-IPCountry, Accept-Language",
            "Cache-Control": "private, no-store",
          },
        });
      }
    }

    return withHsts(await env.ASSETS.fetch(request));
  },
};
