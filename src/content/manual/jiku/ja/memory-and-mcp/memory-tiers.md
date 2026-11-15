# メモリとスキル管理

Jiku はセッション状態とローカル全文履歴を `~/.local/state/jiku/state.db` に保存し、生成されたスキルはすべて人間のレビューを経てから有効化します。

![Koma 端末で Jiku の履歴検索とスキル状態を確認する様子](/media/jiku-terminal.webp "端末から Jiku のメモリ検索結果とスキル一覧を確認した画面。")

## ローカルメモリ階層

| 階層 | 保存先 | 役割と制限 |
| :--- | :--- | :--- |
| **L0：重複フレーム排除リング** | メモリ（`l0_frame_ring_size`、既定 `32`） | Koma のスクリーンショット取得ごとに 64-bit `dHash` を計算し、`perceptual_hash_threshold = 4` ビット以内の静止画面をスキップしてモデル呼び出しを省きます |
| **L1：アプリ固有操作（`l1_app_quirks`）** | ローカル DB テーブル（`app_quirk_max_chars = 512`） | `app_id` ごとの入力特性（端末での `Ctrl+Shift+V` 貼り付けなど）を記録し、プランナーへの入力に含めます |
| **L2：エピソード履歴（`l2_episodes`）** | ローカル全文インデックス | 過去の目標、操作結果、作業履歴を索引化し、`jiku memory search <QUERY>` でオフライン検索できます |

## スキル二段階承認と静的サニタイズ

`stage_new_skills = true` の場合でも、Jiku が複数ステップの作業後に提案する Lua または Markdown SOP スキルは**未承認のまま自動実行されません**。

1. **ステージングと静的チェック**: 候補スクリプトは `~/.local/state/jiku/state.db` の `staged_skills`（`status = 'staged'`）へ保存され、`io.*`、`os.*`、`debug.*`、`package.*`、`loadfile`、`dofile`、`load(`、`require(` を含むものは拒否されます。
2. **人間による差分確認（`jiku skills diff`）**: 有効化前に内容を確認します。
   ```bash
   jiku skills list
   jiku skills diff <skill_id>
   ```
3. **明示的な承認（`jiku skills approve`）**: 承認すると `~/.config/jiku/skills/` へ昇格（`status = 'approved'`）され、監査ログが記録されます。
   ```bash
   jiku skills approve <skill_id>
   ```
