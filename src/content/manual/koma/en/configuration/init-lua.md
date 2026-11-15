# Layouts, Appearance & init.lua

Koma reads its configuration from `~/.config/koma/init.lua` (or `$XDG_CONFIG_HOME/koma/init.lua`, falling back to `/etc/xdg/koma/init.lua`). You can override the config path with `KOMA_CONFIG` or `koma -c <path>`, and split larger setups into modules under `~/.config/koma/lua/` loaded via `require(...)`.

![Koma scrolling workspace layout and Lua configuration](/media/koma-scrolling.webp "Scrolling strip layout with multi-column focus and status bar.")

## Validation & Safe Reloading

- **Sandboxed Evaluation**: Lua 5.4 scripts run with a `4 MiB` heap limit and an instruction cap, with `io`, `os`, `debug`, and `package` OS libraries disabled so a broken loop cannot hang the compositor.
- **Offline Check**: Run `komactl validate` after editing `~/.config/koma/init.lua` to verify syntax, regexes, and gestures before reloading:
  ```bash
  komactl validate ~/.config/koma/init.lua
  ```
- **Atomic Reload**: Save `init.lua` (watched automatically), run `komactl reload`, or press `Mod + Shift + R`. Koma evaluates the updated file in isolation first; if anything fails, your active windows, workspaces, and binds stay intact. Run `komactl config-status` to inspect the active path and any reload error.

## Layouts & Workspaces (`koma.layout`, `koma.dwindle`, `koma.scrolling`, `koma.workspace`)

Headed workspaces default to `"dwindle"`. You can set `"dwindle"`, `"scrolling"`, `"deck"` (monocle active window + background stash), or `"bsp"` globally or per workspace in `~/.config/koma/init.lua`:

```lua
koma.layout("dwindle") -- "dwindle" | "scrolling" | "deck" | "bsp"

koma.dwindle({
    force_split = 0,         -- 0 = auto by aspect ratio, 1 = left/top, 2 = right/bottom
    preserve_split = false,
    smart_split = false,
    default_split_ratio = 1.0,
    inner_gap = 6,
    outer_gap = 10,
})

koma.scrolling({
    preset_column_widths = { 1 / 3, 0.5, 2 / 3 },
    default_column_width = { proportion = 0.5 },
    default_column_display = "normal", -- "normal" | "tabbed"
    center_focused_column = "never",   -- "never" | "always" | "on_overflow"
    camera_damping_ratio = 1.0,
    camera_stiffness = 800.0,
    inner_gap = 8,
    outer_gap = 10,
    edge_auto_scroll = { enabled = true, trigger_width = 30, delay_ms = 100, max_speed = 1500 },
})

koma.workspace({ name = "1", layout = "dwindle", gaps = { inner = 6, outer = 10 } })
koma.workspace({ name = "2", layout = "scrolling" })
koma.workspace({ name = "agent:work", presentation = "headless", layout = "deck" })
```

`koma.workspace({...})` also accepts `preferred_output` (connector name such as `"eDP-1"`) and shorthand `gaps_in` / `gaps_out` integer fields.

## Appearance (`koma.appearance`)

All fields in `koma.appearance({...})` have built-in defaults and only need to be specified when you want to override them:

```lua
koma.appearance({
    corner_radius = 10,
    border = {
        enabled = true,
        width = 2.0,
        active_color = "#58a6ff",
        inactive_color = "#30363d",
        agent_leased_color = "#d2a8ff",  -- Border color while an agent holds an Epoch lease
        human_preempt_color = "#f0883e", -- Border flash on Mod + G human takeover
    },
    focus_ring = { enabled = false, width = 2.0, active_color = "#58a6ff", inactive_color = "#30363d" },
    shadow = {
        enabled = true,
        range = 16,
        render_power = 3,
        sharp = false,
        color = "#00000073",
        offset_x = 0.0,
        offset_y = 4.0,
        scale = 1.0,
    },
    dim = { dim_inactive = false, dim_strength = 0.15, brightness = 1.0, contrast = 1.0 },
    blur = {
        enabled = true,
        size = 6,
        passes = 3,
        noise = 0.0117,
        contrast = 0.8916,
        brightness = 0.8172,
        vibrancy = 0.1696,
        xray = true,
        ignore_opacity = false,
    },
    animations = {
        enabled = true,
        damping_ratio = 1.0,
        stiffness = 800.0,
        epsilon = 0.0005,
        open_scale_from = 0.88,
        close_scale_to = 0.92,
    },
})
```

See [Animations, Borders & Blur](/docs/configuration/animations-and-rice/) for gradient borders, custom curves, and per-channel animation styles, and [Editor Completion (koma-types)](/docs/configuration/lua-types/) for LuaLS autocompletion.

## Keybinds, Modes & Helpers

By default, `inherit_default_binds = true` loads Koma's built-in keymap. `koma.bind(...)` overrides matching chords in place, and `koma.unbind(chord)` removes unwanted defaults:

```lua
koma.unbind("Mod + Return")
koma.bind("Mod + Return", koma.act.spawn({ "foot" }), { desc = "Launch foot" })
koma.bind("Mod + O", koma.act.overview.toggle(), { desc = "Toggle koma-overview" })
```

| Helper | Purpose |
| :--- | :--- |
| `koma.env(key, val)` | Exports an environment variable to child processes spawned by Koma |
| `koma.mode(name, spec)` | Defines a submap mode entered via `koma.act.mode.enter(name)` and left via `koma.act.mode.exit()` |
| `koma.on(event, fn)` | Registers a Lua callback on compositor lifecycle events |
| `koma.macro.define(spec)` | Registers a parameterized automation macro exposed to `koma-mcp` |

## Dynamic Callbacks & Event Hooks (`MacroContext`, `koma.on`)

Keybind functions and `koma.on` listeners receive a read-only snapshot context `ctx` (`MacroContext`). Protected windows have both `app_id` and `title` redacted to `"[protected]"`, and windows on headless workspaces stay isolated from normal user queries:

- `ctx:focused_window()` — Focused window table (`id`, `app_id`, `title`, `workspace`, `floating`, `fullscreen`, `focused`) or `nil`.
- `ctx:windows()` / `ctx:outputs()` / `ctx:workspaces()` — Read-only lists of visible windows, outputs, and workspaces.
- `ctx:dispatch(action)` — Queues any compiled `koma.act.*` action (such as `koma.act.window.focus(win_id)` or `koma.act.workspace.set_layout(mode, workspace?)`; nested Lua callbacks inside `dispatch` are rejected).

Supported `koma.on(event_name, function(ctx, event) ... end)` events (re-entrancy depth capped at `4`): `"compositor.start"`, `"config.reloaded"`, `"window.mapped"`, `"window.closed"`, `"window.focused"`, `"workspace.focused"`, and `"output.changed"`.

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
