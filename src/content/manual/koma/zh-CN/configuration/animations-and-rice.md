# 动画、边框与模糊

Koma 在 `~/.config/koma/init.lua` 的 `koma.appearance({...})` 中统一配置窗口动画、圆角、渐变边框、阴影、非聚焦变暗与 Dual Kawase 模糊，并支持通过 `koma.rule.window({...})` 为特定窗口单独覆盖视觉参数。

## 动画求解器与自定义曲线（`koma.bezier`、`koma.spring`）

- **弹簧模式（`solver = "spring"` 或 `"analytical_spring"`）**：通过 `damping_ratio`（默认 `1.0` 无过冲；`< 1.0` 会带轻微回弹）与 `stiffness`（默认 `800.0`）调节，也可显式指定 `mass`（`1.0`）、`damping` 与收敛阈值 `epsilon`（默认 `0.0005`）。窗口在动画中途改向时会保留当前运动速度平滑衔接。
- **三次贝塞尔曲线（`koma.bezier(name, x1, y1, x2, y2, duration_ms)`）**：注册标准四控制点缓动曲线（`x1, x2` 取值 `0.0..1.0`，`y1, y2` 支持 `-2.0..3.0` 以实现过冲，`duration_ms` 限制在 `1..5000`），也支持表参数 `{ points = { x1, y1, x2, y2 }, duration_ms = ... }`。
- **自定义弹簧（`koma.spring(name, spec)`）**：使用 `mass`、`damping` 或 `damping_ratio`、`stiffness`、`epsilon` 注册命名弹簧。

### 内置曲线预设

| 预设名 | 参数定义 | 运动特点 |
| :--- | :--- | :--- |
| `linear` | `[0.0, 0.0, 1.0, 1.0]`，`200 ms` | 匀速线性 |
| `ease_out` / `default` | `[0.22, 1.0, 0.36, 1.0]`，`250 ms` | 干脆的先快后慢缓出 |
| `md3_decel` | `[0.05, 0.7, 0.1, 1.0]`，`280 ms` | Material Design 3 减速 |
| `overshot` | `[0.05, 0.9, 0.1, 1.1]`，`280 ms` | 轻快微过冲 |
| `fluent` | `[0.1, 0.9, 0.2, 1.0]`，`220 ms` | 平滑 Fluent 曲线 |
| `snappy_spring` | `mass = 1.0, damping = 36.0, stiffness = 420.0` | 紧致迅捷的弹簧 |
| `bouncy_spring` | `mass = 1.0, damping = 20.0, stiffness = 320.0` | 回弹感明显的弹簧 |
| `gentle_spring` | `mass = 1.2, damping = 28.0, stiffness = 180.0` | 柔和舒缓的弹簧 |
| `instant` / `none` | 立即完成 | 关闭该通道动画 |

## 分通道动画配置

可分别为 `windows_open`（别名 `windows_in`）、`windows_close`（别名 `windows_out`）、`windows_move`、`fade`、`border` 与 `workspaces` 指定曲线和样式：

```lua
koma.bezier("rice_pop", 0.05, 0.9, 0.1, 1.1, 260)
koma.spring("glide", { mass = 1.0, damping_ratio = 0.82, stiffness = 360.0 })

koma.appearance({
    animations = {
        enabled = true,
        solver = "spring",
        windows_open = { enabled = true, curve = "rice_pop", style = "popin 85%" },
        windows_close = { enabled = true, curve = "glide", style = "slide" },
        windows_move = { enabled = true, curve = "glide" },
        fade = { enabled = true, curve = "md3_decel", duration_ms = 180 },
        border = { enabled = true, curve = "snappy_spring" },
        workspaces = { enabled = true, curve = "overshot", style = "slidevert" },
    },
})
```

- **窗口开关样式**：`"popin"`（例如 `"popin 85%"`）、`"slide"`（自动贴靠最近边缘，或指定 `"slide top"`、`"slide bottom"`、`"slide left"`、`"slide right"`）、`"gnomed"` 与 `"fade"`。
- **工作区切换样式**：`"slide"`、`"slidevert"`、`"fade"` 与 `"none"`（无头抓屏与录屏场景会自动跳过工作区过渡动画）。

## 渐变边框、模糊与单窗口覆盖

在 `koma.appearance({...})` 中设置全局圆角（`corner_radius`）、旋转多色渐变边框和 Dual Kawase 模糊，再通过 `koma.rule.window({...})` 微调特定应用：

```lua
koma.appearance({
    corner_radius = 12,
    border = {
        enabled = true,
        width = 2.0,
        active_color = "#7aa2f7ff",
        active_color_end = "#bb9af7ff",
        inactive_color = "#292e42cc",
        inactive_color_end = "#1f2335cc",
        gradient_angle = 45.0,
        gradient_rotate_rpm = 6.0,
    },
    blur = {
        enabled = true,
        passes = 3,
        size = 6,
    },
})

koma.rule.window({
    name = "terminal-rice",
    matches = { { app_id = "^foot$" } },
    opacity = 0.96,
    inactive_opacity = 0.84,
    animation = "popin 88%",
    border_color = "#7dcfffff",
})

koma.rule.window({
    name = "video-player-clean",
    matches = { { app_id = "^mpv$" } },
    no_blur = true,
    no_shadow = true,
    inactive_opacity = 1.0,
})
```

## 宏中的指针运动配置（`ctx:move_to` / `ctx:drag`）

在 `koma.macro.define(...)` 中移动或拖拽指针时，可通过 `kinematics` 指定 `"instant"`、`"minimum_jerk"`（默认）、`"spring"`（别名 `"hooke"`、`"hooke_spring"`）或 `"bezier"`（或直接引用命名 `curve`）：

```lua
koma.macro.define({
    id = "canvas.spring_pan_drag",
    app_id = ".*",
    description = "使用平滑弹簧轨迹执行中键画布平移拖拽",
    params = {
        dx = { type = "int", default = 180 },
        dy = { type = "int", default = -90 },
    },
    run = function(ctx, args)
        ctx:drag({
            button = "middle",
            from = { anchor = "center", x = 0, y = 0 },
            to = { anchor = "center", x = args.dx, y = args.dy },
            hold_before_move_ms = 25,
            kinematics = {
                profile = "spring",
                mass = 1.0,
                damping = 22.0,
                stiffness = 340.0,
                epsilon = 0.01,
            },
            hold_before_release_ms = 20,
        })
    end,
})
```
