# Wayland Protocols, Portals & IME

Koma implements a broad Wayland protocol matrix directly on top of [Smithay](https://github.com/Smithay/smithay), enforcing sandbox filtering (`ClientState { restricted: true }`) for `wp_security_context_manager_v1` and `komactl sandbox` jailed sockets.

## Shell, Surface & Output Protocols

| Protocol / Global | Purpose & Client Ecosystem | Security / Sandbox Rule |
| :--- | :--- | :--- |
| `xdg_shell` (`xdg_wm_base`) | Desktop toplevels, popups, fullscreen, SSD negotiation (`zxdg_decoration_manager_v1`) | Jailed clients stay confined to their `Headless` workspace |
| `zwlr_layer_shell_v1` | Bars (`waybar`), notifications (`swaync`), launchers (`fuzzel`/`rofi`), `koma-overview` | Exclusive zones shrink workspace workarea cleanly; filtered out for sandboxed clients |
| `ext_session_lock_v1` | Fail-closed lockscreens (`swaylock`, `hyprlock`) | Masks rendered frames, blocks `grim` screencopy (`failed`), defers `xdg-activation` |
| `zwlr_output_manager_v1` | Dynamic multi-monitor inspection, `test`, and `apply` (`kanshi`, `wdisplays`) | Restricted from sandboxed/jailed clients |
| `zwlr_output_power_manager_v1` & `zwlr_gamma_control_manager_v1` | DPMS sleep/wake (`wlopm`) and night-light / color ramps (`wlsunset`, `gammastep`) | Filtered out for restricted clients |
| `wp_fractional_scale_manager_v1` & `wp_viewporter` | Sharp fractional HiDPI scaling (`1.25`, `1.5`, `1.6`, `"auto"`) | Per-output scale delivery |
| `xdg_activation_v1` & `xdg_toplevel_icon_v1` | Cross-client focus tokens (`10 s` TTL) and validated window icons | Jail-scoped token validation & lock-screen deferral |
| `zwlr_foreign_toplevel_manager_v1` & `ext_foreign_toplevel_list_v1` | Taskbar / panel window list & activate/minimize/close controls | Filtered from restricted clients & guarded during session lock |

## Screencopy & `xdg-desktop-portal`

- **`zwlr_screencopy_manager_v1` (v3)**: Supports SHM and DMA-BUF capture (`grim`, `wayshot`, `slurp`). Emits a single `buffer` / `linux_dmabuf` event per frame and honors `block_out_from = "screencopy"` / `"all"` blackout masks plus `ext-session-lock-v1` fail-closed denial.
- **`xdg-desktop-portal` (`koma.portal`)**: Routes `ScreenCast`, `Screenshot`, and `GlobalShortcuts` / `Inhibit` interfaces via `xdg-desktop-portal-wlr` / `xdg-desktop-portal-gtk` compatible portal configuration installed with Koma packages.

## Input Method (IME) & Virtual Input

Koma natively implements the modern Wayland CJK/IME stack without X11 dependencies:

- **`zwp_text_input_manager_v3`** (`text-input-v3`) for GTK4, Qt6, Chromium/Electron (`--enable-wayland-ime`), and native Wayland terminals.
- **`zwp_input_method_manager_v2`** (`input-method-v2`) and **`zwp_virtual_keyboard_manager_v1`** for **`Fcitx5`** and **`IBus`** candidate popups and preedit composition.
- **`zwp_pointer_constraints_v1` & `zwp_relative_pointer_manager_v1`**: Pointer lock/confine and raw relative motion for games and 3D viewports (broken cleanly on `ext-session-lock` or focus change).
- **`wl_touch` & `wp_cursor_shape_manager_v1`**: Multi-touch gesture/surface routing and compositor-rendered cursor themes.

> [!TIP]
> **IME vs. Agent Text Injection**: Interactive typing uses `Fcitx5` / `IBus` over `text-input-v3` + `input-method-v2`, whereas AI automation via `koma-agent.sock` uses `koma-seat`'s `TextInjectStrategy` (`xkb_keymap` / `text_input_v3` / `clipboard` Ctrl+Shift+V) so agent text never triggers human IME candidate popups.

## `wp_security_context_manager_v1` & Jailed Clients

Both Wayland-native `wp_security_context_manager_v1` (used by Flatpak / `bubblewrap`) and `komactl sandbox` attach `ClientState { restricted: true }`. Restricted connections cannot bind privileged globals (`zwlr_layer_shell_v1`, `zwlr_screencopy_manager_v1`, `zwlr_data_control_manager_v1`, `zwp_virtual_keyboard_manager_v1`, `ext_session_lock_manager_v1`, `zwlr_output_manager_v1`, or `wp_security_context_manager_v1` itself).
