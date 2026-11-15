const root = document.documentElement;
const media = window.matchMedia("(prefers-color-scheme: dark)");

function getSavedTheme(): string | null {
  try {
    return window.localStorage.getItem("komawm-theme");
  } catch {
    return null;
  }
}

function applyTheme(mode: string | null): void {
  const resolved =
    mode === "dark" || mode === "light" ? mode : media.matches ? "dark" : "light";
  root.setAttribute("data-theme", resolved);
}

applyTheme(getSavedTheme());
media.addEventListener("change", () => {
  if (!getSavedTheme()) applyTheme(null);
});

document.getElementById("theme-toggle")?.addEventListener("click", () => {
  const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  try {
    window.localStorage.setItem("komawm-theme", next);
  } catch {}
  applyTheme(next);
});

for (const link of document.querySelectorAll("[data-set-locale]")) {
  if (!(link instanceof HTMLElement)) continue;
  link.addEventListener("click", () => {
    const loc = link.dataset.setLocale;
    if (loc) {
      document.cookie = `komawm_locale=${loc}; Path=/; Max-Age=31536000; SameSite=Lax`;
    }
  });
}

interface SearchRecord {
  locale: string;
  href: string;
  title: string;
  section: string;
  surface: string;
  excerpt: string;
}

let cachedIndex: SearchRecord[] | null = null;
const rawInput = document.getElementById("wiki-search-input");
const input = rawInput instanceof HTMLInputElement ? rawInput : null;
const dropdown = document.getElementById("wiki-search-results");

window.addEventListener("keydown", (event) => {
  if (
    (event.key === "/" ||
      ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k")) &&
    document.activeElement !== input
  ) {
    const active = document.activeElement;
    const tag = active instanceof HTMLElement ? active.tagName : undefined;
    if (tag !== "INPUT" && tag !== "TEXTAREA") {
      event.preventDefault();
      input?.focus();
    }
  } else if (event.key === "Escape" && dropdown && !dropdown.hidden) {
    dropdown.hidden = true;
    input?.blur();
  }
});

input?.addEventListener("input", async () => {
  if (!dropdown) return;
  const query = input.value.trim().toLowerCase();
  if (!query) {
    dropdown.hidden = true;
    return;
  }
  if (!cachedIndex) {
    try {
      const res = await fetch("/search-index.json");
      const parsed: unknown = await res.json();
      cachedIndex = Array.isArray(parsed) ? (parsed as SearchRecord[]) : [];
    } catch {
      cachedIndex = [];
    }
  }
  const loc = input.dataset.locale ?? "en";
  const hits = cachedIndex
    .filter(
      (record) =>
        record.locale === loc &&
        `${record.title} ${record.section} ${record.excerpt}`
          .toLowerCase()
          .includes(query),
    )
    .slice(0, 8);

  dropdown.replaceChildren();
  if (hits.length === 0) {
    const empty = document.createElement("p");
    empty.className = "search-empty";
    empty.textContent = input.dataset.empty ?? "No results";
    dropdown.appendChild(empty);
  } else {
    for (const hit of hits) {
      const anchor = document.createElement("a");
      anchor.href = hit.href;
      anchor.className = "search-hit";
      anchor.dataset.docSwapLink = "true";
      const meta = document.createElement("span");
      meta.className = "search-hit-meta";
      meta.textContent = `${hit.surface} / ${hit.section}`;
      const title = document.createElement("strong");
      title.textContent = hit.title;
      anchor.append(meta, title);
      dropdown.appendChild(anchor);
    }
  }
  dropdown.hidden = false;
});
