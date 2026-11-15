# Installation & Acceptance Boundaries

> [!WARNING]
> Koma is currently at the `v0.0.1` incubation baseline. While all nine Rust crates compile cleanly under `Rust 1.100.0` (Edition 2024) and pass headless and QEMU/KVM Arch Linux software KMS verification, bare-metal physical GPU DRM/KMS and security acceptance remain `v0.1.0` milestones. Do not replace your primary desktop login session without an isolated TTY or VM fallback.

> [!NOTE]
> Koma is a completely standalone Wayland tiling compositor. You never need to install [Jiku](/jiku/) to use Koma for daily keyboard-driven window management.

## System Requirements

Building Koma from [komawm/koma](https://github.com/komawm/koma) on Linux requires the pinned `Rust 1.100.0` toolchain alongside standard Wayland and DRM/KMS system libraries (`libseat`, `libinput`, `libudev`, `libgbm`, `libxkbcommon`, `libdisplay-info`, and `mesa` EGL/GLES2). Optional X11 application compatibility is delegated cleanly to external `xwayland-satellite`.

## Building from Source

Clone the repository and run the workspace quality and release build commands using `cargo`:

```bash
git clone https://github.com/komawm/koma.git
cd koma
just fmt-check typecheck clippy test
cargo build --release --locked -p koma -p komactl -p koma-mcp -p koma-overview
./target/release/koma --headless-check
```

## Workspace Crate Map

| Crate | Kind | Responsibility |
| :--- | :--- | :--- |
| `koma-proto` | Library | IPC framing, `SCM_RIGHTS` FD transport, capability tokens, Epoch identifiers |
| `koma-model` | Library | Dwindle, Scrolling, Deck, BSP layouts, FloatingStack, spring physics |
| `koma-lua` | Library | [Phodopus](https://github.com/Xuepoo/phodopus) Lua 5.4 sandbox bridge, host ops, LuaLS generator |
| `koma-render` | Library | Smithay scene graph, Dual-Kawase blur, rounded corners, screencap masks |
| `koma-seat` | Library | Virtual-seat held-input ledger and `TextInjectStrategy` keystroke/clipboard dispatch |
| `koma` | Binary | Winit nested & bare-metal TTY KMS backends, Wayland protocol handlers |
| `komactl` | Binary | Config validation, live reload, `gen-types`, admin IPC |
| `koma-mcp` | Binary | Stdio JSON-RPC MCP bridge over `koma-agent.sock` |
| `koma-overview` | Binary | Layer-shell spatial workspace overview companion |
