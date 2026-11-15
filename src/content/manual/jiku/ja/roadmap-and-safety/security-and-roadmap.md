# 権限管理と今後の予定

Jiku では、`v0.0.x` で実装済みの権限制御・隔離機構と、`v0.1.0` 向けに計画されている機能を明確に区別しています。

## 実装済みの権限制御（`v0.0.x`）

- **メモリ安全な実装**: デーモンおよび CLI のコードベースでは生ポインタ FFI や安全でないメモリブロックを使用していません。
- **限定されたソケットと Epoch 保護**: `jikud` は未認証の TCP リスナーを開かず、ローカルの `koma-agent.sock` 制御ソケット経由でスコープ付き `CapabilityToken`（`komactl token mint jiku`）を用いて Koma と通信します。入力要求には `expected_epoch` が付与され、人間の割り込み（`4091 ERR_HUMAN_PREEMPTED`）、状態変化（`4090 ERR_STALE_EPOCH`）、保護ウィンドウ（`4032 ERR_PROTECTED_SURFACE`）を検出すると即座に停止します。
- **サンドボックス化された Lua ポリシーとスキルレビュー**: `~/.config/jiku/init.lua` は OS およびファイルシステムプリミティブを無効化した制限付き Lua 5.4 環境で実行されます。生成されたスキルは静的検査（`io.*`、`os.*`、`debug.*`、`package.*`、`loadfile`、`dofile`、`load(`、`require(` を拒否）と `jiku skills diff` / `jiku skills approve` を経て有効化されます。
- **オフライン検証**: `jiku validate-config` と `jikud --headless-check` により、セッション開始前に設定とポリシー構文を検証できます。

## リリース範囲：`v0.0.1` と計画中の `v0.1.0`

- **`v0.0.1`（現行範囲）**: 任意の `jikud` デーモン、`jiku` CLI、`jiku mcp` stdio サーバー、`config.toml` / `init.lua` 設定、`~/JikuBox` 分類、ローカル全文履歴検索、ステージ済みスキルレビューを提供します。**`v0.0.1` にはデスクトップマスコット、アバター表示、PipeWire ライブ音声入出力は含まれません。**
- **`v0.1.0` 予定項目（[komawm/jiku Issues](https://github.com/komawm/jiku/issues) で追跡中・未出荷）**:
  - **デスクトップアバターパイプライン**: `VRM`、`MMD`、`Live2D Cubism`、`Inochi2D` モデルに対応した Wayland layer-shell アバター描画（`v0.0.x` 期間中は延期）。
  - **PipeWire ライブ音声取り込み**: リアルタイム音声対話および発話同期向けの PipeWire 音声入力。
  - **Linux Landlock + Seccomp サンドボックス**: デーモンワーカーおよび外部スキルサブプロセスに対するカーネル強制のファイルシステム・システムコール制限。

仕様およびプロトコル契約は [komawm/docs](https://github.com/komawm/docs) と [komawm.org/jiku](https://komawm.org/jiku/) を参照してください。
