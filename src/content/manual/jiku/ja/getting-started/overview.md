# Jiku 概要

> [!NOTE]
> **Jiku**（`jikud` および `jiku`）は [komawm/jiku](https://github.com/komawm/jiku) で提供される任意の独立デスクトップ自動化デーモンおよび CLI です。Jiku を導入しなくても、[Koma](/ja/) コンポジタは AI 依存なしで単独動作します。

![QEMU 上での Jiku 1.00x リアルタイム風景描画デモ](https://cdn.komawm.org/media/v0.0.1/jiku-paint-realtime-uncut.mp4 "無編集 1.00x QEMU 録画（20 fps で 89.35 秒、3 パス計 85/85 ステップ：ツールバークリック 29 回 + Catmull-Rom スプライン描画 56 本）。")

![Koma 上で完成した 3 パス風景キャンバス](https://cdn.komawm.org/media/v0.0.1/jiku-paint-final-3passes.webp "Koma のワークスペースリース枠内で 3 パス描画を終えた最終キャンバス。")

[ストローク部分のみの 1.00x 映像](https://cdn.komawm.org/media/v0.0.1/jiku-paint-strokes-1x.mp4)（`1.00x` 倍速 `46.00 s`）や従来の [グリッド座標指定スクリーンショット](https://cdn.komawm.org/media/jiku-paint.webp) もあわせてご覧ください。

## Jiku が行うこと

Jiku は高速な画面チェック、多段階タスク計画、小コンテキスト予算管理、音声出力、コンパニオンステージ配信をユーザー空間デーモン（`jikud`）と CLI（`jiku`）にまとめています：

- **バックグラウンドデーモン（`jikud`）**: `$XDG_RUNTIME_DIR/jiku.sock` で待機し、Koma からスクリーンショット取得と AT-SPI2 `@snap:eN` UI ツリー（`SystemGroundingPack`）を取得し、4 段階 `context_budget` 圧縮ウォーターフォールでプロンプトを収めたうえで判定／計画を実行し、Lua ポリシー適用後に多点 `vseat.path` / `vseat.stroke` 入力を Koma へ送ります。
- **CLI・MCP サーバー（`jiku`）**: デーモン状態確認、設定と Lua ポリシー検証、単発判定やタスク実行、AT-SPI2 スナップショット取得（`jiku a11y`）、トークン予算検査（`jiku context inspect`）、オフライン／ライブ比較ベンチマーク（`jiku bench run`）、`~/JikuBox` 分類、ローカル全文履歴検索、スキル承認管理、双方向フレーミング stdio MCP（`Content-Length` + `NDJSON`）経由の 12 ツール公開を行います。
- **ローカル状態と履歴（`~/.local/state/jiku/state.db`）**: 変化のないフレームの重複排除、アプリ固有の操作手順キャッシュ、ローカル全文履歴、承認待ちスキル草案を保存します。
- **音声合成とアバターステージ（`[notify]` / `[tts]` / `[avatar]`）**: 既定で D-Bus 経由のデスクトップ通知を送信します。`[tts]` はモジュール式プロバイダ（`espeak_ng`・`irodori`・`voicevox`・`openai_speech`・`noop`）と 20 ms リップシンク抽出・割り込み再生（`AudioPlaybackSink`）を備え、`jiku avatar serve` は HTTP + WebSocket の `Snapshot` / `AvatarCue` コンパニオン VRM ステージを公開します。

## モデルの役割分担

| 役割 | 用途 | 既定モデルとフォールバック |
| :--- | :--- | :--- |
| **判定プロンプト（`[roles.decision_router]`）** | 高速な UI 状態確認、`grid_225` 座標指定、安全確認、`~/JikuBox` 分類 | 任意の専用判定モデル（`JIKU_DECISION_API_KEY`、ネイティブ零出力トークンエンドポイント）。未設定時は主プランナーモデルへ自動フォールバックし、括弧バランス JSON 抽出で構造化判定を実施 |
| **プランナーモデル（`[roles.planner]`）** | 多段階タスク計画、判定信頼度 `< 0.85` 時のエスカレーション、スキル草案作成 | 任意のテキスト/VLM モデル（`JIKU_PLANNER_API_KEY`）。OpenAI 互換・`llama-server`・Google AI Studio・Anthropic エンドポイントに対応 |
| **ライブ音声セッション（任意）** | 実験的な全二重音声トランスポート | 全二重 `BidiGenerateContent` WebSocket エンドポイント（既定無効、PipeWire ライブマイク入力は `v0.1.0` 予定） |

## Observe → Decide → Plan → Act ループ

1. **Observe**: `jikud` はスコープ限定の `CapabilityToken` で `koma-agent.sock` に接続し、`capture.frame` で読み取り専用スクリーンショット（`block_out_from` 指定面はマスク済み）と現在 `Epoch` を受け取り、`SystemGroundingPack` で AT-SPI2 `@snap:eN` ノードを統合して `context_budget` で圧縮します。
2. **Decide**: 15 項目の安全チェックリスト、閉集合選択（`NONE_OR_OTHER` フォールバック付き）、`15×15` `grid_225` 座標を評価します。
3. **Plan**: 信頼度 `< 0.85` の曖昧な状態や自由形式の指示は `[roles.planner]` へ渡し、具象アクション（`move_path`、`drag_path`、`click`、`inject_text`）や再利用可能なスキルを生成します。
4. **Act**: `expected_epoch` 付きで `vseat.path`、`vseat.stroke`、`vseat.click`、`vseat.key`、`vseat.inject_text`、`vseat.cursor_settle`、`macro.exec` を送信して完了後にリースを解放し、`4090 ERR_STALE_EPOCH`・`4091 ERR_HUMAN_PREEMPTED`・`4032 ERR_PROTECTED_SURFACE` 発生時は即座に停止します。

## CLI クイックツアー

```bash
jikud --daemon --config ~/.config/jiku/config.toml --policy ~/.config/jiku/init.lua
jiku status --json
jiku decide --image shot.png "Is a terminal window visible?"
jiku plan "Summarize the active workspace"
jiku a11y snapshot --json
jiku context inspect --max-tokens 4096
jiku tts say "Ready to assist."
jiku avatar serve --bind 127.0.0.1:4190
jiku bench run --offline
jiku box classify ~/JikuBox
jiku mcp --print-tools
```
