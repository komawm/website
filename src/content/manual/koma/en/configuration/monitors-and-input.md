# Multi-Monitor 2D Layout & Input

Koma configures monitors declaratively through `koma.monitor({...})` (supporting connector names, EDID matching, 2D coordinates, fractional scaling, transforms, VRR, and MacBook `safe_area` cutouts) and configures XKB/libinput hardware through `koma.input({...})` and `koma.device({...})`.

## Monitor Configuration (`koma.monitor`)

You can match monitors by Wayland connector name (`output = "DP-1"`) or portable hardware EDID identity (`match = { make = "...", model = "...", serial = "..." }`):

```lua
-- Primary laptop panel with DPI-aware auto scale and MacBook notch safe area
koma.monitor({
    output = "eDP-1",
    mode = "2560x1600@120.000",
    position = { x = 0, y = 0 },
    scale = "auto",
    transform = "normal",
    vrr = "on_demand", -- false | true | "on_demand"
    max_bpc = 10,
    safe_area = { top = 0, bottom = 0, left = 0, right = 0 },
    allow_non_desktop = false,
    focus_at_startup = true,
    backdrop_color = "#111216",
})

-- External 4K display matched by EDID placed to the right in 2D space
koma.monitor({
    match = { make = "Dell Inc.", model = "DELL U2723QE" },
    mode = "3840x2160@60.000",
    position = { x = 1600, y = -200 },
    scale = 1.5,
    transform = "normal", -- "normal" | "90" | "180" | "270" | "flipped" | "flipped-90" ...
})
```

### Multi-Monitor Keybindings & Runtime Protocol

- **Directional Monitor Navigation**: Bind `koma.act.monitor.focus_left()`, `focus_right()`, `focus_up()`, `focus_down()`, and `koma.act.window.move_to_monitor_left/right/up/down()` (or `koma.act.monitor.focus("DP-1")`).
- **`wlr-output-management` (`zwlr_output_manager_v1`)**: Graphical tools such as `kanshi` and `wdisplays` can inspect heads, test modes/scales/positions (`test`), and apply changes (`apply`) dynamically.
- **Per-Monitor `wp-fractional-scale-v1` + `wp-viewporter`**: Clients receive exact fractional scale factors (`scale = 1.25`, `1.5`, `1.6`, or `"auto"`) without blurry X11-style integer up-scaling.

## Keyboard, Pointer, Touchpad & Tablet (`koma.input`)

```lua
koma.input({
    mod_key = "auto",             -- "auto" (Super on TTY, Alt in Winit) | "Super" | "Alt" | ...
    inherit_default_binds = true, -- Keep built-in defaults and override in-place
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

## Multi-Finger Gestures (`koma.gesture`)

```lua
koma.gesture({
    fingers = 3,
    direction = "horizontal", -- "left"|"right"|"up"|"down"|"horizontal"|"vertical"|"pinch_in"|"pinch_out"
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
