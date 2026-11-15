# Home & Architecture

> [!NOTE]
> **Koma** is a standalone, keyboard-driven Wayland tiling compositor written in Rust (`1.100.0`, Edition 2024) on top of [Smithay](https://github.com/Smithay/smithay). You can install and run Koma daily with **zero AI or companion daemon dependencies** — [Jiku](/jiku/) is completely optional.

![Koma architectural shoji grid overview](/placeholders/koma-shoji.webp "Koma composes Dwindle, Scrolling, Deck, and BSP workspaces inside a unified Smithay scene graph.")

## Design Principles

Koma separates **Ring 0 compositor mechanism** from **user and agent policy**:

1. **Stackless Lua 5.4 Configuration ([Phodopus](https://github.com/Xuepoo/phodopus))**: Every `~/.config/koma/init.lua` reload executes in a fuel-metered, memory-capped pure-Rust Lua 5.4 VM (`4 MiB` heap ceiling by default) inside a shadow registry before atomically swapping live compositor state.
2. **Unified Scene & Layout Engine (`koma-model` + `koma-render`)**: Supports `"dwindle"` (default on headed workspaces), `"scrolling"` (infinite horizontal strip), `"deck"` (100%-viewport monocle + background stash), and `"bsp"` per workspace, paired with Dual-Kawase blur, rounded corners, drop shadows, focus rings, and critically damped spring animations.
3. **Human-First Preemption (`< 1 ms`)**: Any physical keyboard or pointer input, or pressing `Mod + G`, immediately halts agent automation and fences concurrent IPC mutations via monotonic `Epoch` counters (`4091 ERR_HUMAN_PREEMPTED`).
4. **Zero-Avoidable-`unsafe` Rust Posture**: Workspace crates enforce strict `unsafe_code` lints (`#![forbid(unsafe_code)]` across `koma-model`, `koma-lua`, `koma-seat`, `komactl`, `koma-overview`, and `koma-mcp`, plus `#![deny(unsafe_code)]` with safe `rustix` I/O in `koma-proto` and `koma`).

## Workspace Crate Map

| Crate | Kind | Responsibility | Safety Policy |
| :--- | :--- | :--- | :--- |
| `koma-proto` | Library | Dual-socket framing, `SCM_RIGHTS` `memfd`/SHM transport, `CapabilityToken`, `Epoch` codes | `#![deny(unsafe_code)]` |
| `koma-model` | Library | `dwindle`, `scrolling`, `deck`, `bsp` layouts, floating stack, spring physics, rules | `#![forbid(unsafe_code)]` |
| `koma-lua` | Library | [Phodopus](https://github.com/Xuepoo/phodopus) Lua 5.4 sandbox, host APIs, `LuaCATS` stub generator | `#![forbid(unsafe_code)]` |
| `koma-render` | Library | Smithay scene graph, Dual-Kawase GLES2 blur, rounded corners, protected blackout masks | `#![deny(unsafe_code)]` |
| `koma-seat` | Library | Virtual-seat held-input ledger and 3-tier `TextInjectStrategy` dispatch | `#![forbid(unsafe_code)]` |
| `koma` | Binary | `--tty` DRM/KMS & `--winit` nested backends, Wayland protocol globals, `calloop` IPC | `#![deny(unsafe_code)]` |
| `komactl` | Binary | `validate`, `reload`, `gen-types`, `inventory`, `capture`, `token mint`, `sandbox` | `#![forbid(unsafe_code)]` |
| `koma-mcp` | Binary | Stdio JSON-RPC 2.0 MCP bridge over `koma-agent.sock` | `#![forbid(unsafe_code)]` |
| `koma-overview` | Binary | `wlr-layer-shell` spatial workspace overview companion | `#![forbid(unsafe_code)]` |

## Documentation Map

| Section | Coverage | Link |
| :--- | :--- | :--- |
| **Installation** | Package channels (`cdn.komawm.org`), `.deb`/`.rpm`/`.apk`, Arch/AUR, BSD, source build | [Installation & Channels](/docs/getting-started/installation/) |
| **Quickstart** | `--session`, `--winit`, `--tty`, default keybinds, `Mod + Tab` overview, `Mod + G` | [Session Launch & Default Keymap](/docs/getting-started/quickstart/) |
| **Platforms** | Apple Silicon (`M1`–`M4`), Intel MacBook Linux, `ARM64`, FreeBSD `15.1-RELEASE`, OpenBSD | [ARM64, MacBook Linux & BSD](/docs/getting-started/platforms/) |
| **Configuration** | Phodopus Lua sandbox, layouts, monitors, input, rules, `koma-types` LuaLS | [Lua Sandbox, Layouts & Appearance](/docs/configuration/init-lua/) |
| **Protocols & CLI** | Layer shell, session lock, screencopy, portals, IME, `komactl`, `koma-overview` | [Wayland Protocols, Portals & IME](/docs/protocols-and-tools/wayland-protocols/) |
| **IPC & Troubleshooting** | `koma-admin.sock` / `koma-agent.sock`, `Epoch` fencing, MCP, diagnostic FAQ | [Dual Sockets, Epoch Leases & MCP](/docs/ipc/sockets-and-epochs/) |

## Quick Self-Check

Verify the compositor binary without disturbing your running desktop session:

```bash
git clone https://github.com/komawm/koma.git
cd koma
cargo +1.100.0 build --release --locked -p koma -p komactl -p koma-mcp -p koma-overview
./target/release/koma --headless-check
./target/release/komactl gen-types > /tmp/koma-types-check.lua
```

## Contributing & Provenance

Canonical architecture specifications and this tri-lingual manual live in [komawm/docs](https://github.com/komawm/docs) and publish deterministically to Cloudflare R2 (`https://cdn.komawm.org`). Packaging definitions live in [komawm/packaging](https://github.com/komawm/packaging), LuaLS annotations in [komawm/koma-types](https://github.com/komawm/koma-types), and the optional desktop assistant in [komawm/jiku](https://github.com/komawm/jiku).
