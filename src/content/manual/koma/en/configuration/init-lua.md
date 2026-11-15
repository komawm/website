# Layouts, Appearance & Overrides

Koma executes `~/.config/koma/init.lua` inside an embedded stackless Lua 5.4 VM powered by [Phodopus](https://github.com/Xuepoo/phodopus) with deterministic instruction fuel and memory ceilings—preventing a broken config loop from ever freezing your Wayland display server.

![Koma horizontal scrolling workspace layout preview](/placeholders/koma-scrolling.webp "Scrolling strip layout with multi-column focus and status bar.")

## Global & Per-Workspace Tri-Modal Layouts

Headed workspaces default to `"dwindle"`, while Niri-inspired horizontal `"scrolling"` strips (supporting `preset_column_widths`, multi-tile vertical column stacking, `consume_or_expel_window_left/right`, and 3-finger touchpad momentum) can be enabled globally or per workspace:

```lua
-- ~/.config/koma/init.lua
koma.layout("dwindle")

koma.workspace({
  name = "2",
  layout = "scrolling",
  gaps = { inner = 8, outer = 14 },
})

koma.scrolling({
  preset_column_widths = { 0.333, 0.5, 0.667 },
  center_focused_column = "on_overflow",
})
```

## Typed Appearance, Dual-Kawase Blur & Springs

`koma.appearance({...})` configures active/agent-leased border indicators (`#CBDCEB` ice-blue accent), 5-tap downsample / 8-tap upsample Dual-Kawase blur, and critically damped spring animations:

```lua
koma.appearance({
  corner_radius = 12,
  border = {
    enabled = true,
    width = 2,
    active_color = "#CBDCEB",
    inactive_color = "#2A394D",
    agent_leased_color = "#7AA8D6",
    human_preempt_color = "#E07A5F",
  },
  blur = {
    enabled = true,
    passes = 3,
    radius = 6.0,
  },
  animations = {
    enabled = true,
    stiffness = 420.0,
    damping_ratio = 1.0,
  },
})
```
