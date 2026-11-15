# Permissions & Roadmap

Jiku separates implemented permission and isolation controls in `v0.0.x` from capabilities planned for `v0.1.0`.

## Implemented Permissions & Controls (`v0.0.x`)

- **Memory-Safe Implementation**: The daemon and CLI codebase avoids raw pointer FFI and unsafe memory blocks.
- **Scoped Socket & Epoch Controls**: `jikud` connects to Koma over the local `koma-agent.sock` control socket using a scoped `CapabilityToken` (`komactl token mint jiku`) instead of exposing unauthenticated TCP listeners. Input commands include `expected_epoch`, halting immediately on human preemption (`4091 ERR_HUMAN_PREEMPTED`), state drift (`4090 ERR_STALE_EPOCH`), or protected windows (`4032 ERR_PROTECTED_SURFACE`).
- **Sandboxed Lua Policy & Skill Review**: `~/.config/jiku/init.lua` executes in a restricted Lua 5.4 runtime with OS and filesystem primitives disabled. Generated skills undergo static checks (rejecting `io.*`, `os.*`, `debug.*`, `package.*`, `loadfile`, `dofile`, `load(`, and `require(`) and require `jiku skills diff` and `jiku skills approve` before activation.
- **Offline Validation**: `jiku validate-config` and `jikud --headless-check` verify config and policy syntax before launching a live session.

## Release Scope: `v0.0.1` vs Planned `v0.1.0`

- **`v0.0.1` (Current Scope)**: Includes the optional `jikud` daemon, `jiku` CLI, `jiku mcp` stdio server, `config.toml` and `init.lua` configuration, `~/JikuBox` classification, full-text local history search, and staged skill review. **No desktop mascot, avatar overlay, or live PipeWire voice I/O ships in `v0.0.1`.**
- **Planned for `v0.1.0` (Tracked in [komawm/jiku Issues](https://github.com/komawm/jiku/issues), Not Yet Shipped)**:
  - **Desktop Avatar Pipeline**: Wayland layer-shell avatar rendering supporting `VRM`, `MMD`, `Live2D Cubism`, and `Inochi2D` models (deferred during `v0.0.x`).
  - **PipeWire Live Audio Capture**: Real-time PipeWire audio input for live voice sessions and speech synchronization.
  - **Linux Landlock + Seccomp Sandbox**: Kernel-enforced filesystem and syscall confinement for daemon workers and skill subprocesses.

For specifications and protocol contracts, see [komawm/docs](https://github.com/komawm/docs) and [komawm.org/jiku](https://komawm.org/jiku/).
