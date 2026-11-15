# 初次使用与快捷键

> [!TIP]
> Koma 内置完整的 Hyprland 风格默认快捷键表（默认 `inherit_default_binds = true`）。即使尚未创建 `~/.config/koma/init.lua`，启动后也能直接打开终端、平铺或浮动窗口、切换工作区以及重载配置。

![Koma 默认 Dwindle 平铺工作区](https://cdn.komawm.org/media/koma-dwindle.webp)

## 启动模式（`koma [OPTIONS]`）

Koma 会在打开任何显示设备、座席或 DRM 节点之前先完成命令行参数解析：

| 启动参数 | 后端与行为 | 典型场景 |
| :--- | :--- | :--- |
| `koma --winit` | 在现有 Wayland/X11 会话中开窗嵌套运行 | 在 Hyprland / Sway / GNOME 中安全调试配置 |
| `koma --tty` | 通过 `libseat`（`seatd`/`logind`）、`udev`、`DRM/KMS` 与 `libinput` 直接接管 Linux VT | 裸机 TTY 启动或隔离 QEMU/KVM `virtio-vga` 冒烟测试 |
| `koma --session` | 登录会话模式（`koma-session`、`greetd`、`systemd --user`） | 导入 `WAYLAND_DISPLAY`、`DISPLAY`、`XDG_CURRENT_DESKTOP=koma`、`XDG_SESSION_TYPE=wayland`、`KOMA_INSTANCE_SIGNATURE` 至 `systemd --user` 与 D-Bus，并向 `$NOTIFY_SOCKET`/`$NOTIFY_FD` 发送 `READY=1` |
| `koma --headless-check` | 命令行与状态机自检 | CI、打包校验与安装后检查 |
| `--spawn <CMD>` | 合成器套接字就绪后启动指定命令 | 如 `koma --winit --spawn foot` 或 `koma --tty --spawn ghostty` |
| `-c, --config <PATH>` | 覆盖默认 `$XDG_CONFIG_HOME/koma/init.lua` 路径 | 测试临时或备用 Lua 配置 |

> [!NOTE]
> 不显式指定后端时，若检测到 `WAYLAND_DISPLAY` 或 `DISPLAY`（非 `--session` 模式）则自动选择 `--winit`，否则选择 `--tty`。收到 `SIGTERM`、`SIGINT` 或 `SIGHUP` 时会执行干净退出（返回码 `0`）并清理运行时套接字。

## 内置默认快捷键（`Mod`：TTY 下为 `Super`，嵌套 `--winit` 下为 `Alt`）

| 组合键 | 绑定动作 | 说明 |
| :--- | :--- | :--- |
| `Mod + Return` | `spawn({ "ghostty" })` | 启动默认终端 |
| `Mod + Q` | `window.close()` | 关闭当前聚焦窗口 |
| `Mod + V` | `window.float_toggle()` | 切换窗口浮动状态 |
| `Mod + F` | `window.fullscreen_toggle()` | 切换全屏 |
| `Mod + P` | `window.pseudotile_toggle()` | 切换 Dwindle 伪平铺 |
| `Mod + E` | `dwindle.toggle_split()` | 切换 Dwindle 水平/垂直分割方向 |
| `Mod + H / J / K / L` | `focus.left/down/up/right()` | 按方向移动焦点 |
| `Mod + Shift + H / J / K / L` | `window.move_direction(...)` | 按方向移动或交换窗口 |
| `Mod + 1..9` | `workspace.focus("1".."9")` | 切换至工作区 `1`–`9` |
| `Mod + Shift + 1..9` | `window.move_to_workspace("1".."9")` | 将当前窗口移动至工作区 `1`–`9` |
| `Mod + R` / `Mod + Ctrl + R` | `scrolling.switch_preset_column_width()` | 正向/反向循环切换滚动列预设宽度 |
| `Mod + Ctrl + Shift + R` | `scrolling.switch_preset_window_height()` | 循环切换滚动列窗口高度预设 |
| `Mod + C` / `Mod + M` | `scrolling.center_column()` / `maximize_column()` | 居中或最大化当前滚动列 |
| `Mod + W` | `scrolling.toggle_column_tabbed_display()` | 切换当前列多窗口标签页模式 |
| `Mod + Comma` / `Mod + Period` | `scrolling.consume_window_into_column()` / `expel_window_from_column()` | 并入当前列或从当前列拆出 |
| `Mod + BracketLeft` / `BracketRight` | `scrolling.consume_or_expel_window_left/right()` | 向左或向右并入/拆出列 |
| `Mod + S` / `Mod + Shift + S` | `scratchpad.toggle()` / `move_window()` | 呼出/隐藏暂存区或将窗口移入暂存区 |
| `Mod + Tab` | `overview.toggle()` | 打开/关闭 `koma-overview` 空间工作区切换器 |
| `Mod + MouseLeft` / `MouseRight` | `window.drag_move()` / `drag_resize()` | 鼠标拖拽移动或缩放窗口 |
| `Mod + WheelScrollDown / Up` | `workspace.focus_next()` / `focus_prev()` | 滚轮切换工作区（`150 ms` 冷却） |
| `Mod + WheelScrollLeft / Right` | `deck.cycle_prev()` / `cycle_next()` | 滚轮在 Deck/Stash 间轮换窗口（`150 ms` 冷却） |
| `Mod + Shift + R` | `compositor.reload_config()` | 热重载 `init.lua` |
| `Mod + Shift + E` | `compositor.quit()` | 安全退出合成器 |
| `Mod + G`（抢占屏障） | 立即人类抢占 | `< 1 ms` 吊销智能体写租约（`4091 ERR_HUMAN_PREEMPTED`） |

## 全局概览与急停开关（`Mod + Tab` / `Mod + G`）

- **全局空间概览（`koma-overview`）**：默认绑定为 `Mod + Tab`（也可以在 `init.lua` 中绑定 `koma.bind("Mod + O", koma.act.overview.toggle())`）。通过 `koma-admin.sock` 读取 `scene.inventory` 渲染工作区与窗口空间网格。
- **人类优先抢占（`Mod + G`）**：按下 `Mod + G` 或产生真实物理键鼠输入，会立即触发智能体受管工作区的抢占屏障，避免自动化操作与鼠标或键盘输入冲突。

## 借助 `xwayland-satellite` 运行传统 X11 应用

Koma 不在合成器进程内直接内嵌 `Xwayland`，而是通过外部无根 [`xwayland-satellite`](https://github.com/Supreeeme/xwayland-satellite) 提供 X11 兼容。在 `~/.config/koma/init.lua` 中启用：

```lua
koma.xwayland({
    enabled = true,
    -- path = "/usr/bin/xwayland-satellite", -- 可选：显式指定二进制路径
    isolate_agent_workspaces = true,        -- 禁止 X11 客户端接入智能体工作区
})
```
