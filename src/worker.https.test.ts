import { describe, expect, test } from "bun:test";

import worker from "./worker.ts";

function makeEnv(onFetch?: (req: Request) => void) {
  return {
    ASSETS: {
      async fetch(req: Request): Promise<Response> {
        onFetch?.(req);
        return new Response("ok", { status: 200 });
      },
    },
  };
}

describe("HTTPS canonicalization, HSTS, and static /media routing", () => {
  test("redirects http://komawm.org to https://komawm.org with 301 and HSTS", async () => {
    const res = await worker.fetch(
      new Request("http://komawm.org/zh-CN/jiku/?tab=arch"),
      makeEnv() as never,
    );
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("https://komawm.org/zh-CN/jiku/?tab=arch");
    expect(res.headers.get("strict-transport-security")).toBe(
      "max-age=31536000; includeSubDomains",
    );
  });

  test("redirects http://www.komawm.org to apex https://komawm.org with 301", async () => {
    const res = await worker.fetch(
      new Request("http://www.komawm.org/docs/getting-started/home/"),
      makeEnv() as never,
    );
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe(
      "https://komawm.org/docs/getting-started/home/",
    );
    expect(res.headers.get("strict-transport-security")).toBe(
      "max-age=31536000; includeSubDomains",
    );
  });

  test("attaches HSTS header on HTTPS asset and geo-redirect responses", async () => {
    const res = await worker.fetch(
      new Request("https://komawm.org/", {
        headers: { "user-agent": "Mozilla/5.0" },
      }),
      makeEnv() as never,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("strict-transport-security")).toBe(
      "max-age=31536000; includeSubDomains",
    );

    const geoRes = await worker.fetch(
      new Request("https://komawm.org/", {
        headers: {
          "user-agent": "Mozilla/5.0",
          "accept-language": "zh-CN,zh;q=0.9",
        },
      }),
      makeEnv() as never,
    );
    expect(geoRes.status).toBe(302);
    expect(geoRes.headers.get("location")).toBe("https://komawm.org/zh-CN/");
    expect(geoRes.headers.get("strict-transport-security")).toBe(
      "max-age=31536000; includeSubDomains",
    );
  });

  test("passes /media/koma-tiling.webm directly to ASSETS bypassing geo redirect", async () => {
    let seenUrl = "";
    const res = await worker.fetch(
      new Request("https://komawm.org/media/koma-tiling.webm", {
        headers: {
          "user-agent": "Mozilla/5.0",
          "cf-ipcountry": "CN",
        },
      }),
      makeEnv((req) => {
        seenUrl = req.url;
      }) as never,
    );
    expect(res.status).toBe(200);
    expect(seenUrl).toBe("https://komawm.org/media/koma-tiling.webm");
    expect(res.headers.get("strict-transport-security")).toBe(
      "max-age=31536000; includeSubDomains",
    );
  });
});
