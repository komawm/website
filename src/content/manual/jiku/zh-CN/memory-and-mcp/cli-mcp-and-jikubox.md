# 命令行、MCP 与 JikuBox

`jiku` 提供适合脚本编排与诊断的运维命令行工具，同时提供面向外部编码智能体的 stdio Model Context Protocol（MCP）服务端。

## 命令行参数与子命令

所有子命令前均可传入以下全局参数：

- `--config <PATH>` — 覆盖配置文件路径。
- `--policy <PATH>` — 覆盖 Lua 策略文件路径。
- `--socket <PATH>` — 覆盖 Koma IPC Socket 路径。
- `--json` — 输出机器可读的 JSON，而非人类可读文本。

可用的 `jiku` 子命令如下：

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

无需启动图形会话即可离线验证守护进程配置：

```bash
jikud --headless-check
```

## MCP 服务端（`jiku mcp`）

通过标准输入输出启动 `jiku mcp`，供外部智能体宿主或编辑器集成调用：

```bash
jiku mcp --print-tools
jiku mcp --stateless
```

服务端暴露以下七个工具：

| 工具名 | 用途 |
| :--- | :--- |
| `jiku_status` | 查询守护进程、Socket 与运行时状态。 |
| `jiku_run_task` | 通过 Jiku 执行管线提交任务。 |
| `jiku_decide` | 根据输入执行结构化判定请求。 |
| `jiku_plan` | 在执行前生成多步骤规划。 |
| `jiku_box_classify` | 通过 JikuBox 规则分类目录结构。 |
| `jiku_memory_search` | 检索本地全文历史与各层记忆。 |
| `jiku_skills_list` | 列出已安装与暂存的技能定义。 |

## JikuBox 与技能审批流程

`jiku box classify [<DIR>]` 会检查目标目录（默认为当前目录，通常用于 `~/JikuBox`），在规划前整理文件并汇总项目结构信息。

技能变更遵循显式审核门禁：使用 `jiku skills list` 查看技能，用 `jiku skills diff` 检查待审变更，用 `jiku skills stage <PATH>` 暂存本地修改，并通过 `jiku skills approve <NAME>` 启用已审核的技能。

完整实现源码见 [komawm/jiku 仓库](https://github.com/komawm/jiku)。
