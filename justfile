set shell := ["bash", "-euo", "pipefail", "-c"]

default: check

install:
    bun install --frozen-lockfile

[private]
ensure-deps:
    test -x node_modules/.bin/astro || { echo "dependencies missing; run 'just install' first" >&2; exit 1; }
    test -x node_modules/.bin/wrangler || { echo "wrangler missing; run 'just install' first" >&2; exit 1; }

fmt:
    bun fmt --no-script

fmt-check:
    bun fmt --no-script --check

fmt-check-files *FILES:
    bun fmt --no-script --check --ignore-unknown {{FILES}}

lint:
    bun run lint

test:
    bun test src

manual-sync:
    bun run sync:manual

typecheck: ensure-deps
    bun run typecheck

build: ensure-deps
    bun run build

dist: build
    bun run validate:dist

wrangler-dry-run: dist
    bun run wrangler:dry-run

actionlint:
    actionlint .github/workflows/*.yml

hooks-install:
    lefthook install pre-commit
    carryctx hooks install --compose

check: ensure-deps
    bun run check
    actionlint .github/workflows/*.yml

deploy: ensure-deps
    bun run deploy
