# Daemon Config & Policy Sandbox

`jikud` runs inside a hardened same-UID systemd user unit (`resources/jikud.service`) with `ProtectHome=tmpfs`, exposing only `~/.config/jiku` (read-only), `~/.local/state/jiku` (read-write), `~/JikuBox`, and `$XDG_RUNTIME_DIR/koma-agent.sock`.

## Example `config.toml`

```toml
[daemon]
socket_name = "jiku.sock"
koma_agent_socket = "koma-agent.sock"

[roles.decision_router]
provider = "gemini"
model = "gemini-decision-1"

[roles.decision_router.compiler.grid]
rows = 15
cols = 15

[roles.planner]
kind = "opencode_go"
model = "deepseek-v4.1-flash"
thinking = false
```
