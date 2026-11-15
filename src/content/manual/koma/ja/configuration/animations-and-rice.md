# アニメーション・枠線・ブラー

Koma は `~/.config/koma/init.lua` の `koma.appearance({...})` でウィンドウアニメーション・角丸・グラデーション枠線・ドロップシャドウ・非アクティブ減光・Dual Kawase ブラーを設定でき、`koma.rule.window({...})` でアプリケーション単位の上書きも行えます。

## ソルバーとカスタムカーブ（`koma.bezier`, `koma.spring`）

- **スプリング（`solver = "spring"` または `"analytical_spring"`）**：`damping_ratio`（既定 `1.0` = オーバーシュートなし、`1.0` 未満でバウンス）と `stiffness`（既定 `800.0`）、または明示的な `mass`（`1.0`）・`damping`・収束閾値 `epsilon`（既定 `0.0005`）で調整します。移動中にターゲットが変わっても現在速度を引き継いで滑らかに切り替わります。
- **3 次ベジェ曲線（`koma.bezier(name, x1, y1, x2, y2, duration_ms)`）**：4 点制御のイージングカーブを登録します（`x1, x2` は `0.0..1.0`、`y1, y2` は `-2.0..3.0` でオーバーシュート可、`duration_ms` は `1..5000`）。テーブル形式 `{ points = { x1, y1, x2, y2 }, duration_ms = ... }` も受け付けます。
- **カスタムスプリング（`koma.spring(name, spec)`）**：`mass`・`damping` または `damping_ratio`・`stiffness`・`epsilon` で名前付きスプリングを登録します。

### 組み込みカーブプリセット

| プリセット | 定義 | 特性 |
| :--- | :--- | :--- |
| `linear` | `[0.0, 0.0, 1.0, 1.0]`, `200 ms` | 等速リニア |
| `ease_out` / `default` | `[0.22, 1.0, 0.36, 1.0]`, `250 ms` | キレのある標準イーズアウト |
| `md3_decel` | `[0.05, 0.7, 0.1, 1.0]`, `280 ms` | Material Design 3 減速 |
| `overshot` | `[0.05, 0.9, 0.1, 1.1]`, `280 ms` | 軽やかなオーバーシュート |
| `fluent` | `[0.1, 0.9, 0.2, 1.0]`, `220 ms` | 滑らかな Fluent カーブ |
| `snappy_spring` | `mass = 1.0, damping = 36.0, stiffness = 420.0` | 引き締まった応答バネ |
| `bouncy_spring` | `mass = 1.0, damping = 20.0, stiffness = 320.0` | 反発感のあるバウンスバネ |
| `gentle_spring` | `mass = 1.2, damping = 28.0, stiffness = 180.0` | 穏やかな減衰バネ |
| `instant` / `none` | 即時反映 | 該当チャネルの補間を無効化 |

## チャネル別アニメーション設定

`windows_open`（別名 `windows_in`）、`windows_close`（別名 `windows_out`）、`windows_move`、`fade`、`border`、`workspaces` ごとにカーブとスタイルを設定できます。

```lua
koma.bezier("rice_pop", 0.05, 0.9, 0.1, 1.1, 260)
koma.spring("glide", { mass = 1.0, damping_ratio = 0.82, stiffness = 360.0 })

koma.appearance({
    animations = {
        enabled = true,
        solver = "spring",
        windows_open = { enabled = true, curve = "rice_pop", style = "popin 85%" },
        windows_close = { enabled = true, curve = "glide", style = "slide" },
        windows_move = { enabled = true, curve = "glide" },
        fade = { enabled = true, curve = "md3_decel", duration_ms = 180 },
        border = { enabled = true, curve = "snappy_spring" },
        workspaces = { enabled = true, curve = "overshot", style = "slidevert" },
    },
})
```

- **ウィンドウ開閉スタイル**：`"popin"`（例: `"popin 85%"`）、`"slide"`（最近接エッジ、または `"slide top"`, `"slide bottom"`, `"slide left"`, `"slide right"`）、`"gnomed"`、`"fade"`。
- **ワークスペース遷移スタイル**：`"slide"`, `"slidevert"`, `"fade"`, `"none"`（ヘッドレスキャプチャや画面共有時は自動的にスキップされます）。

## グラデーション枠線・ブラー・ウィンドウ別設定

`koma.appearance({...})` で全体の角丸（`corner_radius`）・回転グラデーション枠線・Dual Kawase ブラーを設定し、`koma.rule.window({...})` でアプリごとに調整します。

```lua
koma.appearance({
    corner_radius = 12,
    border = {
        enabled = true,
        width = 2.0,
        active_color = "#7aa2f7ff",
        active_color_end = "#bb9af7ff",
        inactive_color = "#292e42cc",
        inactive_color_end = "#1f2335cc",
        gradient_angle = 45.0,
        gradient_rotate_rpm = 6.0,
    },
    blur = {
        enabled = true,
        passes = 3,
        size = 6,
    },
})

koma.rule.window({
    name = "terminal-rice",
    matches = { { app_id = "^foot$" } },
    opacity = 0.96,
    inactive_opacity = 0.84,
    animation = "popin 88%",
    border_color = "#7dcfffff",
})

koma.rule.window({
    name = "video-player-clean",
    matches = { { app_id = "^mpv$" } },
    no_blur = true,
    no_shadow = true,
    inactive_opacity = 1.0,
})
```

## マクロでのポインタ移動軌道（`ctx:move_to` / `ctx:drag`）

`koma.macro.define(...)` 内のポインタ移動は、`kinematics` テーブルで `profile`（`"instant"`, `"minimum_jerk"` 既定, `"spring"`／別名 `"hooke"`・`"hooke_spring"`, `"bezier"`）または登録済み `curve` を指定できます。

```lua
koma.macro.define({
    id = "canvas.spring_pan_drag",
    app_id = ".*",
    description = "滑らかなスプリング軌道で中ボタンドラッグパンを実行",
    params = {
        dx = { type = "int", default = 180 },
        dy = { type = "int", default = -90 },
    },
    run = function(ctx, args)
        ctx:drag({
            button = "middle",
            from = { anchor = "center", x = 0, y = 0 },
            to = { anchor = "center", x = args.dx, y = args.dy },
            hold_before_move_ms = 25,
            kinematics = {
                profile = "spring",
                mass = 1.0,
                damping = 22.0,
                stiffness = 340.0,
                epsilon = 0.01,
            },
            hold_before_release_ms = 20,
        })
    end,
})
```

### エージェントカーソル表示と多点スプライン軌道

- **GLES2 SDF エージェントカーソルと `LabelPill`（`koma.appearance({ agent_cursor = ... })`）**：`enabled`・`size`・`accent_color`・`trail_enabled`・`fog_enabled`・`ripple_enabled`・`label_enabled`・`idle_timeout_ms`・`idle_wobble`（`KomaAgentCursorSpec`）を設定できます。エージェントのキャプチャビュー（`koma.capture`）からはカーソルオーバーレイが自動除外されます。
- **多点スプライン軌道（`MacroContext:{move_path, stroke_path, path, settle_cursor}`）**：`waypoints`（`KomaAnchorPoint[]`）と任意の `spline = "auto" | "catmull_rom" | "bezier"`（`KomaPathSplineKind`）を指定し、求心（$\alpha = 0.5$）Catmull-Rom 補間と `250 Hz` 適応サブフレーム再標本化で滑らかに描画・移動し、`ctx:settle_cursor()` で静止させます：

```lua
koma.appearance({
    agent_cursor = {
        enabled = true,
        trail_enabled = true,
        fog_enabled = true,
        ripple_enabled = true,
        label_enabled = true,
    },
})

koma.macro.define({
    id = "canvas.spline_stroke",
    app_id = ".*",
    description = "複数ウェイポイントを通る求心 Catmull-Rom スプラインで描画ドラッグを実行",
    run = function(ctx)
        ctx:stroke_path({
            spline = "catmull_rom",
            button = "left",
            waypoints = {
                { anchor = "center", x = -120, y = -40 },
                { anchor = "center", x = 0, y = -90 },
                { anchor = "center", x = 140, y = 20 },
            },
        })
        ctx:settle_cursor(false)
    end,
})
```
