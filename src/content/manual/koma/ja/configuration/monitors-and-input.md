# マルチモニター 2D 配置と入力デバイス

Koma は `koma.monitor({...})` でモニターの 2D 配置（出力名・EDID マッチング・フラクショナルスケーリング・回転・VRR・MacBook ノッチ用 `safe_area`）を宣言的に設定し、`koma.input({...})` と `koma.device({...})` で XKB および `libinput` デバイスを制御します。

## モニター設定（`koma.monitor`）

コネクタ名（`output = "DP-1"`）またはハードウェア固有の EDID（`match = { make = "...", model = "...", serial = "..." }`）で出力を特定できます。

```lua
-- ノート内蔵パネル：DPI 自動スケールとノッチ安全余白を設定
koma.monitor({
    output = "eDP-1",
    mode = "2560x1600@120.000",
    position = { x = 0, y = 0 },
    scale = "auto",
    transform = "normal",
    vrr = "on_demand", -- false | true | "on_demand"
    max_bpc = 10,
    safe_area = { top = 0, bottom = 0, left = 0, right = 0 },
    allow_non_desktop = false,
    focus_at_startup = true,
    backdrop_color = "#111216",
})

-- EDID マッチで外付け 4K モニターを右側の 2D 座標へ配置
koma.monitor({
    match = { make = "Dell Inc.", model = "DELL U2723QE" },
    mode = "3840x2160@60.000",
    position = { x = 1600, y = -200 },
    scale = 1.5,
    transform = "normal", -- "normal" | "90" | "180" | "270" | "flipped" | "flipped-90" ...
})
```

### マルチモニター移動と動的出力管理

- **モニター間アクション**：`koma.act.monitor.focus_left/right/up/down()`、`koma.act.window.move_to_monitor_left/right/up/down()`、`koma.act.monitor.focus("DP-1")` を割り当て可能です。
- **`wlr-output-management`（`zwlr_output_manager_v1`）**：`kanshi` や `wdisplays` による動的プロファイル適用（`test` / `apply`）に対応しています。
- **フラクショナルスケーリング**：`wp-fractional-scale-v1` + `wp-viewporter` により `1.25` / `1.5` / `1.6` / `"auto"` をネイティブ解像度で描画します。

## キーボード・ポインタ・タッチパッド・タブレット（`koma.input`）

```lua
koma.input({
    mod_key = "auto",             -- "auto" (TTY は Super, Winit は Alt) | "Super" | "Alt"
    inherit_default_binds = true, -- 既定キーマップを継承し個別に上書き
    keyboard = {
        layout = "jp,us",
        variant = ",",
        options = { "grp:win_space_toggle", "ctrl:nocaps" },
        repeat_delay = 250,
        repeat_rate = 40,
        numlock_on_startup = false,
    },
    pointer = {
        accel_profile = "flat",   -- "adaptive" | "flat"
        accel_speed = 0.0,        -- -1.0 .. 1.0
        natural_scroll = false,
        left_handed = false,
        middle_emulation = false,
        scroll_factor = 1.0,
        follow_mouse = "normal",  -- "off" | "normal" | "focus_only"
    },
    touchpad = {
        tap_to_click = true,
        tap_and_drag = true,
        tap_drag_lock = false,
        natural_scroll = true,
        disable_while_typing = true,
        disable_while_trackpointing = true,
        accel_profile = "adaptive",
        accel_speed = 0.1,
        scroll_method = "two_finger", -- "none" | "no_scroll" | "two_finger" | "edge" | "on_button_down"
        click_method = "clickfinger", -- "none" | "button_areas" | "clickfinger"
        disabled_on_external_mouse = false,
        scroll_factor = 1.0,
        pinch_sensitivity = 1.0,
    },
    tablet = {
        map_to_output = "eDP-1",
        left_handed = false,
    },
})
```

## マルチフィンガージェスチャ（`koma.gesture`）

```lua
koma.gesture({
    fingers = 3,
    direction = "horizontal", -- "left"|"right"|"up"|"down"|"horizontal"|"vertical"|"pinch_in"|"pinch_out"
    action = koma.act.workspace.focus_next(),
    cooldown_ms = 180,
    desc = "3 本指スワイプでワークスペース切替",
})

koma.gesture({
    fingers = 4,
    direction = "up",
    action = koma.act.overview.toggle(),
    desc = "4 本指上スワイプで koma-overview を開く",
})
```
