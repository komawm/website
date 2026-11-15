# Zero-Unsafe Safety & v0.1.0 Roadmap

![Jiku desktop mascot preview](/placeholders/jiku-kumiko.webp)

Jiku separates implemented safety guarantees in the current codebase from planned `v0.1.0` feature milestones.

## Current Safety Posture (Implemented)

- **Zero `unsafe` Rust**: The `komawm/jiku` workspace enforces `#![forbid(unsafe_code)]`, eliminating unsafe pointer arithmetic and raw FFI wrappers from the orchestration daemon and CLI.
- **Explicit Policy & Skill Gates**: `jiku validate-config`, `jikud --headless-check`, and the `skills list` / `diff` / `stage` / `approve` flow enforce deterministic validation before actions or skill edits take effect.
- **Scoped Socket & Path Controls**: Jiku communicates with Koma over the dedicated Wayland/IPC control socket rather than exposing raw unauthenticated TCP listeners.

## Planned `v0.1.0` Milestone Work (Tracked, Not Yet Shipped)

The following capabilities are tracked under the `v0.1.0` milestone in [komawm/jiku](https://github.com/komawm/jiku/issues) and must not be mistaken for already-shipped features:

- **Multi-Format Avatar & Live2D Pipeline**: Wayland layer-shell mascot rendering supporting `VRM`, `MMD`, `Live2D Cubism`, and `Inochi2D` models (deferred during `v0.0.x` incubation).
- **PipeWire Live Audio Capture**: Real-time PipeWire audio ingress for voice and lip-sync pipelines.
- **Linux Landlock + Seccomp Sandbox**: Kernel-enforced filesystem and syscall confinement for daemon workers and untrusted skill subprocesses.

For architecture specifications and protocol contracts, see [komawm/docs](https://github.com/komawm/docs) and the canonical site at [komawm.org/jiku](https://komawm.org/jiku/).
