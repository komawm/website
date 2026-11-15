# 会话启动与默认快捷键

> [!NOTE]
> 当 `koma.input` 中保持默认的 `inherit_default_binds = true` 时，Koma 开箱即内置一套兼容 Hyprland 肌肉记忆的默认键位表。你在 `init.lua` 中调用 `koma.bind(...)` 只会原地覆盖同名组合键，不会清空其余默认快捷键；若需移除单个默认键位可调用 `koma.unbind(chord)`。

## 嵌套窗口预览与 TTY 启动

调优配置或测试脚本时，可在现有 Wayland 会话内以 `--winit` 嵌套窗口模式启动，或在隔离虚拟机终端使用 `--tty` 启动：

```bash
# 启动前静态校验 Lua 配置与执行配额
komactl validate ~/.config/koma/init.lua

# 在现有 Wayland 桌面中以嵌套窗口运行
koma --winit --config ~/.config/koma/init.lua

# 在隔离 VM 的 TTY 会话中启动并拉起 foot 终端
koma --tty --spawn foot
```

## 内置默认快捷键速查

| 快捷键组合 | 默认动作 | 备注说明 |
| :--- | :--- | :--- |
| `Mod + Return` | 启动终端（`foot`） | 可通过 `koma.bind` 替换为 Ghostty 等 |
| `Mod + Q` | 关闭当前聚焦窗口 | 发送标准 Wayland 关闭请求 |
| `Mod + H / J / K / L` | 四向移动焦点 | 同时兼容 Dwindle 树与 Scrolling 滚动列 |
| `Mod + Shift + H / J / K / L` | 移动窗口或调整列位置 | 保持确定性布局树不变量 |
| `Mod + V` / `Mod + F` | 切换浮动层 / 全屏状态 | 单窗口状态平滑过渡 |
| `Mod + S` | 呼出或收起 `special` 暂存区 | 独立 Scratchpad 覆盖层 |
| `Mod + G` | 人类最高优先级抢占屏障 | 低于 1ms 立即吊销 Agent 当前 Epoch 租约 |
| `Mod + 1..9` | 切换至工作区 `1..9` | 支持多显示器独立工作区绑定 |
