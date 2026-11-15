# 首页与架构总览

> [!NOTE]
> **Koma** 是基于 [Smithay](https://github.com/Smithay/smithay) 与 Rust（`1.100.0`，Edition 2024）编写的独立键盘驱动 Wayland 平铺合成器。你完全可以只安装并日常使用 Koma 窗口管理器——可选伴侣进程 [Jiku](/zh-CN/jiku/) 与 Koma 零强依赖。

![Koma 障子格架构与多工作区平铺总览](/placeholders/koma-shoji.webp "Koma 在统一的 Smithay 场景图中同时承载 Dwindle、Scrolling、Deck 与 BSP 工作区布局。")

## 核心架构原则

Koma 将 **Ring 0 合成器机制** 与 **用户 / 智能体策略** 清晰解耦：

1. **无栈 Lua 5.4 配置沙箱（[Phodopus](https://github.com/Xuepoo/phodopus)）**：每次加载 `~/.config/koma/init.lua` 都在纯 Rust 编写、带单调指令燃料（Instruction Fuel）与内存上限（默认 `4 MiB`）的影子沙箱中预求值，全部规则与正则校验通过后才原子切换生效。
2. **统一场景图与多模式布局引擎（`koma-model` + `koma-render`）**：支持按工作区独立选择 `"dwindle"`（有头工作区默认）、`"scrolling"`（无限横向滚动列）、`"deck"`（全视口单窗堆栈 + 后台 Stash）或 `"bsp"`，配合 Dual-Kawase 模糊、圆角、投影、焦点环与阻尼弹簧动画。
3. **人类优先零延迟抢占（`< 1 ms`）**：任意物理键鼠操作或按下 `Mod + G` 会立即中止自动化操作，并通过单调递增的 `Epoch` 租约（`4091 ERR_HUMAN_PREEMPTED`）阻断过期并发指令。
4. **零可避免 `unsafe` 安全基线**：核心模型、Lua 桥接、虚拟座席、CLI、全局概览与 MCP 桥接共 6 个 crate 强制 `#![forbid(unsafe_code)]`，协议层与主进程使用 `#![deny(unsafe_code)]` 并以安全 `rustix` 原语替代裸 `libc` 调用。

## Workspace Crate 清单

| Crate | 类型 | 职责范围 | `unsafe` 策略 |
| :--- | :--- | :--- | :--- |
| `koma-proto` | 库 | 双套接字帧协议、`SCM_RIGHTS` `memfd`/SHM 传输、`CapabilityToken` 与 `Epoch` 错误码 | `#![deny(unsafe_code)]` |
| `koma-model` | 库 | `dwindle`/`scrolling`/`deck`/`bsp` 布局引擎、浮动层、弹簧物理、窗口规则 | `#![forbid(unsafe_code)]` |
| `koma-lua` | 库 | [Phodopus](https://github.com/Xuepoo/phodopus) Lua 5.4 沙箱桥接、宿主 API 与 `LuaCATS` 类型生成器 | `#![forbid(unsafe_code)]` |
| `koma-render` | 库 | Smithay 场景图、Dual-Kawase GLES2 模糊、圆角裁剪与受保护表面遮罩 | `#![deny(unsafe_code)]` |
| `koma-seat` | 库 | 虚拟座席按键账本与 3 级 `TextInjectStrategy` 文本注入策略调度 | `#![forbid(unsafe_code)]` |
| `koma` | 二进制 | `--tty` DRM/KMS 与 `--winit` 嵌套后端、Wayland 协议全局注册、`calloop` IPC 服务 | `#![deny(unsafe_code)]` |
| `komactl` | 二进制 | `validate`、`reload`、`gen-types`、`inventory`、`capture`、`token mint`、`sandbox` | `#![forbid(unsafe_code)]` |
| `koma-mcp` | 二进制 | 桥接 `koma-agent.sock` 的标准 stdio JSON-RPC 2.0 MCP 服务 | `#![forbid(unsafe_code)]` |
| `koma-overview` | 二进制 | 基于 `wlr-layer-shell` 的空间工作区全局概览伴侣界面 | `#![forbid(unsafe_code)]` |

## 手册导航

| 章节 | 内容概览 | 页面链接 |
| :--- | :--- | :--- |
| **安装与渠道** | `cdn.komawm.org` APT 源、`.deb`/`.rpm`/`.apk`、Arch/AUR、BSD、源码编译 | [多发行版安装与渠道](/zh-CN/docs/getting-started/installation/) |
| **快速启动** | `--session`/`--winit`/`--tty` 模式、完整默认键位、`Mod + Tab` 概览与 `Mod + G` | [会话启动与默认快捷键](/zh-CN/docs/getting-started/quickstart/) |
| **硬件与平台** | Apple Silicon (`M1`–`M4`) 与 Intel MacBook Linux、`ARM64`、FreeBSD `15.1`、OpenBSD | [ARM64、MacBook Linux 与 BSD](/zh-CN/docs/getting-started/platforms/) |
| **Lua 配置** | Phodopus 沙箱、布局外观、多显示器 2D 配置、窗口规则与 `koma-types` 补全 | [Lua 沙箱、布局与视觉外观](/zh-CN/docs/configuration/init-lua/) |
| **协议与工具** | Layer Shell、锁屏、截屏、Portal、IME、`komactl` 与 `koma-overview` | [Wayland 协议、Portal 与输入法](/zh-CN/docs/protocols-and-tools/wayland-protocols/) |
| **IPC 与排障** | `koma-admin.sock` / `koma-agent.sock`、Epoch 租约、MCP 与常见排障 FAQ | [双通道套接字、Epoch 租约与 MCP](/zh-CN/docs/ipc/sockets-and-epochs/) |

## 离线自检命令

可在不改动当前桌面会话的前提下直接构建并校验二进制入口：

```bash
git clone https://github.com/komawm/koma.git
cd koma
cargo +1.100.0 build --release --locked -p koma -p komactl -p koma-mcp -p koma-overview
./target/release/koma --headless-check
./target/release/komactl gen-types > /tmp/koma-types-check.lua
```

## 源码与渠道归属

本三语手册与规范文档托管于 [komawm/docs](https://github.com/komawm/docs)，并通过确定性构建发布至 Cloudflare R2（`https://cdn.komawm.org`）。多发行版打包脚本位于 [komawm/packaging](https://github.com/komawm/packaging)，LuaLS 类型快照位于 [komawm/koma-types](https://github.com/komawm/koma-types)，可选伴侣守护进程位于 [komawm/jiku](https://github.com/komawm/jiku)。
