# ARM64、MacBook Linux 与 BSD

Koma 与 [Jiku](/zh-CN/jiku/) 基于高度可移植的 POSIX 与 Wayland 原语构建（`Smithay`、`libseat`/`seatd`、`libinput`、`rustix` `SCM_RIGHTS` + `File` I/O 以及纯 Rust [Phodopus](https://github.com/Xuepoo/phodopus) Lua 5.4），架构上覆盖 `x86_64`、`aarch64`（`ARM64`）、MacBook Linux 硬件以及 BSD 操作系统。

> [!NOTE]
> **当前验证边界（`v0.0.1`）**：目前已在隔离的 QEMU/KVM 虚拟机中完成 `x86_64` Arch Linux（`koma --tty` + `seatd` + `llvmpipe` 软件 KMS 冒烟）以及 FreeBSD `15.1-RELEASE`（全 workspace 编译与测试检查）。Apple Silicon 裸机、Intel MacBook、ARM64 开发板及 OpenBSD `8+` 的真实硬件运行验证仍待后续验收。

## Apple Silicon MacBook（`M1`–`M4`、Asahi / Fedora / Arch ARM）

在 Apple Silicon（`aarch64`）上运行 Linux 与传统 `x86_64` PC 存在三项关键差异：

1. **刘海屏安全区（`safe_area`）避让**：内置 Liquid Retina XDR 屏幕（`eDP-1`）顶部带有摄像头凹槽。可在 `koma.monitor({...})` 中配置安全内边距，避免平铺窗口或状态栏被遮挡：
   ```lua
   koma.monitor({
       output = "eDP-1",
       scale = "auto",
       safe_area = { top = 38, bottom = 0, left = 0, right = 0 },
       allow_non_desktop = false,
   })
   ```
2. **`16 KiB` 内存页对齐**：Apple Silicon Linux 内核采用 `16 KiB` 页大小（`PAGESIZE = 16384`）。Koma 的 `SCM_RIGHTS` `memfd`/SHM 帧传输按运行时页大小对齐而不写死 `4096`，且 `Phodopus` Lua 沙箱无需任何 JIT `mprotect` 可执行页（原生兼容严格 `W^X`）。
3. **Force Touch 触控板体验**：可在 `koma.input({ touchpad = { ... } })` 中配置 `click_method = "clickfinger"` 与 `pinch_sensitivity`，配合 3/4 指工作区和全局概览手势。
4. **驱动栈**：依赖内核 `apple_drm` / `dcp` 与 Mesa `asahi`（`zwp_linux_dmabuf_v1`）。

## Intel MacBook Linux（含 T2 与非 T2 机型）

- **HiDPI 分数缩放**：Retina `2560x1600` / `2880x1800` / `3072x1920` 面板可通过 `scale = "auto"` 或显式数值（如 `scale = 1.6` / `2.0`）走 `wp-fractional-scale-v1` + `wp-viewporter`。
- **非桌面连接器过滤**：Touch Bar 或 VR 头显等非桌面显示器默认跳过（`allow_non_desktop = false`）。
- **外接 Thunderbolt 显示器**：可按需设置 `max_bpc = 10` 限制色彩位深，建议先在备用 VT 用 `--tty` 验证后再切换主会话。

## 通用 `ARM64`（`aarch64`）Linux

- [komawm/packaging](https://github.com/komawm/packaging) 为 Debian/Ubuntu、Arch Linux ARM、Fedora/Copr、Alpine、NixOS（`aarch64-linux`）及 Homebrew 均提供了 `aarch64`/`arm64` 构建定义。
- 在内存带宽受限的 ARM64 SBC 上，可配置 `koma.appearance({ blur = { enabled = false } })` 关闭多通道 Dual-Kawase 模糊以降低 GPU 带宽占用。

## FreeBSD `15.1-RELEASE` 与 OpenBSD `8+`

| 操作系统 | `v0.0.1` 状态 | 座席与输入栈 | 技术说明 |
| :--- | :--- | :--- | :--- |
| **FreeBSD `15.1-RELEASE`** | **虚拟机验证通过（`cargo check` / `cargo test`）** | `seatd` + `libudev-devd` + `libinput` + `evdev` | 使用 `rustix` `shm_open`（`koma-proto/src/scm_unix.rs`）、跨平台轮询热重载路径（`config_watcher.rs`）及 `LOCAL_PEERCRED`/`getpeereid` 同 UID 套接字鉴权 |
| **OpenBSD `8+`** | **实验性模板** | `wscons` / `libinput` | Ports 模板位于 `komawm/packaging/openbsd/`，待真实运行时 DRM/seatd 验证 |

在 FreeBSD 上运行前，请先启用 `seatd`（`sysrc seatd_enable="YES" && service seatd start`），将用户加入 `video` 组，并确保 `XDG_RUNTIME_DIR` 指向权限 `0700` 的用户自有目录。
