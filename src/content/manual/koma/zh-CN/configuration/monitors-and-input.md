# 显示器与输入设备

Koma 在 `~/.config/koma/init.lua` 中通过 `koma.monitor({...})` 配置多显示器拓扑，并通过 `koma.input({...})`、`koma.device({...})` 与 `koma.gesture({...})` 管理键盘、鼠标、触控板、数位板及多指手势。

## 显示器配置（`koma.monitor`）

支持按 Wayland 接口名（`output = "DP-1"`）或硬件 EDID 信息（`match = { make = "...", model = "...", serial = "..." }`）匹配显示器，外接扩展坞接口编号变化时仍可保持原有布局：

```lua
-- 笔记本主屏：启用 DPI 自适应缩放与可选刘海安全边距
koma.monitor({
    output = "eDP-1",
    mode = "2560x1600@120.000", -- 或 "preferred"
    position = { x = 0, y = 0 },
    scale = "auto",             -- 数值（如 1.5）或 "auto"
    transform = "normal",       -- "normal" | "90" | "180" | "270" | "flipped" | "flipped-90" ...
    vrr = "on_demand",          -- false | true | "on_demand"
    max_bpc = 10,
    safe_area = { top = 0, bottom = 0, left = 0, right = 0 },
    allow_non_desktop = false,
    focus_at_startup = true,
    backdrop_color = "#111216",
})

-- 外接 4K 显示器：按 EDID 匹配并摆放在右侧坐标空间
koma.monitor({
    match = { make = "Dell Inc.", model = "DELL U2723QE" },
    mode = "3840x2160@60.000",
    position = { x = 1600, y = -200 },
    scale = 1.5,
    transform = "normal",
})
```

在 `koma.monitor({...})` 中设置 `off = true` 可关闭对应输出。

### 跨显示器导航与输出管理工具

- **跨屏快捷键动作**：可绑定 `koma.act.monitor.focus_left()`、`focus_right()`、`focus_up()`、`focus_down()`、`koma.act.monitor.focus("DP-1")`，以及 `koma.act.window.move_to_monitor_left/right/up/down()`。
- **`wlr-output-management`（`zwlr_output_manager_v1`）**：支持 `kanshi`、`wdisplays` 等工具在运行时查询输出、测试配置并应用切换。
- **原生分数缩放**：通过 `wp-fractional-scale-v1` 与 `wp-viewporter` 向原生 Wayland 客户端传递精确缩放因子（`1.25`、`1.5`、`1.6` 或 `"auto"`）。

## 键盘、鼠标、触控板与数位板（`koma.input`）

键盘重复率默认值为 `repeat_delay = 220` ms 与 `repeat_rate = 35` Hz（也兼容 `repeat_delay_ms` / `repeat_rate_hz` 别名）。`mod_key = "auto"`（默认）在 `--tty` 下映射为 `Super`，在 `--winit` 嵌套窗口下自动切换为 `Alt`；也可显式指定 `"Super"`、`"Alt"`、`"Ctrl"`、`"Shift"` 或 `"Mod5"`。

```lua
koma.input({
    mod_key = "auto",             -- "auto" | "Super" | "Alt" | "Ctrl" | "Shift" | "Mod5"
    inherit_default_binds = true, -- 保留默认快捷键并允许原地覆盖
    keyboard = {
        layout = "us,cn",
        variant = ",",
        options = { "grp:win_space_toggle", "ctrl:nocaps" },
        repeat_delay = 250,
        repeat_rate = 40,
        numlock_on_startup = false,
    },
    pointer = {
        accel_profile = "flat",   -- "adaptive" | "flat"
        accel_speed = 0.0,        -- -1.0 .. 1.0
        natural_scroll = false,
        left_handed = false,
        middle_emulation = false,
        scroll_factor = 1.0,
        follow_mouse = "normal",  -- "off" | "normal" | "focus_only"
    },
    touchpad = {
        tap_to_click = true,
        tap_and_drag = true,
        tap_drag_lock = false,
        natural_scroll = true,
        disable_while_typing = true,
        disable_while_trackpointing = true,
        accel_profile = "adaptive",
        accel_speed = 0.1,
        scroll_method = "two_finger", -- "none" | "no_scroll" | "two_finger" | "edge" | "on_button_down"
        click_method = "clickfinger", -- "none" | "button_areas" | "clickfinger"
        disabled_on_external_mouse = false,
        scroll_factor = 1.0,
        pinch_sensitivity = 1.0,
    },
    tablet = {
        map_to_output = "eDP-1",
        left_handed = false,
    },
})
```

对于无独立物理按键的 Clickpad / Force Touch 触控板，若未在全局或单设备配置中显式指定，Koma 默认启用 `click_method = "clickfinger"` 与 `disable_while_typing = true`。

## 单设备覆盖配置（`koma.device`）

使用 `koma.device({...})` 按设备名单独覆盖 `libinput` 参数或输出屏幕映射：

```lua
koma.device({
    name = "wacom-one-by-wacom-s-pen",
    map_to_output = "eDP-1",
})

koma.device({
    name = "Logitech MX Master 3",
    accel_profile = "flat",
    accel_speed = -0.2,
    natural_scroll = false,
})
```

## 多指触控板手势（`koma.gesture`）

可将 2 到 5 指的滑动或捏合手势绑定到任意 `koma.act.*` 动作或 Lua 回调：

```lua
koma.gesture({
    fingers = 3,
    direction = "horizontal", -- "left" | "right" | "up" | "down" | "horizontal" | "vertical" | "pinch_in" | "pinch_out"
    action = koma.act.workspace.focus_next(),
    cooldown_ms = 180,
    desc = "三指横向滑动切换工作区",
})

koma.gesture({
    fingers = 4,
    direction = "up",
    action = koma.act.overview.toggle(),
    desc = "四指上滑打开全局概览",
})
```
