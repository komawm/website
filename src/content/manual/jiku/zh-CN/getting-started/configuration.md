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
hover_glide_ms = 140             # 点击前指针平滑悬停滑动耗时（毫秒）

[context]
max_context_tokens = 8192        # 总 Token 预算上限（适配小上下文本地模型）
reserved_output_tokens = 768
min_output_tokens = 256
compaction_trigger_ratio = 0.72
image_token_estimate = 512
keep_recent_images = 1
a11y_max_entries_small_ctx = 28

# 提供方标识、端点与模型 ID 均为占位符，请替换为你自己的绑定。
# `api_key_env` 指定保存各提供方密钥的环境变量名。
[providers.primary]
kind = "openai_compatible"       # 任意 OpenAI 兼容的文本/VLM 端点
base_url = "https://your-planner-endpoint.example/v1"
api_key_env = "JIKU_PLANNER_API_KEY"
thinking = false

[providers.decision]
kind = "google_gemini"           # 原生判定端点驱动要求此类型
base_url = "https://your-decision-endpoint.example/v1beta"
api_key_env = "JIKU_DECISION_API_KEY"

[roles.planner]
provider = "primary"
model = "<primary-text-model-id>"
driver = "turn_sse"
thinking = false
temperature = 0.2

[roles.decision_router]
provider = "decision"
model = "<decision-model-id>"      # 未配置密钥时自动回退至主规划模型
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

## 桌面通知、语音合成与虚拟形象舞台（`[notify]` / `[tts]` / `[avatar]`）

- **桌面通知（`[notify]`）**：默认 `desktop_dbus = true`、`app_name = "Jiku"`，在 `task_completed`、`task_failed`、`verification_needed`、`skill_staged` 事件触发时通过 `org.freedesktop.Notifications` / `notify-send` 发送提醒。
- **可选 TTS（`[tts]`，默认关闭）**：设置 `enabled = true` 后可选择 `provider = "espeak_ng" | "irodori" | "voicevox" | "openai_speech" | "noop"`、`voice` 与 `audio_sink`（`"auto"`、`"pw-play"`、`"aplay"`、`"silent"` 或自定义命令），支持 20 ms RMS 口型时间线提取与 `AudioPlaybackSink` 打断播放。
- **伴侣虚拟形象舞台（`[avatar]`）**：`emit_cues = true` 与 `idle_gaze_follow_vseat = true` 通过 `jiku avatar serve` 推送 `Snapshot` / `AvatarCue` JSON 数据包并跟随活动 `vseat` 光标视线。

## `config.lua`（沙箱化 Lua 配置）

同一份类型化配置也接受 Lua 文档。按扩展名选择格式，或以 `config.toml` 为基础、用 `config.lua` 只覆盖需要变更的键。

| 调用方式 | 实际加载的文件 |
| :--- | :--- |
| `--config <PATH>` / `$JIKU_CONFIG` | 仅该文件（`.toml` 或 `.lua`） |
| 默认搜索且两份都存在 | 先 `config.toml`，再将 `config.lua` 逐字段合并覆盖 |
| 默认搜索且只有一份 | 仅该文件 |

```lua
-- ~/.config/jiku/config.lua
jiku.config{
    daemon = { locale = "zh-CN", socket_name = "jiku.sock" },
    providers = {
        primary = {
            kind = "openai_compatible",
            base_url = "https://your-planner-endpoint.example/v1",
            api_key_env = "JIKU_PLANNER_API_KEY",
        },
        decision = {
            kind = "google_gemini",
            base_url = "https://your-decision-endpoint.example/v1beta",
            api_key_env = "JIKU_DECISION_API_KEY",
        },
    },
    roles = {
        planner = { provider = "primary", model = "<primary-text-model-id>", driver = "turn_sse" },
        decision_router = { provider = "decision", model = "<decision-model-id>", driver = "decisions", optional = true },
    },
}
```

- **逐字段合并**：对象按键合并，数组与标量直接替换；多次调用 `jiku.config{...}` 按顺序叠加。
- **与 `init.lua` 相同的沙箱**：8 MiB 堆上限、确定性燃料预算，没有 `io`、`os`、`dofile`、`loadfile`。因此无法读取环境变量，`api_key_env` 始终是变量名。
- **严格模式校验**：未知键或类型不符会带具体字段路径报错，不会静默回退到默认值。
- **统一校验器**：两种格式反序列化为同一配置类型，并执行同一套语义校验。

用 `jikud --migrate-config --config ~/.config/jiku/config.toml --out ~/.config/jiku/config.lua` 转换现有文件。生成器在缺少 `--force` 时拒绝覆盖，并校验输出能重新加载为完全相同的配置。

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
