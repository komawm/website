# Three-Driver 三驱动编排架构

> [!NOTE]
> **Jiku**（`jikud` 与 `jiku`）是托管于 [komawm/jiku](https://github.com/komawm/jiku) 的可选独立桌面编排伴侣进程；不安装 Jiku 时，[Koma](/zh-CN/) 合成器依然可以完整独立运行。

![深蓝楮皮和纸上的 Jiku 15x15 组子决策网格与声学波纹](/placeholders/jiku-grid.webp "Jiku 15×15 空间决策网格（gemini-decision-1）与 AvatarCue 同心声学波纹。")

## 核心设计：三驱动模型调度

Jiku 将毫秒级闭集视觉判定、长程多步推理规划与可选实时语音交互拆分为三个相互解耦的驱动：

| 驱动器 | 职责分工 | 默认端点与契约 |
| :--- | :--- | :--- |
| **`DecisionsDriver`** | 毫秒级 UI 状态核验、`grid_225` 坐标定位、安全门控与 `~/JikuBox` 批量分拣 | `gemini-decision-1`（`POST /v1beta/decisions`，`total_output_tokens == 0`，支持零报错自动回退至 `EmulatedStructuredTextModel` JSON Schema） |
| **`TurnModelDriver`** | 多步工作区规划、低置信度（`< 0.85`）System-2 接管、候选技能合成 | [OpenCode Go](https://opencode.ai) `deepseek-v4.1-flash`（`thinking = false`），并兼容 OpenAI、Google AI Studio 与 Anthropic |
| **`LiveSessionDriver`** | 可选全双工实时语音与 `AvatarCue` 传输通道 | Gemini `BidiGenerateContent` WebSocket（默认关闭；PipeWire 实时音频流为 `v0.1.0` 目标） |

## Workspace Crate 结构（`#![forbid(unsafe_code)]`）

Jiku 全部 4 个 Rust crate（`jikud`、`jiku`、`jiku-memory`、`jiku-tts`）均强制执行 `#![forbid(unsafe_code)]`：

| Crate | 类型 | 核心职责 |
| :--- | :--- | :--- |
| `jikud` | 库 + 二进制 | `$XDG_RUNTIME_DIR/jiku.sock` RPC 守护进程、三驱动客户端、`DecisionCompiler`、`Phodopus` Lua 策略钩子、`KomaIpcClient`（基于安全 `File::from(fd)` 读取密封 `memfd`） |
| `jiku` | 二进制 | CLI 控制器与 MCP 桥接（`status`、`validate-config`、`decide`、`plan`、`run`、`box classify`、`memory search`、`skills`、`mcp`） |
| `jiku-memory` | 库 | L0 感知哈希 `dHash` 环形缓存、L1 应用特性记忆、L2 SQLite WAL + FTS5 BM25 检索与 `staged_skills` 审批存储 |
| `jiku-tts` | 库 | 可选 `TtsProvider`（`VOICEVOX`、`OpenAI` speech、`noop`）与 `AvatarCue` 事件包 |

## 观测 → 决策 → 规划 → Koma 执行闭环

1. **观测（Observe）**：`jikud` 凭受限 `CapabilityToken` 连接 `koma-agent.sock`，通过 `capture.frame` 获取只读密封 `memfd` 图像（受保护表面已被合成器涂黑）及当前 `Epoch`。
2. **决策（Decide）**：`DecisionsDriver` 并行评估 15 项二元 `Noul` 安全门控与 `Choice`（强制包含 `NONE_OR_OTHER` 开放兜底）及 `15×15` `grid_225` 单元格概率。
3. **规划（Plan）**：当决策置信度 `< 0.85` 或任务需自由文本生成时，无缝交由 `[roles.planner]`（`deepseek-v4.1-flash` 或用户配置的 LLM）规划执行。
4. **执行（Act）**：携带 `expected_epoch` 派发 `vseat.click` / `key` / `inject_text` 或 `macro.exec`；一旦遇 `4090`、`4091` 或 `4032` 立即安全停手或重观测。

## CLI 快速概览

```bash
jikud --daemon --config ~/.config/jiku/config.toml --policy ~/.config/jiku/init.lua
jiku status --json
jiku decide --image shot.png "Is a terminal window visible?"
jiku plan "Summarize the active workspace"
jiku box classify ~/JikuBox
jiku mcp --print-tools
```
