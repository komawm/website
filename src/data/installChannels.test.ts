import { describe, expect, test } from "bun:test";

import { SUPPORTED_LOCALES } from "../lib/i18n.ts";
import { getInstallChannels, RELEASE_POINTERS } from "./installChannels.ts";

describe("installChannels", () => {
  test("covers Koma and Jiku distros with tri-lingual labels and R2 CDN pointers", () => {
    expect(RELEASE_POINTERS.koma).toBe(
      "https://cdn.komawm.org/install/koma/latest.txt",
    );
    expect(RELEASE_POINTERS.jiku).toBe(
      "https://cdn.komawm.org/install/jiku/latest.txt",
    );

    const komaIds = getInstallChannels("koma").map((c) => c.id);
    expect(komaIds).toEqual([
      "arch",
      "apt",
      "rpm",
      "alpine",
      "nix",
      "homebrew",
      "freebsd",
      "openbsd",
      "source",
    ]);

    const jikuIds = getInstallChannels("jiku").map((c) => c.id);
    expect(jikuIds).toEqual(["arch", "apt", "rpm", "alpine", "nix", "source"]);

    for (const surface of ["koma", "jiku"] as const) {
      for (const channel of getInstallChannels(surface)) {
        expect(channel.commands.length).toBeGreaterThan(0);
        for (const locale of SUPPORTED_LOCALES) {
          expect(channel.tabLabel[locale].length).toBeGreaterThan(0);
          expect(channel.name[locale].length).toBeGreaterThan(0);
          expect(channel.summary[locale].length).toBeGreaterThan(0);
        }
      }
    }
  });
});
