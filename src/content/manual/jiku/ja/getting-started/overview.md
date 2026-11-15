# Jiku 概要

> [!NOTE]
> **Jiku**（`jikud` および `jiku`）は [komawm/jiku](https://github.com/komawm/jiku) で提供される任意の独立デスクトップ自動化デーモンおよび CLI です。Jiku を導入しなくても、[Koma](/ja/) コンポジタは AI 依存なしで単独動作します。

![Koma 上のペイントウィンドウを検査・自動操作する Jiku](/media/jiku-paint.webp "スクリーンショット取得とグリッド座標指定を用いて Koma 上のペイントウィンドウを操作する Jiku。")

## Jiku が行うこと

Jiku は高速な画面チェック、多段階タスク計画、任意の音声出力をユーザー空間デーモン（`jikud`）と CLI（`jiku`）にまとめています。

- **バックグラウンドデーモン（`jikud`）**: `$XDG_RUNTIME_DIR/jiku.sock` で待機し、Koma からスクリーンショット取得を行い、設定済みモデルによる判定や計画を実行し、Lua ポリシーを適用したうえで Koma へ仮想キーボード・ポインタ入力を送ります。
- **CLI・MCP サーバー（`jiku`）**: デーモン状態確認、設定と Lua ポリシー検証、単発判定やタスク実行、`~/JikuBox` ディレクトリの分類、ローカル全文履歴の検索、スキル承認管理、外部コーディングエージェント向け stdio MCP ツール提供を行います。
- **ローカル状態と履歴（`~/.local/state/jiku/state.db`）**: 変化のないフレームの重複排除、アプリ固有の操作手順キャッシュ、ローカル全文履歴、承認待ちスキル草案を保存します。
- **通知と任意音声合成（`[notify]` / `[tts]`）**: 既定で D-Bus 経由のデスクトップ通知を送信します。音声合成（`VOICEVOX`、`OpenAI` speech、`noop`）は既定で無効です。

## モデルの役割分担

| 役割 | 用途 | 既定モデルとフォールバック |
| :--- | :--- | :--- |
| **判定プロンプト（`[roles.decision_router]`）** | 高速な UI 状態確認、`grid_225` 座標指定、安全確認、`~/JikuBox` 分類 | `gemini-decision-1`（`GEMINI_API_KEY`）。Gemini キー未設定時は主プランナーモデルの構造化 JSON 出力へ自動フォールバック |
| **プランナーモデル（`[roles.planner]`）** | 多段階タスク計画、判定信頼度 `< 0.85` 時のエスカレーション、スキル草案作成 | [OpenCode Go](https://opencode.ai) `deepseek-v4.1-flash`（`thinking = false`）。OpenAI 互換・Google AI Studio・Anthropic エンドポイントも利用可能 |
| **ライブ音声セッション（任意）** | 実験的な全二重音声トランスポート | Gemini `BidiGenerateContent` WebSocket（既定無効、PipeWire 実音声 I/O は `v0.1.0` 予定） |

## Observe → Decide → Plan → Act ループ

1. **Observe**: `jikud` はスコープ限定の `CapabilityToken` で `koma-agent.sock` に接続し、`capture.frame` で読み取り専用スクリーンショット取得（`block_out_from` 指定ウィンドウはコンポジタ側でマスク済み）と現在 `Epoch` を受け取ります。
2. **Decide**: 15 項目の安全チェックリスト、閉集合選択（`NONE_OR_OTHER` フォールバック付き）、`15×15` `grid_225` 座標を評価します。
3. **Plan**: 信頼度 `< 0.85` の曖昧な状態や自由形式の指示は `[roles.planner]` へ渡し、実行手順や再利用可能なスキルを生成します。
4. **Act**: `expected_epoch` 付きで `vseat.click`、`vseat.key`、`vseat.inject_text`、`macro.exec` を送信し、`4090 ERR_STALE_EPOCH`、`4091 ERR_HUMAN_PREEMPTED`、`4032 ERR_PROTECTED_SURFACE` 発生時は即座に停止します。

## CLI クイックツアー

```bash
jikud --daemon --config ~/.config/jiku/config.toml --policy ~/.config/jiku/init.lua
jiku status --json
jiku decide --image shot.png "Is a terminal window visible?"
jiku plan "Summarize the active workspace"
jiku box classify ~/JikuBox
jiku mcp --print-tools
```
