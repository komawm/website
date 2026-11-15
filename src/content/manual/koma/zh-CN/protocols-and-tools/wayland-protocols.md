# Wayland 协议、Portal 与输入法

Koma 在 [Smithay](https://github.com/Smithay/smithay) 之上完整注册了现代桌面所需的核心 Wayland 协议，并对 `wp_security_context_manager_v1` 与 `komactl sandbox` 沙箱套接字强制执行 `ClientState { restricted: true }` 权限隔离。

## 窗口、面板与输出管理协议

| 协议 / 全局对象 | 用途与生态工具 | 安全与沙箱隔离规则 |
| :--- | :--- | :--- |
| `xdg_shell`（`xdg_wm_base`） | 普通应用窗口、弹窗、全屏及 SSD 服务端装饰协商（`zxdg_decoration_manager_v1`） | 沙箱客户端严格限制在指定 `Headless` 工作区内 |
| `zwlr_layer_shell_v1` | 状态栏（`waybar`）、通知（`swaync`）、启动器（`fuzzel`/`rofi`）与 `koma-overview` | 互斥区（`exclusive_zone`）自动缩减工作区可用范围；对沙箱客户端隐藏 |
| `ext_session_lock_v1` | 故障闭锁（Fail-closed）锁屏（`swaylock`、`hyprlock`） | 锁屏期间遮蔽画面、拒绝 `grim` 截屏（`failed`）、延迟 `xdg-activation` |
| `zwlr_output_manager_v1` | 多显示器动态探测、`test` 与 `apply`（`kanshi`、`wdisplays`） | 禁止沙箱/受限客户端绑定 |
| `zwlr_output_power_manager_v1` 与 `zwlr_gamma_control_manager_v1` | DPMS 息屏唤醒（`wlopm`）与夜览色温调节（`wlsunset`、`gammastep`） | 对受限客户端屏蔽 |
| `wp_fractional_scale_manager_v1` 与 `wp_viewporter` | 原生锐利分数 HiDPI 缩放（`1.25`、`1.5`、`1.6`、`"auto"`） | 按显示器独立下发 |
| `xdg_activation_v1` 与 `xdg_toplevel_icon_v1` | 跨应用焦点激活令牌（`10 s` TTL）与窗口图标校验 | 校验沙箱归属并在锁屏期间自动推迟 |
| `zwlr_foreign_toplevel_manager_v1` 与 `ext_foreign_toplevel_list_v1` | 任务栏窗口列表、激活、最小化与关闭控制 | 禁止沙箱绑定且在锁屏下自动保护 |

## 截屏与 `xdg-desktop-portal`

- **`zwlr_screencopy_manager_v1` (v3)**：支持 SHM 与 DMA-BUF 零拷贝截屏（兼容 `grim`、`wayshot`、`slurp`），每帧仅发出单个 `buffer`/`linux_dmabuf` 事件，并严格执行 `block_out_from = "screencopy"`/`"all"` 黑屏掩码及锁屏拒截保护。
- **`xdg-desktop-portal`（`koma.portal`）**：随包安装门户路由配置，配合 `xdg-desktop-portal-wlr` / `xdg-desktop-portal-gtk` 提供屏幕共享与截图支持。

## 中文/日文输入法（IME）与虚拟输入栈

Koma 原生实现完整 Wayland IME 协议，无需依赖 X11 兼容层：

- **`zwp_text_input_manager_v3`**（`text-input-v3`）：服务 GTK4、Qt6、Chromium/Electron（`--enable-wayland-ime`）及原生 Wayland 终端。
- **`zwp_input_method_manager_v2`**（`input-method-v2`）与 **`zwp_virtual_keyboard_manager_v1`**：支持 **`Fcitx5`** 与 **`IBus`** 候选词浮窗、预编辑（preedit）与按键提交。
- **`zwp_pointer_constraints_v1` 与 `zwp_relative_pointer_manager_v1`**：支持游戏与 3D 视口指针锁定/限制及相对位移（锁屏或失焦时自动解除）。
- **`wl_touch` 与 `wp_cursor_shape_manager_v1`**：多点触控表面路由与合成器端光标形状主题。

> [!TIP]
> **人类 IME 与智能体输入隔离**：你日常打字走 `Fcitx5` / `IBus`（`text-input-v3` + `input-method-v2`）；而通过 `koma-agent.sock` 注入文本时走 `koma-seat` 的 `TextInjectStrategy`（`xkb_keymap` / `text_input_v3` / `clipboard` Ctrl+Shift+V），绝不会误弹出中文候选框干扰自动化。

## `wp_security_context_manager_v1` 与受限容器隔离

无论通过 Wayland 原生 `wp_security_context_manager_v1`（Flatpak / `bubblewrap`）还是 `komactl sandbox` 启动的容器，连接都会被打上 `ClientState { restricted: true }` 标签，无法绑定 `zwlr_layer_shell_v1`、`zwlr_screencopy_manager_v1`、`zwlr_data_control_manager_v1`、`zwp_virtual_keyboard_manager_v1`、`ext_session_lock_manager_v1`、`zwlr_output_manager_v1` 或再次嵌套创建安全上下文。
