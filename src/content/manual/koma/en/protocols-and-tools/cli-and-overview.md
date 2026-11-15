# komactl & Workspace Overview

`komactl` is Koma's administration CLI (`koma-admin.sock`) and offline Lua validator, while `koma-overview` provides a `wlr-layer-shell` spatial overview across all workspaces.

## `komactl` Command Reference

`komactl` discovers `$XDG_RUNTIME_DIR/koma/<signature>/koma-admin.sock` automatically (or via `KOMA_INSTANCE_SIGNATURE`).

| Command | Mode | Description |
| :--- | :--- | :--- |
| `komactl validate [path/to/init.lua]` | Offline | Evaluates `init.lua` in the isolated Lua sandbox, validates rule regexes & gestures, and prints resource counts |
| `komactl reload [path/to/init.lua]` | IPC (`admin.sock`) | Sends `config.reload` and atomically swaps live compositor configuration |
| `komactl config-status` | IPC (`admin.sock`) | Prints active config path, reload generation, and last error if any (`config.status`) |
| `komactl gen-types` | Offline | Emits deterministic `LuaCATS` stubs for `koma-types` (`types/koma.lua`) |
| `komactl inventory` | IPC (`admin.sock`) | Prints live monitors, workspaces, `Epoch` counters, Deck windows, and Stash slots (`scene.inventory`) |
| `komactl token mint [label]` | IPC (`admin.sock`) | Mints a scoped `CapabilityToken` (`ttl_secs = 28800`, `can_create_headless = true`, `max_owned_workspaces = 4`) |
| `komactl capture [ws_id] [out.rgba]` | IPC (`admin.sock`) | Captures a zero-copy `SCM_RIGHTS` sealed `memfd` frame with `grid_225` overlay (`ws_id` default `ws_01`) |
| `komactl sandbox <subcmd>` | Container + IPC | Runs `bwrap` or rootless `podman` GUI containers inside an isolated `Headless` workspace |
| `komactl -V` / `--version` | Offline | Prints `komactl <version>` |

## `komactl sandbox` Container Isolation

`komactl sandbox` creates a restricted `jail-<ws_id>.sock` (never mounting the host `$XDG_RUNTIME_DIR`, `koma-admin.sock`, D-Bus, PipeWire, or SSH agent) inside a private `0700` `tmpfs` runtime directory:

```bash
# Run a browser inside an ephemeral bwrap sandbox on a 1920x1080 Headless workspace (network isolated by default)
komactl sandbox run --name browser-jail -- firefox

# Run an OCI container via rootless podman with network enabled and dry-run inspection first
komactl sandbox run --runtime podman --image fedora:latest --share-net --dry-run -- glxgears

# Explicitly grant scoped agent access (mounts koma-agent.sock + single-workspace KOMA_CAPABILITY_TOKEN)
komactl sandbox run --with-agent-sock --ro-bind ~/repo:/workspace -- code-oss
```

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--runtime <bwrap\|podman>` | `bwrap` | Container engine (auto-switches to `podman` if `--image` is provided) |
| `--ws <ws_id\|auto>` | `auto` | Reuse an existing `ws_id` or allocate a new `Headless` workspace |
| `--name <name>` | `sandbox` | Name for newly created `Headless` workspace |
| `--geometry <WxH[@scale]>` | `1920x1080` | Viewport dimensions and scale (e.g. `2560x1600@1.6`) |
| `--bind <host:guest>` / `--ro-bind` | none | Explicit host bind mounts |
| `--share-net` | off | Enable host network (`bwrap`) or `pasta` (`podman`); isolated by default |
| `--no-gpu` | off | Omit `/dev/dri` passthrough to force software Mesa/Lavapipe |
| `--nvidia` | off | Add `--device=nvidia.com/gpu=all` CDI flag on Podman |
| `--with-agent-sock` | off | Mount `koma-agent.sock` + inject single-workspace `KOMA_CAPABILITY_TOKEN` (never `koma-admin.sock`) |
| `--keep-jail` | off | Keep `jail-<ws_id>.sock` alive after exit (`create-jail` / `revoke-jail` manage it manually) |
| `--dry-run` | off | Print the exact container command without spawning |

## Spatial Overview (`koma-overview`)

![koma-overview spatial workspace switcher](https://cdn.komawm.org/media/koma-overview.webp)

Toggle `koma-overview` via `Mod + Tab` (or bind `koma.act.overview.toggle()`):

- Attaches via `zwlr_layer_shell_v1` on the active output and queries `koma-admin.sock` `scene.inventory`.
- Displays all Headed and Headless workspaces (including `agent:work` decks and background Stash counts) in a unified spatial grid with zero idle GPU wakeups.
