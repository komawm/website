# Memory & Skills

Jiku stores session state and full-text local history in `~/.local/state/jiku/state.db` and gates every generated skill behind human review.

![Searching local Jiku history and checking skills in a Koma terminal](/media/jiku-terminal.webp "Inspecting Jiku memory search output and skill status from a terminal.")

## Local Memory Layers

| Layer | Storage | Purpose & Budget |
| :--- | :--- | :--- |
| **L0: Frame Deduplication Ring** | In-memory (`l0_frame_ring_size`, default `32`) | Computes a 64-bit `dHash` on Koma screenshot captures and skips frames within `perceptual_hash_threshold = 4` bits so idle screens trigger zero model calls |
| **L1: App Quirks (`l1_app_quirks`)** | Local database table (`app_quirk_max_chars = 512`) | Records per-`app_id` input details (such as `Ctrl+Shift+V` paste in terminals) injected into planner prompts |
| **L2: Episode History (`l2_episodes`)** | Local full-text index | Indexes past goals, action outcomes, and workspace traces; searchable offline via `jiku memory search <QUERY>` |

## Two-Phase Skill Approval & Sanitization

When `stage_new_skills = true`, Jiku can propose reusable Lua or Markdown SOP skills after multi-step workflows, but **never executes unapproved skills automatically**:

1. **Stage & Static Sanitization**: Candidate scripts are stored in `staged_skills` inside `~/.local/state/jiku/state.db` (`status = 'staged'`), rejecting any snippet containing `io.*`, `os.*`, `debug.*`, `package.*`, `loadfile`, `dofile`, `load(`, or `require(`.
2. **Human Inspection (`jiku skills diff`)**: Review staged proposals before promotion:
   ```bash
   jiku skills list
   jiku skills diff <skill_id>
   ```
3. **Explicit Approval (`jiku skills approve`)**: Approving a skill promotes it to `~/.config/jiku/skills/` (`status = 'approved'`) and records an audit entry:
   ```bash
   jiku skills approve <skill_id>
   ```
