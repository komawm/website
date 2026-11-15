# インストール・API キー設定・初回起動

> [!NOTE]
> Jiku の導入は完全に任意です。[Koma](/ja/docs/getting-started/installation/) は `jikud` や `jiku` がなくてもスタンドアロンの Wayland コンポジタとして動作します。

## `jikud`・`jiku` のインストール

[komawm/packaging](https://github.com/komawm/packaging)（`cdn.komawm.org` APT、nFPM `.deb`/`.rpm`/`.apk`、Arch `PKGBUILD.jiku.in`）から導入するか、[komawm/jiku](https://github.com/komawm/jiku) を **Rust `1.100.0`（Edition 2024）** でビルドします。

```bash
git clone https://github.com/komawm/jiku.git
cd jiku
cargo +1.100.0 build --release --locked -p jikud -p jiku
./target/release/jikud --headless-check
```

## API キーと環境変数

`jikud` は `config.toml` 内の `api_key_env` に指定された環境変数からのみ認証情報を読み取ります。設定ファイルへ秘密鍵を直書きしないでください。

| 環境変数 | 既定プロバイダ | 用途 |
| :--- | :--- | :--- |
| `OPENCODE_GO_API_KEY` | `opencode_go`（`deepseek-v4.1-flash`） | `[roles.planner]` および自動 `EmulatedStructuredTextModel` フォールバック |
| `GEMINI_API_KEY` | `gemini`（`gemini-decision-1`） | 任意の `DecisionsDriver`（0 出力トークン）および任意 `LiveSessionDriver` |
| `KOMA_CAPABILITY_TOKEN` | Koma IPC（`koma-agent.sock`） | `komactl token mint jiku` で発行するスコープ付きトークン |

> [!TIP]
> **専用 Decision モデルキーが不要な場合**：`GEMINI_API_KEY` が未設定でも、`DecisionBackend` は自動的に `[roles.planner]` を用いた `EmulatedStructuredTextModel` モードでエラーなく動作します。

## 初回起動手順

1. **設定と Lua ポリシーのオフライン検証**：
   ```bash
   jiku validate-config
   ```
2. **稼働中の Koma からケーパビリティトークンを発行**：
   ```bash
   export KOMA_CAPABILITY_TOKEN="$(komactl token mint jiku | jq -r '.token')"
   ```
3. **`jikud` を起動して状態を確認**：
   ```bash
   jikud --daemon &
   jiku status --json
   ```
4. **ドライランまたはタスク実行**：
   ```bash
   jiku run --dry-run "Open a terminal and check uname -a"
   ```

## 外部コーディングエージェント連携（`Claude Code`・`Codex`・`OpenCode`・`Cursor`）

各エージェントに `jiku mcp`（stdio MCP サーバ）を登録するか `jiku/skills/SKILL.md` を参照させることで、Epoch 保護下の `jiku run`・`jiku decide`・`jiku box classify`・`jiku memory search` を安全に呼び出せます。
