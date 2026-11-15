# Monitors & Input

Koma configures multi-monitor layouts through `koma.monitor({...})` and input hardware through `koma.input({...})`, `koma.device({...})`, and `koma.gesture({...})` in `~/.config/koma/init.lua`.

## Monitor Configuration (`koma.monitor`)

Match displays by Wayland connector name (`output = "DP-1"`) or hardware EDID metadata (`match = { make = "...", model = "...", serial = "..." }`) so docked setups keep their layout even if connector names change:

```lua
-- Built-in laptop panel with DPI-aware auto scaling and optional notch safe area
koma.monitor({
    output = "eDP-1",
    mode = "2560x1600@120.000", -- or "preferred"
    position = { x = 0, y = 0 },
    scale = "auto",             -- number (e.g. 1.5) or "auto"
    transform = "normal",       -- "normal" | "90" | "180" | "270" | "flipped" | "flipped-90" ...
    vrr = "on_demand",          -- false | true | "on_demand"
    max_bpc = 10,
    safe_area = { top = 0, bottom = 0, left = 0, right = 0 },
    allow_non_desktop = false,
    focus_at_startup = true,
    backdrop_color = "#111216",
})

-- External 4K monitor matched by EDID and placed to the right
koma.monitor({
    match = { make = "Dell Inc.", model = "DELL U2723QE" },
    mode = "3840x2160@60.000",
    position = { x = 1600, y = -200 },
    scale = 1.5,
    transform = "normal",
})
```

Set `off = true` in a `koma.monitor({...})` block to disable a specific output.

### Multi-Monitor Navigation & Output Tools

- **Keybind Actions**: Bind `koma.act.monitor.focus_left()`, `focus_right()`, `focus_up()`, `focus_down()`, `koma.act.monitor.focus("DP-1")`, and `koma.act.window.move_to_monitor_left/right/up/down()`.
- **`wlr-output-management` (`zwlr_output_manager_v1`)**: Tools such as `kanshi` and `wdisplays` can inspect outputs, test configurations, and apply changes at runtime.
- **Fractional Scaling**: `wp-fractional-scale-v1` and `wp-viewporter` send exact scale factors (`1.25`, `1.5`, `1.6`, or `"auto"`) directly to native Wayland clients.

## Keyboard, Pointer, Touchpad & Tablet (`koma.input`)

Keyboard repeat defaults are `repeat_delay = 220` ms and `repeat_rate = 35` Hz (`repeat_delay_ms` / `repeat_rate_hz` are accepted as aliases). Setting `mod_key = "auto"` (the default) uses `Super` on `--tty` and `Alt` when running nested under `--winit`; explicit values are `"Super"`, `"Alt"`, `"Ctrl"`, `"Shift"`, and `"Mod5"`.

```lua
koma.input({
    mod_key = "auto",             -- "auto" | "Super" | "Alt" | "Ctrl" | "Shift" | "Mod5"
    inherit_default_binds = true, -- Keep built-in defaults and override individual chords
    keyboard = {
        layout = "us,jp",
        variant = ",",
        options = { "grp:win_space_toggle", "ctrl:nocaps" },
        repeat_delay = 250,
        repeat_rate = 40,
        numlock_on_startup = false,
    },
    pointer = {
        accel_profile = "flat",   -- "adaptive" | "flat"
        accel_speed = 0.0,        -- -1.0 .. 1.0
        natural_scroll = false,
        left_handed = false,
        middle_emulation = false,
        scroll_factor = 1.0,
        follow_mouse = "normal",  -- "off" | "normal" | "focus_only"
    },
    touchpad = {
        tap_to_click = true,
        tap_and_drag = true,
        tap_drag_lock = false,
        natural_scroll = true,
        disable_while_typing = true,
        disable_while_trackpointing = true,
        accel_profile = "adaptive",
        accel_speed = 0.1,
        scroll_method = "two_finger", -- "none" | "no_scroll" | "two_finger" | "edge" | "on_button_down"
        click_method = "clickfinger", -- "none" | "button_areas" | "clickfinger"
        disabled_on_external_mouse = false,
        scroll_factor = 1.0,
        pinch_sensitivity = 1.0,
    },
    tablet = {
        map_to_output = "eDP-1",
        left_handed = false,
    },
})
```

On clickpads without separate physical mouse buttons (such as Apple Force Touch trackpads), Koma defaults `click_method` to `"clickfinger"` and `disable_while_typing` to `true` unless overridden above or per device.

## Per-Device Overrides (`koma.device`)

Use `koma.device({...})` to override `libinput` options or output mapping for a single device name:

```lua
koma.device({
    name = "wacom-one-by-wacom-s-pen",
    map_to_output = "eDP-1",
})

koma.device({
    name = "Logitech MX Master 3",
    accel_profile = "flat",
    accel_speed = -0.2,
    natural_scroll = false,
})
```

## Multi-Finger Gestures (`koma.gesture`)

Bind 2- to 5-finger touchpad swipes and pinches to any `koma.act.*` action or Lua callback:

```lua
koma.gesture({
    fingers = 3,
    direction = "horizontal", -- "left" | "right" | "up" | "down" | "horizontal" | "vertical" | "pinch_in" | "pinch_out"
    action = koma.act.workspace.focus_next(),
    cooldown_ms = 180,
    desc = "3-finger workspace swipe",
})

koma.gesture({
    fingers = 4,
    direction = "up",
    action = koma.act.overview.toggle(),
    desc = "4-finger swipe up for koma-overview",
})
```
