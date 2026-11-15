import { describe, expect, test } from "bun:test";

import { getShikiTokensCss, renderMarkdownToHtml } from "./markdown.ts";

describe("markdown Shiki external token classes and AST MathML", () => {
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

  test("compiles $$...$$ and $...$ into safe HAST MathML without raw HTML parsing", async () => {
    const sample = [
      "# Spring & Visual Fast-Path Math",
      "",
      "$$m\\ddot{x} + c\\dot{x} + k(x - x_{\\text{target}}) = 0$$",
      "",
      "Inline $c = 2\\zeta\\sqrt{mk}$ and subscripted $x_1 + y_2 \\le 1.0$, plus code `$XDG_RUNTIME_DIR` and currency $5 to $10.",
      "",
      "1. Cluster expectation:",
      "",
      "   $$E[\\text{step}_{\\text{key}}] = \\sum_{k=1}^{K} k \\cdot P(\\text{Step}_k)$$",
      "",
      'Raw HTML probe: <script>alert(1)</script><div onclick="x()" style="color:red">raw</div>',
      "",
    ].join("\n");
    const html = await renderMarkdownToHtml(sample);
    expect(html).toContain(
      '<div class="math-block"><math display="block" xmlns="http://www.w3.org/1998/Math/MathML">',
    );
    expect(html).toContain(
      '<span class="math-inline"><math xmlns="http://www.w3.org/1998/Math/MathML">',
    );
    expect(html).toContain("<munderover>");
    expect(html).toContain("<msqrt>");
    expect(html).toContain("<code>$XDG_RUNTIME_DIR</code>");
    expect(html).toContain("$5 to $10");
    expect(html).not.toContain("style=");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick=");
    expect(html).not.toContain("<div onclick");
    // Ensure <div class="math-block"> is never nested illegally inside <p>
    expect(html).not.toMatch(/<p>[^<]*<div class="math-block">/u);
  });
});
