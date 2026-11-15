# Three-Driver 三驱动编排架构

> [!NOTE]
> Jiku（`jikud` 与 `jiku`）是托管于 [komawm/jiku](https://github.com/komawm/jiku) 的可选独立伴侣组件；即便完全不安装 Jiku，[Koma](/zh-CN/) 合成器也可独立完整运行。

Jiku 将高频视觉判定、多步任务规划与实时语音交互拆分为三个各司其职的驱动层：

| 驱动器名称 | 核心职责 | 默认模型与协议契约 |
| :--- | :--- | :--- |
| `DecisionsDriver` | 亚秒级界面状态判定与 `~/JikuBox` 文件分拣 | `gemini-decision-1`（`POST /v1beta/decisions`，零输出 Token，无密钥时自动回退至结构化模拟层） |
| `TurnModelDriver` | 多步工作区编排规划与工具调用 | [OpenCode Go](https://opencode.ai) `deepseek-v4.1-flash`（默认关闭 `thinking`），兼容 OpenAI / Google / Anthropic |
| `LiveSessionDriver` | 全双工实时会话协议与 `AvatarCue` 口型包络 | Gemini `BidiGenerateContent` WebSocket（硬件 PipeWire 实时音频流留待 `v0.1.0` 启用） |

![深蓝楮皮和纸上的 Jiku 15x15 组子决策网格与声学波纹](/placeholders/jiku-grid.webp "Jiku 15×15 空间决策网格（gemini-decision-1）与 AvatarCue 同心声学波纹。")

## 常用 CLI 命令速览

```bash
jikud --daemon --config ~/.config/jiku/config.toml --policy ~/.config/jiku/init.lua
jiku status --json
jiku decide --image shot.png "当前画面中是否可见终端窗口？"
jiku plan "梳理当前工作区窗口状态"
jiku box classify ~/JikuBox
jiku mcp --print-tools
```
