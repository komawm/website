# Dual Sockets, Epoch Leases & MCP

Koma splits human administrative control and automated GUI agent access across two physically distinct Unix domain sockets in `$XDG_RUNTIME_DIR`:

- **`koma-admin.sock`**: Used exclusively by `komactl` for configuration reload, layout switching, and administrative inspection.
- **`koma-agent.sock`**: Capability-scoped socket consumed by `koma-mcp` or [Jiku](/jiku/) (`jikud`). Frame captures transfer via sealed `memfd` (`SCM_RIGHTS`) with zero disk writes, while every virtual-seat action carries a monotonic `Epoch` token.

> [!NOTE]
> Pressing `Mod + G` or moving the physical pointer inside a leased workspace increments the workspace `Epoch` in sub-millisecond time, causing any in-flight agent input carrying a stale `Epoch` to fail closed with `ErrStaleEpoch` and automatically releasing held virtual keys.
