# Session Launch & Default Keymap

> [!TIP]
> Koma ships a complete Hyprland-compatible default keybinding table (`inherit_default_binds = true` by default). You can launch Koma with **no `~/.config/koma/init.lua`** and immediately open terminals, tile/float windows, switch workspaces, and reload config.

## Launch Modes (`koma [OPTIONS]`)

Koma parses CLI options purely before touching any display, seat, or DRM device:

| Flag | Backend / Behavior | Typical Use Case |
| :--- | :--- | :--- |
| `koma --winit` | Nested Wayland/X11 window via Smithay Winit backend | Testing config changes safely inside Hyprland, Sway, or GNOME |
| `koma --tty` | Direct bare-metal Linux VT via `libseat` (`seatd`/`logind`), `udev`, `DRM/KMS`, `libinput` | Standalone TTY launch or isolated QEMU/KVM `virtio-vga` smoke tests |
| `koma --session` | Login session mode (`koma-session`, `greetd`, `systemd --user`) | Imports `WAYLAND_DISPLAY`, `DISPLAY`, `XDG_CURRENT_DESKTOP=koma`, `XDG_SESSION_TYPE=wayland`, `KOMA_INSTANCE_SIGNATURE` into `systemd --user` & D-Bus, then signals `$NOTIFY_SOCKET`/`$NOTIFY_FD` `READY=1` |
| `koma --headless-check` | Structural CLI & version/state-machine check | CI, packaging, and post-install sanity verification |
| `--spawn <CMD>` | Spawns `<CMD>` once the compositor socket is ready | e.g. `koma --winit --spawn foot` or `koma --tty --spawn ghostty` |
| `-c, --config <PATH>` | Overrides `$XDG_CONFIG_HOME/koma/init.lua` | Testing alternate Lua configs |

> [!NOTE]
> When invoked with no backend flag, Koma chooses `--winit` if `WAYLAND_DISPLAY` or `DISPLAY` is set (except under `--session`, which targets the physical seat), otherwise `--tty`. Signals `SIGTERM`, `SIGINT`, and `SIGHUP` perform a clean teardown (exit `0`) and unlink runtime sockets.

## Built-In Default Keymap (`Mod` = `Super` on TTY / `Alt` when nested under Winit)

| Chord | Action | Description |
| :--- | :--- | :--- |
| `Mod + Return` | `spawn({ "ghostty" })` | Launch default terminal |
| `Mod + Q` | `window.close()` | Close focused window |
| `Mod + V` | `window.float_toggle()` | Toggle floating state |
| `Mod + F` | `window.fullscreen_toggle()` | Toggle fullscreen |
| `Mod + P` | `window.pseudotile_toggle()` | Toggle dwindle pseudotile |
| `Mod + E` | `dwindle.toggle_split()` | Toggle horizontal/vertical dwindle split |
| `Mod + H / J / K / L` | `focus.left/down/up/right()` | Move focus directionally |
| `Mod + Shift + H / J / K / L` | `window.move_direction(...)` | Move/swap window directionally |
| `Mod + 1..9` | `workspace.focus("1".."9")` | Switch to workspace `1`–`9` |
| `Mod + Shift + 1..9` | `window.move_to_workspace("1".."9")` | Move focused window to workspace `1`–`9` |
| `Mod + R` / `Mod + Ctrl + R` | `scrolling.switch_preset_column_width()` | Cycle scrolling column width forward / backward |
| `Mod + Ctrl + Shift + R` | `scrolling.switch_preset_window_height()` | Cycle scrolling window height preset |
| `Mod + C` / `Mod + M` | `scrolling.center_column()` / `maximize_column()` | Center or maximize scrolling column |
| `Mod + W` | `scrolling.toggle_column_tabbed_display()` | Toggle tabbed display inside scrolling column |
| `Mod + Comma` / `Mod + Period` | `scrolling.consume_window_into_column()` / `expel_window_from_column()` | Consume into or expel from column |
| `Mod + BracketLeft` / `BracketRight` | `scrolling.consume_or_expel_window_left/right()` | Consume/expel left or right |
| `Mod + S` / `Mod + Shift + S` | `scratchpad.toggle()` / `move_window()` | Toggle or move window to scratchpad |
| `Mod + Tab` | `overview.toggle()` | Toggle `koma-overview` spatial workspace Exposé |
| `Mod + MouseLeft` / `MouseRight` | `window.drag_move()` / `drag_resize()` | Drag-move or drag-resize window |
| `Mod + WheelScrollDown / Up` | `workspace.focus_next()` / `focus_prev()` | Cycle workspaces (`150 ms` cooldown) |
| `Mod + WheelScrollLeft / Right` | `deck.cycle_prev()` / `cycle_next()` | Cycle Deck/Stash stack (`150 ms` cooldown) |
| `Mod + Shift + R` | `compositor.reload_config()` | Hot-reload `init.lua` |
| `Mod + Shift + E` | `compositor.quit()` | Exit Koma cleanly |
| `Mod + G` (Compositor Barrier) | Instant Human Preemption | Immediately revokes active agent leases (`< 1 ms`, `4091 ERR_HUMAN_PREEMPTED`) |

## Workspace Overview & Kill-Switch (`Mod + Tab` / `Mod + G`)

- **Spatial Overview (`koma-overview`)**: Bound to `Mod + Tab` by default (you can also bind `koma.bind("Mod + O", koma.act.overview.toggle())` in `init.lua`). Renders an interactive `wlr-layer-shell` spatial grid of active workspaces and windows via `koma-admin.sock` (`scene.inventory`).
- **Human Preemption (`Mod + G`)**: Pressing `Mod + G` or generating physical keyboard/pointer activity raises the preemption barrier on agent-leased workspaces so AI automation cannot fight your cursor.

## Legacy X11 Apps via `xwayland-satellite`

Koma avoids embedding `Xwayland` directly inside Ring 0. Instead, configure rootless [`xwayland-satellite`](https://github.com/Supreeeme/xwayland-satellite) in `~/.config/koma/init.lua`:

```lua
koma.xwayland({
    enabled = true,
    -- path = "/usr/bin/xwayland-satellite", -- optional explicit path
    isolate_agent_workspaces = true,        -- keep X11 isolated from agent workspaces
})
```
