# 守护进程配置与策略沙箱

`jikud` 通过同 UID 隔离的 `systemd --user` 单元（`resources/jikud.service`）运行，启用 `ProtectHome=tmpfs` 遮蔽真实主目录，仅按白名单挂载只读的 `~/.config/jiku`、可写的 `~/.local/state/jiku`、`~/JikuBox` 以及 `$XDG_RUNTIME_DIR/koma-agent.sock`。

## `config.toml` 配置示例

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
