# jiku 命令行、MCP 服务与 JikuBox

`jiku` 同时提供可脚本化的运维命令行工具与基于标准输入输出的 Model Context Protocol（MCP）服务端，用于工作区检查、策略校验与技能审批。

## 运维命令行

所有子命令均支持以下全局参数：

- `--config <PATH>` — 指定配置文件路径。
- `--policy <PATH>` — 指定安全策略文件路径。
- `--socket <PATH>` — 指定 Koma IPC Socket 路径。
- `--json` — 输出机器可读的 JSON 格式。

当前仓库内已实现的 `jiku` 子命令如下：

```bash
jiku status
jiku validate-config
jiku decide "<prompt>"
jiku plan "<goal>"
jiku run "<task>"
jiku box classify [<DIR>]
jiku memory search "<QUERY>"
jiku skills list
jiku skills diff
jiku skills stage <PATH>
jiku skills approve <NAME>
```

无头守护进程可通过以下命令在不启动图形会话的前提下检查配置：

```bash
jikud --headless-check
```

## MCP 服务端

通过标准输入输出启动 MCP 服务或列出工具定义：

```bash
jiku mcp --print-tools
jiku mcp --stateless
```

服务暴露以下七个工具：

| 工具名 | 用途 |
| --- | --- |
| `jiku_status` | 查询守护进程、Socket 与运行时状态。 |
| `jiku_run_task` | 通过 Jiku 执行管线提交任务。 |
| `jiku_decide` | 根据输入生成结构化决策。 |
| `jiku_plan` | 在执行前生成多步骤规划。 |
| `jiku_box_classify` | 通过 JikuBox 启发式识别项目目录结构。 |
| `jiku_memory_search` | 检索本地分层记忆。 |
| `jiku_skills_list` | 列出已安装与暂存的技能定义。 |

## JikuBox 与技能审批流

`jiku box classify` 在规划开始前识别目标目录（默认为当前工作目录）的项目结构与上下文元数据。

技能变更采用显式审查流程：通过 `jiku skills list` 查看技能，`jiku skills diff` 检查差异，`jiku skills stage` 暂存修改，并通过 `jiku skills approve` 批准启用。

完整源码请查阅 [komawm/jiku 仓库](https://github.com/komawm/jiku)。
