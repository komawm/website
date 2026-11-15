# 首页

欢迎查阅 **Koma** 文档。

Koma 是一款基于 Rust（`1.100.0`，Edition 2024）与 `Smithay` 构建的键盘流 Wayland 平铺合成器。你可以从 [安装指南与验收边界](/zh-CN/docs/getting-started/installation/) 开始，或在 [ARM64、MacBook Linux 与 BSD](/zh-CN/docs/getting-started/platforms/) 中查看新老款 MacBook（`M1`–`M4` / `Intel`）及 BSD 支持；如需配置平铺布局与快捷键，请参阅 [布局模式、视觉外观与增量覆盖](/zh-CN/docs/configuration/init-lua/)。

## 文档导览

| 章节 | 主要内容 | 入口 |
| :--- | :--- | :--- |
| **安装与渠道** | `x86_64` / `aarch64` 源码编译、`v0.1.0` 验收边界与 `cdn.komawm.org` 发行包矩阵 | [安装指南与验收边界](/zh-CN/docs/getting-started/installation/) |
| **快速上手** | `--winit` 嵌套窗口测试、TTY 启动、默认快捷键与 `<1ms` `Mod+G` 抢占屏障 | [会话启动与默认快捷键](/zh-CN/docs/getting-started/quickstart/) |
| **硬件与跨平台** | Apple 芯片（`M1`–`M4` `16 KiB` 页对齐）与 Intel 款 MacBook Linux、原生 `ARM64`、`FreeBSD` / `OpenBSD` | [ARM64、MacBook Linux 与 BSD](/zh-CN/docs/getting-started/platforms/) |
| **Lua 5.4 配置** | `dwindle`、`scrolling` 横向滚动列、`deck`、浮动暂存窗与 [komawm/koma-types](https://github.com/komawm/koma-types) 类型补全 | [布局模式、视觉外观与增量覆盖](/zh-CN/docs/configuration/init-lua/) |
| **IPC 与 Jiku** | 双套接字隔离、Epoch 租约栅栏、`koma-mcp` 与可选独立守护进程 [Jiku](/zh-CN/jiku/) | [双通道套接字、Epoch 租约与 MCP](/zh-CN/docs/ipc/sockets-and-epochs/) |

## 快速编译与自检

克隆 [komawm/koma](https://github.com/komawm/koma) 并在不改动当前桌面会话的情况下执行离线自检：

```bash
git clone https://github.com/komawm/koma.git
cd koma
cargo +1.100.0 build --release --locked -p koma -p komactl -p koma-mcp -p koma-overview
./target/release/koma --headless-check
```

## 参与贡献

文档源文件托管于 [komawm/docs](https://github.com/komawm/docs)，构建产物分发于 Cloudflare R2（`https://cdn.komawm.org`）。各发行版打包配置位于 [komawm/packaging](https://github.com/komawm/packaging)，可选桌面编排守护进程位于 [komawm/jiku](https://github.com/komawm/jiku)。
