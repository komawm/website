# Hooke Spring Physics, Bezier Curves & Ricing

Koma combines a deterministic **Damped Hooke's Law Semi-Implicit Euler** spring solver with custom **Cubic Bezier** curves, per-channel animation styles, Dual Kawase frosted blur, rotating gradient borders, and per-window visual ricing rules in `init.lua`.

## Damped Hooke's Law Semi-Implicit Euler Solver

By default (`solver = "spring"`), Koma integrates animated window positions, sizes, opacity, focus interpolation, and workspace offsets using the second-order damped spring ODE:

$$m\ddot{x} + c\dot{x} + k(x - x_{\text{target}}) = 0$$

Given mass $m \ge 0.01$, damping $c \ge 0.0$, stiffness $k \ge 1.0$, and convergence threshold $\epsilon \ge 10^{-6}$, each sub-step advances velocity first and position second (Symplectic / Semi-Implicit Euler):

$$v_{t+\Delta t} = v_t + \frac{-k(x_t - x_{\text{target}}) - c v_t}{m}\Delta t$$

$$x_{t+\Delta t} = x_t + v_{t+\Delta t}\Delta t$$

When configuring via dimensionless damping ratio $\zeta$ instead of physical damping $c$, Koma computes $c = 2\zeta\sqrt{mk}$ automatically.

### Sub-Stepping and Dynamic Momentum Preservation

To remain numerically stable across frame drops and high-refresh monitors without allocating per-frame heap buffers ($O(1)$ time, $O(1)$ space per track):

- Total frame delta is clamped to $0.0 \le \Delta t \le 0.1\,\text{s}$ and split into $N = \lceil \Delta t / (1/240) \rceil \in [1, 24]$ equal sub-steps.
- When a target changes mid-flight (dynamic window drag, hover focus switch, tile reflow, or rapid workspace switch), `retarget` updates $x_{\text{target}}$ while preserving live position $x$ and velocity $v$.
- A track snaps to rest when $|x - x_{\text{target}}| \le 50\epsilon$ and $|v| \le 250\epsilon$.

You can also choose `solver = "analytical_spring"` globally or per curve when a closed-form analytical spring curve is desired.

## Custom Cubic Bezier Curves (`koma.bezier`)

Register named Bezier curves with `koma.bezier(name, x1, y1, x2, y2, duration_ms)` or table syntax:

- Control point $x_1, x_2$ are clamped to $[0.0, 1.0]$, while $y_1, y_2$ accept $[-2.0, 3.0]$ for expressive overshoot curves such as `[0.05, 0.9, 0.1, 1.1]`.
- Duration is clamped to $1 \le d \le 5000\,\text{ms}$.
- Koma solves $X(u) = \tau$ via 8 Newton-Raphson iterations with a 12-iteration bisection fallback ($O(1)$ time, $O(1)$ space) and computes exact chain-rule velocity $\dot{x}(t)$ so Bezier tracks hand off continuously into spring momentum.

## Named Curve Presets & Per-Channel Configuration

Built-in presets resolved by name include:

| Preset | Definition | Character |
| --- | --- | --- |
| `linear` | `[0.0, 0.0, 1.0, 1.0]` | Constant velocity |
| `ease_out` / `default` | `[0.22, 1.0, 0.36, 1.0]` | Crisp deceleration |
| `md3_decel` | `[0.05, 0.7, 0.1, 1.0]` | Material Design 3 standard |
| `overshot` | `[0.05, 0.9, 0.1, 1.1]` | Slight Hyprland-style pop overshoot |
| `fluent` | `[0.1, 0.9, 0.2, 1.0]` | Fluent motion curve |
| `snappy_spring` | `m = 1.0, c = 36.0, k = 420.0` | Tight responsive spring |
| `bouncy_spring` | `m = 1.0, c = 20.0, k = 320.0` | Playful spring overshoot |
| `gentle_spring` | `m = 1.2, c = 28.0, k = 180.0` | Soft relaxed motion |

Register custom springs and Beziers cleanly, then bind per-channel curves and styles (`windows_open` / alias `windows_in`, `windows_close` / alias `windows_out`, `windows_move`, `fade`, `border`, `workspaces`):

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

Supported `windows_open` / `windows_close` styles are `popin` (`popin 85%`), `slide` (nearest viewport edge, or explicit `slide top|bottom|left|right`), `gnomed`, and `fade`. Supported `workspaces` styles are `slide`, `slidevert`, `fade`, and `none` (workspace transitions are automatically skipped during headless capture/screencasts).

## Gradient Borders, Dual Kawase Blur & Window Rice Rules

Combine GLES2-compatible multi-stop gradient borders and Dual Kawase frosted blur with per-window rice overrides:

```lua
koma.appearance({
  border = {
    width = 2,
    radius = 12,
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

All `WindowAnimationTable` focus transitions interpolate border endpoints smoothly via `focus_factor` $\in [0, 1]$ without requiring external shader plugins.
