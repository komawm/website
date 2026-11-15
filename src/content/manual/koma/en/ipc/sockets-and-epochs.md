# Dual Sockets, Epoch Leases & MCP

Koma separates desktop administration from AI automation using two Unix domain sockets under `$XDG_RUNTIME_DIR/koma/<signature>/` (directory mode `0700`).

## `koma-admin.sock` vs. `koma-agent.sock`

| Socket | Mode & Authentication | Allowed Operations |
| :--- | :--- | :--- |
| **`koma-admin.sock`** | `0600`, same-UID kernel credentials (`SO_PEERCRED` / `LOCAL_PEERCRED` / `getpeereid`); blocked for sandboxed Wayland clients | `config.reload`, `config.status`, `auth.mint_token`, `sandbox.create_wayland_jail`, `sandbox.revoke_wayland_jail`, `scene.inventory`, `capture.frame`, human takeover (`ws.set_mode`) |
| **`koma-agent.sock`** | `0600`, first frame must be `auth.authenticate` with a `CapabilityToken` | Scoped `ws.create`, `capture.frame`, `vseat.*`, `macro.exec` / `lua.exec_tx`, restricted to granted or leased workspaces |

Frame `#1` on `koma-agent.sock` must be `auth.authenticate` carrying a `CapabilityToken` minted via `komactl token mint` (or `auth.mint_token` on `koma-admin.sock`). Unauthenticated requests or admin RPCs on `koma-agent.sock` are rejected immediately. Both sockets use 4-byte little-endian length-prefixed UTF-8 JSON frames (up to `16 MiB`) with optional `SCM_RIGHTS` file descriptors.

## Monotonic `Epoch` Concurrency Fencing

Every workspace maintains a monotonic `Epoch` counter that increments on lease changes, window creation/focus/geometry updates, and human preemption. Before issuing `vseat.*` input, an agent observes the workspace (`scene.inventory` or `capture.frame`) and passes `expected_epoch`:

| Error Code | Symbol | Meaning & Recovery |
| :--- | :--- | :--- |
| **`4090`** | `ERR_STALE_EPOCH` | Workspace state changed between observation and execution; action is aborted before input dispatch (`koma-mcp` attaches a fresh PNG at `new_observed_epoch`) |
| **`4091`** | `ERR_HUMAN_PREEMPTED` | User pressed `Mod + G` or generated physical input; agent must stop and yield control |
| **`4032`** | `ERR_PROTECTED_SURFACE` | Target hit a `block_out_from` protected window or layer; input is blocked and pixels are masked `#000000` |

## Virtual Seats (`vseat`) & Zero-Copy `SCM_RIGHTS` Capture

- **Isolated Virtual Seats**: Each agent-leased workspace uses an independent virtual pointer, keyboard, and clipboard ledger, leaving the user's `seat0` focus and clipboard untouched.
- **High-Precision Splines, `ClickGrab` & `LabelPill`**: In addition to `vseat.pointer_move`, `vseat.click` (with optional `modifiers` + `label`), and `vseat.drag`, Koma exposes `vseat.path` / `vseat.stroke` (`250 Hz` centripetal Catmull-Rom / Bezier resampling with Smithay `ClickGrab` drag forwarding), `vseat.relative_move`, `vseat.wheel`, `vseat.hit_test`, `vseat.cursor_label`, and `vseat.cursor_settle`.
- **Explicit `DeliverySemantics`**: Errors report structured `DeliveryDisposition` (`Unknown`, `NotDelivered`, `DeliveryUncertain`, `DeliveredUnverified`, `DeliveredVerified`) and `RetryDisposition` (`Safe`, `Unsafe`, `Unknown`) metadata so callers know whether re-issuing an action is safe.
- **3-Tier `TextInjectStrategy`**: UTF-8 text injection selects `xkb_keymap`, `text_input_v3`, or `clipboard` (`Ctrl+Shift+V`) automatically to avoid triggering Fcitx5/IBus candidate popups.
- **Sealed `SCM_RIGHTS` `memfd` / SHM**: `capture.frame` writes RGBA8 frames into a read-only sealed `memfd` (Linux/FreeBSD) or POSIX shared-memory descriptor (BSD fallback) passed via `SCM_RIGHTS` instead of copying large pixel buffers over JSON.

## `koma-mcp` Stdio Server

`koma-mcp` connects lazily to `koma-agent.sock` and auto-detects both `Content-Length` (LSP-style) and newline-delimited JSON (`NDJSON`) stdio framing per message for MCP clients (`Claude Code`, `Codex`, `Cursor`, `OpenCode`, `pi`, or [Jiku](/jiku/)):

```bash
# Inspect built-in MCP tool schemas offline
koma-mcp --print-tools

# Run with an explicit capability token
KOMA_CAPABILITY_TOKEN=koma_cap_... koma-mcp

# Local convenience mode (auto-mints a scoped token via koma-admin.sock)
koma-mcp --auto-mint-admin
```

Built-in `koma-mcp` exposes 17 core tools (`koma_ping`, `koma_scene_inventory`, `koma_ws_create`, `koma_capture_frame`, `koma_click`, `koma_drag`, `koma_key`, `koma_inject_text`, `koma_paste_mime`, `koma_win_activate`, `koma_exec_macro`, `koma_path`, `koma_cursor_settle`, `koma_wheel`, `koma_relative_move`, `koma_hit_test`, and `koma_cursor_label`), plus any `macro__<id>` macros registered in `~/.config/koma/init.lua` via `koma.macro.define(...)`.
