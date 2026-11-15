const pageCache = new Map<string, string>();

async function fetchDocHtml(url: string): Promise<string> {
  const cached = pageCache.get(url);
  if (cached) return cached;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  pageCache.set(url, html);
  return html;
}

async function navigateDoc(href: string, push = true): Promise<void> {
  try {
    const rawHtml = await fetchDocHtml(href);
    const parsed = new DOMParser().parseFromString(rawHtml, "text/html");
    const nextArticle = parsed.getElementById("doc-article");
    const nextToc = parsed.getElementById("doc-toc");
    const curArticle = document.getElementById("doc-article");
    const curToc = document.getElementById("doc-toc");
    if (!nextArticle || !curArticle) {
      window.location.assign(href);
      return;
    }
    curArticle.replaceWith(nextArticle);
    if (nextToc && curToc) curToc.replaceWith(nextToc);
    document.title = parsed.title;
    if (push) window.history.pushState({}, "", href);
    window.scrollTo({ top: 0, behavior: "instant" });

    const targetPathname = new URL(href, window.location.origin).pathname;
    for (const anchor of document.querySelectorAll(
      ".wiki-sidebar a[data-doc-swap-link]",
    )) {
      if (!(anchor instanceof HTMLAnchorElement)) continue;
      const match =
        new URL(anchor.href, window.location.origin).pathname === targetPathname;
      if (match) anchor.setAttribute("aria-current", "page");
      else anchor.removeAttribute("aria-current");
    }
  } catch {
    window.location.assign(href);
  }
}

document.addEventListener("mouseover", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const anchor = target.closest("a[data-doc-swap-link]");
  if (anchor instanceof HTMLAnchorElement && anchor.origin === window.location.origin) {
    fetchDocHtml(anchor.href).catch(() => {});
  }
});

document.addEventListener("click", (event) => {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }
  const target = event.target;
  if (!(target instanceof Element)) return;
  const anchor = target.closest("a[data-doc-swap-link]");
  if (
    !(anchor instanceof HTMLAnchorElement) ||
    anchor.origin !== window.location.origin
  ) {
    return;
  }
  if (document.getElementById("doc-article")) {
    event.preventDefault();
    void navigateDoc(anchor.href, true);
  }
});

window.addEventListener("popstate", () => {
  if (document.getElementById("doc-article")) {
    void navigateDoc(window.location.href, false);
  }
});
