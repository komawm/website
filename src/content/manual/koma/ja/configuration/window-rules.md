# ウィンドウルールと保護サーフェス

Koma は `~/.config/koma/init.lua` の `koma.rule.window({...})` で Wayland / XWayland ウィンドウを、`koma.rule.layer({...})` で `wlr-layer-shell` サーフェスを制御します。ルールは宣言順に評価され（後続の一致プロパティが上書き）、戻り値の `KomaHandle` で `:set_enabled(bool)` や `:remove()` を動的に呼び出せます。`app_id`・`title`・`namespace` の正規表現は設定読み込み時に検証されるため、不正なパターンで稼働中のウィンドウが壊れることはありません。

## ウィンドウルール（`koma.rule.window`）

| フィールド | 適用タイミング | 内容 |
| :--- | :--- | :--- |
| `matches` / `excludes` | 一致・除外条件 | `app_id`、`title`、`tag`、`workspace`、`is_floating`、`is_focused`、`is_urgent`、`is_modal_dialog`、`is_xwayland`、`is_screencast_target`、`is_agent_workspace`、`at_startup` |
| `initial` | 初回マッピングのみ | `open_on_output`、`open_on_workspace`、`open_mode`（`"tile"` \| `"float"` \| `"fullscreen"` \| `"maximized"` \| `"deck_top"` \| `"stash_background"`）、`open_focused`、`default_floating_pos = { x, y, anchor }` |
| `opacity` | ライブサーフェス | 透過率の上書き（`0.0..=1.0`） |
| `inactive_opacity` | ライブサーフェス | 非フォーカス時の透過率乗数（`0.0..=1.0`） |
| `corner_radius` | ライブサーフェス | ウィンドウ単位の角丸半径（論理ピクセル） |
| `clip_to_geometry` | ライブサーフェス | レイアウト境界でクライアント描画をクリップ |
| `animation` | ライブサーフェス | ウィンドウ単位の開閉アニメーション指定（例: `"popin 88%"`, `"slide:top"`） |
| `no_blur` / `no_shadow` | ライブサーフェス | 背景ブラーまたはドロップシャドウを無効化 |
| `border_color` | ライブサーフェス | アクティブボーダー色の上書き（`"#rrggbb"` / `"#rrggbbaa"`） |
| `focusable` | ライブ入力 | キーボードフォーカスの可否を制御 |
| `pin_on_output` | ライブサーフェス | 同一出力でのワークスペース切替時もフローティングウィンドウを維持 |
| `suppress_events` | ライブサーフェス | クライアントからの状態要求を無視（例: `{ "maximize" }`） |
| `block_out_from` | プライバシー保護 | `"agent_capture"` \| `"screencast"` \| `"screencopy"` \| `"all"` |

`default_floating_pos.anchor` には `"top-left"`, `"top"`, `"top-right"`, `"left"`, `"center"`, `"right"`, `"bottom-left"`, `"bottom"`, `"bottom-right"` を指定できます。

### 設定例（`~/.config/koma/init.lua`）

```lua
-- パスワードマネージャを中央フロート配置し、あらゆるキャプチャから黒塗り遮蔽
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

-- ブラウザのピクチャ・イン・ピクチャを右下へ固定配置
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

-- 起動時のチャットアプリをワークスペース 3 へ自動配置（フォーカスを奪わない）
koma.rule.window({
    name = "chat-workspace",
    matches = { { app_id = "^(org\\.telegram\\.desktop|discord)$", at_startup = true } },
    initial = {
        open_on_workspace = "3",
        open_focused = false,
    },
})

-- キーバインドからルールを動的に有効化
koma.bind("Mod + Shift + B", function()
    vault_rule:set_enabled(true)
end, { desc = "機密ウィンドウ保護ルールを有効化" })
```

## Layer-Shell ルール（`koma.rule.layer`）

`namespace`、`layer`（`"background"`, `"bottom"`, `"top"`, `"overlay"`）、`at_startup` でパネル・通知・壁紙サーフェスを制御します。

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

## 保護サーフェス（`4032 ERR_PROTECTED_SURFACE`）

> [!IMPORTANT]
> セッションロック画面（`ext-session-lock-v1`）、認証ダイアログ（`polkit-gnome-authentication-agent`, `hyprpolkitagent`, `pinentry`）、主要パスワードマネージャ（`KeePassXC`, `Bitwarden`, `1Password`）は既定で保護対象となります。追加のウィンドウやレイヤーは `block_out_from` で指定できます。

- **キャプチャ遮蔽**：`block_out_from = "agent_capture"` または `"all"` に一致するサーフェスは、オフスクリーン `capture.frame` 出力前に `#000000` で塗り潰されます（他のウィンドウと重なっている場合も同様です）。
- **入力ブロック（`4032`）**：保護サーフェス領域への仮想シート（`vseat.*`）クリック・ドラッグ・キー・テキスト注入は `4032 ERR_PROTECTED_SURFACE` で拒否されます。`koma-mcp` や [Jiku](/ja/jiku/) から保護対象を読み取ったり操作したりすることはできません。
- **スクリーンコピー／画面共有の分離**：`"screencopy"` と `"all"` は `zwlr_screencopy_manager_v1`（`grim`）から遮蔽し、`"screencast"` は Portal PipeWire ストリームで遮蔽します。

## 互換性に関する補足

- **Waydroid（`Waydroid`, `waydroid.<package>`）**：ユーザーの `koma.rule.window` で明示的に上書きしない限り既定で `no_blur = true` が適用されます。空の `wl_surface.set_input_region` を持つコンテナサーフェスはクリックスルーとして扱い、枠線・フォーカスリング・影・ブラーおよび `clip_to_geometry` を抑止してマルチウィンドウ動作を維持します。
- **リモートデスクトップクライアント**：フォーカス中は `zwlr_virtual_pointer_manager_v1` と `zwp_keyboard_shortcuts_inhibit_manager_v1` に対応しつつ、緊急復帰用の `Mod + G` と VT 切替ショートカットは常に有効なまま保ちます。
- **パネル・ウィジェット（`waybar`, `ironbar`, `quickshell`）**：`get_popup` の制約解除、単色バッファ（`wp_single_pixel_buffer_v1`）、`wp_presentation` フィードバック、`wl_shm` `Abgr8888`/`Xbgr8888` 形式に対応しています。
