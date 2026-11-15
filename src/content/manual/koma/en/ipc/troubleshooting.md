# Diagnostics & Troubleshooting FAQ

This guide covers common startup, DRM/seat, rendering, Lua config, IME, and XWayland issues when testing or running Koma.

## 1. `koma --tty` Fails to Open Seat or DRM Master

**Symptom**: `libseat` fails to acquire a seat or DRM reports `Permission denied` / `Not master`.

- **Check active seat provider**: On systems without `systemd-logind`, ensure `seatd` is running (`systemctl status seatd` on Arch/Debian or `service seatd status` on FreeBSD) and your user is in the `seat` / `video` / `input` groups (`id -nG`).
- **Avoid running `koma --tty` inside a graphical terminal**: Launching `--tty` from inside an existing compositor that owns DRM master will conflict. Switch to a spare Linux VT (`Ctrl+Alt+F3`) or run `koma --winit` inside your current session.
- **Inside QEMU/KVM**: Pass `-device virtio-vga` (verified with `seatd` + Mesa `llvmpipe`).

## 2. Software Rendering (`llvmpipe`) vs. Hardware GPU EGL/GBM

- Koma supports automatic Mesa `llvmpipe` fallback when hardware DRM/GBM acceleration is unavailable (such as virtualized `virtio-vga` without Virgl).
- Check `glxinfo -B` / `eglinfo` or `RUST_LOG=info koma --winit` logs to inspect the active `GL Renderer`.
- On low-bandwidth GPUs or software rendering, disable multipass Dual-Kawase blur in `~/.config/koma/init.lua`:
  ```lua
  koma.appearance({ blur = { enabled = false }, shadow = { enabled = false } })
  ```

## 3. Recovering from a Broken `init.lua`

- Validate edits offline before reloading:
  ```bash
  komactl validate ~/.config/koma/init.lua
  ```
- Because `komactl reload` evaluates scripts in an isolated Phodopus shadow registry first, a broken `init.lua` will return an error in `komactl config-status` without crashing or wiping your active binds.
- If a bad config prevents startup, run `koma -c /dev/null` (or move `~/.config/koma/init.lua` aside) to boot with built-in Hyprland-compatible defaults.

## 4. `komactl` Cannot Find `koma-admin.sock`

- Verify `XDG_RUNTIME_DIR` is set to your `0700` user runtime directory (e.g. `/run/user/1000`).
- Inspect active sockets:
  ```bash
  ls -la "$XDG_RUNTIME_DIR/koma/"
  ```
- If multiple nested instances are running, export `KOMA_INSTANCE_SIGNATURE=<dir_name>` before running `komactl`.

## 5. IME (`Fcitx5` / `IBus`) Not Popping Up in Chromium / Electron

- Koma exposes `text-input-v3`, `input-method-v2`, and `virtual-keyboard-v1`.
- Launch Chromium/Electron apps with Wayland IME flags:
  ```bash
  chromium --ozone-platform=wayland --enable-wayland-ime
  ```
- Ensure `fcitx5 -d` is running inside the same Wayland session (`WAYLAND_DISPLAY` imported via `koma --session` or `koma.act.spawn`).

## 6. X11 App Does Not Start (`xwayland-satellite`)

- Confirm `xwayland-satellite` is installed in `$PATH` (or configure `koma.xwayland({ enabled = true, path = "/path/to/xwayland-satellite" })`).
- Remember that `isolate_agent_workspaces = true` prevents X11 clients from mapping on agent-leased headless workspaces by design.
