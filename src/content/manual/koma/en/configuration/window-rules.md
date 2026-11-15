# Window Rules & Protected Surfaces

Koma matches Wayland and XWayland windows with `koma.rule.window({...})` and `wlr-layer-shell` panels with `koma.rule.layer({...})`. Rules are evaluated in declaration order (last matching value wins per property). Each call returns a `KomaHandle` with `:set_enabled(bool)` and `:remove()`, and regexes (`app_id`, `title`, `namespace`) are validated during config load before affecting active windows.

## Window Rules (`koma.rule.window`)

| Field | Scope | Meaning |
| :--- | :--- | :--- |
| `matches` / `excludes` | Match/exclude lists | Supports `app_id`, `title`, `tag`, `workspace`, `is_floating`, `is_focused`, `is_urgent`, `is_modal_dialog`, `is_xwayland`, `is_screencast_target`, `is_agent_workspace`, `at_startup` |
| `initial` | Initial map only | `open_on_output`, `open_on_workspace`, `open_mode` (`"tile"` \| `"float"` \| `"fullscreen"` \| `"maximized"` \| `"deck_top"` \| `"stash_background"`), `open_focused`, `default_floating_pos = { x, y, anchor }` |
| `opacity` | Live surface | Surface opacity override (`0.0..=1.0`) |
| `inactive_opacity` | Live surface | Opacity multiplier when unfocused (`0.0..=1.0`) |
| `corner_radius` | Live surface | Per-window corner radius in logical pixels |
| `clip_to_geometry` | Live surface | Clips client surface textures to layout bounds |
| `animation` | Live surface | Per-window open/close animation preset (e.g. `"popin 88%"`, `"slide:top"`) |
| `no_blur` / `no_shadow` | Live surface | Disables background blur or drop shadow for matching windows |
| `border_color` | Live surface | Active border color override (`"#rrggbb"` / `"#rrggbbaa"`) |
| `focusable` | Live input | Allows or blocks keyboard focus |
| `pin_on_output` | Live surface | Keeps a floating window visible across workspace switches on its output |
| `suppress_events` | Live surface | Ignores client state requests such as `{ "maximize" }` |
| `block_out_from` | Privacy / capture | `"agent_capture"` \| `"screencast"` \| `"screencopy"` \| `"all"` |

Supported `anchor` values for `default_floating_pos` are `"top-left"`, `"top"`, `"top-right"`, `"left"`, `"center"`, `"right"`, `"bottom-left"`, `"bottom"`, and `"bottom-right"`.

### Practical Examples (`~/.config/koma/init.lua`)

```lua
-- Float password managers centered and block them from all capture paths
local vault_rule = koma.rule.window({
    name = "vault-redaction",
    matches = {
        { app_id = "^org\\.keepassxc\\.KeePassXC$" },
        { app_id = "^Bitwarden$" },
        { title = ".*(1Password|Private Browsing).*" },
    },
    initial = {
        open_mode = "float",
        default_floating_pos = { x = 0, y = 0, anchor = "center" },
    },
    block_out_from = "all",
})

-- Pin Picture-in-Picture windows in the bottom-right corner
koma.rule.window({
    name = "browser-pip",
    matches = { { app_id = "^(firefox|chromium)$", title = "^Picture-in-Picture$" } },
    initial = {
        open_mode = "float",
        open_focused = false,
        default_floating_pos = { x = 24, y = 24, anchor = "bottom-right" },
    },
    pin_on_output = true,
    opacity = 0.96,
})

-- Route chat apps to workspace 3 at startup without stealing focus
koma.rule.window({
    name = "chat-workspace",
    matches = { { app_id = "^(org\\.telegram\\.desktop|discord)$", at_startup = true } },
    initial = {
        open_on_workspace = "3",
        open_focused = false,
    },
})

-- Re-enable a rule dynamically from a keybind
koma.bind("Mod + Shift + B", function()
    vault_rule:set_enabled(true)
end, { desc = "Ensure vault blackout rule is enabled" })
```

## Layer-Shell Rules (`koma.rule.layer`)

Match panels, notifications, wallpapers, and overlays by `namespace`, `layer` (`"background"`, `"bottom"`, `"top"`, `"overlay"`), and `at_startup`:

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

## Protected Surfaces (`4032 ERR_PROTECTED_SURFACE`)

> [!IMPORTANT]
> Active session lockscreens (`ext-session-lock-v1`), authentication prompts (`polkit-gnome-authentication-agent`, `hyprpolkitagent`, `pinentry`), and common password managers (`KeePassXC`, `Bitwarden`, `1Password`) are protected by default. Custom rules can protect any window or layer via `block_out_from`.

- **Capture Redaction**: Surfaces with `block_out_from = "agent_capture"` or `"all"` are painted solid `#000000` in offscreen `capture.frame` exports—even when another window overlaps them.
- **Input Write Fence (`4032`)**: Any virtual-seat (`vseat.*`) click, drag, key, or text injection targeting a protected surface is rejected with `4032 ERR_PROTECTED_SURFACE`. Neither `koma-mcp` nor [Jiku](/jiku/) can read or drive protected surfaces.
- **Screencopy & Screencast Isolation**: `"screencopy"` and `"all"` redact the surface from `zwlr_screencopy_manager_v1` (`grim`) captures; `"screencast"` redacts it from portal PipeWire streams.

## Compatibility Notes

- **Waydroid (`Waydroid`, `waydroid.<package>`)**: Applies `no_blur = true` by default unless overridden by a `koma.rule.window` rule. Container surfaces with an empty `wl_surface.set_input_region` are treated as click-through with suppressed border, focus ring, shadow, blur, and `clip_to_geometry` bypass so multi-window `waydroid.*` apps remain responsive.
- **Remote Desktop Clients**: Supports `zwlr_virtual_pointer_manager_v1` virtual pointers and `zwp_keyboard_shortcuts_inhibit_manager_v1` shortcut pass-through when focused, while keeping `Mod + G` preemption and TTY/VT switching active.
- **Bars & Panel Widgets (`waybar`, `ironbar`, `quickshell`)**: Supports `get_popup` unconstraining, `wp_single_pixel_buffer_v1`, `wp_presentation` feedback, and `wl_shm` `Abgr8888`/`Xbgr8888` buffers.
