# Koma Overview

> [!NOTE]
> Koma is a standalone, keyboard-driven Wayland tiling compositor. You can install and run Koma daily without any AI tools or companion daemons—[Jiku](/jiku/) is completely optional.

![Koma running in the default dwindle tiling layout](/media/koma-dwindle.webp)

## Key Capabilities

1. **Validated Lua 5.4 Configuration**: Every reload of `~/.config/koma/init.lua` executes inside an isolated, memory-capped (`4 MiB` default) Lua 5.4 sandbox before atomically swapping the live compositor configuration. Invalid configs fail cleanly without disrupting your session.
2. **Per-Workspace Layouts & Visual Effects**: Choose `"dwindle"` (default on headed workspaces), `"scrolling"` (horizontal column strip), `"deck"` (monocle viewport with background stash), or `"bsp"` per workspace, with Dual-Kawase blur, rounded corners, drop shadows, focus rings, and spring animations.
3. **Human-First Preemption (`< 1 ms`)**: Any physical keyboard or pointer input—or pressing `Mod + G`—immediately revokes active automation leases and rejects stale IPC writes via monotonic `Epoch` counters (`4091 ERR_HUMAN_PREEMPTED`).
4. **Built-In Sandboxing & Scoped IPC**: Separates full administrator control (`koma-admin.sock`) from token-scoped automation (`koma-agent.sock`), and supports isolated workspaces via `komactl sandbox` (`bwrap` / rootless `podman`) and `wp_security_context_manager_v1`.

## Documentation Map

| Section | Coverage | Link |
| :--- | :--- | :--- |
| **Installation** | Package repositories, `.deb`/`.rpm`/`.apk`, Arch/AUR, BSD, source build | [Installation](/docs/getting-started/installation/) |
| **Quickstart** | `--session`, `--winit`, `--tty`, default keybinds, `Mod + Tab` overview, `Mod + G` | [Getting Started & Keybindings](/docs/getting-started/quickstart/) |
| **Platforms** | Apple Silicon (`M1`–`M4`), Intel MacBook Linux, `ARM64`, FreeBSD `15.1-RELEASE`, OpenBSD | [Hardware & Platforms](/docs/getting-started/platforms/) |
| **Configuration** | Lua 5.4 config, layouts, monitors, input, window rules, `koma-types` LuaLS | [Layouts, Windows & init.lua](/docs/configuration/init-lua/) |
| **Protocols & CLI** | Layer shell, session lock, screencopy, portals, IME, `komactl`, `koma-overview` | [Panels, Portals, IME & Apps](/docs/protocols-and-tools/wayland-protocols/) |
| **IPC & Troubleshooting** | `koma-admin.sock` / `koma-agent.sock`, `Epoch` leases, MCP, diagnostics | [IPC & Workspace Leases](/docs/ipc/sockets-and-epochs/) |

## Quick Self-Check

Build and verify the compositor binaries without disturbing your running desktop session:

```bash
git clone https://github.com/komawm/koma.git
cd koma
cargo build --release --locked -p koma -p komactl -p koma-mcp -p koma-overview
./target/release/koma --headless-check
./target/release/komactl gen-types > /tmp/koma-types-check.lua
```

## Project Repositories

This manual and specifications live in [komawm/docs](https://github.com/komawm/docs). Packaging definitions live in [komawm/packaging](https://github.com/komawm/packaging), LuaLS editor annotations in [komawm/koma-types](https://github.com/komawm/koma-types), and the optional companion agent in [komawm/jiku](https://github.com/komawm/jiku).
