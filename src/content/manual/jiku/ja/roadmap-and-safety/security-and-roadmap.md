# 権限管理と今後の予定

Jiku では、`v0.0.x` で実装済みの権限制御・隔離機構と、`v0.1.0` 向けに計画されている機能を明確に区別しています。

## 実装済みの権限制御（`v0.0.x`）

- **メモリ安全な実装**: デーモンおよび CLI のコードベースでは生ポインタ FFI や安全でないメモリブロックを使用していません。
- **限定されたソケットと Epoch 保護**: `jikud` は未認証の TCP リスナーを開かず、ローカルの `koma-agent.sock` 制御ソケット経由でスコープ付き `CapabilityToken`（`komactl token mint jiku`）を用いて Koma と通信します。入力要求には `expected_epoch` が付与され、人間の割り込み（`4091 ERR_HUMAN_PREEMPTED`）、状態変化（`4090 ERR_STALE_EPOCH`）、保護ウィンドウ（`4032 ERR_PROTECTED_SURFACE`）を検出すると即座に停止します。
- **サンドボックス化された Lua ポリシーとスキルレビュー**: `~/.config/jiku/init.lua` は OS およびファイルシステムプリミティブを無効化した制限付き Lua 5.4 環境で実行されます。生成されたスキルは静的検査（`io.*`、`os.*`、`debug.*`、`package.*`、`loadfile`、`dofile`、`load(`、`require(` を拒否）と `jiku skills diff` / `jiku skills approve` を経て有効化されます。
- **オフライン検証**: `jiku validate-config` と `jikud --headless-check` により、セッション開始前に設定とポリシー構文を検証できます。

## 2x2 `VirtualPaint` アブレーション：判定モデル vs. グラウンディング

再現可能な `jiku bench run` スイート（ライブ時は `4` タスク・計 `16` トライアル）により、任意の判定モデルゲートと `SystemGroundingPack` 空間グラウンディングの効果を定量比較しています：

| スイート / 条件 | 合格率 | 平均ヒット誤差 | 平均 Chamfer 誤差 | 無駄な操作 |
| :--- | :--- | :--- | :--- | :--- |
| **オフライン `NoDecision + MinimalRaw`** | `0/4` | `69.64 px` | `136.46 px` | `9` |
| **オフライン `Decision + EnrichedGrounding`** | `4/4` | `0.00 px` | `1.52 px` | `0` |
| **ライブ ローカル `Qwen3VL-2B-Instruct-Q4_K_M`（`4096` ctx）** | 各セル `1/4`（`16/16` 回完了） | 平均レイテンシ `1209–2331 ms` | — | 小型 2B VLM での保守的な安全誤検知（`False Pos = true`） |

![判定モデルとシステムグラウンディング有効時の VirtualPaint アブレーション結果](https://cdn.komawm.org/media/v0.0.1/ablation-decision-enriched.png "判定ゲートと SystemGroundingPack 有効時の VirtualPaint 出力（4/4 合格、Chamfer 誤差 1.52 px）。")

![判定モデルなし・最小生状態時の VirtualPaint アブレーション結果](https://cdn.komawm.org/media/v0.0.1/ablation-nodecision-minimal.png "判定ゲート・強化グラウンディングなし時のベースライン出力（0/4 合格、Chamfer 誤差 136.46 px）。")

## リリース範囲：`v0.0.1` と計画中の `v0.1.0`

- **`v0.0.1`（現行範囲）**: 任意の `jikud` デーモン、`jiku` CLI、双方向フレーミング対応 12 ツール `jiku mcp` stdio サーバー、`config.toml`（`[context]`・`[tts]`・`[avatar]`）と `init.lua`、`jiku a11y` AT-SPI2 グラウンディング、4 段階 `context_budget` 圧縮、`jiku bench run`、モジュール式 `jiku-tts` 音声合成＋20 ms リップシンク、WebSocket `jiku avatar serve` VRM ステージ、`~/JikuBox` 分類、ローカル全文履歴検索、ステージ済みスキルレビューを含みます。**ネイティブ Wayland layer-shell マスコットオーバーレイ、PipeWire ライブマイク入力、カーネル Landlock/seccomp サンドボックスは `v0.0.1` には含まれません。**
- **`v0.1.0` 予定項目（[komawm/jiku Issues](https://github.com/komawm/jiku/issues) で追跡中・未出荷）**:
  - **ネイティブ Wayland Layer-Shell アバターオーバーレイ**: ブラウザ提供の `jiku avatar serve` WebSocket VRM ステージを補完する、`MMD`・`Inochi2D` 向けコンポジタ直接描画。
  - **PipeWire 全二重マイク入力**: インタラクティブな `jiku live` 音声会話向けリアルタイムハードウェアマイク取り込み（`AudioPlaybackSink` による TTS 再生は `v0.0.1` に含まれます）。
  - **Linux Landlock + Seccomp サンドボックス**: デーモンワーカーおよび外部スキルサブプロセスに対するカーネル強制のファイルシステム・システムコール制限。

仕様およびプロトコル契約は [komawm/docs](https://github.com/komawm/docs) と [komawm.org/jiku](https://komawm.org/jiku/) を参照してください。
