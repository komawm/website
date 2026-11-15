# エディタ補完 (koma-types)

`~/.config/koma/init.lua` 向けの LuaLS 補完・ホバードキュメント・型チェックは、`komactl gen-types` および `Apache-2.0` リポジトリ [komawm/koma-types](https://github.com/komawm/koma-types) で提供されています。

![Dwindle レイアウトでの ~/.config/koma/init.lua 編集と komactl の使用例](https://cdn.komawm.org/media/koma-dwindle.webp "Dwindle タイルレイアウト上で ~/.config/koma/init.lua と komactl を使う画面例。")

## `types/koma.lua` の生成または取得

実行中の Koma とバージョンを確実に一致させるため、導入済みの `komactl` から直接生成する方法を推奨します（公式リポジトリのクローンも可能です）。

```bash
# 方法 A: 導入済み komactl から生成
mkdir -p ~/.config/koma/types
komactl gen-types > ~/.config/koma/types/koma.lua

# 方法 B: 型定義リポジトリをクローン
git clone --depth 1 https://github.com/komawm/koma-types.git ~/.local/share/koma-types
```

Koma をアップグレードした際は `komactl gen-types > ~/.config/koma/types/koma.lua` を再実行すると最新の型定義へ更新できます。

## エディタ設定（`.luarc.json`）

`~/.config/koma/.luarc.json` を作成し、`Lua 5.4` とライブラリパスを指定します。

```json
{
  "$schema": "https://raw.githubusercontent.com/LuaLS/vscode-lua/master/setting/schema.json",
  "runtime.version": "Lua 5.4",
  "diagnostics.globals": ["koma"],
  "workspace.library": [
    "./types"
  ],
  "workspace.checkThirdParty": false
}
```

リポジトリをクローンした場合は `"workspace.library"` を `["~/.local/share/koma-types/types"]` に設定するか、`~/.config/koma/types` へシンボリックリンクを作成してください。

### 各エディタでの利用

- **Neovim（`nvim-lspconfig` / `lazydev.nvim`）**：`~/.config/koma/init.lua` を開くと `lua_ls` が `.luarc.json` を自動読み込みします（`lazydev.nvim` の `library` へ `~/.local/share/koma-types/types` を追加しても利用できます）。
- **Helix**：`.lua` ファイルを開くと `lua-language-server` が `.luarc.json` を自動で読み込みます。
- **Zed / VS Code（`sumneko.lua`）**：`~/.config/koma` フォルダをワークスペースとして開くと、`koma.layout`・`koma.monitor`・`koma.input`・`koma.appearance`・`koma.rule.*`・`koma.macro.*`・`koma.act.*` の補完が即座に有効になります。

`komawm/koma-types` に公開されているスタブは Lua 5.4（`luac -p`）で構文検証され、`komactl gen-types` の出力と一致することが確認されています。

### `v0.0.1` の主な追加型

- **`KomaAgentCursorSpec` と `KomaAppearanceSpec.agent_cursor`**：`enabled?`・`size?`・`accent_color?`・`trail_enabled?`・`fog_enabled?`・`ripple_enabled?`・`label_enabled?`・`idle_timeout_ms?`・`idle_wobble?` を追加しました。
- **軌道・パス型**：`KomaPathSplineKind`（`"auto" | "catmull_rom" | "bezier"`）、`KomaPathSpec`、`MacroContext:{move_path, stroke_path, path, settle_cursor}` を追加しました。
