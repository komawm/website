# Lua Sandbox, Layouts & Appearance

Koma evaluates `~/.config/koma/init.lua` inside an embedded, stackless Lua 5.4 VM powered by pure-Rust [Phodopus](https://github.com/Xuepoo/phodopus) (`koma-lua`).

![Koma horizontal scrolling workspace layout preview](/placeholders/koma-scrolling.webp "Scrolling strip layout with multi-column focus and status bar.")

## Phodopus Sandbox Quotas & Atomic Hot-Reload

- **Deterministic Resource Caps**: Each Lua evaluation enforces monotonic instruction fuel and a strict heap cap (`DEFAULT_HEAP_LIMIT_BYTES = 4 MiB`), with `io`, `os`, `debug`, and `package` OS libraries stripped so a broken config loop cannot hang the Wayland display server.
- **Shadow-Registry Swap**: Running `komactl reload` (or editing `init.lua` via the built-in watcher, or `Mod + Shift + R`) evaluates the entire script in a fresh shadow sandbox first. If any syntax error, fuel exhaustion, or invalid rule regex occurs, the live compositor state stays untouched.
- **Pre-Check Offline**: Run `komactl validate` before reloading to inspect parsed monitors, workspaces, binds, gestures, rules, and macros.

## Layout Engines (`koma.layout`, `koma.workspace`, `koma.dwindle`, `koma.scrolling`)

Headed workspaces default to `"dwindle"`, while `"scrolling"`, `"deck"`, and `"bsp"` can be chosen globally or per workspace:

```lua
koma.layout("dwindle") -- "dwindle" | "scrolling" | "deck" | "bsp"

koma.dwindle({
    force_split = 0,         -- 0 = follow pointer/aspect, 1 = left/top, 2 = right/bottom
    preserve_split = true,
    smart_split = true,
    default_split_ratio = 1.0,
    inner_gap = 6,
    outer_gap = 10,
})

koma.scrolling({
    preset_column_widths = { 0.3333, 0.5, 0.6667 },
    default_column_width = { proportion = 0.5 },
    default_column_display = "normal", -- "normal" | "tabbed"
    center_focused_column = "never",   -- "never" | "always" | "on_overflow"
    camera_damping_ratio = 1.0,
    camera_stiffness = 550.0,
    inner_gap = 8,
    outer_gap = 12,
    edge_auto_scroll = { enabled = true, trigger_width = 48, delay_ms = 120, max_speed = 900 },
})

koma.workspace({ name = "1", layout = "dwindle", gaps_in = 6, gaps_out = 10 })
koma.workspace({ name = "2", layout = "scrolling" })
koma.workspace({ name = "agent:work", presentation = "headless", layout = "deck" })
```

## Appearance & Spring Physics (`koma.appearance`)

All fields in `koma.appearance({...})` carry typed defaults and accept incremental overrides:

```lua
koma.appearance({
    corner_radius = 10,
    border = {
        enabled = true,
        width = 2.0,
        active_color = "#7aa2f7",
        inactive_color = "#3b4261",
        agent_leased_color = "#9ece6a",  -- Distinct border when an agent holds an Epoch lease
        human_preempt_color = "#f7768e", -- Flash on Mod + G human preemption
    },
    focus_ring = { enabled = false, width = 2.0, active_color = "#7dcfff", inactive_color = "#24283b" },
    shadow = {
        enabled = true,
        range = 18,
        render_power = 3,
        sharp = false,
        color = "#00000073",
        inactive_color = "#00000040",
        offset_x = 0.0,
        offset_y = 4.0,
        scale = 1.0,
    },
    dim = { dim_inactive = false, dim_strength = 0.15, brightness = 1.0, contrast = 1.0 },
    blur = {
        enabled = true,
        size = 6,
        passes = 2,
        noise = 0.015,
        contrast = 1.0,
        brightness = 1.0,
        vibrancy = 0.18,
        xray = false,
        ignore_opacity = false,
    },
    animations = {
        enabled = true,
        damping_ratio = 0.9,
        stiffness = 420.0,
        epsilon = 0.5,
        open_scale_from = 0.92,
        close_scale_to = 0.92,
    },
})
```

## Incremental Keybinds, Unbinds & Modes

By default `inherit_default_binds = true` loads the built-in keymap and lets `koma.bind(...)` override specific chords in-place while `koma.unbind(chord)` removes unwanted defaults:

```lua
koma.unbind("Mod + Return")
koma.bind("Mod + Return", koma.act.spawn({ "foot" }), { desc = "Launch foot" })
koma.bind("Mod + O", koma.act.overview.toggle(), { desc = "Toggle koma-overview" })
```

| Helper | Purpose |
| :--- | :--- |
| `koma.env(key, val)` | Exports an environment variable to child processes spawned by Koma |
| `koma.mode(name, spec)` | Declares submaps / resize modes entered via `koma.act.mode` |
| `koma.on(event, fn)` | Subscribes fuel-metered Lua callbacks to compositor lifecycle events |
| `koma.macro.define(spec)` | Registers zero-token parameterized GUI macros exposed dynamically to `koma-mcp` |

## Dynamic State Snapshots (`MacroContext`) & Lifecycle Hooks (`koma.on`)

Lua keybind callbacks and `koma.on` listeners receive a sandboxed `ctx` (`MacroContext`) backed by an immutable `DesktopQuerySnapshot` captured in Ring 0 before dispatch (protected window titles are redacted to `"[protected]"` and headless `Offscreen` windows stay isolated from human queries):

- `ctx:focused_window()` — Focused window table (`id`, `app_id`, `title`, `workspace`, `floating`, `fullscreen`, `focused`) or `nil`.
- `ctx:windows()` / `ctx:outputs()` / `ctx:workspaces()` — Read-only tables of scoped windows, outputs, and workspaces.
- `ctx:dispatch(action)` — Queues any compiled `koma.act.*` action (for example `koma.act.window.focus(win_id)` or `koma.act.workspace.set_layout(mode, workspace?)`; nested Lua callbacks are rejected).

Canonical Ring 0 `koma.on(event_name, function(ctx, event) ... end)` hooks (re-entrancy depth capped at `4`): `"compositor.start"`, `"config.reloaded"`, `"window.mapped"`, `"window.closed"`, `"window.focused"`, `"workspace.focused"`, and `"output.changed"`.

```lua
-- Run-or-Raise terminal binding
koma.bind("Mod + Shift + T", function(ctx)
    for _, win in ipairs(ctx:windows()) do
        if win.app_id == "foot" then
            ctx:dispatch(koma.act.window.focus(win.id))
            return
        end
    end
    ctx:dispatch(koma.act.spawn({ "foot" }))
end, { desc = "Focus foot or launch it" })

-- Switch to scrolling strip layout automatically on ultrawide displays
koma.on("output.changed", function(ctx, ev)
    if ev.width and ev.width >= 3440 then
        ctx:dispatch(koma.act.workspace.set_layout("scrolling"))
    end
end)
```
