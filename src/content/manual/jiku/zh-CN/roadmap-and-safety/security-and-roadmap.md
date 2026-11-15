# 零 Unsafe 安全边界与 v0.1.0 路线图

![Jiku 桌面角色预览](/placeholders/jiku-kumiko.webp)

Jiku 明确区分当前代码库已经落地的安全边界与尚在规划中的 `v0.1.0` 里程碑功能。

## 当前安全现状（已实现）

- **全量零 `unsafe` Rust**：`komawm/jiku` 工作区启用 `#![forbid(unsafe_code)]`，在编排守护进程与 CLI 中彻底禁用裸指针算术与不安全 FFI 封装。
- **显式策略与技能审查门禁**：通过 `jiku validate-config`、`jikud --headless-check` 以及 `skills list` / `diff` / `stage` / `approve` 流程，确保配置与技能变更经过校验后再生效。
- **受限 IPC 通信边界**：Jiku 通过专用本地控制 Socket 与 Koma 通信，不默认暴露未鉴权的 TCP 监听端口。

## 规划中的 `v0.1.0` 路线图（已跟踪，尚未发布）

以下能力记录在 [komawm/jiku Issues](https://github.com/komawm/jiku/issues) 的 `v0.1.0` 里程碑中，当前仅作路线图说明，不代表已发布特性：

- **多格式虚拟形象管线**：基于 Wayland layer-shell 的桌面角色渲染，规划支持 `VRM`、`MMD`、`Live2D Cubism` 与 `Inochi2D` 模型（`v0.0.x` 孵化阶段暂缓）。
- **PipeWire 实时音频采集**：用于语音交互与口型同步的 PipeWire 实时音频输入管线。
- **Linux Landlock + Seccomp 沙箱**：由内核强制执行的文件系统与系统调用隔离，用于约束守护进程工作单元与外部技能子进程。

架构规范与协议约定请参考 [komawm/docs](https://github.com/komawm/docs) 与 [komawm.org/jiku](https://komawm.org/jiku/)。
