# L0–L2 記憶階層とスキル承認ゲート

`jiku-memory` は外部ベクトル DB を必要とせず、`~/.local/state/jiku/state.db`（SQLite WAL + FTS5 BM25）単一ファイルで 3 階層の記憶を管理します。

- **L0 知覚フレームリング**：直近数フレームを `dHash` 付きで RAM リングバッファに保持し、画面変化の有無を即座に判定します。
- **L1 アプリ別 Quirk ノート**：Wayland `app_id` ごとの操作特性を固定スナップショットとして注入し、プロンプトキャッシュのヒット率を維持します。
- **L2 エピソード検索とスキル承認ゲート**：FTS5 による履歴検索（`jiku memory search`）に加え、提案された Lua マクロは必ずステージング領域に隔離され、人間が `jiku skills diff` と `jiku skills approve` で承認するまで実行されません。
