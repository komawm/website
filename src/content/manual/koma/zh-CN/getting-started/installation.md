# 安装指南与验收边界

> [!WARNING]
> Koma 目前处于 `v0.0.1` 孵化基线阶段。虽然全部 9 个 Rust crate 已在 `Rust 1.100.0`（Edition 2024）下通过编译、单元测试以及 QEMU/KVM Arch Linux 虚拟机 `llvmpipe` KMS 冒烟验证，但真机物理显卡 DRM/KMS 扫描输出与安全隔离验收仍属于 `v0.1.0` 目标。日常开发请先在嵌套 `--winit` 窗口或独立虚拟机中体验，切勿直接覆盖宿主机的默认登录会话。

> [!NOTE]
> Koma 是完全独立的 Wayland 平铺窗口合成器。日常纯键盘桌面使用完全不需要安装 [Jiku](/zh-CN/jiku/)；Jiku 仅作为按需选装的桌面自动化伴侣存在。

## 系统依赖

在 Linux 上从 [komawm/koma](https://github.com/komawm/koma) 源码编译需要仓库锁定的 `Rust 1.100.0` 工具链，以及常规 Wayland / KMS 系统开发库（`libseat`、`libinput`、`libudev`、`libgbm`、`libxkbcommon`、`libdisplay-info` 与 `mesa` EGL/GLES2）。X11 旧应用支持通过外部无根 `xwayland-satellite` 按需提供。

## 从源码编译与自检

克隆仓库后可通过 `just` 门禁与 `cargo` 构建四个核心二进制文件：

```bash
git clone https://github.com/komawm/koma.git
cd koma
just fmt-check typecheck clippy test
cargo build --release --locked -p koma -p komactl -p koma-mcp -p koma-overview
./target/release/koma --headless-check
```

## 九 Crate 架构分工

| Crate 名称 | 类型 | 核心职责说明 |
| :--- | :--- | :--- |
| `koma-proto` | 库 | IPC 报文帧、`SCM_RIGHTS` 文件描述符传递、能力令牌与 Epoch 纪元号 |
| `koma-model` | 库 | Dwindle、Scrolling 滚动列、Deck、BSP 布局、浮动栈与临界阻尼弹簧物理 |
| `koma-lua` | 库 | [Phodopus](https://github.com/Xuepoo/phodopus) 纯 Rust 无栈 Lua 5.4 桥接与类型生成器 |
| `koma-render` | 库 | Smithay 场景合成、Dual-Kawase 双重模糊、圆角着色器与隐私窗口遮罩 |
| `koma-seat` | 库 | 虚拟输入座席按键账本与 `TextInjectStrategy` 文本注入分发 |
| `koma` | 二进制 | Winit 嵌套窗口与裸机 TTY KMS 后端、Wayland 协议栈与热重载主循环 |
| `komactl` | 二进制 | 配置静态校验、在线热重载、`gen-types` 类型导出与管理端 IPC |
| `koma-mcp` | 二进制 | 连接 `koma-agent.sock` 的标准输入输出 MCP 适配器 |
| `koma-overview` | 二进制 | 基于 Layer-Shell 的工作区缩略图概览组件 |
