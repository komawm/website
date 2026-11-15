# Three-Driver Architecture

> [!NOTE]
> Jiku (`jikud` and `jiku`) is an optional standalone subsystem hosted at [komawm/jiku](https://github.com/komawm/jiku). [Koma](/) operates completely independently without Jiku installed.

Jiku separates high-frequency visual triage, deliberative planning, and real-time voice interaction into three specialized model drivers:

| Driver | Role | Default Endpoint & Contract |
| :--- | :--- | :--- |
| `DecisionsDriver` | Sub-second UI state checks & `~/JikuBox` file triage | `gemini-decision-1` (`POST /v1beta/decisions`, `total_output_tokens == 0`, with `EmulatedStructuredTextModel` fallback) |
| `TurnModelDriver` | Multi-step workspace planning & tool calls | [OpenCode Go](https://opencode.ai) `deepseek-v4.1-flash` (`thinking = false`), plus OpenAI / Google / Anthropic |
| `LiveSessionDriver` | Full-duplex voice & `AvatarCue` session transport | Gemini `BidiGenerateContent` WebSocket (live PipeWire audio device I/O targeted for `v0.1.0`) |

![Jiku 15x15 Kumiko lattice and acoustic waves on indigo kozo washi](/placeholders/jiku-grid.webp "Jiku 15×15 spatial decision lattice (gemini-decision-1) paired with AvatarCue acoustic envelope waves.")

## Quick CLI Tour

```bash
jikud --daemon --config ~/.config/jiku/config.toml --policy ~/.config/jiku/init.lua
jiku status --json
jiku decide --image shot.png "Is a terminal window visible?"
jiku plan "Summarize the active workspace"
jiku box classify ~/JikuBox
jiku mcp --print-tools
```
