# Jiku 概览

> [!NOTE]
> **Jiku**（`jikud` 与 `jiku`）是托管于 [komawm/jiku](https://github.com/komawm/jiku) 的可选独立桌面后台服务与命令行工具。不安装 Jiku 时，[Koma](/zh-CN/) 合成器依然可以完整独立运行，不依赖任何 AI 组件。

![Jiku 在 QEMU 中的 1.00x 实时风景绘画演示](https://cdn.komawm.org/media/v0.0.1/jiku-paint-realtime-uncut.mp4 "未经剪辑的 1.00x QEMU 实时录屏（20 fps 下共 89.35 秒，3 轮共 85/85 步：29 次工具栏点击 + 56 条 Catmull-Rom 样条笔画）。")

![Koma 工作区内完成的 3 轮风景画作终稿](https://cdn.komawm.org/media/v0.0.1/jiku-paint-final-3passes.webp "在 Koma 工作区租约边框内完成 3 轮绘制后的画布成图。")

也可以观看 [纯笔画阶段 1.00x 录屏](https://cdn.komawm.org/media/v0.0.1/jiku-paint-strokes-1x.mp4)（`1.00x` 倍速 `46.00 s`），或对比早期的 [网格定位截图](https://cdn.komawm.org/media/jiku-paint.webp)。

## Jiku 的功能定位

Jiku 将屏幕状态判定、多步任务规划、小上下文预算管理、语音输出与虚拟形象舞台遥测拆分到用户态守护进程（`jikud`）和命令行工具（`jiku`）中：

- **后台守护进程（`jikud`）**：监听 `$XDG_RUNTIME_DIR/jiku.sock`，从 Koma 请求屏幕截图捕获及 AT-SPI2 `@snap:eN` UI 树（`SystemGroundingPack`），通过 4 阶段 `context_budget` 压缩瀑布裁剪提示词，调用配置好的判定与规划模型，执行你的 Lua 策略脚本，并将多路点 `vseat.path` / `vseat.stroke` 动作发回 Koma。
- **命令行与 MCP 服务（`jiku`）**：检查守护进程状态、校验配置与 Lua 策略、执行单次判定或完整任务、抓取 AT-SPI2 快照（`jiku a11y`）、检查 Token 预算（`jiku context inspect`）、运行离线/在线消融评测（`jiku bench run`）、分类整理 `~/JikuBox` 目录、检索本地全文历史、审批暂存技能，并通过双帧协议 stdio MCP（`Content-Length` + `NDJSON`）对外暴露 12 个工具。
- **本地状态与历史（`~/.local/state/jiku/state.db`）**：对重复画面去重、记录按应用区分的操作习惯、保存本地全文历史记录，并暂存待人工审核的技能草稿。
- **语音合成与虚拟形象舞台（`[notify]` / `[tts]` / `[avatar]`）**：默认通过 D-Bus 发送桌面通知；`[tts]` 提供模块化语音后端（`espeak_ng`、`irodori`、`voicevox`、`openai_speech`、`noop`）及 20 ms 口型能量帧提取与打断播放（`AudioPlaybackSink`），`jiku avatar serve` 则提供 HTTP + WebSocket `Snapshot` / `AvatarCue` 伴侣 VRM 舞台服务。

## 模型分工

| 角色 | 用途 | 默认模型与回退方式 |
| :--- | :--- | :--- |
| **判定请求（`[roles.decision_router]`）** | 快速界面状态检查、`grid_225` 坐标定位、安全门控与 `~/JikuBox` 分类 | `gemini-decision-1`（`GEMINI_API_KEY`）；未配置 Gemini 密钥时，自动回退到主规划模型并通过平衡括号 JSON 提取完成结构化判定 |
| **规划模型（`[roles.planner]`）** | 多步骤工作区规划、判定置信度低于 `0.85` 时的接管处理以及技能草拟 | [OpenCode Go](https://opencode.ai) `deepseek-v4.1-flash`（`thinking = false`），同时支持 OpenAI 兼容、`llama-server`、Google AI Studio 与 Anthropic 接口 |
| **实时语音会话（可选）** | 实验性全双工实时语音传输 | Gemini `BidiGenerateContent` WebSocket（默认关闭；PipeWire 实时麦克风采集计划在 `v0.1.0` 提供） |

## 观测 → 判定 → 规划 → 执行闭环

1. **观测（Observe）**：`jikud` 凭受限的 `CapabilityToken` 连接 `koma-agent.sock`，通过 `capture.frame` 获取只读屏幕截图捕获（`block_out_from` 指定的受保护窗口会由合成器遮蔽）及当前 `Epoch`，经 `SystemGroundingPack` 融合可选 AT-SPI2 `@snap:eN` 节点，并用 `context_budget` 压缩超限提示词。
2. **判定（Decide）**：依次核验 15 项安全检查规则、闭集选项（保留 `NONE_OR_OTHER` 兜底项）以及 `15×15` `grid_225` 网格坐标。
3. **规划（Plan）**：当判定置信度 `< 0.85` 或任务需要开放式推理时，转交 `[roles.planner]` 生成具体动作（`move_path`、`drag_path`、`click`、`inject_text`）或候选技能。
4. **执行（Act）**：携带 `expected_epoch` 发送 `vseat.path`、`vseat.stroke`、`vseat.click`、`vseat.key`、`vseat.inject_text`、`vseat.cursor_settle` 或 `macro.exec`，并在任务结束后自动释放租约；遇到 `4090 ERR_STALE_EPOCH`、`4091 ERR_HUMAN_PREEMPTED` 或 `4032 ERR_PROTECTED_SURFACE` 时立即停手。

## CLI 快速概览

```bash
jikud --daemon --config ~/.config/jiku/config.toml --policy ~/.config/jiku/init.lua
jiku status --json
jiku decide --image shot.png "Is a terminal window visible?"
jiku plan "Summarize the active workspace"
jiku a11y snapshot --json
jiku context inspect --max-tokens 4096
jiku tts say "Ready to assist."
jiku avatar serve --bind 127.0.0.1:4190
jiku bench run --offline
jiku box classify ~/JikuBox
jiku mcp --print-tools
```
