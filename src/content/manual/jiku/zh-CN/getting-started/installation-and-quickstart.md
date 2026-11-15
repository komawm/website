# 安装与首次运行

> [!NOTE]
> 安装 Jiku 完全可选。[Koma](/zh-CN/docs/getting-started/installation/) 无需 `jikud` 或 `jiku` 即可作为纯 Wayland 平铺合成器独立运行。

![在 Koma 终端中执行 jiku 状态检查](https://cdn.komawm.org/media/jiku-terminal.webp "在 Koma 终端中检查 Jiku 状态并运行命令行工具。")

## 安装 `jikud` 与 `jiku`

可通过 [komawm/packaging](https://github.com/komawm/packaging) 安装预构建软件包（签名 APT `jiku` 包、AUR `jiku-bin`、Linuxbrew `jiku.rb` 或 `.deb`/`.rpm`/`.apk` 包），从 [komawm/jiku](https://github.com/komawm/jiku) 下载 `v0.0.1` 发布压缩包（`jiku-0.0.1-x86_64-unknown-linux-gnu.tar.gz` 或 `jiku-0.0.1-aarch64-unknown-linux-gnu.tar.gz`），或从源码构建。

### 预构建二进制渠道（`x86_64` 与 `aarch64`）

```bash
# Arch Linux（AUR 预构建二进制包）
paru -S jiku-bin

# Debian / Ubuntu（签名 APT 软件源）
curl -fsSL https://cdn.komawm.org/apt/setup.sh | sudo bash && sudo apt install -y jiku

# Linuxbrew
curl -fsSLO https://cdn.komawm.org/install/jiku/jiku.rb && brew install --formula ./jiku.rb
```

### 从源码构建

```bash
# 从代码仓库直接安装
cargo +1.100.0 install --git https://github.com/komawm/jiku.git jikud jiku --locked

# 或克隆仓库并在本地构建
git clone https://github.com/komawm/jiku.git
cd jiku
cargo +1.100.0 build --release --locked -p jikud -p jiku
./target/release/jikud --headless-check
```

## API 密钥与环境变量

`jikud` 仅从 `config.toml` 中 `api_key_env` 指定的环境变量读取凭据。切勿把明文密钥写入 `config.toml`。

| 环境变量 | 默认提供方 | 承担角色 |
| :--- | :--- | :--- |
| `OPENCODE_GO_API_KEY` | `opencode_go`（`deepseek-v4.1-flash`） | 主规划模型 `[roles.planner]`，以及未配置专用判定密钥时的结构化 JSON 回退 |
| `GEMINI_API_KEY` | `gemini`（`gemini-decision-1`） | 可选专用判定模型，以及可选实时语音会话 |
| `KOMA_CAPABILITY_TOKEN` | Koma IPC（`koma-agent.sock`） | 通过 `komactl token mint jiku` 签发的作用域租约令牌 |

> [!TIP]
> **没有专用判定模型密钥？** 若未设置 `GEMINI_API_KEY`（或将 `[roles.decision_router]` 指向 OpenAI、Anthropic、vLLM 或 Ollama 提供方），Jiku 会自动回退到 `[roles.planner]` 并使用结构化 JSON 输出完成判定，不会报错。

## 首次运行步骤

1. **离线校验配置与 Lua 策略**：
   ```bash
   jiku validate-config
   ```
2. **在 Koma 运行状态下签发作用域令牌**：
   ```bash
   export KOMA_CAPABILITY_TOKEN="$(komactl token mint jiku | jq -r '.token')"
   ```
3. **启动 `jikud` 守护进程并检查状态**：
   ```bash
   jikud --daemon &
   jiku status --json
   ```
4. **先试跑 Dry-Run 任务与本地诊断**：
   ```bash
   jiku run --dry-run "Open a terminal and check uname -a"
   jiku a11y snapshot --json
   jiku context inspect --max-tokens 4096
   jiku tts say "Jiku is ready"
   jiku avatar serve --bind 127.0.0.1:4190
   jiku bench run --offline
   ```

## 接入外部编码智能体（`Claude Code`、`Codex`、`OpenCode`、`pi`、`Cursor`）

`jiku mcp`（12 个编排工具）与 `koma-mcp`（17 个合成器工具）均会在每条消息边界自动识别 `Content-Length` 与 `NDJSON` stdio 帧格式。可在 `Claude Code`、`Codex`、`Cursor`、`pi` 或 OpenCode（`~/.config/opencode/opencode.json`）中注册接入：

```json
{
  "mcp": {
    "koma": {
      "type": "local",
      "command": ["koma-mcp", "--auto-mint-admin"],
      "enabled": true
    },
    "jiku": {
      "type": "local",
      "command": ["jiku", "mcp"],
      "enabled": true
    }
  }
}
```

也可以让编码智能体读取 `jiku/skills/SKILL.md`，在 Koma 的 Epoch 隔离保护下调用 `jiku run`、`jiku decide`、`jiku a11y`、`jiku context inspect`、`jiku box classify` 与 `jiku memory search`。
