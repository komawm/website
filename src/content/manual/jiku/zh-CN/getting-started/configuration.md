# 守护进程配置、DecisionCompiler 与语音

`jikud` 读取 `~/.config/jiku/config.toml`（支持 `--config` 或 `$JIKU_CONFIG` 覆盖）以及 `~/.config/jiku/init.lua`（支持 `--policy` 或 `$JIKU_POLICY` 覆盖）。所有配置项均内置经过校验的默认值，零配置即可通过 `jikud --headless-check` 或启动服务。

## `config.toml` 核心配置参考

```toml
[daemon]
locale = "zh-CN"                 # "zh-CN" | "ja-JP" | "en-US"
socket_name = "jiku.sock"        # 位于 $XDG_RUNTIME_DIR/
dropbox_dir = "~/JikuBox"

[koma]
default_workspace = "agent:work"
default_overlay = "grid_225"     # "grid_225" | "som" | "none"
perceptual_hash_threshold = 4    # L0 dHash 汉明距离去重阈值

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
model = "gemini-decision-1"      # 无密钥时自动无感回退至 EmulatedStructuredTextModel
driver = "decisions"
optional = true
fallback_to_primary_text_model = true
```

## `DecisionCompiler`、`GridSpec` 与 `TimeSlotMacro` 参数

`[decision_router.compiler]` 与 `[decision_router.compiler.grid]` 暴露全部决策编译器超参数：

| 配置项 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `grid.cols` / `grid.rows` | `15` / `15` | 空间决策网格尺寸（`1..=64`，默认 `225` 格 `A1`–`O15`） |
| `fast_path_confidence` | `0.85` | 允许跳过 System-2 规划直接下发 `vseat` 动作的置信度阈值 |
| `min_cell_prob` | `0.05` | `grid_225` 质心插值保留单元格概率下限 |
| `time_slot_min_confidence` | `0.75` | `TimeSlotMacro` 多步快捷键序列单步最低置信度 |
| `bernoulli_activation_threshold` | `0.80` | `BernoulliExpectedStep` 条件步骤触发阈值 |
| `probe_min_prob` | `0.15` | `ThresholdProbe` 候选保留下限 |
| `stop_sentinel` / `fallback_token` | `"stop_done"` / `"NONE_OR_OTHER"` | 序列终止哨兵与开放世界逃逸选项 |

## 桌面通知与可选语音合成（`[notify]` / `[tts]`）

- **桌面通知（`[notify]`）**：默认 `desktop_dbus = true`、`app_name = "Jiku"`，在 `task_completed`、`task_failed`、`verification_needed`、`skill_staged` 时通过 D-Bus / `notify-send` 提醒人类。
- **可选 TTS（`[tts]`，默认关闭 `enabled = false`）**：显式启用后支持 `voicevox`（`http://127.0.0.1:50021`，`speaker_id = 3`）、`openai_speech` 与 `noop`（对应 `VoicevoxProvider`、`OpenAiSpeechProvider`、`NoopTtsProvider`）。

## Phodopus Lua 策略（`~/.config/jiku/init.lua`）与 `jikud.service`

用户策略钩子运行在隔离的 [Phodopus](https://github.com/Xuepoo/phodopus) Lua 5.4 沙箱中，可通过 `systemd --user` 托管运行：

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
