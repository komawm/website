# Koma & Jiku Website (`komawm.org`)

Tri-lingual (`en`, `zh-CN`, `ja`) static Astro website for [Koma](https://github.com/komawm/koma) (`https://komawm.org`) and its optional companion [Jiku](https://github.com/komawm/jiku) (`https://komawm.org/jiku/`).

## Highlights

- **Pure Bun 1.4.4+ Toolchain**: Uses native `bun fmt --no-script`, `bun check --no-script`, `bun test`, and `scripts/lint.ts` with zero Prettier, ESLint, esbuild, or `bunx` dependencies.
- **Dedicated Hero & Manual Surfaces**: `/` and `/jiku/` render focused product hero pages with architecture highlights and multi-distro install channels backed by [komawm/packaging](https://github.com/komawm/packaging) and `https://cdn.komawm.org`, while `/docs/` and `/jiku/docs/` render the tri-lingual [komawm/docs](https://github.com/komawm/docs) manuals.
- **Edge IP Geo-Detection (`src/worker.ts`)**: Directs first-time visitors from `JP` to `/ja/` and `CN` to `/zh-CN/` via Cloudflare `request.cf.country`, while respecting explicit `komawm_locale` cookie overrides and keeping search crawlers untouched.
- **Pre-Rendered Markdown + Zero-Reload Navigation**: Compiles Markdown at Astro build time into static HTML under `dist/` for Cloudflare Workers Static Assets, with search indexing (`search-index.json`), `sitemap.xml`, and Reader View semantic markup.

## Local Development

```bash
just install
just check
```

## License

Website source and infrastructure are MIT licensed; see [LICENSE](https://github.com/komawm/website/blob/main/LICENSE).
