# Session Launch & Default Keymap

> [!NOTE]
> When `inherit_default_binds = true` (enabled by default in `koma.input`), Koma loads a familiar Hyprland-compatible default keybinding table out of the box. Calling `koma.bind(...)` overrides matching chords in place without wiping unaffected defaults.

## Nested Window & TTY Modes

During evaluation or theme tuning, start Koma inside an existing Wayland desktop (such as Hyprland or Niri) using `--winit`, or launch inside an isolated VM seat using `--tty`:

```bash
# Validate configuration syntax & Phodopus budget before launch
komactl validate ~/.config/koma/init.lua

# Run nested inside an existing Wayland session
koma --winit --config ~/.config/koma/init.lua

# Run in an isolated VM TTY and spawn foot terminal
koma --tty --spawn foot
```

## Built-in Default Keybindings

| Chord | Default Action | Notes |
| :--- | :--- | :--- |
| `Mod + Return` | Spawn terminal (`foot`) | Overridable via `koma.bind` |
| `Mod + Q` | Close focused window | Graceful Wayland `toplevel.close` |
| `Mod + H / J / K / L` | Focus directional neighbor | Works across Dwindle & Scrolling columns |
| `Mod + Shift + H / J / K / L` | Move window or column | Preserves deterministic tree state |
| `Mod + V` / `Mod + F` | Toggle floating / fullscreen | Per-window state transition |
| `Mod + S` | Toggle `special` scratchpad | Overlay workspace layer |
| `Mod + G` | Human preemption barrier | Immediately revokes active agent Epoch lease |
| `Mod + 1..9` | Switch workspace `1..9` | Per-monitor workspace sets |
