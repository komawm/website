# LuaLS 型補完の導入 (koma-types)

`~/.config/koma/init.lua` 向けの LuaLS / LuaCATS 型定義スナップショットは `Apache-2.0` ライセンスの独立リポジトリ [komawm/koma-types](https://github.com/komawm/koma-types) で提供され、`komactl gen-types` からバイト単位で再現検証されています。

## Neovim / VS Code (`lua-language-server`) の設定

型定義を出力し、`~/.config/koma/.luarc.json` にライブラリパスを追加するだけで全テーブルの入力補完が有効になります。

```bash
mkdir -p ~/.config/koma/types
komactl gen-types > ~/.config/koma/types/koma.lua
```

```json
{
  "$schema": "https://raw.githubusercontent.com/LuaLS/vscode-lua/master/setting/schema.json",
  "runtime.version": "Lua 5.4",
  "workspace.library": ["~/.config/koma/types"],
  "diagnostics.globals": ["koma"]
}
```
