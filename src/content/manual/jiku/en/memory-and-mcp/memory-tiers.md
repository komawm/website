# L0–L2 Memory Tiers & Staged Skills

Jiku persists workspace experience locally in `jiku-memory` (`~/.local/state/jiku/state.db` using SQLite WAL + FTS5) and isolates AI-synthesized skills behind a strict two-phase human approval gate.

## Three-Tier Memory Architecture (`jiku-memory`)

| Tier | Storage | Purpose & Budget |
| :--- | :--- | :--- |
| **L0: Perceptual `dHash` Ring** | In-memory (`l0_frame_ring_size`, default `32`) | Computes 64-bit `dHash` on `Koma` frames; drops duplicate frames within `perceptual_hash_threshold = 4` bits so idle screens incur zero VLM/decision calls |
| **L1: App Quirks (`l1_app_quirks`)** | SQLite table (bounded `app_quirk_max_chars = 512`) | Records per-`app_id` interaction quirks (e.g., terminal `Ctrl+Shift+V` paste requirement or dialog shortcuts) injected into planning prompts |
| **L2: Episodic FTS5 (`l2_episodes`)** | SQLite WAL + FTS5 BM25 | Indexes past goals, action outcomes, and workspace traces; searchable offline via `jiku memory search <QUERY>` |

## Two-Phase Skill Promotion & Sanitization Gate

When `stage_new_skills = true`, Jiku can propose reusable Lua or Markdown SOP skills after completing multi-step workflows, but **cannot execute unapproved skills automatically**:

1. **Stage & Static Sanitization**: Candidate scripts are written to `staged_skills` inside `~/.local/state/jiku/state.db` (`status = 'staged'`), rejecting any snippet containing `io.*`, `os.*`, `debug.*`, `package.*`, `loadfile`, `dofile`, `load(`, or `require(`.
2. **Human Inspection (`jiku skills diff`)**: Review staged proposals before promotion:
   ```bash
   jiku skills list
   jiku skills diff <skill_id>
   ```
3. **Explicit Approval (`jiku skills approve`)**: Approving a skill promotes it to `~/.config/jiku/skills/` (`status = 'approved'`) and records an audit entry:
   ```bash
   jiku skills approve <skill_id>
   ```
