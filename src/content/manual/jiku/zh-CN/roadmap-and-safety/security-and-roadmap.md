# 权限控制与后续计划

Jiku 明确区分当前 `v0.0.x` 版本中已经实现的权限与隔离控制，以及规划在 `v0.1.0` 落地的功能项。

## 已实现的权限与控制（`v0.0.x`）

- **内存安全实现**：守护进程与命令行工具的代码实现中避免裸指针 FFI 与不安全内存块。
- **受限 Socket 与 Epoch 隔离**：`jikud` 通过本地控制 Socket `koma-agent.sock` 和受限的 `CapabilityToken`（由 `komactl token mint jiku` 签发）与 Koma 通信，不暴露未鉴权的 TCP 端口。输入动作必须附带 `expected_epoch`，一旦人类抢占输入（`4091 ERR_HUMAN_PREEMPTED`）、工作区状态变更（`4090 ERR_STALE_EPOCH`）或遇到受保护窗口（`4032 ERR_PROTECTED_SURFACE`）会立即中止操作。
- **Lua 策略沙箱与技能审核**：`~/.config/jiku/init.lua` 运行在禁用系统调用和文件原语的 Lua 5.4 受限环境中；生成的技能必须通过静态检查（拦截 `io.*`、`os.*`、`debug.*`、`package.*`、`loadfile`、`dofile`、`load(` 与 `require(`）以及 `jiku skills diff` / `jiku skills approve` 流程后才能生效。
- **离线配置检查**：`jiku validate-config` 与 `jikud --headless-check` 可在启动会话前校验配置和策略语法。

## 版本范围说明：`v0.0.1` 与规划中的 `v0.1.0`

- **`v0.0.1`（当前范围）**：包含可选的 `jikud` 守护进程、`jiku` 命令行、`jiku mcp` stdio 服务、`config.toml` 与 `init.lua` 配置、`~/JikuBox` 目录分类、本地全文历史检索以及技能暂存审批。**`v0.0.1` 不包含桌面吉祥物、虚拟形象叠加层或 PipeWire 实时语音输入输出。**
- **规划中的 `v0.1.0`（在 [komawm/jiku Issues](https://github.com/komawm/jiku/issues) 中跟踪，尚未发布）**：
  - **桌面虚拟形象管线**：基于 Wayland layer-shell 的形象渲染，计划支持 `VRM`、`MMD`、`Live2D Cubism` 与 `Inochi2D` 模型（`v0.0.x` 阶段暂缓）。
  - **PipeWire 实时音频采集**：用于实时语音会话与口型同步的 PipeWire 音频输入。
  - **Linux Landlock + Seccomp 沙箱**：由内核强制执行的文件系统与系统调用限制，用于约束守护进程工作单元与外部技能子进程。

相关规范与协议约定请参考 [komawm/docs](https://github.com/komawm/docs) 与 [komawm.org/jiku](https://komawm.org/jiku/)。
