# Three-Driver オーケストレーション設計

> [!NOTE]
> Jiku（`jikud` および `jiku`）は [komawm/jiku](https://github.com/komawm/jiku) で開発されている任意導入の独立サブシステムです。[Koma](/ja/) 本体は Jiku なしで完全に動作します。

Jiku は高頻度の視覚判定・複数ステップの計画・リアルタイム音声対話を 3 つの専用ドライバに分離しています。

| ドライバ | 役割 | 既定モデルとプロトコル契約 |
| :--- | :--- | :--- |
| `DecisionsDriver` | 高速 UI 状態判定・`~/JikuBox` 自動仕分け | `gemini-decision-1`（`POST /v1beta/decisions`・出力トークン 0・フォールバック内蔵） |
| `TurnModelDriver` | ワークスペース計画立案・ツール呼び出し | [OpenCode Go](https://opencode.ai) `deepseek-v4.1-flash`（`thinking = false`）、OpenAI / Anthropic 互換 |
| `LiveSessionDriver` | 全二重セッション通信・`AvatarCue` 包絡抽出 | Gemini `BidiGenerateContent` WebSocket（実機 PipeWire 入出力は `v0.1.0` 対象） |

![藍染楮和紙に描かれた Jiku 15x15 組子格子と音響波紋](/placeholders/jiku-grid.webp "15×15 空間決定グリッド (gemini-decision-1) と AvatarCue 音響波紋。")

## CLI クイックツアー

```bash
jikud --daemon --config ~/.config/jiku/config.toml --policy ~/.config/jiku/init.lua
jiku status --json
jiku decide --image shot.png "ターミナルウィンドウが表示されていますか？"
jiku plan "現在のワークスペースを要約して"
jiku box classify ~/JikuBox
jiku mcp --print-tools
```
