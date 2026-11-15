# ウィンドウルールと保護サーフェス

Koma は `koma.rule.window`（Wayland / XWayland ウィンドウ）および `koma.rule.layer`（`wlr-layer-shell` サーフェス）による宣言的ルールを提供します。すべてのルールは `:set_enabled(bool)` と `:remove()` を備えた `KomaHandle` を返し、正規表現はシャドウ評価時に事前コンパイルされるため不正なパターンでコンポジタが破損しません。

## ウィンドウルール仕様（`koma.rule.window`）

| フィールド | 適用対象 | 内容 |
| :--- | :--- | :--- |
| `matches` / `excludes` | 一致条件配列 | `app_id`、`title`、`tag`、`workspace`、`is_floating`、`is_focused`、`is_urgent`、`is_modal_dialog`、`is_xwayland`、`is_screencast_target`、`is_agent_workspace`、`at_startup` |
| `initial` | 初回マッピング時 | `open_on_output`、`open_on_workspace`、`open_mode`（`"tiled"` / `"floating"` / `"fullscreen"`）、`open_focused`、`default_floating_pos = { x, y, anchor }` |
| `opacity` | ライブサーフェス | 透過率の上書き（`0.0..=1.0`） |
| `corner_radius` | ライブサーフェス | ウィンドウ単位の角丸半径（論理ピクセル） |
| `clip_to_geometry` | ライブサーフェス | レイアウトジオメトリでクライアント描画をクリップ |
| `focusable` | ライブ入力 | キーボードフォーカスの可否を制御 |
| `pin_on_output` | ライブサーフェス | 同一出力でのワークスペース切替時も追従固定 |
| `block_out_from` | プライバシー保護 | `"agent_capture"` \| `"screencast"` \| `"screencopy"` \| `"all"` |

### 設定例

```lua
-- パスワードマネージャを中央フローティング配置し、あらゆるキャプチャから黒塗り遮蔽
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

-- 起動時チャットアプリをワークスペース 3 へ自動配置
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

`namespace`、`layer`（`"background"` / `"bottom"` / `"top"` / `"overlay"`）、`at_startup` でステータスバーや通知デイモンを制御できます。

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

## 保護サーフェス遮蔽とブラックアウト（`4032 ERR_PROTECTED_SURFACE`）

> [!IMPORTANT]
> **コンポジタ主導の強制マスク**：`block_out_from = "agent_capture"` または `"all"` に一致するウィンドウ／レイヤーは、`capture.frame`（`SCM_RIGHTS` `memfd`）エクスポート前に `koma-render` が領域を `#000000`（`[PROTECTED]`）へ塗り潰します。

- **入力遮断（`4032`）**：保護サーフェス上を対象とした `vseat.*` クリック・ドラッグ・キー・テキスト注入はすべて `4032 ERR_PROTECTED_SURFACE` で拒否されます。
- **完全な機密保護**：`koma-mcp` や [Jiku](/ja/jiku/) からパスワードや 2FA トークン画面が参照されることはありません。
- **キャプチャ種別ごとの制御**：`"screencopy"` / `"all"` は `zwlr_screencopy_manager_v1`（`grim`）からも遮蔽し、`"screencast"` は Portal 画面共有ストリームで遮蔽します。
