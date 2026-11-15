# L0–L2 三层记忆与技能审批门禁

`jiku-memory` 使用单文件 `~/.local/state/jiku/state.db`（SQLite WAL + FTS5 BM25）管理本地状态，无需部署任何外部向量数据库服务：

- **L0 感知哈希帧环**：内存中定长保存最近数帧界面快照与 `dHash` 指纹，快速识别画面是否变化，避免无效重复请求。
- **L1 应用特性卡片（Quirk Notes）**：按 Wayland `app_id` 冻结的轻量界面操作备忘，保持上下文前缀稳定以命中大模型 Prompt Cache。
- **L2 轨迹全文检索与技能审批门禁**：基于 FTS5 的历史轨迹检索（`jiku memory search`），所有自动提炼的候选 Lua 技能均先进入隔离暂存区，必须由人工执行 `jiku skills diff` 与 `jiku skills approve` 审阅后方可晋升生效。
