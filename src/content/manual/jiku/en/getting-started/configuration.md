# Daemon Config, DecisionCompiler & TTS

`jikud` reads `~/.config/jiku/config.toml` (overridable via `--config` or `$JIKU_CONFIG`) and policy hooks from `~/.config/jiku/init.lua` (overridable via `--policy` or `$JIKU_POLICY`). All fields carry validated defaults so `jikud` starts cleanly even before creating custom config files.

## `config.toml` Reference

```toml
[daemon]
locale = "en-US"                 # "en-US" | "zh-CN" | "ja-JP"
socket_name = "jiku.sock"        # Created under $XDG_RUNTIME_DIR/
dropbox_dir = "~/JikuBox"

[koma]
default_workspace = "agent:work"
default_overlay = "grid_225"     # "grid_225" | "som" | "none"
perceptual_hash_threshold = 4    # L0 dHash Hamming gate

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
model = "gemini-decision-1"      # Auto-falls back to EmulatedStructuredTextModel if key absent
driver = "decisions"
optional = true
fallback_to_primary_text_model = true
```

## `DecisionCompiler`, `GridSpec` & `TimeSlotMacro`

All compiler thresholds and spatial grid dimensions are configurable under `[decision_router.compiler]` and `[decision_router.compiler.grid]`:

| Key | Default | Meaning |
| :--- | :--- | :--- |
| `grid.cols` / `grid.rows` | `15` / `15` | Spatial targeting lattice (`1..=64`, default `225` cells `A1`–`O15`) |
| `fast_path_confidence` | `0.85` | Minimum calibrated probability for direct `vseat` execution without System-2 fallback |
| `min_cell_prob` | `0.05` | Minimum cell probability included in top-`K` centroid interpolation |
| `time_slot_min_confidence` | `0.75` | Minimum slot confidence before `TimeSlotMacro` stops a compiled shortcut sequence |
| `bernoulli_activation_threshold` | `0.80` | Minimum `P(Yes)` to trigger a conditional `BernoulliExpectedStep` |
| `probe_min_prob` | `0.15` | Candidate retention floor for `ThresholdProbe` |
| `stop_sentinel` / `fallback_token` | `"stop_done"` / `"NONE_OR_OTHER"` | Sequence completion sentinel and open-world escape token |

## Notifications & Optional TTS (`[notify]` / `[tts]`)

- **Desktop Notifications (`[notify]`)**: `desktop_dbus = true`, `app_name = "Jiku"`, `notify_on = ["task_completed", "task_failed", "verification_needed", "skill_staged"]` dispatches notifications via `org.freedesktop.Notifications` / `notify-send`.
- **Optional TTS (`[tts]`, disabled by default)**: Set `enabled = true` and select `provider = "voicevox"` (`http://127.0.0.1:50021`, `speaker_id = 3`), `"openai_speech"`, or `"noop"` (`VoicevoxProvider`, `OpenAiSpeechProvider`, `NoopTtsProvider`).

## Phodopus Lua Policy (`~/.config/jiku/init.lua`) & `jikud.service`

`jikud` runs user policy hooks inside a sandboxed [Phodopus](https://github.com/Xuepoo/phodopus) Lua 5.4 VM (blocking OS/file primitives) and ships a `systemd --user` unit (`jikud.service`):

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
