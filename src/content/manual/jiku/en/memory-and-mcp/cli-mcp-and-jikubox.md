# jiku CLI, MCP Server & JikuBox

`jiku` provides both an interactive/scriptable operator CLI and an stdio Model Context Protocol (MCP) server for workspace inspection, policy checks, and skill review.

## Operator CLI Commands

Global flags accepted before any subcommand:

- `--config <PATH>` — Override the daemon/CLI configuration path.
- `--policy <PATH>` — Override the safety policy file.
- `--socket <PATH>` — Override the Koma IPC socket path.
- `--json` — Emit machine-readable JSON instead of human-readable summaries.

Available subcommands in the verified repository CLI (`jiku` crate):

```bash
jiku status
jiku validate-config
jiku decide "<prompt>"
jiku plan "<goal>"
jiku run "<task>"
jiku box classify [<DIR>]
jiku memory search "<QUERY>"
jiku skills list
jiku skills diff
jiku skills stage <PATH>
jiku skills approve <NAME>
```

The headless daemon can also verify configuration without launching a graphical session:

```bash
jikud --headless-check
```

## Model Context Protocol (MCP) Server

Run `jiku mcp` over standard input/output for external agent hosts or editor integrations:

```bash
jiku mcp --print-tools
jiku mcp --stateless
```

The server exposes seven tools:

| Tool | Purpose |
| --- | --- |
| `jiku_status` | Query current daemon, socket, and runtime health. |
| `jiku_run_task` | Submit a task through the Jiku execution pipeline. |
| `jiku_decide` | Compile a structured routing/action decision from input. |
| `jiku_plan` | Generate a multi-step plan before execution. |
| `jiku_box_classify` | Classify a project directory via JikuBox heuristics. |
| `jiku_memory_search` | Query indexed local memory tiers. |
| `jiku_skills_list` | List installed and staged skill definitions. |

## JikuBox & Skill Governance

`jiku box classify` detects project structure and workspace metadata in a target directory (defaulting to the current directory) before generating context for planning.

Skill updates follow an explicit review gate: inspect available skills with `jiku skills list`, review proposed edits with `jiku skills diff`, queue changes with `jiku skills stage`, and promote reviewed skills with `jiku skills approve`.

For the exact source implementation, see the [komawm/jiku repository](https://github.com/komawm/jiku).
