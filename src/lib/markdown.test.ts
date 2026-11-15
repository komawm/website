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

  test("preserves semantic MathML and .math-block/.math-inline while stripping unsafe HTML/style/scripts", async () => {
    const sample = [
      "# Math",
      "",
      '<div class="math-block" style="color:red"><math display="block"><mi>m</mi><mover><mi>x</mi><mo>¨</mo></mover></math></div>',
      "",
      'Inline <span class="math-inline"><math><mi>k</mi><mo>=</mo><mn>420</mn></math></span> <script>alert(1)</script><span onclick="x()">ok</span>',
      "",
    ].join("\n");
    const html = await renderMarkdownToHtml(sample);
    expect(html).toContain('<div class="math-block"><math display="block">');
    expect(html).toContain('<span class="math-inline"><math>');
    expect(html).not.toContain("style=");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick=");
  });
});
