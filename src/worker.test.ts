import { describe, expect, test } from "bun:test";

import worker, {
  currentPathLocale,
  localizePathname,
  parseCookieLocale,
} from "./worker.ts";

function makeEnv() {
  return {
    ASSETS: {
      fetch: async (req: Request) => new Response(`asset:${new URL(req.url).pathname}`),
    },
  };
}

describe("Cloudflare Edge Geo-Locale Worker", () => {
  test("parses cookie locale and localizes pathnames cleanly", () => {
    expect(parseCookieLocale("foo=1; komawm_locale=ja; bar=2")).toBe("ja");
    expect(parseCookieLocale("komawm_locale=fr")).toBeNull();
    expect(currentPathLocale("/zh-CN/docs/")).toBe("zh-CN");
    expect(localizePathname("/jiku/", "ja")).toBe("/ja/jiku/");
  });

  test("redirects JP and CN human visitors without cookie to localized path", async () => {
    const req = new Request("https://komawm.org/jiku/", {
      headers: { "user-agent": "Mozilla/5.0" },
    }) as Request & { cf?: { country?: string } };
    req.cf = { country: "JP" };

    const res = await worker.fetch(req, makeEnv());
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://komawm.org/ja/jiku/");
  });

  test("respects explicit komawm_locale cookie and bypasses bots & static assets", async () => {
    const cookieReq = new Request("https://komawm.org/", {
      headers: {
        "user-agent": "Mozilla/5.0",
        cookie: "komawm_locale=en",
      },
    }) as Request & { cf?: { country?: string } };
    cookieReq.cf = { country: "CN" };

    const cookieRes = await worker.fetch(cookieReq, makeEnv());
    expect(cookieRes.status).toBe(200);
    expect(await cookieRes.text()).toBe("asset:/");

    const botReq = new Request("https://komawm.org/", {
      headers: { "user-agent": "Googlebot/2.1" },
    }) as Request & { cf?: { country?: string } };
    botReq.cf = { country: "JP" };

    const botRes = await worker.fetch(botReq, makeEnv());
    expect(botRes.status).toBe(200);
  });

  test("redirects www.komawm.org to apex https://komawm.org with 301 preserving path and query", async () => {
    const rootReq = new Request("https://www.komawm.org/", {
      headers: { "user-agent": "Mozilla/5.0" },
    });
    const rootRes = await worker.fetch(rootReq, makeEnv());
    expect(rootRes.status).toBe(301);
    expect(rootRes.headers.get("location")).toBe("https://komawm.org/");
    expect(rootRes.headers.get("cache-control")).toBe("public, max-age=300");

    const docsReq = new Request("https://WWW.KOMAWM.ORG/jiku/docs/?q=memory", {
      headers: { "user-agent": "Googlebot/2.1" },
    });
    const docsRes = await worker.fetch(docsReq, makeEnv());
    expect(docsRes.status).toBe(301);
    expect(docsRes.headers.get("location")).toBe(
      "https://komawm.org/jiku/docs/?q=memory",
    );
  });
});
