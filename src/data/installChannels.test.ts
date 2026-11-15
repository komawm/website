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

    const komaSource = getInstallChannels("koma").find((c) => c.id === "source");
    expect(komaSource?.commands[0]?.code).toContain(
      "koma komactl koma-mcp koma-overview",
    );
    expect(komaSource?.commands[0]?.code).not.toContain("koma-compositor");

    const komaBrew = getInstallChannels("koma").find((c) => c.id === "homebrew");
    expect(komaBrew?.commands[0]?.code).toContain(
      "https://cdn.komawm.org/install/koma/koma.rb",
    );

    const jikuSource = getInstallChannels("jiku").find((c) => c.id === "source");
    expect(jikuSource?.commands[0]?.code).toContain("jikud jiku");
    expect(jikuSource?.commands[0]?.code).not.toContain("jiku-cli");

    const jikuRpm = getInstallChannels("jiku").find((c) => c.id === "rpm");
    expect(
      jikuRpm?.commands.some((cmd) =>
        cmd.code.includes("https://cdn.komawm.org/releases/jiku/"),
      ),
    ).toBe(true);
  });
});
