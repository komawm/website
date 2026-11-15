# Jiku 概览

> [!NOTE]
> **Jiku**（`jikud` 与 `jiku`）是托管于 [komawm/jiku](https://github.com/komawm/jiku) 的可选独立桌面后台服务与命令行工具。不安装 Jiku 时，[Koma](/zh-CN/) 合成器依然可以完整独立运行，不依赖任何 AI 组件。

![Jiku 在 Koma 中检查并自动操作绘图窗口](/media/jiku-paint.webp "Jiku 通过屏幕截图捕获与网格定位在 Koma 中操作绘图窗口。")

## Jiku 的功能定位

Jiku 将屏幕状态判定、多步任务规划与可选语音输出拆分到用户态守护进程（`jikud`）和命令行工具（`jiku`）中：

- **后台守护进程（`jikud`）**：监听 `$XDG_RUNTIME_DIR/jiku.sock`，向 Koma 请求屏幕截图捕获，调用配置好的判定与规划模型，执行你的 Lua 策略脚本，并将虚拟键鼠输入动作发回 Koma。
- **命令行与 MCP 服务（`jiku`）**：检查守护进程状态、校验配置与 Lua 策略、执行单次判定或完整任务、分类整理 `~/JikuBox` 目录、检索本地全文历史、审批暂存技能，并向外部编码智能体暴露 stdio MCP 工具。
- **本地状态与历史（`~/.local/state/jiku/state.db`）**：对重复画面去重、记录按应用区分的操作习惯、保存本地全文历史记录，并暂存待人工审核的技能草稿。
- **通知与可选语音（`[notify]` / `[tts]`）**：默认通过 D-Bus 发送桌面通知；文本转语音（`VOICEVOX`、`OpenAI` speech 或 `noop`）默认关闭。

## 模型分工

| 角色 | 用途 | 默认模型与回退方式 |
| :--- | :--- | :--- |
| **判定请求（`[roles.decision_router]`）** | 快速界面状态检查、`grid_225` 坐标定位、安全门控与 `~/JikuBox` 分类 | `gemini-decision-1`（`GEMINI_API_KEY`）；未配置 Gemini 密钥时，自动回退到主规划模型以结构化 JSON 输出完成判定 |
| **规划模型（`[roles.planner]`）** | 多步骤工作区规划、判定置信度低于 `0.85` 时的接管处理以及技能草拟 | [OpenCode Go](https://opencode.ai) `deepseek-v4.1-flash`（`thinking = false`），同时支持 OpenAI 兼容、Google AI Studio 与 Anthropic 接口 |
| **实时语音会话（可选）** | 实验性全双工实时语音传输 | Gemini `BidiGenerateContent` WebSocket（默认关闭；PipeWire 实时音频 I/O 计划在 `v0.1.0` 提供） |

## 观测 → 判定 → 规划 → 执行闭环

1. **观测（Observe）**：`jikud` 凭受限的 `CapabilityToken` 连接 `koma-agent.sock`，通过 `capture.frame` 获取只读屏幕截图捕获（`block_out_from` 指定的受保护窗口会由合成器遮蔽）及当前 `Epoch`。
2. **判定（Decide）**：依次核验 15 项安全检查规则、闭集选项（保留 `NONE_OR_OTHER` 兜底项）以及 `15×15` `grid_225` 网格坐标。
3. **规划（Plan）**：当判定置信度 `< 0.85` 或任务需要开放式推理时，转交 `[roles.planner]` 生成具体步骤或候选技能。
4. **执行（Act）**：携带 `expected_epoch` 发送 `vseat.click`、`vseat.key`、`vseat.inject_text` 或 `macro.exec`；遇到 `4090 ERR_STALE_EPOCH`、`4091 ERR_HUMAN_PREEMPTED` 或 `4032 ERR_PROTECTED_SURFACE` 时立即停手。

## CLI 快速概览

```bash
jikud --daemon --config ~/.config/jiku/config.toml --policy ~/.config/jiku/init.lua
jiku status --json
jiku decide --image shot.png "Is a terminal window visible?"
jiku plan "Summarize the active workspace"
jiku box classify ~/JikuBox
jiku mcp --print-tools
```
