# Home

Welcome to the **Koma** documentation.

Koma is a keyboard-driven Wayland tiling compositor written in Rust (`1.100.0`, Edition 2024) on top of `Smithay`. Feel free to start with [Installation & Channels](/docs/getting-started/installation/) or check hardware support in [ARM64, MacBook Linux & BSD](/docs/getting-started/platforms/). If you are looking to configure layouts, visual effects, or keybindings, see [Layouts, Appearance & Overrides](/docs/configuration/init-lua/).

## Documentation Overview

| Section | Topics Covered | Page |
| :--- | :--- | :--- |
| **Installation** | Source builds (`x86_64` / `aarch64`), `v0.1.0` acceptance gates, and `cdn.komawm.org` package channels | [Installation & Channels](/docs/getting-started/installation/) |
| **Quickstart** | Nested `--winit` session testing, TTY launch, default keybindings, and `<1ms` `Mod+G` preemption | [Session & Default Keybinds](/docs/getting-started/quickstart/) |
| **Platforms** | Apple Silicon (`M1`–`M4`, `16 KiB` page alignment) & Intel MacBook Linux, native `ARM64`, `FreeBSD` / `OpenBSD` | [ARM64, MacBook Linux & BSD](/docs/getting-started/platforms/) |
| **Configuration** | `dwindle`, `scrolling`, `deck`, scratchpads, spring animations, and [komawm/koma-types](https://github.com/komawm/koma-types) LuaLS completions | [Layouts, Appearance & Overrides](/docs/configuration/init-lua/) |
| **IPC & Jiku** | Dual UNIX sockets, Epoch leases, `koma-mcp`, and optional companion daemon [Jiku](/jiku/) | [Dual Sockets, Epoch Leases & MCP](/docs/ipc/sockets-and-epochs/) |

## Quick Build & Self-Check

Clone [komawm/koma](https://github.com/komawm/koma) and verify the workspace without modifying your active desktop session:

```bash
git clone https://github.com/komawm/koma.git
cd koma
cargo +1.100.0 build --release --locked -p koma -p komactl -p koma-mcp -p koma-overview
./target/release/koma --headless-check
```

## Contributing

The documentation source lives in [komawm/docs](https://github.com/komawm/docs) and is published to Cloudflare R2 (`https://cdn.komawm.org`). Packaging scripts are maintained in [komawm/packaging](https://github.com/komawm/packaging), and the optional desktop orchestration companion lives in [komawm/jiku](https://github.com/komawm/jiku).
