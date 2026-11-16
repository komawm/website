# Permissions & Roadmap

Jiku separates implemented permission and isolation controls in `v0.0.x` from capabilities planned for `v0.1.0`.

## Implemented Permissions & Controls (`v0.0.x`)

- **Memory-Safe Implementation**: The daemon and CLI codebase avoids raw pointer FFI and unsafe memory blocks.
- **Scoped Socket & Epoch Controls**: `jikud` connects to Koma over the local `koma-agent.sock` control socket using a scoped `CapabilityToken` (`komactl token mint jiku`) instead of exposing unauthenticated TCP listeners. Input commands include `expected_epoch`, halting immediately on human preemption (`4091 ERR_HUMAN_PREEMPTED`), state drift (`4090 ERR_STALE_EPOCH`), or protected windows (`4032 ERR_PROTECTED_SURFACE`).
- **Sandboxed Lua Policy & Skill Review**: `~/.config/jiku/init.lua` executes in a restricted Lua 5.4 runtime with OS and filesystem primitives disabled. Generated skills undergo static checks (rejecting `io.*`, `os.*`, `debug.*`, `package.*`, `loadfile`, `dofile`, `load(`, and `require(`) and require `jiku skills diff` and `jiku skills approve` before activation.
- **Offline Validation**: `jiku validate-config` and `jikud --headless-check` verify config and policy syntax before launching a live session.

## 2x2 `VirtualPaint` Ablation: Decision Model vs. Grounding

Reproducible `jiku bench run` benchmarks measure the effect of optional Decision Model gating alongside `SystemGroundingPack` UI grounding (`4` tasks across `16` trials in live mode):

| Suite / Condition | Pass Rate | Mean Hit Error | Mean Chamfer Error | Wasted Actions |
| :--- | :--- | :--- | :--- | :--- |
| **Offline `NoDecision + MinimalRaw`** | `0/4` | `69.64 px` | `136.46 px` | `9` |
| **Offline `Decision + EnrichedGrounding`** | `4/4` | `0.00 px` | `1.52 px` | `0` |
| **Live local 2B VLM (`4096` ctx)** | `1/4` per cell (`16/16` trials completed) | `1209–2331 ms` avg latency | — | Conservative 2B VLM safety false positives (`False Pos = true`) |

![Decision + Enriched Grounding VirtualPaint ablation render](https://cdn.komawm.org/media/v0.0.1/ablation-decision-enriched.png "VirtualPaint output with Decision gating and SystemGroundingPack spatial grounding (4/4 pass, 1.52 px chamfer).")

![No-Decision + Minimal Raw VirtualPaint ablation render](https://cdn.komawm.org/media/v0.0.1/ablation-nodecision-minimal.png "Baseline VirtualPaint output without Decision gating or enriched grounding (0/4 pass, 136.46 px chamfer).")

## Release Scope: `v0.0.1` vs Planned `v0.1.0`

- **`v0.0.1` (Current Scope)**: Includes the optional `jikud` daemon, `jiku` CLI, dual-framing 12-tool `jiku mcp` stdio server, `config.toml` (`[context]`, `[tts]`, `[avatar]`) and `init.lua`, `jiku a11y` AT-SPI2 grounding, 4-stage `context_budget` compaction, `jiku bench run`, modular `jiku-tts` synthesis + 20 ms lip-sync, WebSocket `jiku avatar serve` VRM stage, `~/JikuBox` classification, full-text local history search, and staged skill review. **Native Wayland layer-shell mascot overlays, live PipeWire microphone capture, and kernel Landlock/seccomp sandboxing do not ship in `v0.0.1`.**
- **Planned for `v0.1.0` (Tracked in [komawm/jiku Issues](https://github.com/komawm/jiku/issues), Not Yet Shipped)**:
  - **Native Wayland Layer-Shell Avatar Overlays**: Direct compositor layer-shell rendering for `MMD` and `Inochi2D` companions (complementing the browser-hosted `jiku avatar serve` WebSocket VRM stage).
  - **PipeWire Full-Duplex Microphone Input**: Real-time PipeWire hardware microphone capture for interactive `jiku live` voice sessions (`AudioPlaybackSink` TTS playout already ships in `v0.0.1`).
  - **Linux Landlock + Seccomp Sandbox**: Kernel-enforced filesystem and syscall confinement for daemon workers and skill subprocesses.

For specifications and protocol contracts, see [komawm/docs](https://github.com/komawm/docs) and [komawm.org/jiku](https://komawm.org/jiku/).
