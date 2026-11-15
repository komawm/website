# デーモン設定・DecisionCompiler・TTS

`jikud` は `~/.config/jiku/config.toml`（`--config` または `$JIKU_CONFIG`）および `~/.config/jiku/init.lua`（`--policy` または `$JIKU_POLICY`）を読み込みます。全項目に検証済みデフォルト値が定義されているため、カスタム設定前でも起動可能です。

## `config.toml` リファレンス

```toml
[daemon]
locale = "ja-JP"                 # "ja-JP" | "zh-CN" | "en-US"
socket_name = "jiku.sock"        # $XDG_RUNTIME_DIR/ 配下に作成
dropbox_dir = "~/JikuBox"

[koma]
default_workspace = "agent:work"
default_overlay = "grid_225"     # "grid_225" | "som" | "none"
perceptual_hash_threshold = 4    # L0 dHash ハミング距離しきい値

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
model = "gemini-decision-1"      # キー未設定時は EmulatedStructuredTextModel へ自動フォールバック
driver = "decisions"
optional = true
fallback_to_primary_text_model = true
```

## `DecisionCompiler`・`GridSpec`・`TimeSlotMacro` 設定

`[decision_router.compiler]` と `[decision_router.compiler.grid]` で全パラメータを調整できます。

| キー | 既定値 | 説明 |
| :--- | :--- | :--- |
| `grid.cols` / `grid.rows` | `15` / `15` | 空間グリッド分割数（`1..=64`、既定 `225` セル `A1`–`O15`） |
| `fast_path_confidence` | `0.85` | System-2 へ回さず `vseat` を直接実行する最小信頼度 |
| `min_cell_prob` | `0.05` | 重心補間（`grid_225`）に含める最小セル確率 |
| `time_slot_min_confidence` | `0.75` | `TimeSlotMacro` 連続ショートカット実行の最小スロット信頼度 |
| `bernoulli_activation_threshold` | `0.80` | `BernoulliExpectedStep` 発動に必要な最小 `P(Yes)` |
| `probe_min_prob` | `0.15` | `ThresholdProbe` 候補保持の下限確率 |
| `stop_sentinel` / `fallback_token` | `"stop_done"` / `"NONE_OR_OTHER"` | シーケンス終了トークンおよび未知選択肢フォールバック |

## デスクトップ通知と任意 TTS（`[notify]` / `[tts]`）

- **デスクトップ通知（`[notify]`）**：既定で `desktop_dbus = true`・`app_name = "Jiku"` となり、`task_completed` / `task_failed` / `verification_needed` / `skill_staged` 時に D-Bus / `notify-send` で通知します。
- **任意 TTS（`[tts]`、既定 `enabled = false`）**：有効化すると `voicevox`（`http://127.0.0.1:50021`, `speaker_id = 3`）、`openai_speech`、`noop` を選択できます（`VoicevoxProvider` / `OpenAiSpeechProvider` / `NoopTtsProvider`）。

## Phodopus Lua ポリシー（`~/.config/jiku/init.lua`）と `jikud.service`

ポリシーフックは [Phodopus](https://github.com/Xuepoo/phodopus) 隔離 VM 内で動作し、`systemd --user` ユニットとして常駐できます。

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
