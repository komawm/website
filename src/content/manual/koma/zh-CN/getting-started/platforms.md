# ARM64、MacBook Linux 与 BSD

Koma 与 Jiku 底层围绕可移植的现代系统原语（`Smithay`、`libseat`/`seatd`、`libinput`、`rustix` `SCM_RIGHTS` 与纯 Rust 无栈 Lua 5.4 引擎 [Phodopus](https://github.com/Xuepoo/phodopus)）构建，在常规 `x86_64` 台式机/笔记本之外，完整考虑了 **ARM64 设备**、**安装 Linux 的新老款 MacBook** 以及 **FreeBSD / OpenBSD**。

## 安装 Linux 的 MacBook（Apple 芯片与老款 Intel）

不同年代的 MacBook 在安装 Linux 时分属两套完全不同的架构，[komawm/packaging](https://github.com/komawm/packaging) 在构建矩阵中均已专门适配：

| MacBook 硬件代际 | 处理器与构建目标 (Target) | Linux 内核与图形驱动栈 | 构建与配置关键点 |
| :--- | :--- | :--- | :--- |
| **Apple 芯片（`M1` / `M2` / `M3` / `M4`）** | `aarch64-unknown-linux-gnu`（`arm64`） | Fedora Asahi Remix / Debian / Arch ARM（`apple-dcp` 显示协处理器 + Mesa `asahi` 驱动，**16 KiB 内存页**） | CD 默认注入 `-Wl,-z,max-page-size=16384` 确保 ELF 段在 16K 内核上直接加载；原生支持分离式显示/渲染设备协商与触控板三指连续滚动 |
| **老款 Intel（`Core i5` / `i7` / `i9`）** | `x86_64-unknown-linux-gnu`（`amd64`） | 标准发行版或 T2 Linux 内核（Intel `i915` 核显或 `amdgpu` 双显卡） | 直接安装常规 `x86_64` 发行包；内置的 `Abgr2101010` / `Argb8888` 跨 GPU 格式协商可覆盖双显卡 MacBook Pro |

```lua
-- MacBook Linux 视网膜高分屏与 Command 主修饰键推荐配置 (~/.config/koma/init.lua)
koma.output("eDP-1", { scale = 2.0 })
koma.input({
  mod_key = "Super", -- 对应苹果键盘左下/右下的 Command (⌘) 键
  inherit_default_binds = true,
  touchpad = { natural_scroll = true, tap_to_click = true },
})
```

## 原生 ARM64 工作站与开发板

`cd-release.yml` 直接使用原生 ARM64 构建节点产出 `.deb`（`arm64`）、`.rpm`（`aarch64`）与 `.tar.zst`，兼容 Panfrost/Panthor、Freedreno（骁龙 Linux 笔记本）等主流开源 Mesa GBM/EGL 驱动。

## FreeBSD 与 OpenBSD 跨系统路线

> [!NOTE]
> FreeBSD 与 OpenBSD 目前处于 `v0.1.0` 前的移植推进轨道：流水线已开启针对 BSD 目标三元组的核心库交叉编译检查，实机 DRM/Wayland 会话验收将分阶段解锁。

- **FreeBSD（`x86_64` 与 `aarch64`）**：依托 `drm-kmod`、`seatd`（`libseat` 原生支持 FreeBSD）、`libudev-devd` 与 `wayland` 运行；Jiku 的外部沙箱对应映射至 FreeBSD `Capsicum` 能力模式。
- **OpenBSD（`amd64` 与 `arm64`）**：对接 Xenocara `drm`/`mesa`、`libinput-openbsd` 与 `wayland` 移植栈；Jiku 的文件系统与系统调用最小权限隔离对应映射至 OpenBSD 原生的 `unveil(2)` 与 `pledge(2)`。
