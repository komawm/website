# Three-Driver オーケストレーション設計

> [!NOTE]
> **Jiku**（`jikud` および `jiku`）は [komawm/jiku](https://github.com/komawm/jiku) で提供される任意の独立デスクトップ自動化デーモンです。Jiku を導入しなくても、[Koma](/ja/) コンポジタ単体で完全に動作します。

![藍染楮和紙に描かれた Jiku 15x15 組子格子と音響波紋](/placeholders/jiku-grid.webp "15×15 空間決定グリッド (gemini-decision-1) と AvatarCue 音響波紋。")

## コア設計：3 つの専門モデルドライバ

Jiku は高速な閉集合視覚判定、段階的タスク計画、任意のリアルタイム音声対話を 3 つの疎結合ドライバへ分離しています。

| ドライバ | 役割 | 既定エンドポイント・契約 |
| :--- | :--- | :--- |
| **`DecisionsDriver`** | ミリ秒単位の UI 判定、`grid_225` 座標特定、安全ゲート、`~/JikuBox` 分類 | `gemini-decision-1`（`POST /v1beta/decisions`、`total_output_tokens == 0`、`EmulatedStructuredTextModel` JSON Schema へ自動フォールバック） |
| **`TurnModelDriver`** | 多段階プランニング、低信頼時（`< 0.85`）の System-2 介入、スキル合成 | [OpenCode Go](https://opencode.ai) `deepseek-v4.1-flash`（`thinking = false`）、OpenAI / Google AI Studio / Anthropic 互換 |
| **`LiveSessionDriver`** | 任意の全二重音声および `AvatarCue` セッション転送 | Gemini `BidiGenerateContent` WebSocket（既定無効、PipeWire 実音声 I/O は `v0.1.0` 目標） |

## ワークスペース・クレート構成（`#![forbid(unsafe_code)]`）

Jiku の全 4 クレート（`jikud`、`jiku`、`jiku-memory`、`jiku-tts`）は `#![forbid(unsafe_code)]` を強制し、生 FFI や `mmap` を一切持ちません。

| クレート | 種別 | 責務 |
| :--- | :--- | :--- |
| `jikud` | ライブラリ＋バイナリ | `$XDG_RUNTIME_DIR/jiku.sock` RPC デーモン、3 ドライバ、`DecisionCompiler`、Phodopus Lua ポリシー、`KomaIpcClient`（安全な `File::from(fd)` による `memfd` 読取） |
| `jiku` | バイナリ | CLI コントローラおよび MCP サーバ（`status`、`validate-config`、`decide`、`plan`、`run`、`box classify`、`memory search`、`skills`、`mcp`） |
| `jiku-memory` | ライブラリ | L0 知覚 `dHash` リング、L1 アプリ特性、L2 SQLite WAL + FTS5 BM25、`staged_skills` 承認ストア |
| `jiku-tts` | ライブラリ | 任意の `TtsProvider`（`VOICEVOX`、`OpenAI` speech、`noop`）と `AvatarCue` パケット |

## Observe → Decide → Plan → Koma Action ループ

1. **Observe**：スコープ限定 `CapabilityToken` で `koma-agent.sock` に接続し、`capture.frame`（保護サーフェスは黒塗り済み）と現在 `Epoch` を取得します。
2. **Decide**：`DecisionsDriver` が 15 項目の二値 `Noul` 安全チェックと `Choice`（`NONE_OR_OTHER` 必須）および `15×15` `grid_225` セル確率を評価します。
3. **Plan**：信頼度 `< 0.85` または自由入力が必要な場合、`[roles.planner]`（`deepseek-v4.1-flash` 等）へエスカレーションします。
4. **Act**：`expected_epoch` 付きで `vseat.*` / `macro.exec` を送信し、`4090` / `4091` / `4032` 受信時は即座に停止または再観測します。

## CLI クイックツアー

```bash
jikud --daemon --config ~/.config/jiku/config.toml --policy ~/.config/jiku/init.lua
jiku status --json
jiku decide --image shot.png "Is a terminal window visible?"
jiku plan "Summarize the active workspace"
jiku box classify ~/JikuBox
jiku mcp --print-tools
```
