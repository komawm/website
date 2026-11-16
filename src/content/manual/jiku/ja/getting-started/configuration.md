# 設定とポリシー

`jikud` は `~/.config/jiku/config.toml`（`--config` または `$JIKU_CONFIG` で上書き可）と `~/.config/jiku/init.lua` のポリシーフック（`--policy` または `$JIKU_POLICY` で上書き可）を読み込みます。すべての項目に検証済みの既定値が設定されているため、独自ファイルを作成する前でも起動できます。

## `config.toml` リファレンス

```toml
[daemon]
locale = "ja-JP"                 # "ja-JP" | "zh-CN" | "en-US"
socket_name = "jiku.sock"        # $XDG_RUNTIME_DIR/ 配下に作成
dropbox_dir = "~/JikuBox"

[koma]
default_workspace = "agent:work"
default_overlay = "grid_225"     # "grid_225" | "som" | "none"
perceptual_hash_threshold = 4    # 重複フレーム判定のハミング距離しきい値
hover_glide_ms = 140             # クリック前のカーソルホバー移動時間 (ms)

[context]
max_context_tokens = 8192        # 総トークン予算上限（小規模コンテキスト向け制御）
reserved_output_tokens = 768
min_output_tokens = 256
compaction_trigger_ratio = 0.72
image_token_estimate = 512
keep_recent_images = 1
a11y_max_entries_small_ctx = 28

# プロバイダキー・エンドポイント・モデル ID は置き換えるプレースホルダーです。
# `api_key_env` は各プロバイダキーを保持する環境変数名です。
[providers.primary]
kind = "openai_compatible"       # 任意の OpenAI 互換テキスト/VLM エンドポイント
base_url = "https://your-planner-endpoint.example/v1"
api_key_env = "JIKU_PLANNER_API_KEY"
thinking = false

[providers.decision]
kind = "google_gemini"           # ネイティブ判定エンドポイントドライバで必須
base_url = "https://your-decision-endpoint.example/v1beta"
api_key_env = "JIKU_DECISION_API_KEY"

[roles.planner]
provider = "primary"
model = "<primary-text-model-id>"
driver = "turn_sse"
thinking = false
temperature = 0.2

[roles.decision_router]
provider = "decision"
model = "<decision-model-id>"      # キー未設定時は主プランナーモデルへ自動フォールバック
driver = "decisions"
optional = true
fallback_to_primary_text_model = true
```

## 判定ルーティングとグリッド設定（`[decision_router.compiler]`）

空間グリッドの分割数や判定しきい値は `[decision_router.compiler]` および `[decision_router.compiler.grid]` で調整します。

| キー | 既定値 | 説明 |
| :--- | :--- | :--- |
| `grid.cols` / `grid.rows` | `15` / `15` | 空間ターゲットグリッドの分割数（`1..=64`、既定は `225` セル `A1`–`O15`） |
| `fast_path_confidence` | `0.85` | プランナーモデルへエスカレーションせず直接 `vseat` 入力を行う最小信頼度 |
| `min_cell_prob` | `0.05` | 上位 `K` セルからターゲット座標を補間する際に含める最小確率 |
| `time_slot_min_confidence` | `0.75` | 連続ショートカット手順の各ステップ継続に必要な最小信頼度 |
| `bernoulli_activation_threshold` | `0.80` | 条件付き後続ステップを発火させる最小 `P(Yes)` |
| `probe_min_prob` | `0.15` | プローブ時に候補選択肢を保持する最小確率の下限 |
| `stop_sentinel` / `fallback_token` | `"stop_done"` / `"NONE_OR_OTHER"` | 手順終了センチネルおよび未知選択肢用フォールバックトークン |

## デスクトップ通知・TTS・アバターステージ（`[notify]` / `[tts]` / `[avatar]`）

- **デスクトップ通知（`[notify]`）**: 既定で `desktop_dbus = true`・`app_name = "Jiku"` となり、`task_completed`、`task_failed`、`verification_needed`、`skill_staged` 発生時に `org.freedesktop.Notifications` / `notify-send` で通知します。
- **任意 TTS（`[tts]`、既定で無効）**: `enabled = true` として `provider = "espeak_ng" | "irodori" | "voicevox" | "openai_speech" | "noop"`、`voice`、`audio_sink`（`"auto"`・`"pw-play"`・`"aplay"`・`"silent"` または任意コマンド）を選択できます。20 ms RMS のリップシンク音素タイムライン抽出と `AudioPlaybackSink` 割り込み再生を備えます。
- **コンパニオンアバターステージ（`[avatar]`）**: `emit_cues = true` と `idle_gaze_follow_vseat = true` により、`jiku avatar serve` 経由で `Snapshot` / `AvatarCue` JSON パケット配信と `vseat` ポインタ追従視線制御を行います。

## `config.lua`（サンドボックス化された Lua 設定）

同じ型付き設定は Lua ドキュメントとしても受け付けます。拡張子で形式を選ぶか、`config.toml` を土台にして `config.lua` で差分だけを上書きします。

| 呼び出し | 読み込まれるファイル |
| :--- | :--- |
| `--config <PATH>` / `$JIKU_CONFIG` | 指定したファイルのみ（`.toml` / `.lua`） |
| 既定の探索・両方存在 | `config.toml` の後に `config.lua` をフィールド単位でマージ |
| 既定の探索・片方のみ | そのファイルのみ |

```lua
-- ~/.config/jiku/config.lua
jiku.config{
    daemon = { locale = "ja-JP", socket_name = "jiku.sock" },
    providers = {
        primary = {
            kind = "openai_compatible",
            base_url = "https://your-planner-endpoint.example/v1",
            api_key_env = "JIKU_PLANNER_API_KEY",
        },
        decision = {
            kind = "google_gemini",
            base_url = "https://your-decision-endpoint.example/v1beta",
            api_key_env = "JIKU_DECISION_API_KEY",
        },
    },
    roles = {
        planner = { provider = "primary", model = "<primary-text-model-id>", driver = "turn_sse" },
        decision_router = { provider = "decision", model = "<decision-model-id>", driver = "decisions", optional = true },
    },
}
```

- **フィールド単位マージ**：オブジェクトはキー単位でマージし、配列とスカラーは置換します。`jiku.config{...}` を複数回呼ぶと順に適用されます。
- **`init.lua` と同じサンドボックス**：8 MiB のヒープ上限、決定論的フューエル、`io` / `os` / `dofile` / `loadfile` なし。環境変数を読めないため、`api_key_env` は変数名のままです。
- **厳格なスキーマ**：未知のキーや型違いは該当フィールドパス付きで拒否され、暗黙の既定値にはなりません。
- **単一のバリデータ**：両形式は同じ設定型へ変換され、同じ意味検証を通ります。

`jikud --migrate-config --config ~/.config/jiku/config.toml --out ~/.config/jiku/config.lua` で既存ファイルを変換できます。ジェネレータは `--force` なしの上書きを拒否し、出力が同一設定へ再読込されることを検証します。

移行後は元の `config.toml` を削除するか名前を変更してください。既定の探索では先に読み込まれますが、生成された `config.lua` が定義するセクションをすべて置き換えるため、以後の TOML 編集は反映されません。

## Lua 設定（`~/.config/jiku/init.lua`）と `jikud.service`

`jikud` は OS やファイルシステム操作プリミティブを遮断したサンドボックス化 Lua 5.4 ランタイム上でポリシーフックを実行し、`systemd --user` ユニット（`jikud.service`）も提供します。

```ini
# ~/.config/systemd/user/jikud.service
[Unit]
Description=Jiku Desktop Orchestration Daemon
After=graphical-session.target

[Service]
ExecStart=/usr/bin/jikud --daemon
Restart=on-failure

[Install]
WantedBy=graphical-session.target
```
