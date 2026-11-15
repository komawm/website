# 诊断与常见排障指南

本文汇总了运行或测试 Koma 时最常见的座席权限、DRM 渲染、Lua 配置重载、中文输入法（IME）与 XWayland 排障方法。

## 1. `koma --tty` 无法打开座席或获取 DRM Master

**常见现象**：`libseat` 启动失败或 DRM 报 `Permission denied` / `Not master`。

- **检查座席守护进程**：在不使用 `systemd-logind` 的环境（如极简系统、VM 或 FreeBSD）中，确认 `seatd` 已启动，且当前用户属于 `seat` / `video` / `input` 用户组（执行 `id -nG` 检查）。
- **勿在现有图形桌面终端内直接执行 `--tty`**：已有合成器占用 DRM Master 时会导致抢占冲突。请切换到空闲 TTY（如 `Ctrl+Alt+F3`）执行 `koma --tty`，或在当前桌面内使用 `koma --winit`。
- **QEMU/KVM 虚拟机**：使用 `-device virtio-vga` 配合 `seatd` 与 Mesa `llvmpipe` 可稳定完成无头/串口验证。

## 2. 软件渲染（`llvmpipe`）与硬件 GPU 区分

- 当虚拟机 `virtio-vga` 无硬件 3D 加速时，Koma 会自动回退到 Mesa `llvmpipe` 软件 EGL。
- 启动时附加 `RUST_LOG=info koma --winit` 可观察实际加载的 `GL Renderer` 与显示模式。
- 在软件渲染或低功耗设备上，可关闭多通道模糊与阴影以降低 CPU 开销：
  ```lua
  koma.appearance({ blur = { enabled = false }, shadow = { enabled = false } })
  ```

## 3. 从异常的 `init.lua` 配置恢复

- 每次修改配置后先执行离线沙箱校验：
  ```bash
  komactl validate ~/.config/koma/init.lua
  ```
- 由于 `komactl reload` 先在 Phodopus 影子沙箱中求值，语法错误、正则错误或死循环都会被燃料配额拦截，线上状态不会被破坏，可通过 `komactl config-status` 查看具体报错行。
- 若开机配置损坏导致无法启动，可临时运行 `koma -c /dev/null` 使用内置默认快捷键启动桌面再修复配置文件。

## 4. `komactl` 提示找不到 `koma-admin.sock`

- 确认 `$XDG_RUNTIME_DIR` 指向当前用户的 `0700` 运行时目录（例如 `/run/user/1000`）。
- 查看活跃实例套接字：
  ```bash
  ls -la "$XDG_RUNTIME_DIR/koma/"
  ```
- 当同时运行多个嵌套实例时，导出 `export KOMA_INSTANCE_SIGNATURE=<目录名>` 指定目标实例。

## 5. `Fcitx5` / `IBus` 在 Chromium / Electron 中无法呼出候选框

- Koma 原生提供 `text-input-v3`、`input-method-v2` 与 `virtual-keyboard-v1`。
- 请为 Chromium / Electron 应用附加 Wayland IME 参数：
  ```bash
  chromium --ozone-platform=wayland --enable-wayland-ime
  ```
- 确认 `fcitx5 -d` 在同一个 `WAYLAND_DISPLAY` 会话中启动。

## 6. 传统 X11 应用无法启动（`xwayland-satellite`）

- 检查 `$PATH` 中是否已安装 `xwayland-satellite`（或在 `init.lua` 中显式配置 `koma.xwayland({ enabled = true, path = "..." })`）。
- 当启用 `isolate_agent_workspaces = true` 时，X11 应用将被刻意禁止进入智能体无头工作区。
