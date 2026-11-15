# 配置文件与策略

`jikud` 从 `~/.config/jiku/config.toml` 读取配置（可通过 `--config` 或 `$JIKU_CONFIG` 覆盖），并从 `~/.config/jiku/init.lua` 加载策略钩子（可通过 `--policy` 或 `$JIKU_POLICY` 覆盖）。所有字段均带有校验后的默认值，在未创建自定义配置文件时也能正常启动和检查。

## `config.toml` 配置参考

```toml
[daemon]
locale = "zh-CN"                 # "zh-CN" | "ja-JP" | "en-US"
socket_name = "jiku.sock"        # 创建于 $XDG_RUNTIME_DIR/
dropbox_dir = "~/JikuBox"

[koma]
default_workspace = "agent:work"
default_overlay = "grid_225"     # "grid_225" | "som" | "none"
perceptual_hash_threshold = 4    # 重复画面去重的汉明距离阈值

[providers.opencode_go]
kind = "opencode_go"
base_url = "https://opencode.ai/inference/go/openai/v1"
api_key_env = "OPENCODE_GO_API_KEY"
thinking = false

[providers.gemini]
kind = "google_gemini"
base_url = "https://generativelanguage.googleapis.com/v1beta"
api_key_env = "GEMINI_API_KEY"

[roles.planner]
provider = "opencode_go"
model = "deepseek-v4.1-flash"
driver = "turn_sse"
thinking = false
temperature = 0.2

[roles.decision_router]
provider = "gemini"
model = "gemini-decision-1"      # 未配置密钥时自动回退至主规划模型
driver = "decisions"
optional = true
fallback_to_primary_text_model = true
```

## 判定路由与网格参数（`[decision_router.compiler]`）

空间网格尺寸和各判定阈值位于 `[decision_router.compiler]` 与 `[decision_router.compiler.grid]`：

| 配置项 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `grid.cols` / `grid.rows` | `15` / `15` | 空间定位网格尺寸（`1..=64`，默认 `225` 格 `A1`–`O15`） |
| `fast_path_confidence` | `0.85` | 允许直接下发 `vseat` 输入而无需升级至规划模型的最低置信度 |
| `min_cell_prob` | `0.05` | 计算 Top-`K` 目标坐标插值时纳入统计的最小网格概率 |
| `time_slot_min_confidence` | `0.75` | 连续快捷操作序列单步所需的最低置信度，低于该值则停止序列 |
| `bernoulli_activation_threshold` | `0.80` | 触发条件后续步骤所需的最低 `P(Yes)` 概率 |
| `probe_min_prob` | `0.15` | 探测阶段保留候选项的最低概率下限 |
| `stop_sentinel` / `fallback_token` | `"stop_done"` / `"NONE_OR_OTHER"` | 序列结束标记与开放兜底选项 |

## 桌面通知与可选语音合成（`[notify]` / `[tts]`）

- **桌面通知（`[notify]`）**：默认 `desktop_dbus = true`、`app_name = "Jiku"`，在 `task_completed`、`task_failed`、`verification_needed`、`skill_staged` 事件触发时通过 `org.freedesktop.Notifications` / `notify-send` 发送提醒。
- **可选 TTS（`[tts]`，默认关闭）**：设置 `enabled = true` 后可选择 `provider = "voicevox"`（`http://127.0.0.1:50021`，`speaker_id = 3`）、`"openai_speech"` 或 `"noop"`。

## Lua 策略配置（`~/.config/jiku/init.lua`）与 `jikud.service`

`jikud` 在沙箱化的 Lua 5.4 运行时中执行用户策略钩子（禁用 OS 与文件原语），并提供 `systemd --user` 服务单元（`jikud.service`）：

```ini
# ~/.config/systemd/user/jikud.service
[Unit]
Description=Jiku Desktop Orchestration Daemon
After=graphical-session.target

[Service]
ExecStart=/usr/bin/jikud --daemon
Restart=on-failure

[Install]
WantedBy=graphical-session.target
```
