# L0–L2 SQLite FTS5 Memory & Skills

`jiku-memory` persists local state in `~/.local/state/jiku/state.db` (SQLite WAL + FTS5 BM25) across three bounded tiers without external vector database daemons:

- **L0 Perceptual Frame Ring**: Bounded in-RAM ring buffer of recent workspace frames indexed by `dHash` to detect visual state transitions without redundant model calls.
- **L1 Per-App Quirk Cards**: Frozen per-`app_id` UI notes injected deterministically to preserve prompt-cache prefixes.
- **L2 Episodic FTS5 Log & Staged Skills**: Append-only trajectory log searchable via `jiku memory search`, paired with human-gated Lua macro promotion (`jiku skills diff` and `jiku skills approve`) so candidate skills never self-activate unreviewed.
