# Window Rules & Protected Surfaces

Koma provides declarative rule matching for both Wayland/XWayland application windows (`koma.rule.window`) and `wlr-layer-shell` surfaces (`koma.rule.layer`). Every rule returns a `KomaHandle` supporting `:set_enabled(bool)` and `:remove()`, and every `app_id` / `title` / `namespace` regex is compiled during shadow evaluation so broken patterns reject cleanly before touching live windows.

## Window Rule Schema (`koma.rule.window`)

| Field | Scope | Meaning |
| :--- | :--- | :--- |
| `matches` / `excludes` | Array of match tables | Match by `app_id`, `title`, `tag`, `workspace`, `is_floating`, `is_focused`, `is_urgent`, `is_modal_dialog`, `is_xwayland`, `is_screencast_target`, `is_agent_workspace`, `at_startup` |
| `initial` | Initial spawn only | `open_on_output`, `open_on_workspace`, `open_mode` (`"tiled"` / `"floating"` / `"fullscreen"`), `open_focused`, `default_floating_pos = { x, y, anchor }` |
| `opacity` | Live surface | Surface opacity override (`0.0..=1.0`) |
| `corner_radius` | Live surface | Per-window corner radius override in logical pixels |
| `clip_to_geometry` | Live surface | Clips client textures to layout geometry |
| `focusable` | Live input | Allows or prevents keyboard focus |
| `pin_on_output` | Live surface | Pins floating window across workspace switches on an output |
| `block_out_from` | Privacy / Capture | `"agent_capture"` \| `"screencast"` \| `"screencopy"` \| `"all"` |

### Practical Rule Examples

```lua
-- Float password managers & protect them from agent capture, screencasts, and grim screencopy
local vault_rule = koma.rule.window({
    name = "vault-redaction",
    matches = {
        { app_id = "^org\\.keepassxc\\.KeePassXC$" },
        { app_id = "^Bitwarden$" },
        { title = ".*(1Password|Private Browsing).*" },
    },
    initial = {
        open_mode = "floating",
        default_floating_pos = { x = 0, y = 0, anchor = "center" },
    },
    block_out_from = "all", -- "agent_capture" | "screencast" | "screencopy" | "all"
})

-- Route browser & chat windows automatically at startup
koma.rule.window({
    name = "chat-workspace",
    matches = { { app_id = "^(org\\.telegram\\.desktop|discord)$", at_startup = true } },
    initial = {
        open_on_workspace = "3",
        open_focused = false,
    },
})

-- Temporarily toggle a rule dynamically inside a keybind callback
koma.bind("Mod + Shift + B", function()
    vault_rule:set_enabled(true)
end, { desc = "Ensure vault blackout rule is enabled" })
```

## Layer-Shell Rules (`koma.rule.layer`)

Use `koma.rule.layer({...})` to style bars, notification daemons, or lock/launcher overlays matched by `namespace`, `layer` (`"background"`, `"bottom"`, `"top"`, `"overlay"`), and `at_startup`:

```lua
koma.rule.layer({
    name = "swaync-privacy",
    matches = { { namespace = "^swaync-notification-window$" } },
    corner_radius = 12,
    opacity = 0.96,
    place_within_backdrop = false,
    block_out_from = "screencast",
})
```

## Protected Surface Redaction Blackout (`4032 ERR_PROTECTED_SURFACE`)

> [!IMPORTANT]
> **Compositor-Enforced Blackout**: When a window or layer matches `block_out_from = "agent_capture"` or `"all"`, `koma-render` masks its pixels to `#000000` (`[PROTECTED]`) inside offscreen `capture.frame` (`SCM_RIGHTS` `memfd`) exports—even if the window sits underneath or overlaps an agent capture region!

- **Write Fence (`4032`)**: Any `vseat.*` click, drag, key, or text injection targeting a protected window is rejected by the compositor with `4032 ERR_PROTECTED_SURFACE` before dispatching input.
- **Sovereign Privacy**: Neither `koma-mcp` nor [Jiku](/jiku/) can ever read passwords, 2FA OTPs, or banking dialogs flagged with `block_out_from`.
- **Screencast & Screencopy Isolation**: Setting `block_out_from = "screencopy"` or `"all"` also blackouts the surface in `zwlr_screencopy_manager_v1` (`grim`) captures, while `"screencast"` redacts portal PipeWire streams.
