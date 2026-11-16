# Configuration

`jikud` reads `~/.config/jiku/config.toml` (overridable via `--config` or `$JIKU_CONFIG`) and policy hooks from `~/.config/jiku/init.lua` (overridable via `--policy` or `$JIKU_POLICY`). All fields have validated defaults, so `jikud` starts cleanly even before you create custom config files.

## `config.toml` Reference

```toml
[daemon]
locale = "en-US"                 # "en-US" | "zh-CN" | "ja-JP"
socket_name = "jiku.sock"        # Created under $XDG_RUNTIME_DIR/
dropbox_dir = "~/JikuBox"

[koma]
default_workspace = "agent:work"
default_overlay = "grid_225"     # "grid_225" | "som" | "none"
perceptual_hash_threshold = 4    # Duplicate frame Hamming distance threshold
hover_glide_ms = 140             # Pre-click cursor hover glide duration (ms)

[context]
max_context_tokens = 8192        # Total token budget (clamp small models cleanly)
reserved_output_tokens = 768
min_output_tokens = 256
compaction_trigger_ratio = 0.72
image_token_estimate = 512
keep_recent_images = 1
a11y_max_entries_small_ctx = 28

# Provider keys, endpoints, and model IDs are placeholders you replace.
# `api_key_env` names the environment variable holding each provider key.
[providers.primary]
kind = "openai_compatible"       # any OpenAI-compatible text/VLM endpoint
base_url = "https://your-planner-endpoint.example/v1"
api_key_env = "JIKU_PLANNER_API_KEY"
thinking = false

[providers.decision]
kind = "google_gemini"           # required by native decision-endpoint drivers
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
model = "<decision-model-id>"      # Falls back to primary planner model if key is absent
driver = "decisions"
optional = true
fallback_to_primary_text_model = true
```

## Decision Routing & Grid Settings (`[decision_router.compiler]`)

Spatial grid dimensions and decision thresholds are configured under `[decision_router.compiler]` and `[decision_router.compiler.grid]`:

| Key | Default | Meaning |
| :--- | :--- | :--- |
| `grid.cols` / `grid.rows` | `15` / `15` | Spatial targeting grid dimensions (`1..=64`, default `225` cells `A1`–`O15`) |
| `fast_path_confidence` | `0.85` | Minimum confidence required for direct `vseat` input before escalating to the planner model |
| `min_cell_prob` | `0.05` | Minimum cell probability included when interpolating top-`K` target coordinates |
| `time_slot_min_confidence` | `0.75` | Minimum per-step confidence before stopping a multi-step shortcut sequence |
| `bernoulli_activation_threshold` | `0.80` | Minimum `P(Yes)` needed to trigger a conditional follow-up step |
| `probe_min_prob` | `0.15` | Minimum probability floor for retaining candidate choices while probing |
| `stop_sentinel` / `fallback_token` | `"stop_done"` / `"NONE_OR_OTHER"` | Sequence completion sentinel and open-world fallback token |

## Notifications, TTS & Avatar Stage (`[notify]` / `[tts]` / `[avatar]`)

- **Desktop Notifications (`[notify]`)**: `desktop_dbus = true`, `app_name = "Jiku"`, `notify_on = ["task_completed", "task_failed", "verification_needed", "skill_staged"]` dispatches notifications via `org.freedesktop.Notifications` / `notify-send`.
- **Optional TTS (`[tts]`, disabled by default)**: Set `enabled = true` and choose `provider = "espeak_ng" | "irodori" | "voicevox" | "openai_speech" | "noop"`, `voice`, and `audio_sink` (`"auto"`, `"pw-play"`, `"aplay"`, `"silent"`, or custom command). Generates 20 ms RMS lip-sync vowel cues and supports barge-in interruption via `AudioPlaybackSink`.
- **Companion Avatar Stage (`[avatar]`)**: `emit_cues = true` and `idle_gaze_follow_vseat = true` stream `Snapshot` / `AvatarCue` JSON packets and track active `vseat` pointer coordinates over `jiku avatar serve`.

## `config.lua` (Sandboxed Lua Configuration)

The same typed configuration is also accepted as a Lua document. Pick the format by extension, or keep `config.toml` as the base and let `config.lua` overlay the keys it changes.

| Invocation | Loaded documents |
| :--- | :--- |
| `--config <PATH>` / `$JIKU_CONFIG` | exactly that file (`.toml` or `.lua`) |
| default search, both files present | `config.toml`, then `config.lua` merged over it |
| default search, one file present | that file only |

```lua
-- ~/.config/jiku/config.lua
jiku.config{
    daemon = { locale = "en-US", socket_name = "jiku.sock" },
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

- **Field-level merge**: objects merge key by key; arrays and scalars replace. Repeated `jiku.config{...}` calls apply in order.
- **Same sandbox as `init.lua`**: an 8 MiB heap ceiling, deterministic fuel, and no `io`, `os`, `dofile`, or `loadfile`. It cannot read the environment, so `api_key_env` stays a variable *name*.
- **Strict schema**: unknown keys or wrong value types are rejected with the offending field path instead of silently defaulting.
- **One validator**: both formats deserialize into the same configuration type and run the same semantic checks.

Convert an existing file with `jikud --migrate-config --config ~/.config/jiku/config.toml --out ~/.config/jiku/config.lua`. The generator refuses to overwrite without `--force` and verifies that its output reloads to an identical configuration.

## Lua Configuration (`~/.config/jiku/init.lua`) & `jikud.service`

`jikud` runs user policy hooks inside a sandboxed Lua 5.4 runtime (blocking OS and filesystem primitives) and ships a `systemd --user` unit (`jikud.service`):

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
