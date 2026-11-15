# 胡克弹簧物理、贝塞尔曲线与视觉美化

Koma 在 `init.lua` 中将确定性的 **阻尼胡克定律半隐式欧拉（Semi-Implicit Euler）弹簧求解器**、自定义 **三次贝塞尔曲线（Cubic Bezier）**、分通道动画样式、Dual Kawase 毛玻璃模糊、渐变旋转边框以及逐窗口美化规则整合为一体。

## 阻尼胡克定律半隐式欧拉求解器

在默认模式（`solver = "spring"`）下，Koma 通过二阶阻尼弹簧常微分方程驱动窗口位置、尺寸、透明度、焦点过渡与工作区偏移：

$$m\ddot{x} + c\dot{x} + k(x - x_{\text{target}}) = 0$$

给定质量 $m \ge 0.01$、阻尼系数 $c \ge 0.0$、刚度 $k \ge 1.0$ 与收敛阈值 $\epsilon \ge 10^{-6}$，每个子步先更新速度再更新位置（辛欧拉 / 半隐式欧拉积分）：

$$v_{t+\Delta t} = v_t + \frac{-k(x_t - x_{\text{target}}) - c v_t}{m}\Delta t$$

$$x_{t+\Delta t} = x_t + v_{t+\Delta t}\Delta t$$

若改用无量纲阻尼比 $\zeta$ 配置，Koma 会自动按 $c = 2\zeta\sqrt{mk}$ 换算物理阻尼。

### 子步分割与动态目标动量保持

为在高刷屏或偶发掉帧场景下保持数值稳定性并实现单轨 $O(1)$ 时间、$O(1)$ 空间复杂度：

- 单帧总时间步长限制在 $0.0 \le \Delta t \le 0.1\,\text{s}$，并拆分为 $N = \lceil \Delta t / (1/240) \rceil \in [1, 24]$ 个等长子步。
- 当拖动窗口、悬停切换焦点、重排平铺或快速切换工作区导致目标突变时，`retarget` 仅更新 $x_{\text{target}}$ 而不重置当前位移 $x$ 与速度 $v$，完整保留已有物理动量。
- 当 $|x - x_{\text{target}}| \le 50\epsilon$ 且 $|v| \le 250\epsilon$ 时，轨道精确吸附到静止态。

全局或单条曲线也可显式指定 `solver = "analytical_spring"` 以启用解析弹簧求解器。

## 自定义三次贝塞尔曲线（`koma.bezier`）

使用 `koma.bezier(name, x1, y1, x2, y2, duration_ms)`（或表参数形式）注册命名曲线：

- 控制点 $x_1, x_2$ 限制在 $[0.0, 1.0]$，$y_1, y_2$ 支持 $[-2.0, 3.0]$，可直接表达类似 `[0.05, 0.9, 0.1, 1.1]` 的过冲回弹效果。
- 动画时长限制在 $1 \le d \le 5000\,\text{ms}$。
- 求解 $X(u) = \tau$ 时采用 8 轮 Newton-Raphson 迭代与 12 轮二分法兜底（$O(1)$ 时间与空间），并按链式法则计算实时速度 $\dot{x}(t)$，确保中途改向或切回弹簧物理时速度连续衔接。

## 内置曲线预设与分通道绑定

开箱即用的内置曲线预设如下：

| 预设名 | 定义 | 运动风格 |
| --- | --- | --- |
| `linear` | `[0.0, 0.0, 1.0, 1.0]` | 匀速线性插值 |
| `ease_out` / `default` | `[0.22, 1.0, 0.36, 1.0]` | 干脆的先快后慢缓出 |
| `md3_decel` | `[0.05, 0.7, 0.1, 1.0]` | Material Design 3 减速曲线 |
| `overshot` | `[0.05, 0.9, 0.1, 1.1]` | 轻盈的过冲回弹 |
| `fluent` | `[0.1, 0.9, 0.2, 1.0]` | Fluent 平滑减速曲线 |
| `snappy_spring` | `m = 1.0, c = 36.0, k = 420.0` | 紧致迅速的响应弹簧 |
| `bouncy_spring` | `m = 1.0, c = 20.0, k = 320.0` | 弹性明显的回弹弹簧 |
| `gentle_spring` | `m = 1.2, c = 28.0, k = 180.0` | 柔和舒缓的阻尼弹簧 |

注册自定义弹簧与贝塞尔曲线后，可分别为 `windows_open`（别名 `windows_in`）、`windows_close`（别名 `windows_out`）、`windows_move`、`fade`、`border` 与 `workspaces` 通道绑定曲线和样式：

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

窗口开关动画支持 `popin`（如 `popin 85%`）、`slide`（自动从最近视口边缘滑入，或显式指定 `slide top|bottom|left|right`）、`gnomed` 与 `fade`；工作区切换支持 `slide`、`slidevert`、`fade` 与 `none`（在无头录制与录屏场景中会自动跳过过渡）。

## 渐变边框、Dual Kawase 模糊与窗口美化规则

将 OpenGL ES 2.0 兼容的多段渐变旋转边框、Dual Kawase 毛玻璃模糊与逐窗口规则组合配置：

```lua
koma.appearance({
  border = {
    width = 2,
    radius = 12,
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

聚焦状态切换时，`WindowAnimationTable` 会根据 `border` 曲线实时插值 `focus_factor` $\in [0, 1]$，在激活边框色与非激活边框色之间平滑过渡。
