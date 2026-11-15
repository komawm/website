import { describe, expect, test } from "bun:test";

import { getShikiTokensCss, renderMarkdownToHtml } from "./markdown.ts";

describe("markdown Shiki external token classes", () => {
  test("replaces inline Shiki style attributes with deterministic shk- classes", async () => {
    const sample = "# Demo\n\n```lua\nlocal ok = true\n```\n";
    const html1 = await renderMarkdownToHtml(sample);
    const html2 = await renderMarkdownToHtml(sample);

    expect(html1).toBe(html2);
    expect(html1).not.toContain("style=");
    const classes = [...html1.matchAll(/\b(shk-[0-9a-f]{8})\b/gu)].map(
      (match) => match[1] ?? "",
    );
    expect(classes.length).toBeGreaterThan(0);

    const css = getShikiTokensCss();
    for (const cls of classes) {
      expect(css).toContain(`.${cls}{`);
    }
  });
});
