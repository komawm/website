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

[providers.opencode_go]
kind = "opencode_go"
base_url = "https://opencode.ai/inference/go/openai/v1"
api_key_env = "OPENCODE_GO_API_KEY"
thinking = false

[providers.gemini]
kind = "google_gemini"
base_url = "https://generativelanguage.googleapis.com/v1beta"
api_key_env = "GEMINI_API_KEY"

[roles.planner]
provider = "opencode_go"
model = "deepseek-v4.1-flash"
driver = "turn_sse"
thinking = false
temperature = 0.2

[roles.decision_router]
provider = "gemini"
model = "gemini-decision-1"      # キー未設定時は主プランナーモデルへ自動フォールバック
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

## デスクトップ通知と任意 TTS（`[notify]` / `[tts]`）

- **デスクトップ通知（`[notify]`）**: 既定で `desktop_dbus = true`・`app_name = "Jiku"` となり、`task_completed`、`task_failed`、`verification_needed`、`skill_staged` 発生時に `org.freedesktop.Notifications` / `notify-send` で通知します。
- **任意 TTS（`[tts]`、既定で無効）**: `enabled = true` にすると `provider = "voicevox"`（`http://127.0.0.1:50021`、`speaker_id = 3`）、`"openai_speech"`、`"noop"` を選択できます。

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
