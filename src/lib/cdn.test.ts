import { describe, expect, test } from "bun:test";

import { cdnUrl } from "./cdn.ts";

describe("cdnUrl", () => {
  test("builds safe R2 CDN URLs for allowed prefixes", () => {
    expect(cdnUrl("manual/koma/latest.json")).toBe(
      "https://cdn.komawm.org/manual/koma/latest.json",
    );
    expect(cdnUrl("apt/komawm.sources")).toBe(
      "https://cdn.komawm.org/apt/komawm.sources",
    );
  });

  test("rejects traversal, leading slash, and unknown prefixes", () => {
    expect(() => cdnUrl("../secret")).toThrow();
    expect(() => cdnUrl("/manual/koma/latest.json")).toThrow();
    expect(() => cdnUrl("private/key.pem")).toThrow();
  });
});
