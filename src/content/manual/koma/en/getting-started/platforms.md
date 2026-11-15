# Hardware & Platforms

Koma and [Jiku](/jiku/) are built on portable POSIX and Wayland primitives (`libseat`/`seatd`, `libinput`, `SCM_RIGHTS` file-descriptor passing, and an embedded Lua 5.4 runtime) so support extends across `x86_64`, `aarch64` (`ARM64`), MacBook Linux hardware, and BSD operating systems.

> [!NOTE]
> **Verification Scope**: At `v0.0.1`, `x86_64` Arch Linux (`koma --tty` + `seatd` + `llvmpipe` software KMS) and FreeBSD `15.1-RELEASE` (`cargo check` / `cargo test` workspace build) are verified in isolated QEMU/KVM VMs. Bare-metal Apple Silicon, Intel MacBook, ARM64 SBCs, and OpenBSD `8+` runtime tests remain pending hardware/VM acceptance.

## Apple Silicon MacBook (`M1`–`M4`, Asahi / Fedora / Arch ARM)

Linux distributions running on Apple Silicon (`aarch64`) differ from desktop `x86_64` PCs in display geometry, memory page size, and trackpad ergonomics:

1. **Notch & Camera Cutout `safe_area` Insets**: Built-in Liquid Retina XDR panels include top camera housing cutouts (`eDP-1`). Configure `safe_area` in `koma.monitor({...})` so tiled layouts and `wlr-layer-shell` bars stay clear of the notch:
   ```lua
   koma.monitor({
       output = "eDP-1",
       scale = "auto",
       safe_area = { top = 38, bottom = 0, left = 0, right = 0 },
       allow_non_desktop = false,
   })
   ```
2. **`16 KiB` Kernel Page Alignment**: Apple Silicon Linux kernels use `16 KiB` pages (`PAGESIZE = 16384`). Frame transport (`SCM_RIGHTS` `memfd` / SHM) queries runtime page alignment rather than hardcoding `4096`-byte pages, and the Lua 5.4 sandbox requires zero JIT `mprotect` executable pages (`W^X` safe).
3. **Force Touch Clickpad Ergonomics**: Enable `click_method = "clickfinger"` and tuned `pinch_sensitivity` in `koma.input({ touchpad = { ... } })` for one/two/three-finger clickfinger behavior alongside `3`/`4`-finger workspace & overview gestures.
4. **Apple DRM / Mesa Stack**: Requires kernel `apple_drm` / `dcp` + Mesa `asahi` (`GL_OES_EGL_image` / `zwp_linux_dmabuf_v1`).

## Intel MacBook Linux (T2 & Non-T2)

- **HiDPI Fractional Scaling**: Retina `2560x1600` / `2880x1800` / `3072x1920` panels use `scale = "auto"` (or explicit `scale = 2.0` / `1.6`) via `wp-fractional-scale-v1` + `wp-viewporter`.
- **Non-Desktop Connectors**: Touch Bar / virtual VR connectors marked non-desktop are skipped automatically (`allow_non_desktop = false`).
- **Dual-GPU / Hybrid Macs**: Set `max_bpc = 10` if needed on external Thunderbolt displays, and test `--tty` on a spare VT before migrating from `seatd` / `systemd-logind`.

## Generic `ARM64` (`aarch64`) Linux

- Packaging recipes in [komawm/packaging](https://github.com/komawm/packaging) define `aarch64` / `arm64` targets across Debian/Ubuntu, Arch Linux ARM, Fedora/Copr, Alpine, NixOS (`aarch64-linux`), and Homebrew.
- Set `koma.appearance({ blur = { enabled = false } })` on low-power ARM64 SBCs if Dual-Kawase multipass blur saturates memory bandwidth.

## FreeBSD `15.1-RELEASE` & OpenBSD `8+`

| OS | Status at `v0.0.1` | Seat & Input Stack | Notes |
| :--- | :--- | :--- | :--- |
| **FreeBSD `15.1-RELEASE`** | **VM Verified (`cargo check` / `cargo test` PASS)** | `seatd` + `libudev-devd` + `libinput` + `evdev` | Uses `shm_open` SHM transport, polling fallback for config reload, and `LOCAL_PEERCRED` / `getpeereid` for same-UID socket checks |
| **OpenBSD `8+`** | **Experimental Template** | `wscons` / `libinput` / `pledge`-aware path | Ports template in `komawm/packaging/openbsd/`; runtime DRM/`seatd` verification pending |

On FreeBSD, ensure `seatd` is running (`sysrc seatd_enable="YES" && service seatd start`), your user belongs to `video`, and `XDG_RUNTIME_DIR` points to a user-owned `0700` directory before testing `koma`.
