/**
 * Build-time Markdown -> Pre-rendered HTML compiler using unified + remark + rehype + Shiki.
 *
 * Runs at build time before deployment to Cloudflare Workers Static Assets so clients
 * receive ready-to-paint semantic HTML (with GitHub-style Warning/Note callouts,
 * heading IDs, keyboard-scrollable tables, and dual-theme syntax highlighting) with
 * zero client-side Markdown parsing cost.
 */

import rehypeShiki from "@shikijs/rehype";
import GithubSlugger from "github-slugger";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import { remarkAlert } from "remark-github-blockquote-alert";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

export interface TocHeading {
  readonly depth: 2 | 3;
  readonly id: string;
  readonly text: string;
}

export function extractHeadings(markdown: string): TocHeading[] {
  const slugger = new GithubSlugger();
  const headings: TocHeading[] = [];
  let inFence = false;
  for (const rawLine of markdown.split("\n")) {
    if (rawLine.trimStart().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = rawLine.match(/^(#{2,3})\s+(.+)$/u);
    if (!match) continue;
    const depth = (match[1]?.length ?? 2) as 2 | 3;
    const text = (match[2] ?? "").replace(/[`*_]/gu, "").trim();
    if (text) {
      headings.push({ depth, id: slugger.slug(text), text });
    }
  }
  return headings;
}

export async function renderMarkdownToHtml(markdown: string): Promise<string> {
  // Strip top H1 because ManualPage renders `<h1 itemprop="headline">` cleanly in the header
  const bodyMd = markdown.replace(/^#\s+.+\n+/u, "");
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkAlert)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: "wrap" })
    .use(rehypeShiki, {
      themes: {
        light: "github-light",
        dark: "nord",
      },
      defaultColor: false,
    })
    .use(rehypeStringify)
    .process(bodyMd);

  // Wrap tables in keyboard-scrollable regions for mobile & accessibility
  return String(file).replace(
    /<table>([\s\S]*?)<\/table>/gu,
    '<div class="table-scroll" tabindex="0"><table>$1</table></div>',
  );
}
