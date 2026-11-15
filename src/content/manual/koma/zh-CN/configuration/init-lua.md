# 布局模式、视觉外观与增量覆盖

Koma 通过内嵌的纯 Rust 无栈 Lua 5.4 运行时 [Phodopus](https://github.com/Xuepoo/phodopus) 加载 `~/.config/koma/init.lua`。每次配置求值与事件回调都受严格的单调指令配额（Instruction Fuel）与内存上限保护，彻底杜绝配置死循环卡死 Wayland 显示服务器的风险。

![Koma 横向滚动工作区布局预览](/placeholders/koma-scrolling.webp "Scrolling 连续横向滚动列布局占位预览。")

## 全局与分工作区多模态布局

图形工作区默认采用 `"dwindle"` 螺旋平铺，同时原生支持忠于 Niri 手感的 `"scrolling"` 无限横向滚动列（含预设列宽切换、单列多窗垂直堆叠、`consume_or_expel` 吞吐操作与三指触控板惯性追踪），可按工作区自由混搭：

```lua
-- ~/.config/koma/init.lua
koma.layout("dwindle")

koma.workspace({
  name = "2",
  layout = "scrolling",
  gaps = { inner = 8, outer = 14 },
})

koma.scrolling({
  preset_column_widths = { 0.333, 0.5, 0.667 },
  center_focused_column = "on_overflow",
})
```

## 类型化外观、Dual-Kawase 模糊与弹簧动画

`koma.appearance({...})` 提供完整的默认回退结构，可精细定制 `#CBDCEB` 冰青焦点边框、Agent 租约边框提示色、Dual-Kawase 毛玻璃模糊以及临界阻尼弹簧曲线：

```lua
koma.appearance({
  corner_radius = 12,
  border = {
    enabled = true,
    width = 2,
    active_color = "#CBDCEB",
    inactive_color = "#2A394D",
    agent_leased_color = "#7AA8D6",
    human_preempt_color = "#E07A5F",
  },
  blur = {
    enabled = true,
    passes = 3,
    radius = 6.0,
  },
  animations = {
    enabled = true,
    stiffness = 420.0,
    damping_ratio = 1.0,
  },
})
```
