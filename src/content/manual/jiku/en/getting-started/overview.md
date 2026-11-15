# Three-Driver Architecture

> [!NOTE]
> **Jiku** (`jikud` and `jiku`) is an optional, standalone desktop orchestration daemon hosted at [komawm/jiku](https://github.com/komawm/jiku). [Koma](/) runs completely independently with zero AI dependencies when Jiku is not installed.

![Jiku 15x15 Kumiko lattice and acoustic waves on indigo kozo washi](/placeholders/jiku-grid.webp "Jiku 15×15 spatial decision lattice (gemini-decision-1) paired with AvatarCue acoustic envelope waves.")

## Core Design: Three Specialized Model Drivers

Jiku separates sub-second closed-set visual triage, deliberative multi-step planning, and optional real-time voice interaction into three decoupled drivers inside `jikud`:

| Driver | Role | Default Endpoint & Contract |
| :--- | :--- | :--- |
| **`DecisionsDriver`** | Sub-second UI state checks, `grid_225` targeting, safety gates & `~/JikuBox` triage | `gemini-decision-1` (`POST /v1beta/decisions`, `total_output_tokens == 0`, with automatic `EmulatedStructuredTextModel` JSON-Schema fallback) |
| **`TurnModelDriver`** | Multi-step workspace planning, System-2 fallback (`< 0.85`), skill synthesis | [OpenCode Go](https://opencode.ai) `deepseek-v4.1-flash` (`thinking = false`), plus OpenAI-compatible, Google AI Studio, and Anthropic providers |
| **`LiveSessionDriver`** | Optional full-duplex voice & `AvatarCue` session transport | Gemini `BidiGenerateContent` WebSocket (disabled by default; live PipeWire audio I/O targeted for `v0.1.0`) |

## Workspace Crates (`#![forbid(unsafe_code)]`)

All four Jiku crates (`jikud`, `jiku`, `jiku-memory`, `jiku-tts`) enforce `#![forbid(unsafe_code)]` and zero raw FFI:

| Crate | Kind | Responsibility |
| :--- | :--- | :--- |
| `jikud` | Library + Binary | `$XDG_RUNTIME_DIR/jiku.sock` RPC daemon, Three-Driver clients, `DecisionCompiler`, `Phodopus` Lua policy hooks, `KomaIpcClient` (`File::from(fd)` sealed `memfd` reads) |
| `jiku` | Binary | CLI controller (`status`, `validate-config`, `decide`, `plan`, `run`, `box classify`, `memory search`, `skills`, `mcp`) |
| `jiku-memory` | Library | L0 perceptual `dHash` frame ring, L1 per-app quirks, L2 SQLite WAL + FTS5 BM25 memory, `staged_skills` approval store |
| `jiku-tts` | Library | Optional `TtsProvider` (`VOICEVOX`, `OpenAI` speech, `noop`) + `AvatarCue` packet models |

## Observe → Decide → Plan → Koma Action Loop

1. **Observe**: `jikud` connects to `koma-agent.sock` with a scoped `CapabilityToken` and requests `capture.frame` (`SCM_RIGHTS` sealed `memfd`, masked for `block_out_from` surfaces) plus `Epoch`.
2. **Decide (`DecisionsDriver`)**: Evaluates calibrated binary `Noul` safety checklists (`15` rules) and `Choice` questions (`NONE_OR_OTHER` open-world escape) over `15×15` `grid_225` cells.
3. **Plan (`TurnModelDriver`)**: Escalates ambiguous states (`< 0.85` confidence) to `[roles.planner]` (`deepseek-v4.1-flash` or configured LLM) to synthesize structured steps or candidate Lua skills.
4. **Act (`KomaIpcClient`)**: Executes `vseat.click`, `vseat.key`, `vseat.inject_text`, or `macro.exec` with `expected_epoch`, stopping immediately on `4090 ERR_STALE_EPOCH`, `4091 ERR_HUMAN_PREEMPTED`, or `4032 ERR_PROTECTED_SURFACE`.

## Quick CLI Tour

```bash
jikud --daemon --config ~/.config/jiku/config.toml --policy ~/.config/jiku/init.lua
jiku status --json
jiku decide --image shot.png "Is a terminal window visible?"
jiku plan "Summarize the active workspace"
jiku box classify ~/JikuBox
jiku mcp --print-tools
```
