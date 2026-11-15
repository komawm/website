# 双通道套接字、Epoch 租约与 MCP

Koma 在 `$XDG_RUNTIME_DIR` 下将人类管理指令与自动化 Agent 通道从物理套接字层面彻底分离：

- **`koma-admin.sock`**：仅供 `komactl` 使用，负责配置热重载、工作区控制与状态诊断。
- **`koma-agent.sock`**：面向 `koma-mcp` 或 [Jiku](/zh-CN/jiku/)（`jikud`）的受限能力通道。屏幕帧通过密封 `memfd`（`SCM_RIGHTS`）零拷贝传递，所有虚拟座席操作均强制校验单调递增的 `Epoch` 纪元号。

> [!NOTE]
> 当你按下 `Mod + G` 或主动介入当前租约工作区时，合成器会在亚毫秒内递增 `Epoch` 并清空虚拟按键账本；滞留在途的旧纪元 Agent 指令会立即以 `ErrStaleEpoch` 安全拒绝。
