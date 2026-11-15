# インストールと初回起動

> [!NOTE]
> Jiku の導入は任意です。[Koma](/ja/docs/getting-started/installation/) は `jikud` や `jiku` がなくてもスタンドアロンの Wayland タイル型コンポジタとして動作します。

![Koma の端末上で jiku CLI チェックを実行している様子](/media/jiku-terminal.webp "Koma の端末上で Jiku の状態確認と CLI コマンドを実行した画面。")

## `jikud` と `jiku` のインストール

[komawm/packaging](https://github.com/komawm/packaging) からビルド済みパッケージ（署名付き APT `jiku` パッケージ、AUR `jiku-bin`、Linuxbrew `jiku.rb`、`.deb`/`.rpm`/`.apk` アーカイブ）を導入するか、[komawm/jiku](https://github.com/komawm/jiku) から `v0.0.1` リリースアーカイブ（`jiku-0.0.1-x86_64-unknown-linux-gnu.tar.gz` または `jiku-0.0.1-aarch64-unknown-linux-gnu.tar.gz`）を取得するか、ソースからビルドします。

### ビルド済みバイナリチャネル（`x86_64` & `aarch64`）

```bash
# Arch Linux（AUR ビルド済みパッケージ）
paru -S jiku-bin

# Debian / Ubuntu（署名付き APT リポジトリ）
curl -fsSL https://cdn.komawm.org/apt/setup.sh | sudo bash && sudo apt install -y jiku

# Linuxbrew
curl -fsSLO https://cdn.komawm.org/install/jiku/jiku.rb && brew install --formula ./jiku.rb
```

### ソースからのビルド

```bash
# リポジトリから直接インストール
cargo +1.100.0 install --git https://github.com/komawm/jiku.git jikud jiku --locked

# またはローカルへクローンしてビルド
git clone https://github.com/komawm/jiku.git
cd jiku
cargo +1.100.0 build --release --locked -p jikud -p jiku
./target/release/jikud --headless-check
```

## API キーと環境変数

`jikud` は `config.toml` 内の `api_key_env` に指定された環境変数からのみ認証情報を読み取ります。`config.toml` に生の API キーを直接書かないでください。

| 環境変数 | 既定プロバイダ | 用途 |
| :--- | :--- | :--- |
| `OPENCODE_GO_API_KEY` | `opencode_go`（`deepseek-v4.1-flash`） | 主プランナー `[roles.planner]` および判定時の自動 JSON フォールバック |
| `GEMINI_API_KEY` | `gemini`（`gemini-decision-1`） | 任意の専用判定プロンプトモデルおよび任意ライブ音声セッション |
| `KOMA_CAPABILITY_TOKEN` | Koma IPC（`koma-agent.sock`） | `komactl token mint jiku` で発行するスコープ付きリーストークン |

> [!TIP]
> **専用の判定モデルキーがない場合**: `GEMINI_API_KEY` が未設定（または `[roles.decision_router]` に OpenAI / Anthropic / vLLM / Ollama プロバイダを指定）でも、Jiku はエラーを出さず `[roles.planner]` の構造化 JSON 出力へ自動フォールバックします。

## 初回起動手順

1. **設定と Lua ポリシーのオフライン検証**:
   ```bash
   jiku validate-config
   ```
2. **稼働中の Koma からスコープ付きトークンを発行**:
   ```bash
   export KOMA_CAPABILITY_TOKEN="$(komactl token mint jiku | jq -r '.token')"
   ```
3. **`jikud` を起動して状態を確認**:
   ```bash
   jikud --daemon &
   jiku status --json
   ```
4. **ドライランタスクで動作確認**:
   ```bash
   jiku run --dry-run "Open a terminal and check uname -a"
   ```

## 外部コーディングエージェント連携（`Claude Code`・`Codex`・`OpenCode`・`Cursor`）

コーディングエージェントへ `jiku mcp`（stdio MCP サーバー）を登録するか `jiku/skills/SKILL.md` を参照させることで、Koma の Epoch 保護下で `jiku run`・`jiku decide`・`jiku box classify`・`jiku memory search` を安全に呼び出せます。
