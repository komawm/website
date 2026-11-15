# Koma website guidance

This repository owns the public tri-lingual (`en`, `zh-CN`, `ja`) static Astro website at [komawm.org](https://komawm.org) and [komawm.org/jiku/](https://komawm.org/jiku/). Read the [workspace policy](https://github.com/komawm/.github/blob/main/workspace/AGENTS.md) and [workspace map](https://github.com/komawm/.github/blob/main/workspace/workspace.toml) before cross-repository work.

## Toolchain Rules

- Use the pure Bun `1.4.4` toolchain (`bun fmt --no-script`, `bun check --no-script -p tsconfig.json`, `bun test`, `bun build`).
- Never introduce Prettier, ESLint, esbuild, or `bunx` / `npx` / `pipx run` / `uvx`. Always invoke local binaries directly (for example `./node_modules/.bin/wrangler` or `./node_modules/.bin/astro`).
- Canonical documentation lives in [komawm/docs](https://github.com/komawm/docs); `scripts/sync-manual.ts` syncs published R2 bundles from `https://cdn.komawm.org/manual/` with `--if-available` fallback to bundled `src/content/manual/`.
- Keep all links in `README.md` and `AGENTS.md` as canonical `https://`, `mailto:`, or `#` URLs.

## Quality & CarryCtx Workflow

- Run `just check` to validate manual sync fallback, formatting, linting, unit tests, TypeScript/Astro typechecking, static build, `dist/` validation, Wrangler dry-run, and `actionlint`.
- Run `just hooks-install` to compose lefthook with managed CarryCtx hooks.
- Use this checkout's CarryCtx database (`WEB` prefix), named agent/session, scoped tasks, and isolated `.worktrees/` branches off `main`. Never commit databases, `node_modules/`, `dist/`, `.astro/`, or raw CarryCtx snapshots.
