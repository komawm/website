# 布局、外观与 init.lua

Koma 默认从 `~/.config/koma/init.lua`（或 `$XDG_CONFIG_HOME/koma/init.lua`，回退路径为 `/etc/xdg/koma/init.lua`）加载配置。可通过环境变量 `KOMA_CONFIG` 或启动参数 `koma -c <path>` 指定其他配置文件；较长的配置可拆分到 `~/.config/koma/lua/` 目录中并用 `require(...)` 引入。

![Koma 横向滚动工作区布局与 Lua 配置预览](/media/koma-scrolling.webp "Scrolling 连续横向滚动列布局与状态栏预览。")

## 配置校验与安全热重载

- **沙箱隔离**：Lua 5.4 求值环境设有 `4 MiB` 堆内存上限与指令数限制，并移除 `io`、`os`、`debug` 与 `package` 等系统库，避免配置死循环阻塞合成器。
- **离线预检**：修改 `~/.config/koma/init.lua` 后，先用 `komactl validate` 检查语法、窗口规则正则与手势配置：
  ```bash
  komactl validate ~/.config/koma/init.lua
  ```
- **原子重载**：保存 `init.lua`（自动监听变更）、执行 `komactl reload` 或按下 `Mod + Shift + R` 时，Koma 会先在隔离环境中完整校验新配置；若出现错误，当前运行中的窗口、工作区和快捷键保持不变。可通过 `komactl config-status` 查看当前生效路径与最近一次重载错误。

## 布局与工作区（`koma.layout`、`koma.dwindle`、`koma.scrolling`、`koma.workspace`）

有头工作区默认使用 `"dwindle"` 布局。你可以在 `~/.config/koma/init.lua` 中全局或按工作区分别指定 `"dwindle"`、`"scrolling"`、`"deck"`（单窗全视口聚焦 + 后台暂存栈）或 `"bsp"`：

```lua
koma.layout("dwindle") -- "dwindle" | "scrolling" | "deck" | "bsp"

koma.dwindle({
    force_split = 0,         -- 0 = 按宽高比自动分割, 1 = 左/上, 2 = 右/下
    preserve_split = false,
    smart_split = false,
    default_split_ratio = 1.0,
    inner_gap = 6,
    outer_gap = 10,
})

koma.scrolling({
    preset_column_widths = { 1 / 3, 0.5, 2 / 3 },
    default_column_width = { proportion = 0.5 },
    default_column_display = "normal", -- "normal" | "tabbed"
    center_focused_column = "never",   -- "never" | "always" | "on_overflow"
    camera_damping_ratio = 1.0,
    camera_stiffness = 800.0,
    inner_gap = 8,
    outer_gap = 10,
    edge_auto_scroll = { enabled = true, trigger_width = 30, delay_ms = 100, max_speed = 1500 },
})

koma.workspace({ name = "1", layout = "dwindle", gaps = { inner = 6, outer = 10 } })
koma.workspace({ name = "2", layout = "scrolling" })
koma.workspace({ name = "agent:work", presentation = "headless", layout = "deck" })
```

`koma.workspace({...})` 还支持 `preferred_output`（如 `"eDP-1"`）以及简写整数参数 `gaps_in`、`gaps_out`。

## 视觉外观（`koma.appearance`）

`koma.appearance({...})` 中的每个字段都带有默认值，只需覆盖需要调整的部分：

```lua
koma.appearance({
    corner_radius = 10,
    border = {
        enabled = true,
        width = 2.0,
        active_color = "#58a6ff",
        inactive_color = "#30363d",
        agent_leased_color = "#d2a8ff",  -- 智能体持有 Epoch 租约时的边框色
        human_preempt_color = "#f0883e", -- 按下 Mod + G 人类接管时的提示色
    },
    focus_ring = { enabled = false, width = 2.0, active_color = "#58a6ff", inactive_color = "#30363d" },
    shadow = {
        enabled = true,
        range = 16,
        render_power = 3,
        sharp = false,
        color = "#00000073",
        offset_x = 0.0,
        offset_y = 4.0,
        scale = 1.0,
    },
    dim = { dim_inactive = false, dim_strength = 0.15, brightness = 1.0, contrast = 1.0 },
    blur = {
        enabled = true,
        size = 6,
        passes = 3,
        noise = 0.0117,
        contrast = 0.8916,
        brightness = 0.8172,
        vibrancy = 0.1696,
        xray = true,
        ignore_opacity = false,
    },
    animations = {
        enabled = true,
        damping_ratio = 1.0,
        stiffness = 800.0,
        epsilon = 0.0005,
        open_scale_from = 0.88,
        close_scale_to = 0.92,
    },
})
```

渐变边框、自定义动画曲线与分通道样式见[动画、边框与模糊](/zh-CN/docs/configuration/animations-and-rice/)，编辑器类型补全配置见[编辑器类型补全 (koma-types)](/zh-CN/docs/configuration/lua-types/)。

## 快捷键、子模式与辅助接口

默认 `inherit_default_binds = true` 会加载内置快捷键表。`koma.bind(...)` 会按组合键原地覆盖，`koma.unbind(chord)` 可移除不需要的默认绑定：

```lua
koma.unbind("Mod + Return")
koma.bind("Mod + Return", koma.act.spawn({ "foot" }), { desc = "Launch foot" })
koma.bind("Mod + O", koma.act.overview.toggle(), { desc = "Toggle koma-overview" })
```

| 辅助接口 | 用途 |
| :--- | :--- |
| `koma.env(key, val)` | 向 Koma 启动的子进程导出环境变量 |
| `koma.mode(name, spec)` | 定义子模式，通过 `koma.act.mode.enter(name)` 进入、`koma.act.mode.exit()` 退出 |
| `koma.on(event, fn)` | 注册生命周期事件回调 |
| `koma.macro.define(spec)` | 定义参数化 GUI 宏并暴露给 `koma-mcp` |

## 动态状态查询与事件钩子（`MacroContext`、`koma.on`）

按键回调函数与 `koma.on` 监听器都会收到只读上下文快照 `ctx`（`MacroContext`）。受保护窗口的 `app_id` 与 `title` 会自动脱敏为 `"[protected]"`，无头工作区中的窗口不会出现在常规桌面查询中：

- `ctx:focused_window()` — 返回当前聚焦窗口信息表（`id`、`app_id`、`title`、`workspace`、`floating`、`fullscreen`、`focused`）或 `nil`。
- `ctx:windows()` / `ctx:outputs()` / `ctx:workspaces()` — 返回可见窗口、显示器输出与工作区列表。
- `ctx:dispatch(action)` — 派发已编译的 `koma.act.*` 动作（例如 `koma.act.window.focus(win_id)` 或 `koma.act.workspace.set_layout(mode, workspace?)`；不允许在 `dispatch` 中嵌套 Lua 回调）。

`koma.on(event_name, function(ctx, event) ... end)` 支持的事件（最大嵌套深度为 `4`）：`"compositor.start"`、`"config.reloaded"`、`"window.mapped"`、`"window.closed"`、`"window.focused"`、`"workspace.focused"` 与 `"output.changed"`。

```lua
-- Run-or-Raise：已有 foot 则聚焦，否则启动新终端
koma.bind("Mod + Shift + T", function(ctx)
    for _, win in ipairs(ctx:windows()) do
        if win.app_id == "foot" then
            ctx:dispatch(koma.act.window.focus(win.id))
            return
        end
    end
    ctx:dispatch(koma.act.spawn({ "foot" }))
end, { desc = "Focus foot or launch it" })

-- 检测到超宽显示器时自动切换到 scrolling 布局
koma.on("output.changed", function(ctx, ev)
    if ev.width and ev.width >= 3440 then
        ctx:dispatch(koma.act.workspace.set_layout("scrolling"))
    end
end)
```
