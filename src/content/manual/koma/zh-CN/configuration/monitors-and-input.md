# 多显示器 2D 布局与输入设备

Koma 通过 `koma.monitor({...})` 声明多显示器 2D 拓扑（支持接口名、EDID 硬件匹配、分数缩放、旋转翻转、VRR 与 MacBook 刘海 `safe_area`），并通过 `koma.input({...})` 与 `koma.device({...})` 配置 XKB 与 `libinput` 设备行为。

## 显示器配置（`koma.monitor`）

可按 Wayland 输出名称（`output = "DP-1"`）或跨接口稳定的 EDID 元数据（`match = { make = "...", model = "...", serial = "..." }`）匹配显示器：

```lua
-- 笔记本主屏：启用 DPI 自适应缩放与安全边距
koma.monitor({
    output = "eDP-1",
    mode = "2560x1600@120.000",
    position = { x = 0, y = 0 },
    scale = "auto",
    transform = "normal",
    vrr = "on_demand", -- false | true | "on_demand"
    max_bpc = 10,
    safe_area = { top = 0, bottom = 0, left = 0, right = 0 },
    allow_non_desktop = false,
    focus_at_startup = true,
    backdrop_color = "#111216",
})

-- 外接 4K 显示器：按 EDID 匹配并摆放在右侧 2D 坐标空间
koma.monitor({
    match = { make = "Dell Inc.", model = "DELL U2723QE" },
    mode = "3840x2160@60.000",
    position = { x = 1600, y = -200 },
    scale = 1.5,
    transform = "normal", -- "normal" | "90" | "180" | "270" | "flipped" | "flipped-90" ...
})
```

### 跨显示器导航与动态输出管理

- **跨屏快捷键动作**：可绑定 `koma.act.monitor.focus_left/right/up/down()`、`koma.act.window.move_to_monitor_left/right/up/down()` 或指定名称 `koma.act.monitor.focus("DP-1")`。
- **`wlr-output-management`（`zwlr_output_manager_v1`）**：兼容 `kanshi` 与 `wdisplays` 等工具执行动态输出探测（`test`）与热切换（`apply`）。
- **原生分数缩放**：通过 `wp-fractional-scale-v1` + `wp-viewporter` 向客户端下发精确分数缩放因子（如 `1.25`、`1.5`、`1.6` 或 `"auto"`）。

## 键盘、鼠标、触控板与数位板（`koma.input`）

```lua
koma.input({
    mod_key = "auto",             -- "auto" (TTY 为 Super, Winit 嵌套为 Alt) | "Super" | "Alt"
    inherit_default_binds = true, -- 保留内置默认快捷键并允许原地覆盖
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

## 多指触控板手势（`koma.gesture`）

```lua
koma.gesture({
    fingers = 3,
    direction = "horizontal", -- "left"|"right"|"up"|"down"|"horizontal"|"vertical"|"pinch_in"|"pinch_out"
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
