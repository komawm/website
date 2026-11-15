# L0–L2 三层记忆与技能审批门禁

Jiku 通过 `jiku-memory` 将桌面交互经验本地持久化于 `~/.local/state/jiku/state.db`（SQLite WAL + FTS5），并通过严格的两阶段人类审批门禁隔离所有 AI 合成的候选技能。

## 三层记忆体系（`jiku-memory`）

| 记忆层级 | 存储介质 | 核心职责与配额 |
| :--- | :--- | :--- |
| **L0：感知 `dHash` 环形缓存** | 内存环形缓冲（默认 `l0_frame_ring_size = 32`） | 对 `Koma` 捕获帧计算 64 位感知 `dHash`；汉明距离 `<= 4` 的静止帧直接去重，零冗余模型调用 |
| **L1：应用特性记忆（`l1_app_quirks`）** | SQLite 表（单应用上限 `app_quirk_max_chars = 512`） | 记录特定 `app_id` 的交互习惯（如终端需 `Ctrl+Shift+V` 粘贴），按需注入规划上下文 |
| **L2：情景记忆（`l2_episodes`）** | SQLite WAL + FTS5 BM25 | 索引历史目标、动作轨迹与结果；支持通过 `jiku memory search <QUERY>` 毫秒级全文检索 |

## 候选技能两阶段审批与静态净化

当 `stage_new_skills = true` 时，Jiku 会在完成重复性任务后提炼可复用 Lua 或 Markdown SOP 技能，但 **绝不允许跳过人类审批直接执行**：

1. **暂存与静态词法净化**：候选技能先存入 `~/.local/state/jiku/state.db` 的 `staged_skills` 表（`status = 'staged'`），静态校验严格拦截 `io.*`、`os.*`、`debug.*`、`package.*`、`loadfile`、`dofile`、`load(` 与 `require(`。
2. **人类 Diff 审查（`jiku skills diff`）**：逐行核查候选技能变更：
   ```bash
   jiku skills list
   jiku skills diff <skill_id>
   ```
3. **显式批准晋升（`jiku skills approve`）**：仅当人类明确批准后，技能才会被写入 `~/.config/jiku/skills/` 并记录审计日志：
   ```bash
   jiku skills approve <skill_id>
   ```
