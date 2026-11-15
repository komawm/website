# Jiku Overview

> [!NOTE]
> **Jiku** (`jikud` and `jiku`) is an optional standalone companion daemon and CLI hosted at [komawm/jiku](https://github.com/komawm/jiku). [Koma](/) runs completely independently with no AI dependencies when Jiku is not installed.

![Jiku inspecting and automating a paint window inside Koma](/media/jiku-paint.webp "Jiku inspecting a paint window inside Koma using screenshot capture and grid targeting.")

## What Jiku Does

Jiku separates fast screen checks, multi-step task planning, and optional audio output into a user-space daemon (`jikud`) and CLI (`jiku`):

- **Background daemon (`jikud`)**: Listens on `$XDG_RUNTIME_DIR/jiku.sock`, requests screenshot captures from Koma, evaluates decision prompts and planner models, enforces your Lua policy script, and sends virtual keyboard/pointer actions back to Koma.
- **Operator CLI and MCP server (`jiku`)**: Checks daemon health, validates config and Lua policies, runs decision prompts or multi-step tasks, classifies directories in `~/JikuBox`, searches full-text local history, manages skill approvals, and exposes tools over stdio MCP.
- **Local state and history (`~/.local/state/jiku/state.db`)**: Deduplicates unchanged frames, caches per-application shortcuts, stores full-text local history, and holds generated skill drafts until reviewed.
- **Notifications and optional speech (`[notify]` / `[tts]`)**: Sends desktop notifications over D-Bus by default; text-to-speech (`VOICEVOX`, `OpenAI` speech, or `noop`) is disabled by default.

## Model Roles

| Role | Purpose | Default Model & Fallback |
| :--- | :--- | :--- |
| **Decision prompt (`[roles.decision_router]`)** | Fast UI state checks, `grid_225` coordinate targeting, safety gates, and `~/JikuBox` classification | `gemini-decision-1` (`GEMINI_API_KEY`); automatically falls back to the planner model using structured JSON output when no Gemini key is set |
| **Planner model (`[roles.planner]`)** | Multi-step task planning, fallback when decision confidence is below `0.85`, and skill drafting | [OpenCode Go](https://opencode.ai) `deepseek-v4.1-flash` (`thinking = false`), plus OpenAI-compatible, Google AI Studio, and Anthropic endpoints |
| **Live voice session (optional)** | Experimental full-duplex voice transport | Gemini `BidiGenerateContent` WebSocket (disabled by default; live PipeWire audio I/O is planned for `v0.1.0`) |

## Observe → Decide → Plan → Act Loop

1. **Observe**: `jikud` connects to `koma-agent.sock` using a scoped `CapabilityToken` and calls `capture.frame` for a read-only screenshot capture (with `block_out_from` surfaces masked by Koma) and the current `Epoch`.
2. **Decide**: Evaluates a 15-item safety checklist, closed-set choices (with `NONE_OR_OTHER` fallback), and `15×15` `grid_225` target coordinates.
3. **Plan**: Escalates ambiguous states (`< 0.85` confidence) or open-ended goals to `[roles.planner]` to produce concrete actions or draft reusable skills.
4. **Act**: Sends `vseat.click`, `vseat.key`, `vseat.inject_text`, or `macro.exec` tagged with `expected_epoch`, stopping immediately on `4090 ERR_STALE_EPOCH`, `4091 ERR_HUMAN_PREEMPTED`, or `4032 ERR_PROTECTED_SURFACE`.

## Quick CLI Tour

```bash
jikud --daemon --config ~/.config/jiku/config.toml --policy ~/.config/jiku/init.lua
jiku status --json
jiku decide --image shot.png "Is a terminal window visible?"
jiku plan "Summarize the active workspace"
jiku box classify ~/JikuBox
jiku mcp --print-tools
```
