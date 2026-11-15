# L0–L2 記憶階層とスキル承認ゲート

Jiku は `jiku-memory` を通じて操作履歴を `~/.local/state/jiku/state.db`（SQLite WAL + FTS5）へローカル保存し、AI が生成した候補スキルは必ず人間の二段階承認ゲートを通します。

## 3 層メモリ構成（`jiku-memory`）

| 階層 | 保存先 | 役割と制限 |
| :--- | :--- | :--- |
| **L0：知覚 `dHash` リング** | メモリ（既定 `l0_frame_ring_size = 32`） | `Koma` フレームの 64-bit `dHash` を計算し、`perceptual_hash_threshold = 4` 以内の静止画面は推論をスキップ |
| **L1：アプリ特性（`l1_app_quirks`）** | SQLite（上限 `app_quirk_max_chars = 512`） | `app_id` ごとの操作癖（端末での `Ctrl+Shift+V` ペースト等）を保持し、計画プロンプトへ注入 |
| **L2：エピソード（`l2_episodes`）** | SQLite WAL + FTS5 BM25 | 過去のタスク目標と実行軌跡を索引化し、`jiku memory search <QUERY>` で高速検索 |

## スキル二段階昇格と静的サニタイズ

`stage_new_skills = true` の場合でも、AI が生成したスキルが未承認のまま自動実行されることはありません。

1. **ステージングと静的検証**：候補スクリプトは `state.db` の `staged_skills`（`status = 'staged'`）へ格納され、`io.*`・`os.*`・`debug.*`・`package.*`・`loadfile`・`dofile`・`load(`・`require(` を含むコードは拒否されます。
2. **差分レビュー（`jiku skills diff`）**：昇格前に内容を確認します。
   ```bash
   jiku skills list
   jiku skills diff <skill_id>
   ```
3. **承認による有効化（`jiku skills approve`）**：人間が明示承認した場合のみ `~/.config/jiku/skills/` へ配置されます。
   ```bash
   jiku skills approve <skill_id>
   ```
