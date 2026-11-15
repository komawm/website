# Koma 概览

> [!NOTE]
> Koma 是一款独立、键盘驱动的 Wayland 平铺合成器。你可以单独安装并日常使用 Koma 窗口管理器，无需任何 AI 工具或伴侣守护进程——[Jiku](/zh-CN/jiku/) 完全可选。

![运行在默认 Dwindle 平铺布局下的 Koma](/media/koma-dwindle.webp)

## 核心特性

1. **隔离校验的 Lua 5.4 配置**：每次重载 `~/.config/koma/init.lua` 都会先在受内存限制（默认 `4 MiB`）的隔离 Lua 5.4 沙箱中求值，全部规则与配置校验通过后才会原子切换至运行中的合成器。配置出错不会破坏当前桌面会话。
2. **按工作区独立布局与视觉效果**：每个工作区可独立使用 `"dwindle"`（有头工作区默认）、`"scrolling"`（横向滚动列）、`"deck"`（全视口单窗堆栈与后台 Stash）或 `"bsp"`，并支持 Dual-Kawase 模糊、圆角、阴影、焦点环与弹簧动画。
3. **人类优先抢占（`< 1 ms`）**：任意物理键鼠输入或按下 `Mod + G`，都会立即吊销当前的自动化写租约，并通过单调递增的 `Epoch` 计数阻断过期并发指令（`4091 ERR_HUMAN_PREEMPTED`）。
4. **内置容器沙箱与双套接字隔离**：将完整管理通道（`koma-admin.sock`）与基于能力令牌的受限通道（`koma-agent.sock`）分离，并支持通过 `komactl sandbox`（`bwrap` / 无根 `podman`）与 `wp_security_context_manager_v1` 隔离窗口客户端。

## 手册导航

| 章节 | 内容概览 | 页面链接 |
| :--- | :--- | :--- |
| **安装指南** | 软件源、`.deb`/`.rpm`/`.apk`、Arch/AUR、BSD 与源码编译 | [安装指南](/zh-CN/docs/getting-started/installation/) |
| **初次使用与快捷键** | `--session`/`--winit`/`--tty` 模式、默认快捷键、`Mod + Tab` 概览与 `Mod + G` | [初次使用与快捷键](/zh-CN/docs/getting-started/quickstart/) |
| **硬件与平台支持** | Apple Silicon (`M1`–`M4`) 与 Intel MacBook Linux、`ARM64`、FreeBSD `15.1-RELEASE`、OpenBSD | [硬件与平台支持](/zh-CN/docs/getting-started/platforms/) |
| **Lua 配置指南** | Lua 5.4 配置、布局、显示器、输入设备、窗口规则与 `koma-types` 补全 | [布局、窗口与 init.lua](/zh-CN/docs/configuration/init-lua/) |
| **协议与命令行工具** | Layer Shell、锁屏、截屏、Portal、输入法、`komactl` 与 `koma-overview` | [状态栏、Portal、输入法与应用兼容](/zh-CN/docs/protocols-and-tools/wayland-protocols/) |
| **IPC 与自动化** | `koma-admin.sock` / `koma-agent.sock`、`Epoch` 租约、MCP 与问题排查 | [IPC 与工作区租约](/zh-CN/docs/ipc/sockets-and-epochs/) |

## 离线自检命令

在不改动当前桌面会话的前提下直接构建并校验可执行文件：

```bash
git clone https://github.com/komawm/koma.git
cd koma
cargo build --release --locked -p koma -p komactl -p koma-mcp -p koma-overview
./target/release/koma --headless-check
./target/release/komactl gen-types > /tmp/koma-types-check.lua
```

## 相关仓库

本手册与规范文档托管于 [komawm/docs](https://github.com/komawm/docs)。多发行版打包定义位于 [komawm/packaging](https://github.com/komawm/packaging)，LuaLS 类型定义位于 [komawm/koma-types](https://github.com/komawm/koma-types)，可选伴侣守护进程位于 [komawm/jiku](https://github.com/komawm/jiku)。
