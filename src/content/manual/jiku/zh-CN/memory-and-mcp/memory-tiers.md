# 记忆检索与技能

Jiku 将会话状态与本地全文历史保存在 `~/.local/state/jiku/state.db`，并要求所有生成的技能经过人工审查后才能启用。

![在 Koma 终端中检索 Jiku 本地历史与查看技能状态](https://cdn.komawm.org/media/jiku-terminal.webp "在终端中运行 Jiku 历史检索与技能状态查看命令。")

## 本地记忆分层

| 层级 | 存储位置 | 用途与限制 |
| :--- | :--- | :--- |
| **L0：画面去重环** | 内存环形缓冲（`l0_frame_ring_size`，默认 `32`） | 对 Koma 捕获的屏幕截图计算 64 位 `dHash`，汉明距离在 `perceptual_hash_threshold = 4` 位以内的静止画面直接跳过，不触发模型调用 |
| **L1：应用习惯（`l1_app_quirks`）** | 本地数据库表（单条上限 `app_quirk_max_chars = 512`） | 记录各 `app_id` 的交互细节（如终端需使用 `Ctrl+Shift+V` 粘贴），并注入规划提示词 |
| **L2：情景历史（`l2_episodes`）** | 本地全文索引 | 索引过往任务目标、动作结果与工作区轨迹，可通过 `jiku memory search <QUERY>` 离线检索 |

## 技能两阶段审批与静态检查

当 `stage_new_skills = true` 时，Jiku 会在多步工作流结束后提炼可复用的 Lua 或 Markdown SOP 技能，但 **绝不会自动执行未经批准的技能**：

1. **暂存与静态清洗**：候选脚本写入 `~/.local/state/jiku/state.db` 的 `staged_skills` 表（`status = 'staged'`），静态检查会拦截包含 `io.*`、`os.*`、`debug.*`、`package.*`、`loadfile`、`dofile`、`load(` 或 `require(` 的脚本。
2. **人工 Diff 审查（`jiku skills diff`）**：启用前逐项核对暂存变更：
   ```bash
   jiku skills list
   jiku skills diff <skill_id>
   ```
3. **显式批准（`jiku skills approve`）**：批准后技能会移至 `~/.config/jiku/skills/`（`status = 'approved'`）并记录审计日志：
   ```bash
   jiku skills approve <skill_id>
   ```

## 小上下文预算与四阶段压缩瀑布

针对紧凑本地模型（如 `llama-server` 上 `4096`–`8192` Token 窗口的 `Qwen3VL-2B-Instruct-Q4_K_M`），当提示词估算超出 `compaction_trigger_ratio`（`0.72`）时，`context_budget` 会按确定性顺序执行四阶段压缩，同时保证 `min_output_tokens`（`256`）至 `reserved_output_tokens`（`768`）的回复空间：

1. **`stage1_visual_roi_pruning`**：仅保留最新的 `keep_recent_images`（`1`）张截图（每张按 `image_token_estimate = 512` 估算），丢弃历史冗余图像帧。
2. **`stage2_a11y_skeleton_folding`**：将冗长的 AT-SPI2 子树折叠为最多 `a11y_max_entries_small_ctx`（`28`）个最相关的可交互 `@snap:eN` 节点。
3. **`stage3_episodic_l1_folding`**：压缩较早轮次的对话并裁剪 `l1_app_quirks` / L2 记忆片段，同时完整保留 `[context]`、`[cursor]` 与 `[a11y]` 锚定头部信息。
4. **输出预留钳位**：将 `max_output_tokens` 稳妥收敛在剩余安全余量（`64` Token）以内。

可通过 `jiku context inspect` 离线检验压缩结果：在实测的 `4096`-token 预算检查中，`5031` Token 的输入载荷被压缩至 `2943` Token（`clamped_max_output_tokens = 768`、`dropped_images = 2`、`truncated_a11y_nodes = 36`）。
