# LuaLS Type Completion (koma-types)

Editor autocompletion and inline hover documentation for `~/.config/koma/init.lua` are published in the standalone `Apache-2.0` repository [komawm/koma-types](https://github.com/komawm/koma-types) and reproduced byte-for-byte from `komactl gen-types`.

## Wiring Neovim / VS Code (`lua-language-server`)

Generate or download `koma.lua` into `~/.config/koma/types/` and add `.luarc.json` alongside your `init.lua`:

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
