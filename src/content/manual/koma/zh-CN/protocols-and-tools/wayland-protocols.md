# 状态栏、Portal、输入法与应用兼容

Koma 实现了桌面面板、锁屏、Portal、远程桌面与输入法所需的核心 Wayland 协议，并将 `wp_security_context_manager_v1` 与 `komactl sandbox` 的连接标记为受限，禁止沙箱客户端绑定特权全局对象。

## 窗口、面板与输出管理协议

| 协议 / 全局对象 | 用途与生态工具 | 安全与沙箱隔离规则 |
| :--- | :--- | :--- |
| `xdg_shell`（`xdg_wm_base`） | 桌面应用窗口、弹窗、全屏及 SSD 服务端装饰协商（`zxdg_decoration_manager_v1`） | 沙箱客户端严格限制在指定 `Headless` 工作区内 |
| `zwlr_layer_shell_v1` | 状态栏与面板小组件（`waybar`、`ironbar`、`quickshell`）、通知（`swaync`）、启动器（`fuzzel`/`rofi`）、`koma-overview` | 支持互斥区、`get_popup` -> `xdg_popup` 弹窗边界放开与键鼠抓取；对沙箱客户端隐藏 |
| `ext_session_lock_v1` | 故障闭锁（Fail-closed）锁屏（`swaylock`、`hyprlock`） | 锁屏期间遮蔽画面、拒绝 `grim` 截屏（`failed`）、延迟 `xdg-activation` |
| `zwlr_output_manager_v1` | 多显示器动态探测、`test` 与 `apply`（`kanshi`、`wdisplays`） | 禁止沙箱/受限客户端绑定 |
| `zwlr_output_power_manager_v1` 与 `zwlr_gamma_control_manager_v1` | DPMS 息屏唤醒（`wlopm`）与夜览色温调节（`wlsunset`、`gammastep`） | 对受限客户端屏蔽 |
| `wp_fractional_scale_manager_v1` 与 `wp_viewporter` | 原生锐利分数 HiDPI 缩放（`1.25`、`1.5`、`1.6`、`"auto"`） | 按显示器独立下发 |
| `wp_single_pixel_buffer_v1`、`wp_presentation` 与 `wl_shm` 格式 | 纯色小组件（`ironbar`/`quickshell`）、呈现时间反馈与 `Abgr8888`/`Xbgr8888` 缓冲格式（`Waydroid`） | 向图形客户端开放 |
| `xdg_activation_v1` 与 `xdg_toplevel_icon_v1` | 跨应用焦点激活令牌（`10 s` TTL）与窗口图标校验 | 校验沙箱归属并在锁屏期间自动推迟 |
| `zwlr_foreign_toplevel_manager_v1` 与 `ext_foreign_toplevel_list_v1` | 任务栏窗口列表、激活、最小化与关闭控制 | 禁止沙箱绑定且在锁屏下自动保护 |
| `zwlr_virtual_pointer_manager_v1` 与 `zwp_keyboard_shortcuts_inhibit_manager_v1` | 远程桌面虚拟指针与快捷键抑制传递（`RustDesk`） | 禁止沙箱客户端绑定；始终保留 `Mod + G` 抢占与 VT 切换不进入抑制 |

## 截屏与 `xdg-desktop-portal`

- **`zwlr_screencopy_manager_v1` (v3)**：支持 SHM 与 DMA-BUF 零拷贝截屏（兼容 `grim`、`wayshot`、`slurp`），每帧仅发出单个 `buffer`/`linux_dmabuf` 事件，并严格执行 `block_out_from = "screencopy"`/`"all"` 黑屏掩码及 `ext-session-lock-v1` 拒截保护。
- **`xdg-desktop-portal`（`koma.portal`）**：随安装包提供门户路由配置，配合 `xdg-desktop-portal-wlr` / `xdg-desktop-portal-gtk` 提供 `ScreenCast`、`Screenshot` 与 `GlobalShortcuts` / `Inhibit` 支持。

## 中文/日文输入法（IME）与虚拟输入栈

Koma 原生实现现代 Wayland CJK/IME 协议栈，无需依赖 X11 兼容层：

- **`zwp_text_input_manager_v3`**（`text-input-v3`）：服务 GTK4、Qt6、Chromium/Electron（`--enable-wayland-ime`）及原生 Wayland 终端。
- **`zwp_input_method_manager_v2`**（`input-method-v2`）与 **`zwp_virtual_keyboard_manager_v1`**：支持 **`Fcitx5`** 与 **`IBus`** 候选词浮窗及预编辑（preedit）输入。
- **`zwp_pointer_constraints_v1` 与 `zwp_relative_pointer_manager_v1`**：支持游戏与 3D 视口指针锁定/限制及相对位移（`ext-session-lock` 锁屏或失焦时自动解除）。
- **`wl_touch` 与 `wp_cursor_shape_manager_v1`**：多点触控表面路由与合成器端光标形状主题。

> [!TIP]
> **日常 IME 与自动化文本注入分离**：手动打字走 `Fcitx5` / `IBus`（`text-input-v3` + `input-method-v2`）；而通过 `koma-agent.sock` 注入文本时会直接经由按键映射、`text-input-v3` 或剪贴板粘贴（`Ctrl+Shift+V`）送入窗口，绝不会误弹出中文候选框。

## `wp_security_context_manager_v1` 与受限容器隔离

无论是 Wayland 原生 `wp_security_context_manager_v1`（用于 Flatpak / `bubblewrap`）还是 `komactl sandbox`，都会将客户端连接标记为受限状态。受限连接无法绑定特权全局对象（`zwlr_layer_shell_v1`、`zwlr_screencopy_manager_v1`、`zwlr_data_control_manager_v1`、`zwp_virtual_keyboard_manager_v1`、`ext_session_lock_manager_v1`、`zwlr_output_manager_v1` 或 `wp_security_context_manager_v1` 本身）。
