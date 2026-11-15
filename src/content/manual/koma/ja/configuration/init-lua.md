# レイアウト・外観・init.lua

Koma は `~/.config/koma/init.lua`（または `$XDG_CONFIG_HOME/koma/init.lua`、フォールバックは `/etc/xdg/koma/init.lua`）から設定を読み込みます。環境変数 `KOMA_CONFIG` または `koma -c <path>` で設定ファイルを切り替えられるほか、`~/.config/koma/lua/` 配下に分割したモジュールを `require(...)` で読み込めます。

![Koma 横スクロールレイアウトと Lua 設定のプレビュー](https://cdn.komawm.org/media/koma-scrolling.webp "Scrolling レイアウトのマルチカラム表示とステータスバーの例。")

## 検証と安全なリロード

- **サンドボックス評価**：Lua 5.4 の評価環境はヒープ上限 `4 MiB` と命令数上限で制限されており、`io`・`os`・`debug`・`package` の各 OS ライブラリは無効化されているため、設定内の無限ループ等でコンポジタが停止することはありません。
- **事前検証**：`~/.config/koma/init.lua` を編集したら、リロード前に `komactl validate` で構文・正規表現・ジェスチャをオフライン確認できます。
  ```bash
  komactl validate ~/.config/koma/init.lua
  ```
- **安全なリロード**：`init.lua` の保存（自動監視）、`komactl reload`、または `Mod + Shift + R` で設定を再読み込みします。新しい設定は独立環境で評価され、エラーがある場合は稼働中のウィンドウやキーバインドを維持したまま失敗します。現在の状態と最後のエラーは `komactl config-status` で確認できます。

## レイアウトとワークスペース（`koma.layout`, `koma.dwindle`, `koma.scrolling`, `koma.workspace`）

画面付きワークスペースの既定レイアウトは `"dwindle"` です。`~/.config/koma/init.lua` では全体またはワークスペース単位で `"dwindle"`・`"scrolling"`・`"deck"`（アクティブウィンドウ全画面 + バックグラウンドスタッシュ）・`"bsp"` を指定できます。

```lua
koma.layout("dwindle") -- "dwindle" | "scrolling" | "deck" | "bsp"

koma.dwindle({
    force_split = 0,         -- 0 = 縦横比で自動分割, 1 = 左/上, 2 = 右/下
    preserve_split = false,
    smart_split = false,
    default_split_ratio = 1.0,
    inner_gap = 6,
    outer_gap = 10,
})

koma.scrolling({
    preset_column_widths = { 1 / 3, 0.5, 2 / 3 },
    default_column_width = { proportion = 0.5 },
    default_column_display = "normal", -- "normal" | "tabbed"
    center_focused_column = "never",   -- "never" | "always" | "on_overflow"
    camera_damping_ratio = 1.0,
    camera_stiffness = 800.0,
    inner_gap = 8,
    outer_gap = 10,
    edge_auto_scroll = { enabled = true, trigger_width = 30, delay_ms = 100, max_speed = 1500 },
})

koma.workspace({ name = "1", layout = "dwindle", gaps = { inner = 6, outer = 10 } })
koma.workspace({ name = "2", layout = "scrolling" })
koma.workspace({ name = "agent:work", presentation = "headless", layout = "deck" })
```

`koma.workspace({...})` では `preferred_output`（`"eDP-1"` 等のコネクタ名）や整数指定の `gaps_in` / `gaps_out` も使用できます。

## 外観（`koma.appearance`）

`koma.appearance({...})` の各項目には既定値が設定されているため、変更したい設定だけ記述できます。

```lua
koma.appearance({
    corner_radius = 10,
    border = {
        enabled = true,
        width = 2.0,
        active_color = "#58a6ff",
        inactive_color = "#30363d",
        agent_leased_color = "#d2a8ff",  -- エージェントの Epoch リース保持中の枠線色
        human_preempt_color = "#f0883e", -- Mod + G 人間接収時の枠線色
    },
    focus_ring = { enabled = false, width = 2.0, active_color = "#58a6ff", inactive_color = "#30363d" },
    shadow = {
        enabled = true,
        range = 16,
        render_power = 3,
        sharp = false,
        color = "#00000073",
        offset_x = 0.0,
        offset_y = 4.0,
        scale = 1.0,
    },
    dim = { dim_inactive = false, dim_strength = 0.15, brightness = 1.0, contrast = 1.0 },
    blur = {
        enabled = true,
        size = 6,
        passes = 3,
        noise = 0.0117,
        contrast = 0.8916,
        brightness = 0.8172,
        vibrancy = 0.1696,
        xray = true,
        ignore_opacity = false,
    },
    animations = {
        enabled = true,
        damping_ratio = 1.0,
        stiffness = 800.0,
        epsilon = 0.0005,
        open_scale_from = 0.88,
        close_scale_to = 0.92,
    },
})
```

グラデーション枠線・カスタムカーブ・チャネル別スタイルについては [アニメーション・枠線・ブラー](/ja/docs/configuration/animations-and-rice/)、LuaLS の型補完については [エディタ補完 (koma-types)](/ja/docs/configuration/lua-types/) を参照してください。

## キーバインド・モード・補助 API

既定では `inherit_default_binds = true` により組み込みキーマップが読み込まれます。`koma.bind(...)` で特定のキーを上書きし、`koma.unbind(chord)` で不要な既定バインドを解除できます。

```lua
koma.unbind("Mod + Return")
koma.bind("Mod + Return", koma.act.spawn({ "foot" }), { desc = "Launch foot" })
koma.bind("Mod + O", koma.act.overview.toggle(), { desc = "Toggle koma-overview" })
```

| 補助 API | 用途 |
| :--- | :--- |
| `koma.env(key, val)` | Koma から起動する子プロセスへ環境変数を渡す |
| `koma.mode(name, spec)` | `koma.act.mode.enter(name)` / `koma.act.mode.exit()` で切り替えるサブマップモードを定義 |
| `koma.on(event, fn)` | ライフサイクルイベントの Lua コールバックを登録 |
| `koma.macro.define(spec)` | パラメータ化マクロを定義し `koma-mcp` に公開 |

## 動的スナップショットとイベントフック（`MacroContext`, `koma.on`）

キーバインドのコールバックや `koma.on` リスナーには、読み取り専用のスナップショット `ctx`（`MacroContext`）が渡されます。保護対象ウィンドウは `app_id` と `title` の両方が `"[protected]"` にマスクされ、ヘッドレスワークスペースのウィンドウは通常クエリから分離されます。

- `ctx:focused_window()` — フォーカス中のウィンドウ情報（`id`, `app_id`, `title`, `workspace`, `floating`, `fullscreen`, `focused`）または `nil` を返します。
- `ctx:windows()` / `ctx:outputs()` / `ctx:workspaces()` — 表示対象ウィンドウ・出力・ワークスペースの一覧を返します。
- `ctx:dispatch(action)` — コンパイル済み `koma.act.*` アクション（`koma.act.window.focus(win_id)` や `koma.act.workspace.set_layout(mode, workspace?)` 等）をキューへ投入します（`dispatch` 内のネストした Lua コールバックは拒否されます）。

`koma.on(event_name, function(ctx, event) ... end)` で利用できるイベント（再帰深度上限 `4`）は `"compositor.start"`・`"config.reloaded"`・`"window.mapped"`・`"window.closed"`・`"window.focused"`・`"workspace.focused"`・`"output.changed"` です。

```lua
-- Run-or-Raise：既存の foot をフォーカス、無ければ起動
koma.bind("Mod + Shift + T", function(ctx)
    for _, win in ipairs(ctx:windows()) do
        if win.app_id == "foot" then
            ctx:dispatch(koma.act.window.focus(win.id))
            return
        end
    end
    ctx:dispatch(koma.act.spawn({ "foot" }))
end, { desc = "Focus foot or launch it" })

-- ウルトラワイド出力の検出時に scrolling レイアウトへ自動切替
koma.on("output.changed", function(ctx, ev)
    if ev.width and ev.width >= 3440 then
        ctx:dispatch(koma.act.workspace.set_layout("scrolling"))
    end
end)
```
