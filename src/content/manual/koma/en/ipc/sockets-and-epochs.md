# Dual Sockets, Epoch Leases & MCP

Koma exposes a strict dual-socket IPC architecture under `$XDG_RUNTIME_DIR/koma/<signature>/` so human desktop administration and AI agent automation never share the same privilege boundary.

## `koma-admin.sock` vs. `koma-agent.sock`

| Socket | Mode & Peer Auth | Allowed Operations |
| :--- | :--- | :--- |
| **`koma-admin.sock`** | `0600`, same-UID (`SO_PEERCRED` / `LOCAL_PEERCRED` / `getpeereid`) | `config.reload`, `config.status`, `auth.mint_token`, `sandbox.create_wayland_jail`, `sandbox.revoke_wayland_jail`, `scene.inventory`, `capture.frame`, human takeover |
| **`koma-agent.sock`** | `0660`, mandatory Frame `#1` `auth.authenticate` (`CapabilityToken`) | Scoped `ws.create`, `capture.frame`, `vseat.*`, `macro.exec`, restricted strictly to leased workspaces |

Frame `#1` on `koma-agent.sock` **must** be `auth.authenticate` with a `CapabilityToken` minted via `komactl token mint` (or `auth.mint_token` on `koma-admin.sock`). Unauthenticated requests or admin-only RPCs (`auth.mint_token`, `config.reload`, `sandbox.*`) are rejected immediately.

## Monotonic `Epoch` Concurrency Fencing

Every workspace carries a monotonic `Epoch` incremented on window creation/focus/geometry changes and human preemption. Before mutating input via `vseat.*`, an agent observes the workspace (`scene.inventory` or `capture.frame`) and sends `expected_epoch`:

| Error Code | Symbol | Meaning & Recovery |
| :--- | :--- | :--- |
| **`4090`** | `ERR_STALE_EPOCH` | Window geometry or focus changed between observation and action; action was aborted safely **before** execution (`koma-mcp` attaches a fresh re-observed PNG at `new_observed_epoch`) |
| **`4091`** | `ERR_HUMAN_PREEMPTED` | Human pressed `Mod + G` or touched physical input; agent must pause and yield control |
| **`4032`** | `ERR_PROTECTED_SURFACE` | Target coordinates hit a `block_out_from` protected window/layer; input blocked and pixels masked `#000000` |

## Virtual Seat (`vseat`) & Zero-Copy `SCM_RIGHTS` Capture

- **Isolated Virtual Seats**: Each agent-leased workspace receives its own virtual pointer/keyboard/clipboard state (`koma-seat`), leaving the human user's `seat0` focus and clipboard untouched.
- **3-Tier `TextInjectStrategy`**: UTF-8 text injection selects `xkb_keymap` (ASCII US QWERTY), `text_input_v3`, or `clipboard` (`Ctrl+Shift+V` terminal paste) without triggering Fcitx5/IBus candidate popups.
- **Sealed `SCM_RIGHTS` `memfd` / SHM (`koma-proto/src/scm_unix.rs`)**: `capture.frame` writes RGBA8 pixels into a read-only sealed `memfd` (Linux) or `rustix::shm` descriptor (BSD fallback) passed via `SCM_RIGHTS` file descriptors rather than copying large buffers over JSON.

## `koma-mcp` Stdio Server

`koma-mcp` bridges `koma-agent.sock` to any MCP-compatible coding or desktop client (`Claude Code`, `Codex`, `Cursor`, `OpenCode`, or [Jiku](/jiku/)):

```bash
# Inspect all built-in + dynamic Phodopus macro tool schemas offline
koma-mcp --print-tools

# Run with an explicit capability token
KOMA_CAPABILITY_TOKEN=koma_cap_... koma-mcp

# Local developer convenience mode (auto-mints a scoped token from admin.sock)
koma-mcp --auto-mint-admin
```

Built-in `koma-mcp` tools: `koma_scene_inventory`, `koma_ws_create`, `koma_capture_frame`, `koma_click`, `koma_drag`, `koma_key`, `koma_inject_text`, `koma_paste_mime`, `koma_win_activate`, and `koma_exec_macro`, plus any `macro__<id>` registered via `koma.macro.define(...)`.
