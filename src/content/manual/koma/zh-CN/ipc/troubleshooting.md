# 常见问题排查

本文汇总运行或测试 Koma 时常见的座席权限、DRM 渲染、Lua 配置恢复、IPC 套接字、输入法（IME）与 XWayland 问题的排查步骤。

## 1. `koma --tty` 无法打开座席或获取 DRM Master

**现象**：`libseat` 初始化失败，或 DRM 报错 `Permission denied` / `Not master`。

- **检查座席服务**：在没有 `systemd-logind` 的环境中（如极简系统、虚拟机或 FreeBSD），确认 `seatd` 正在运行（Arch/Debian 执行 `systemctl status seatd`，FreeBSD 执行 `service seatd status`），并用 `id -nG` 确认当前用户属于 `seat`、`video` 与 `input` 组。
- **避免在图形桌面终端中直接运行 `--tty`**：当前会话已占用 DRM Master 时会产生冲突。请切换到空闲 TTY（如 `Ctrl+Alt+F3`）执行 `koma --tty`，或在当前桌面中改用嵌套模式 `koma --winit`。
- **QEMU/KVM 虚拟机**：可使用 `-device virtio-vga` 搭配 `seatd` 与 Mesa `llvmpipe`。

## 2. 软件渲染（`llvmpipe`）与硬件 GPU

- 当缺少硬件 DRM/GBM 加速时（例如未开启 Virgl 的 `virtio-vga`），Koma 会自动回退到 Mesa `llvmpipe`。
- 可通过 `glxinfo -B`、`eglinfo` 或 `RUST_LOG=info koma --winit` 日志查看实际使用的 `GL Renderer`。
- 在软件渲染或低性能 GPU 上，建议在 `~/.config/koma/init.lua` 中关闭模糊和阴影以提升帧率：
  ```lua
  koma.appearance({ blur = { enabled = false }, shadow = { enabled = false } })
  ```

## 3. 从损坏的 `~/.config/koma/init.lua` 恢复

- 重载前先离线验证配置：
  ```bash
  komactl validate ~/.config/koma/init.lua
  ```
- `komactl reload` 会先在隔离沙箱中求值新配置；若存在语法错误、非法正则或死循环，错误会被拦截并记录到 `komactl config-status`，不会破坏当前已生效的快捷键和窗口布局。
- 若开机配置出错导致无法启动，可运行 `koma -c /dev/null`（或临时移走 `~/.config/koma/init.lua`）以内置默认配置启动后再修复。

## 4. `komactl` 找不到 `koma-admin.sock`

- 确认 `$XDG_RUNTIME_DIR` 已设置为当前用户的 `0700` 运行时目录（例如 `/run/user/1000`）。
- 查看当前活跃的 Koma 实例目录：
  ```bash
  ls -la "$XDG_RUNTIME_DIR/koma/"
  ```
- 若同时运行了多个嵌套实例，请在调用 `komactl` 前导出 `export KOMA_INSTANCE_SIGNATURE=<目录名>`。

## 5. `Fcitx5` / `IBus` 在 Chromium / Electron 中无法弹出候选框

- Koma 原生提供 `text-input-v3`、`input-method-v2` 与 `virtual-keyboard-v1` 协议。
- 为 Chromium / Electron 应用加上 Wayland IME 参数启动：
  ```bash
  chromium --ozone-platform=wayland --enable-wayland-ime
  ```
- 确认 `fcitx5 -d` 运行在同一个 `WAYLAND_DISPLAY` 会话中（通过 `koma --session` 或 `koma.act.spawn` 启动）。

## 6. X11 应用无法启动（`xwayland-satellite`）

- 确认 `$PATH` 中已安装 `xwayland-satellite`（或在 `~/.config/koma/init.lua` 中设置 `koma.xwayland({ enabled = true, path = "/path/to/xwayland-satellite" })`）。
- 当 `isolate_agent_workspaces = true`（默认开启）时，X11 客户端会被主动禁止映射到智能体租用的无头工作区中。
