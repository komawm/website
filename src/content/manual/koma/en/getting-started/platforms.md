# ARM64, MacBook Linux & BSD

Koma and Jiku are engineered around portable POSIX/Wayland foundations (`Smithay`, `libseat`/`seatd`, `libinput`, `rustix` `SCM_RIGHTS`, and pure-Rust [Phodopus](https://github.com/Xuepoo/phodopus) Lua 5.4) so hardware support extends cleanly beyond desktop `x86_64` Linux.

## MacBook Running Linux (Apple Silicon & Intel)

Linux on MacBook spans two distinct CPU and GPU architectures, both accounted for in [komawm/packaging](https://github.com/komawm/packaging):

| MacBook Generation | CPU & Target Triple | Kernel / KMS Stack | Packaging & Config Notes |
| :--- | :--- | :--- | :--- |
| **Apple Silicon (`M1` / `M2` / `M3` / `M4`)** | `aarch64-unknown-linux-gnu` (`arm64`) | Fedora Asahi Remix / Debian / Arch ARM (`apple-dcp` KMS + Mesa `asahi` AGX EGL, **16 KiB page size**) | Built with `-Wl,-z,max-page-size=16384` so ELF segments map cleanly on 16K kernels; supports Retina fractional scale and 3-finger Magic Trackpad scrolling |
| **Intel MacBook (`Core i5` / `i7` / `i9`)** | `x86_64-unknown-linux-gnu` (`amd64`) | Standard Linux / T2 Linux (`i915` iGPU or hybrid `amdgpu` dGPU) | Uses standard `x86_64` `.deb` / `.rpm` / `.pkg.tar.zst` artifacts; multi-GPU format negotiation (`Abgr2101010`, `Argb8888`) handles hybrid MacBook Pro models |

```lua
-- Recommended Retina & Command-key tuning on MacBook Linux (~/.config/koma/init.lua)
koma.output("eDP-1", { scale = 2.0 })
koma.input({
  mod_key = "Super", -- Maps to left/right Command (⌘) key on Apple keyboards
  inherit_default_binds = true,
  touchpad = { natural_scroll = true, tap_to_click = true },
})
```

## ARM64 Workstations & SBCs

Native `aarch64-unknown-linux-gnu` packages are built directly on ARM64 runners without QEMU emulation overhead, supporting Mesa Panfrost/Panthor, Freedreno (`msm`), V3D, and Vulkan/GLES2 Wayland stacks.

## FreeBSD & OpenBSD Portability

> [!NOTE]
> FreeBSD and OpenBSD support is currently on the pre-`v0.1.0` portability track: CI cross-checks core protocol, layout model, and Lua crates against BSD targets while bare-metal BSD DRM/Wayland verification is underway.

- **FreeBSD (`x86_64` & `aarch64`)**: Pairs natively with `graphics/drm-kmod`, `sysutils/seatd` (`libseat`), `devel/libudev-devd`, and `graphics/wayland`. For Jiku, outer process isolation maps to FreeBSD `Capsicum` / `jail` primitives.
- **OpenBSD (`amd64` & `arm64`)**: Targets Xenocara `drm` / `mesa` + OpenBSD `wayland` ports and `libinput-openbsd`, with Jiku sandboxing mapped to `pledge(2)` and `unveil(2)` in place of Linux-specific Landlock.
