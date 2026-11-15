# Troubleshooting

Common fixes for seat/DRM startup, software rendering, broken Lua configs, IPC sockets, IME input, and XWayland.

## 1. `koma --tty` Fails to Open Seat or DRM Master

**Symptom**: `libseat` fails to acquire a seat or DRM reports `Permission denied` / `Not master`.

- **Check the active seat service**: On systems without `systemd-logind`, verify `seatd` is running (`systemctl status seatd` on Arch/Debian or `service seatd status` on FreeBSD) and confirm your user belongs to `seat`, `video`, and `input` (`id -nG`).
- **Do not launch `--tty` inside a running graphical session**: Another compositor already holds DRM master. Switch to a free Linux VT (`Ctrl+Alt+F3`) for `koma --tty`, or test nested with `koma --winit`.
- **QEMU/KVM VMs**: Use `-device virtio-vga` with `seatd` and Mesa `llvmpipe`.

## 2. Software Rendering (`llvmpipe`) vs. Hardware GPU

- Koma falls back to Mesa `llvmpipe` automatically when hardware DRM/GBM acceleration is unavailable (such as `virtio-vga` without Virgl).
- Check the active `GL Renderer` with `glxinfo -B`, `eglinfo`, or `RUST_LOG=info koma --winit`.
- On software rendering or slow GPUs, disable blur and shadows in `~/.config/koma/init.lua`:
  ```lua
  koma.appearance({ blur = { enabled = false }, shadow = { enabled = false } })
  ```

## 3. Recovering from a Broken `~/.config/koma/init.lua`

- Check config edits offline before reloading:
  ```bash
  komactl validate ~/.config/koma/init.lua
  ```
- `komactl reload` evaluates the script in an isolated sandbox first. Syntax errors, invalid rule regexes, or runaway loops fail safely without wiping your active binds and layout; run `komactl config-status` to inspect the error.
- If a bad config prevents startup, run `koma -c /dev/null` (or move `~/.config/koma/init.lua` aside) to boot with built-in defaults.

## 4. `komactl` Cannot Find `koma-admin.sock`

- Confirm `$XDG_RUNTIME_DIR` points to your `0700` runtime directory (for example `/run/user/1000`).
- List active instance directories:
  ```bash
  ls -la "$XDG_RUNTIME_DIR/koma/"
  ```
- If multiple instances are running, export `KOMA_INSTANCE_SIGNATURE=<dir_name>` before running `komactl`.

## 5. IME (`Fcitx5` / `IBus`) Not Appearing in Chromium / Electron

- Koma implements `text-input-v3`, `input-method-v2`, and `virtual-keyboard-v1`.
- Launch Chromium or Electron apps with native Wayland IME flags:
  ```bash
  chromium --ozone-platform=wayland --enable-wayland-ime
  ```
- Confirm `fcitx5 -d` is running in the same `WAYLAND_DISPLAY` session (started via `koma --session` or `koma.act.spawn`).

## 6. X11 App Fails to Start (`xwayland-satellite`)

- Ensure `xwayland-satellite` is installed in `$PATH` (or set `koma.xwayland({ enabled = true, path = "/path/to/xwayland-satellite" })`).
- With `isolate_agent_workspaces = true` (default), X11 clients are intentionally blocked from mapping on agent-leased headless workspaces.
