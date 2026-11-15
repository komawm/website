# CLI, MCP & JikuBox

`jiku` provides a scriptable operator CLI and an stdio Model Context Protocol (MCP) server for workspace inspection, policy checks, `~/JikuBox` classification, and skill review.

## Operator CLI Commands

Global flags accepted before any subcommand:

- `--config <PATH>` — Override the configuration file path.
- `--policy <PATH>` — Override the Lua policy file path.
- `--socket <PATH>` — Override the Koma IPC socket path.
- `--json` — Emit machine-readable JSON instead of human-readable text.

Available `jiku` subcommands:

```bash
jiku status
jiku validate-config
jiku decide "<prompt>"
jiku plan "<goal>"
jiku run "<task>"
jiku a11y snapshot [--json]
jiku a11y act <@snap:eN> [--action click]
jiku tts say "<text>"
jiku tts stop
jiku avatar serve [--bind <ADDR>] [--vrm <PATH>]
jiku context inspect [--max-tokens <N>] [--sample-text <TEXT>]
jiku bench run [--offline|--live] [--endpoint <URL>] [--model <NAME>] [--out-dir <DIR>]
jiku box classify [<DIR>]
jiku memory search "<QUERY>"
jiku skills list
jiku skills diff
jiku skills stage <PATH>
jiku skills approve <NAME>
```

Verify daemon configuration offline without starting a graphical session:

```bash
jikud --headless-check
```

## Model Context Protocol (MCP) Server

Run `jiku mcp` over standard input/output (auto-detecting `Content-Length` and `NDJSON` framing per message) for external agent hosts or editor integrations:

```bash
jiku mcp --print-tools
jiku mcp --stateless
```

The server exposes twelve tools:

| Tool | Purpose |
| :--- | :--- |
| `jiku_status` | Query current daemon, socket, and runtime status. |
| `jiku_run_task` | Submit a task through the Jiku execution pipeline. |
| `jiku_decide` | Run a structured decision prompt from input. |
| `jiku_plan` | Generate a multi-step plan before execution. |
| `jiku_box_classify` | Classify a directory via JikuBox heuristics. |
| `jiku_memory_search` | Query full-text local history and memory layers. |
| `jiku_skills_list` | List installed and staged skill definitions. |
| `jiku_a11y_snapshot` | Capture situational AT-SPI2 UI accessibility nodes with `@snap:eN` refs. |
| `jiku_a11y_act` | Invoke a semantic AT-SPI2 action targeting an `@snap:eN` ref. |
| `jiku_tts_say` | Synthesize and enqueue speech audio plus 20 ms lip-sync timeline cues. |
| `jiku_context_inspect` | Inspect 4-stage token budget compaction without hitting an upstream LLM. |
| `jiku_bench_run` | Run offline or live `2x2` `VirtualPaint` decision vs. grounding benchmarks. |

## JikuBox & Skill Review Workflow

`jiku box classify [<DIR>]` inspects a target directory (defaulting to the current directory, commonly `~/JikuBox`) to organize files and summarize project metadata before planning.

Skill updates follow an explicit review gate: list skills with `jiku skills list`, inspect pending changes with `jiku skills diff`, queue local edits with `jiku skills stage <PATH>`, and activate reviewed skills with `jiku skills approve <NAME>`.

For the source implementation, see the [komawm/jiku repository](https://github.com/komawm/jiku).
