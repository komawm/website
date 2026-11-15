# Lua 沙箱、布局与视觉外观

Koma 通过纯 Rust 编写的无栈 Lua 5.4 运行时 [Phodopus](https://github.com/Xuepoo/phodopus)（`koma-lua`）加载 `~/.config/koma/init.lua`。

![Koma 横向滚动工作区布局预览](/placeholders/koma-scrolling.webp "Scrolling 连续横向滚动列布局与多列焦点预览。")

## Phodopus 沙箱配额与原子热重载

- **确定性资源熔断**：每次求值与回调均受单调指令燃料（Instruction Fuel）与严格堆内存上限（默认 `DEFAULT_HEAP_LIMIT_BYTES = 4 MiB`）约束，且剥离 `io`、`os`、`debug`、`package` 等 OS 库，彻底杜绝配置脚本死循环卡死显示服务器。
- **影子注册表原子切换**：执行 `komactl reload`、修改配置触发文件监控或按下 `Mod + Shift + R` 时，新配置先在影子沙箱内完整求值并校验所有正则与手势。一旦失败，线上工作区状态保持原样不动。
- **离线预检**：可在保存后先运行 `komactl validate` 查看识别到的显示器、工作区、快捷键、手势与规则数量。

## 布局引擎（`koma.layout`、`koma.workspace`、`koma.dwindle`、`koma.scrolling`）

有头工作区默认采用 `"dwindle"`，支持全局或按工作区单独切换 `"dwindle"`、`"scrolling"`、`"deck"` 或 `"bsp"`：

```lua
koma.layout("dwindle") -- "dwindle" | "scrolling" | "deck" | "bsp"

koma.dwindle({
    force_split = 0,         -- 0 = 随指针/宽高比自动分割, 1 = 左/上, 2 = 右/下
    preserve_split = true,
    smart_split = true,
    default_split_ratio = 1.0,
    inner_gap = 6,
    outer_gap = 10,
})

koma.scrolling({
    preset_column_widths = { 0.3333, 0.5, 0.6667 },
    default_column_width = { proportion = 0.5 },
    default_column_display = "normal", -- "normal" | "tabbed"
    center_focused_column = "never",   -- "never" | "always" | "on_overflow"
    camera_damping_ratio = 1.0,
    camera_stiffness = 550.0,
    inner_gap = 8,
    outer_gap = 12,
    edge_auto_scroll = { enabled = true, trigger_width = 48, delay_ms = 120, max_speed = 900 },
})

koma.workspace({ name = "1", layout = "dwindle", gaps_in = 6, gaps_out = 10 })
koma.workspace({ name = "2", layout = "scrolling" })
koma.workspace({ name = "agent:work", presentation = "headless", layout = "deck" })
```

## 视觉外观与弹簧物理（`koma.appearance`）

`koma.appearance({...})` 的全部字段均具备类型化默认值，支持按需增量覆盖：

```lua
koma.appearance({
    corner_radius = 10,
    border = {
        enabled = true,
        width = 2.0,
        active_color = "#7aa2f7",
        inactive_color = "#3b4261",
        agent_leased_color = "#9ece6a",  -- 智能体持有 Epoch 租约时的专属边框色
        human_preempt_color = "#f7768e", -- 按下 Mod + G 人类接管时的提示色
    },
    focus_ring = { enabled = false, width = 2.0, active_color = "#7dcfff", inactive_color = "#24283b" },
    shadow = {
        enabled = true,
        range = 18,
        render_power = 3,
        sharp = false,
        color = "#00000073",
        inactive_color = "#00000040",
        offset_x = 0.0,
        offset_y = 4.0,
        scale = 1.0,
    },
    dim = { dim_inactive = false, dim_strength = 0.15, brightness = 1.0, contrast = 1.0 },
    blur = {
        enabled = true,
        size = 6,
        passes = 2,
        noise = 0.015,
        contrast = 1.0,
        brightness = 1.0,
        vibrancy = 0.18,
        xray = false,
        ignore_opacity = false,
    },
    animations = {
        enabled = true,
        damping_ratio = 0.9,
        stiffness = 420.0,
        epsilon = 0.5,
        open_scale_from = 0.92,
        close_scale_to = 0.92,
    },
})
```

## 增量键位覆盖、解绑与子模式

默认 `inherit_default_binds = true` 会加载完整内置键位表；`koma.bind(...)` 按键位原地覆盖，`koma.unbind(chord)` 可移除指定默认键位：

```lua
koma.unbind("Mod + Return")
koma.bind("Mod + Return", koma.act.spawn({ "foot" }), { desc = "Launch foot" })
koma.bind("Mod + O", koma.act.overview.toggle(), { desc = "Toggle koma-overview" })
```

| 辅助 API | 用途说明 |
| :--- | :--- |
| `koma.env(key, val)` | 向 Koma 派生的子进程注入环境变量 |
| `koma.mode(name, spec)` | 定义可通过 `koma.act.mode` 切换的快捷键子模式 |
| `koma.on(event, fn)` | 注册受指令配额保护的生命周期事件回调 |
| `koma.macro.define(spec)` | 定义零 Token 参数化 GUI 宏并动态暴露给 `koma-mcp` |

## 实时桌面快照查询（`MacroContext`）与生命周期钩子（`koma.on`）

快捷键回调与 `koma.on` 监听器会收到由 Ring 0 预先捕获的只读 `DesktopQuerySnapshot` 支撑的 `ctx`（`MacroContext`）。受保护窗口的标题会被自动脱敏为 `"[protected]"`，且无头离屏智能体工作区（`Offscreen`）窗口对人类侧快照不可见：

- `ctx:focused_window()` — 返回当前聚焦窗口信息表（`id`、`app_id`、`title`、`workspace`、`floating`、`fullscreen`、`focused`）或 `nil`。
- `ctx:windows()` / `ctx:outputs()` / `ctx:workspaces()` — 返回作用域内的窗口、输出显示器与工作区只读列表。
- `ctx:dispatch(action)` — 提交任意已编译的 `koma.act.*` 动作（如 `koma.act.window.focus(win_id)` 与 `koma.act.workspace.set_layout(mode, workspace?)`；禁止嵌套 Lua 回调）。

Ring 0 支持的规范 `koma.on(event_name, function(ctx, event) ... end)` 事件（最大递归深度 `4`）：`"compositor.start"`、`"config.reloaded"`、`"window.mapped"`、`"window.closed"`、`"window.focused"`、`"workspace.focused"` 与 `"output.changed"`。

```lua
-- Run-or-Raise：已有 foot 则直接聚焦，否则启动新终端
koma.bind("Mod + Shift + T", function(ctx)
    for _, win in ipairs(ctx:windows()) do
        if win.app_id == "foot" then
            ctx:dispatch(koma.act.window.focus(win.id))
            return
        end
    end
    ctx:dispatch(koma.act.spawn({ "foot" }))
end, { desc = "Focus foot or launch it" })

-- 检测到超宽带鱼屏接入或变更时自动切换为 scrolling 横向布局
koma.on("output.changed", function(ctx, ev)
    if ev.width and ev.width >= 3440 then
        ctx:dispatch(koma.act.workspace.set_layout("scrolling"))
    end
end)
```
