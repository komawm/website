# 安装、密钥配置与首次运行

> [!NOTE]
> Jiku 属于完全可选组件。[Koma](/zh-CN/docs/getting-started/installation/) 无需安装 `jikud` 或 `jiku` 即可作为纯正 Wayland 平铺合成器独立使用。

## 安装 `jikud` 与 `jiku`

可通过 [komawm/packaging](https://github.com/komawm/packaging)（`cdn.komawm.org` APT `jiku` 包、nFPM `.deb`/`.rpm`/`.apk`、Arch `PKGBUILD.jiku.in`）安装，或从 [komawm/jiku](https://github.com/komawm/jiku) 使用 **Rust `1.100.0`（Edition 2024）** 源码构建：

```bash
git clone https://github.com/komawm/jiku.git
cd jiku
cargo +1.100.0 build --release --locked -p jikud -p jiku
./target/release/jikud --headless-check
```

## API 密钥与环境变量

`jikud` 仅从 `config.toml` 中 `api_key_env` 指定的环境变量读取凭据，切勿将明文密钥写入配置文件：

| 环境变量 | 默认提供方 | 承担角色 |
| :--- | :--- | :--- |
| `OPENCODE_GO_API_KEY` | `opencode_go`（`deepseek-v4.1-flash`） | 基础规划器 `[roles.planner]` 与自动 `EmulatedStructuredTextModel` 回退 |
| `GEMINI_API_KEY` | `gemini`（`gemini-decision-1`） | 可选零解码单次预填充 `DecisionsDriver` 与可选实时语音通道 |
| `KOMA_CAPABILITY_TOKEN` | Koma IPC（`koma-agent.sock`） | 由 `komactl token mint jiku` 签发的作用域租约令牌 |

> [!TIP]
> **没有专用决策模型密钥？** 若未配置 `GEMINI_API_KEY` 或将通用文本/多模态模型指向 `[roles.decision_router]`，`DecisionBackend` 会自动切至 `EmulatedStructuredTextModel` 使用 `[roles.planner]` 模型完成结构化判定，绝不报错阻塞。

## 首次运行步骤

1. **离线校验配置与 Lua 策略**：
   ```bash
   jiku validate-config
   ```
2. **在 Koma 运行状态下签发受限令牌**：
   ```bash
   export KOMA_CAPABILITY_TOKEN="$(komactl token mint jiku | jq -r '.token')"
   ```
3. **启动 `jikud` 守护进程并检查状态**：
   ```bash
   jikud --daemon &
   jiku status --json
   ```
4. **先试跑 Dry-Run 或正式执行任务**：
   ```bash
   jiku run --dry-run "Open a terminal and check uname -a"
   ```

## 接入外部编码智能体（`Claude Code`、`Codex`、`OpenCode`、`Cursor`）

在编码智能体的 MCP 配置中注册 `jiku mcp`（标准 stdio JSON-RPC 2.0），或引导其加载 `jiku/skills/SKILL.md`，即可安全调度 `jiku run`、`jiku decide`、`jiku box classify` 与 `jiku memory search`。
