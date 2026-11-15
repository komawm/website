# メモリとスキル管理

Jiku はセッション状態とローカル全文履歴を `~/.local/state/jiku/state.db` に保存し、生成されたスキルはすべて人間のレビューを経てから有効化します。

![Koma 端末で Jiku の履歴検索とスキル状態を確認する様子](https://cdn.komawm.org/media/jiku-terminal.webp "端末から Jiku のメモリ検索結果とスキル一覧を確認した画面。")

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

## 小コンテキスト予算と 4 段階コンパクションウォーターフォール

`llama-server` 上の `Qwen3VL-2B-Instruct-Q4_K_M` のような `4096`–`8192` トークンの小規模ローカルモデル向けに、プロンプト見積りが `compaction_trigger_ratio`（`0.72`）を超えると `context_budget` が決定論的な 4 段階圧縮を実行し、`min_output_tokens`（`256`）〜 `reserved_output_tokens`（`768`）の出力余白を確保します：

1. **`stage1_visual_roi_pruning`**: 最新の `keep_recent_images`（`1`）枚のみを残し（1 枚あたり `image_token_estimate = 512`）、古いスクリーンショットを破棄します。
2. **`stage2_a11y_skeleton_folding`**: 冗長な AT-SPI2 サブツリーを最も関連性の高い上位 `a11y_max_entries_small_ctx`（`28`）個の操作可能 `@snap:eN` ノードへ要約します。
3. **`stage3_episodic_l1_folding`**: 古い会話ターンを圧縮し、`[context]`・`[cursor]`・`[a11y]` グラウンディングヘッダを保持したまま `l1_app_quirks` / L2 履歴抜粋をトリミングします。
4. **出力予約トークン数のクランプ**: 残余ヘッドルーム（`64` トークン）の内側へ `max_output_tokens` を安全にクランプします。

`jiku context inspect` でオフライン検証でき、`4096` トークン予算の実測では `5031` トークンの入力を `2943` トークンへ圧縮しました（`clamped_max_output_tokens = 768`、`dropped_images = 2`、`truncated_a11y_nodes = 36`）。
