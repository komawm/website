# LuaLS 型補完の導入 (koma-types)

`~/.config/koma/init.lua` 向けの LuaLS / LuaCATS 型定義は、`Apache-2.0` ライセンスの独立リポジトリ [komawm/koma-types](https://github.com/komawm/koma-types) で公開されており、`komactl gen-types`（`koma-lua/src/typegen.rs`）の出力とバイト単位で一致するよう検証されています。

## `types/koma.lua` の生成または取得

手元の `komactl` から直接生成するか、公式スナップショットをクローンします。

```bash
# 方法 A: 導入済み komactl から生成
mkdir -p ~/.config/koma/types
komactl gen-types > ~/.config/koma/types/koma.lua

# 方法 B: バージョン管理リポジトリをクローン
git clone --depth 1 https://github.com/komawm/koma-types.git ~/.local/share/koma-types
```

## エディタ設定（`.luarc.json`）

`~/.config/koma/.luarc.json` を作成して `Lua 5.4` とライブラリパスを指定します。

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

### 各エディタでの利用

- **Neovim（`nvim-lspconfig` / `lazydev.nvim`）**：`~/.config/koma/init.lua` を開くと `lua_ls` が `.luarc.json` を自動認識します（`lazydev.nvim` の `library` へ `~/.local/share/koma-types/types` を追加しても構いません）。
- **Helix（`languages.toml`）**：`lua-language-server` が `.luarc.json` を自動読み込みします。
- **Zed / VS Code（`sumneko.lua`）**：`~/.config/koma` フォルダを開くと `koma.layout`・`koma.monitor`・`koma.input`・`koma.appearance`・`koma.rule.*`・`koma.macro.*`・`koma.act.*` の補完が即座に有効になります。

## 再現性チェック

`komawm/koma-types` の CI では、毎回 `Lua 5.4` の `luac -p` 構文チェックおよび `komactl gen-types` との完全一致（`artifact.toml` の `generator_reproduced = true`）を検証しています。
