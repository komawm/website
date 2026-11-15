# 权限控制与后续计划

Jiku 明确区分当前 `v0.0.x` 版本中已经实现的权限与隔离控制，以及规划在 `v0.1.0` 落地的功能项。

## 已实现的权限与控制（`v0.0.x`）

- **内存安全实现**：守护进程与命令行工具的代码实现中避免裸指针 FFI 与不安全内存块。
- **受限 Socket 与 Epoch 隔离**：`jikud` 通过本地控制 Socket `koma-agent.sock` 和受限的 `CapabilityToken`（由 `komactl token mint jiku` 签发）与 Koma 通信，不暴露未鉴权的 TCP 端口。输入动作必须附带 `expected_epoch`，一旦人类抢占输入（`4091 ERR_HUMAN_PREEMPTED`）、工作区状态变更（`4090 ERR_STALE_EPOCH`）或遇到受保护窗口（`4032 ERR_PROTECTED_SURFACE`）会立即中止操作。
- **Lua 策略沙箱与技能审核**：`~/.config/jiku/init.lua` 运行在禁用系统调用和文件原语的 Lua 5.4 受限环境中；生成的技能必须通过静态检查（拦截 `io.*`、`os.*`、`debug.*`、`package.*`、`loadfile`、`dofile`、`load(` 与 `require(`）以及 `jiku skills diff` / `jiku skills approve` 流程后才能生效。
- **离线配置检查**：`jiku validate-config` 与 `jikud --headless-check` 可在启动会话前校验配置和策略语法。

## 2x2 `VirtualPaint` 消融评测：决策模型 vs. 系统信息锚定

通过可复现的 `jiku bench run` 基准套件（涵盖 `4` 项绘图任务；在线模式运行 `16` 轮测试），量化对比可选决策门控与 `SystemGroundingPack` 空间锚定的实际差异：

| 测试集 / 条件 | 通过率 | 平均命中误差 | 平均倒角误差（Chamfer） | 无效动作 |
| :--- | :--- | :--- | :--- | :--- |
| **离线 `NoDecision + MinimalRaw`** | `0/4` | `69.64 px` | `136.46 px` | `9` |
| **离线 `Decision + EnrichedGrounding`** | `4/4` | `0.00 px` | `1.52 px` | `0` |
| **在线本地 `Qwen3VL-2B-Instruct-Q4_K_M`（`4096` ctx）** | 每组 `1/4`（`16/16` 次均完成） | 平均延迟 `1209–2331 ms` | — | 小参数 2B VLM 安全规则误报偏保守（`False Pos = true`） |

![启用决策模型与系统信息锚定的 VirtualPaint 消融成图](https://cdn.komawm.org/media/v0.0.1/ablation-decision-enriched.png "启用决策门控与 SystemGroundingPack 空间锚定后的 VirtualPaint 输出（4/4 通过，1.52 px 倒角误差）。")

![无决策模型与仅极简原始状态的 VirtualPaint 消融成图](https://cdn.komawm.org/media/v0.0.1/ablation-nodecision-minimal.png "未启用决策门控与系统锚定时的基线输出（0/4 通过，136.46 px 倒角误差）。")

## 版本范围说明：`v0.0.1` 与规划中的 `v0.1.0`

- **`v0.0.1`（当前范围）**：包含可选的 `jikud` 守护进程、`jiku` 命令行、支持双帧格式的 12 工具 `jiku mcp` stdio 服务、`config.toml`（`[context]`、`[tts]`、`[avatar]`）与 `init.lua` 配置、`jiku a11y` AT-SPI2 锚定、四阶段 `context_budget` 压缩、`jiku bench run` 模块化评测、模块化 `jiku-tts` 语音与 20 ms 口型提取、WebSocket `jiku avatar serve` VRM 舞台、`~/JikuBox` 目录分类、本地全文历史检索以及技能暂存审批。**`v0.0.1` 暂不包含原生 Wayland layer-shell 桌面虚拟形象叠加层、PipeWire 实时麦克风采集及内核态 Landlock/seccomp 强制沙箱。**
- **规划中的 `v0.1.0`（在 [komawm/jiku Issues](https://github.com/komawm/jiku/issues) 中跟踪，尚未发布）**：
  - **原生 Wayland Layer-Shell 虚拟形象叠加层**：面向 `MMD` 与 `Inochi2D` 模型的直接合成器层渲染（与当前浏览器承载的 `jiku avatar serve` WebSocket VRM 舞台互补）。
  - **PipeWire 全双工实时麦克风采集**：用于交互式 `jiku live` 实时语音对话的硬件音频输入（`AudioPlaybackSink` TTS 播放已在 `v0.0.1` 提供）。
  - **Linux Landlock + Seccomp 沙箱**：由内核强制执行的文件系统与系统调用限制，用于约束守护进程工作单元与外部技能子进程。

相关规范与协议约定请参考 [komawm/docs](https://github.com/komawm/docs) 与 [komawm.org/jiku](https://komawm.org/jiku/)。
