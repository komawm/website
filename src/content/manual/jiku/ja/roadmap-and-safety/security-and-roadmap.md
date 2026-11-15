# ゼロ Unsafe 安全境界と v0.1.0 ロードマップ

![Jiku デスクトップマスコットプレビュー](/placeholders/jiku-kumiko.webp)

Jiku では、現在のコードベースに実装済みの安全保証と、`v0.1.0` マイルストーンで計画中の機能明確に区別しています。

## 現在の安全構成（実装済み）

- **全クレートでのゼロ `unsafe` Rust**：`komawm/jiku` ワークスペース全体で `#![forbid(unsafe_code)]` を強制し、オーケストレーションデーモンと CLI から生ポインタ演算および安全でない FFI ラッパーを排除しています。
- **明示的なポリシー・スキル承認ゲート**：`jiku validate-config`、`jikud --headless-check`、および `skills list` / `diff` / `stage` / `approve` の手順により、適用前の検証を徹底します。
- **限定されたローカル IPC 境界**：Jiku は専用のローカル制御ソケット経由で Koma と通信し、未認証の TCP リスナーを既定では公開しません。

## 計画中の `v0.1.0` マイルストーン項目（追跡中・未実装）

以下の機能は [komawm/jiku Issues](https://github.com/komawm/jiku/issues) の `v0.1.0` マイルストーンで計画されており、現時点で出荷済みの機能ではありません。

- **マルチフォーマット・アバターパイプライン**：`VRM`、`MMD`、`Live2D Cubism`、`Inochi2D` モデルに対応した Wayland layer-shell マスコット描画（`v0.0.x` 期間中は延期）。
- **PipeWire ライブ音声入力**：音声対話とリップシンク向けのリアルタイム PipeWire 音声取り込み。
- **Linux Landlock + Seccomp サンドボックス**：デーモンワーカーおよび外部スキルサブプロセスに対するカーネルレベルのファイルシステム・システムコール隔離。

設計仕様およびプロトコル契約は [komawm/docs](https://github.com/komawm/docs) と [komawm.org/jiku](https://komawm.org/jiku/) を参照してください。
