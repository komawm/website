# モニターと入力設定

Koma は `~/.config/koma/init.lua` 内の `koma.monitor({...})` でマルチモニターの 2D 配置を設定し、`koma.input({...})`・`koma.device({...})`・`koma.gesture({...})` で入力デバイスを制御します。

## モニター設定（`koma.monitor`）

コネクタ名（`output = "DP-1"`）またはハードウェア固有の EDID（`match = { make = "...", model = "...", serial = "..." }`）でディスプレイを識別できるため、ドック経由で出力番号が変わっても配置を維持できます。

```lua
-- ノート内蔵パネル：DPI 自動スケーリングとノッチ用安全余白を設定
koma.monitor({
    output = "eDP-1",
    mode = "2560x1600@120.000", -- または "preferred"
    position = { x = 0, y = 0 },
    scale = "auto",             -- 数値（例: 1.5）または "auto"
    transform = "normal",       -- "normal" | "90" | "180" | "270" | "flipped" | "flipped-90" ...
    vrr = "on_demand",          -- false | true | "on_demand"
    max_bpc = 10,
    safe_area = { top = 0, bottom = 0, left = 0, right = 0 },
    allow_non_desktop = false,
    focus_at_startup = true,
    backdrop_color = "#111216",
})

-- EDID マッチで外付け 4K モニターを右側へ配置
koma.monitor({
    match = { make = "Dell Inc.", model = "DELL U2723QE" },
    mode = "3840x2160@60.000",
    position = { x = 1600, y = -200 },
    scale = 1.5,
    transform = "normal",
})
```

特定の出力を無効にする場合は `koma.monitor({...})` に `off = true` を指定します。

### モニター間移動と動的出力ツール

- **キーバインドアクション**：`koma.act.monitor.focus_left()`・`focus_right()`・`focus_up()`・`focus_down()`、`koma.act.monitor.focus("DP-1")`、`koma.act.window.move_to_monitor_left/right/up/down()` を割り当てられます。
- **`wlr-output-management`（`zwlr_output_manager_v1`）**：`kanshi` や `wdisplays` を用いて実行時に出力設定のテストや適用が行えます。
- **フラクショナルスケーリング**：`wp-fractional-scale-v1` と `wp-viewporter` により、`1.25`・`1.5`・`1.6` や `"auto"` の倍率を Wayland クライアントへ直接渡します。

## キーボード・ポインタ・タッチパッド・タブレット（`koma.input`）

キーボードリピートの既定値は `repeat_delay = 220` ms、`repeat_rate = 35` Hz です（`repeat_delay_ms` / `repeat_rate_hz` エイリアスも利用可能）。`mod_key = "auto"`（既定）は `--tty` で `Super`、`--winit` ネスト実行で `Alt` を自動選択します。明示指定には `"Super"`・`"Alt"`・`"Ctrl"`・`"Shift"`・`"Mod5"` を使用できます。

```lua
koma.input({
    mod_key = "auto",             -- "auto" | "Super" | "Alt" | "Ctrl" | "Shift" | "Mod5"
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

独立した物理ボタンを持たないクリックパッド（Apple Force Touch トラックパッド等）では、明示的な上書きがない限り `click_method = "clickfinger"` と `disable_while_typing = true` が既定で有効になります。

## デバイス個別設定（`koma.device`）

特定のデバイス名に対して `libinput` の挙動や出力先モニターを個別に上書きできます。

```lua
koma.device({
    name = "wacom-one-by-wacom-s-pen",
    map_to_output = "eDP-1",
})

koma.device({
    name = "Logitech MX Master 3",
    accel_profile = "flat",
    accel_speed = -0.2,
    natural_scroll = false,
})
```

## マルチフィンガージェスチャ（`koma.gesture`）

2〜5 本指のスワイプやピンチ操作に `koma.act.*` アクションまたは Lua コールバックを割り当てます。

```lua
koma.gesture({
    fingers = 3,
    direction = "horizontal", -- "left" | "right" | "up" | "down" | "horizontal" | "vertical" | "pinch_in" | "pinch_out"
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
