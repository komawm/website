import { describe, expect, test } from "bun:test";

import { localizePath, SUPPORTED_LOCALES, UI_MESSAGES } from "./i18n.ts";

describe("tri-lingual i18n parity & route helpers", () => {
  test("all three locales define identical UI message keys", () => {
    const enKeys = Object.keys(UI_MESSAGES.en).sort();
    for (const locale of SUPPORTED_LOCALES) {
      expect(Object.keys(UI_MESSAGES[locale]).sort()).toEqual(enKeys);
    }
  });

  test("localizePath preserves Koma and Jiku sub-site routes across en, zh-CN, and ja", () => {
    expect(localizePath("/", "ja")).toBe("/ja/");
    expect(localizePath("/ja/jiku/docs/getting-started/quickstart/", "zh-CN")).toBe(
      "/zh-CN/jiku/docs/getting-started/quickstart/",
    );
    expect(localizePath("/zh-CN/docs/configuration/init-lua/", "en")).toBe(
      "/docs/configuration/init-lua/",
    );
  });
});
