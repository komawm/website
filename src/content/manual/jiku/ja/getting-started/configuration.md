# デーモン設定とポリシーサンドボックス

`jikud` は同一 UID の `systemd --user` ユニット（`resources/jikud.service`）で `ProtectHome=tmpfs` を有効化し、読み取り専用の `~/.config/jiku` と状態保存先 `~/.local/state/jiku`、`~/JikuBox`、および `$XDG_RUNTIME_DIR/koma-agent.sock` のみを最小権限でマウントします。

## `config.toml` 設定例

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
