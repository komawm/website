# Jiku Overview

> [!NOTE]
> **Jiku** (`jikud` and `jiku`) is an optional standalone companion daemon and CLI hosted at [komawm/jiku](https://github.com/komawm/jiku). [Koma](/) runs completely independently with no AI dependencies when Jiku is not installed.

![Jiku 1.00x realtime landscape painting in QEMU](https://cdn.komawm.org/media/v0.0.1/jiku-paint-realtime-uncut.mp4 "Uncut 1.00x QEMU recording (89.35 s at 20 fps, 85/85 steps across 3 passes: 29 toolbar clicks + 56 Catmull-Rom spline strokes).")

![Final 3-pass landscape canvas in Koma](https://cdn.komawm.org/media/v0.0.1/jiku-paint-final-3passes.webp "Completed 3-pass painting inside Koma with workspace lease border.")

Watch the [stroke-only 1.00x cut](https://cdn.komawm.org/media/v0.0.1/jiku-paint-strokes-1x.mp4) (`46.00 s` at `1.00x` speed) alongside the earlier [grid-targeting screenshot](https://cdn.komawm.org/media/jiku-paint.webp).

## What Jiku Does

Jiku separates fast screen checks, multi-step task planning, small-context budgeting, speech output, and companion stage telemetry into a user-space daemon (`jikud`) and CLI (`jiku`):

- **Background daemon (`jikud`)**: Listens on `$XDG_RUNTIME_DIR/jiku.sock`, requests screenshot captures and AT-SPI2 `@snap:eN` UI trees (`SystemGroundingPack`), runs the 4-stage `context_budget` compaction waterfall, evaluates decision prompts and planner models, enforces your Lua policy script, and dispatches multi-waypoint `vseat.path` / `vseat.stroke` actions back to Koma.
- **Operator CLI and MCP server (`jiku`)**: Checks daemon health, validates config and Lua policies, runs decision prompts or multi-step tasks, captures AT-SPI2 snapshots (`jiku a11y`), inspects token budgets (`jiku context inspect`), runs offline/live ablations (`jiku bench run`), classifies `~/JikuBox`, manages skill approvals, and exposes 12 tools over dual-framing stdio MCP (`Content-Length` + NDJSON).
- **Local state and history (`~/.local/state/jiku/state.db`)**: Deduplicates unchanged frames, caches per-application shortcuts, stores full-text local history, and holds generated skill drafts until reviewed.
- **Speech synthesis & Avatar stage (`[notify]` / `[tts]` / `[avatar]`)**: Sends desktop notifications over D-Bus by default; `[tts]` adds modular providers (`espeak_ng`, `irodori`, `voicevox`, `openai_speech`, `noop`) with 20 ms lip-sync cue extraction and barge-in playback (`AudioPlaybackSink`), while `jiku avatar serve` exposes an HTTP + WebSocket `Snapshot` / `AvatarCue` companion VRM stage.

## Model Roles

| Role | Purpose | Default Model & Fallback |
| :--- | :--- | :--- |
| **Decision prompt (`[roles.decision_router]`)** | Fast UI state checks, `grid_225` coordinate targeting, safety gates, and `~/JikuBox` classification | Optional dedicated decision model (`JIKU_DECISION_API_KEY`, native zero-output-token endpoint); automatically falls back to the planner model using balanced-JSON extraction and structured output when the role is unset |
| **Planner model (`[roles.planner]`)** | Multi-step task planning, fallback when decision confidence is below `0.85`, and skill drafting | Any text/VLM model you configure (`JIKU_PLANNER_API_KEY`), including OpenAI-compatible, `llama-server`, Google AI Studio, and Anthropic endpoints |
| **Live voice session (optional)** | Experimental full-duplex voice transport | Full-duplex `BidiGenerateContent` WebSocket endpoint (disabled by default; live PipeWire microphone capture is planned for `v0.1.0`) |

## Observe → Decide → Plan → Act Loop

1. **Observe**: `jikud` connects to `koma-agent.sock` using a scoped `CapabilityToken`, calls `capture.frame` for a read-only screenshot (`block_out_from` surfaces masked) and `Epoch`, merges optional AT-SPI2 `@snap:eN` nodes via `SystemGroundingPack`, and compacts oversized prompts with `context_budget`.
2. **Decide**: Evaluates a 15-item safety checklist, closed-set choices (with `NONE_OR_OTHER` fallback), and `15×15` `grid_225` target coordinates.
3. **Plan**: Escalates ambiguous states (`< 0.85` confidence) or open-ended goals to `[roles.planner]` to produce concrete actions (`move_path`, `drag_path`, `click`, `inject_text`) or draft reusable skills.
4. **Act**: Sends `vseat.path`, `vseat.stroke`, `vseat.click`, `vseat.key`, `vseat.inject_text`, `vseat.cursor_settle`, or `macro.exec` tagged with `expected_epoch`, releasing the lease on completion and stopping immediately on `4090 ERR_STALE_EPOCH`, `4091 ERR_HUMAN_PREEMPTED`, or `4032 ERR_PROTECTED_SURFACE`.

## Quick CLI Tour

```bash
jikud --daemon --config ~/.config/jiku/config.toml --policy ~/.config/jiku/init.lua
jiku status --json
jiku decide --image shot.png "Is a terminal window visible?"
jiku plan "Summarize the active workspace"
jiku a11y snapshot --json
jiku context inspect --max-tokens 4096
jiku tts say "Ready to assist."
jiku avatar serve --bind 127.0.0.1:4190
jiku bench run --offline
jiku box classify ~/JikuBox
jiku mcp --print-tools
```
