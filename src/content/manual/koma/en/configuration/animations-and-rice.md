# Animations, Borders & Blur

Koma configures window animations, rounded corners, gradient borders, shadows, inactive dimming, and Dual Kawase blur inside `koma.appearance({...})` in `~/.config/koma/init.lua`, with optional per-window overrides through `koma.rule.window({...})`.

## Solvers & Custom Curves (`koma.bezier`, `koma.spring`)

- **Springs (`solver = "spring"` or `"analytical_spring"`)**: Controlled by `damping_ratio` (default `1.0` = no overshoot; `< 1.0` adds bounce) and `stiffness` (default `800.0`), or explicit `mass` (`1.0`) and `damping`, plus rest threshold `epsilon` (default `0.0005`). Retargeting a window mid-motion preserves its current velocity.
- **Cubic Beziers (`koma.bezier(name, x1, y1, x2, y2, duration_ms)`)**: Standard 4-point easing curves (`x1, x2` in `0.0..1.0`; `y1, y2` in `-2.0..3.0` for overshoot; `duration_ms` in `1..5000`). Also accepts table syntax `{ points = { x1, y1, x2, y2 }, duration_ms = ... }`.
- **Custom Springs (`koma.spring(name, spec)`)**: Registers a named spring with `mass`, `damping` or `damping_ratio`, `stiffness`, and `epsilon`.

### Built-In Curve Presets

| Preset | Definition | Character |
| :--- | :--- | :--- |
| `linear` | `[0.0, 0.0, 1.0, 1.0]`, `200 ms` | Constant speed |
| `ease_out` / `default` | `[0.22, 1.0, 0.36, 1.0]`, `250 ms` | Crisp deceleration |
| `md3_decel` | `[0.05, 0.7, 0.1, 1.0]`, `280 ms` | Material Design 3 deceleration |
| `overshot` | `[0.05, 0.9, 0.1, 1.1]`, `280 ms` | Slight pop overshoot |
| `fluent` | `[0.1, 0.9, 0.2, 1.0]`, `220 ms` | Smooth Fluent curve |
| `snappy_spring` | `mass = 1.0, damping = 36.0, stiffness = 420.0` | Tight responsive spring |
| `bouncy_spring` | `mass = 1.0, damping = 20.0, stiffness = 320.0` | Playful spring overshoot |
| `gentle_spring` | `mass = 1.2, damping = 28.0, stiffness = 180.0` | Soft relaxed motion |
| `instant` / `none` | Immediate snap | Disables animation for that channel |

## Per-Channel Animation Configuration

Assign curves and transition styles per channel (`windows_open` / alias `windows_in`, `windows_close` / alias `windows_out`, `windows_move`, `fade`, `border`, and `workspaces`):

```lua
koma.bezier("rice_pop", 0.05, 0.9, 0.1, 1.1, 260)
koma.spring("glide", { mass = 1.0, damping_ratio = 0.82, stiffness = 360.0 })

koma.appearance({
    animations = {
        enabled = true,
        solver = "spring",
        windows_open = { enabled = true, curve = "rice_pop", style = "popin 85%" },
        windows_close = { enabled = true, curve = "glide", style = "slide" },
        windows_move = { enabled = true, curve = "glide" },
        fade = { enabled = true, curve = "md3_decel", duration_ms = 180 },
        border = { enabled = true, curve = "snappy_spring" },
        workspaces = { enabled = true, curve = "overshot", style = "slidevert" },
    },
})
```

- **Window open/close styles**: `"popin"` (e.g. `"popin 85%"`), `"slide"` (nearest viewport edge, or `"slide top"`, `"slide bottom"`, `"slide left"`, `"slide right"`), `"gnomed"`, and `"fade"`.
- **Workspace switch styles**: `"slide"`, `"slidevert"`, `"fade"`, and `"none"` (workspace animations are automatically skipped in headless captures and screencasts).

## Gradient Borders, Blur & Window Overrides

Set global rounded corners (`corner_radius`), multi-stop rotating gradient borders, and Dual Kawase blur in `koma.appearance({...})`, then tune individual applications with `koma.rule.window({...})`:

```lua
koma.appearance({
    corner_radius = 12,
    border = {
        enabled = true,
        width = 2.0,
        active_color = "#7aa2f7ff",
        active_color_end = "#bb9af7ff",
        inactive_color = "#292e42cc",
        inactive_color_end = "#1f2335cc",
        gradient_angle = 45.0,
        gradient_rotate_rpm = 6.0,
    },
    blur = {
        enabled = true,
        passes = 3,
        size = 6,
    },
})

koma.rule.window({
    name = "terminal-rice",
    matches = { { app_id = "^foot$" } },
    opacity = 0.96,
    inactive_opacity = 0.84,
    animation = "popin 88%",
    border_color = "#7dcfffff",
})

koma.rule.window({
    name = "video-player-clean",
    matches = { { app_id = "^mpv$" } },
    no_blur = true,
    no_shadow = true,
    inactive_opacity = 1.0,
})
```

## Pointer Kinematics in Macros (`ctx:move_to` / `ctx:drag`)

Pointer movement inside `koma.macro.define(...)` accepts a `kinematics` table with `profile` set to `"instant"`, `"minimum_jerk"` (default), `"spring"` (aliases `"hooke"`, `"hooke_spring"`), or `"bezier"` (or a named `curve`):

```lua
koma.macro.define({
    id = "canvas.spring_pan_drag",
    app_id = ".*",
    description = "Middle-mouse pan drag with smooth spring pointer motion",
    params = {
        dx = { type = "int", default = 180 },
        dy = { type = "int", default = -90 },
    },
    run = function(ctx, args)
        ctx:drag({
            button = "middle",
            from = { anchor = "center", x = 0, y = 0 },
            to = { anchor = "center", x = args.dx, y = args.dy },
            hold_before_move_ms = 25,
            kinematics = {
                profile = "spring",
                mass = 1.0,
                damping = 22.0,
                stiffness = 340.0,
                epsilon = 0.01,
            },
            hold_before_release_ms = 20,
        })
    end,
})
```
