# Editor Completion (koma-types)

Editor autocompletion, hover documentation, and option diagnostics for `~/.config/koma/init.lua` are provided by `komactl gen-types` and the `Apache-2.0` stub repository [komawm/koma-types](https://github.com/komawm/koma-types).

![Editing ~/.config/koma/init.lua with komactl and Dwindle tiling](/media/koma-dwindle.webp "Dwindle tiling layout alongside ~/.config/koma/init.lua and komactl.")

## Generating or Cloning `types/koma.lua`

Generate the type file directly from your installed `komactl` binary (recommended so stubs match your running version) or clone `komawm/koma-types`:

```bash
# Option A: Generate directly from installed komactl
mkdir -p ~/.config/koma/types
komactl gen-types > ~/.config/koma/types/koma.lua

# Option B: Clone the versioned stub repository
git clone --depth 1 https://github.com/komawm/koma-types.git ~/.local/share/koma-types
```

Re-run `komactl gen-types > ~/.config/koma/types/koma.lua` after upgrading Koma to refresh new fields and actions.

## Editor Setup (`.luarc.json`)

Create `~/.config/koma/.luarc.json` pointing `workspace.library` at the directory containing `koma.lua`:

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

If you cloned `komawm/koma-types` instead, set `"workspace.library"` to `["~/.local/share/koma-types/types"]` (or symlink `~/.local/share/koma-types/types` to `~/.config/koma/types`).

### Editor Notes

- **Neovim (`nvim-lspconfig` / `lazydev.nvim`)**: Opening `~/.config/koma/init.lua` picks up `.luarc.json` automatically with `lua_ls`, or you can add `~/.local/share/koma-types/types` to `lazydev.nvim` `library` paths.
- **Helix**: Uses `lua-language-server` automatically for `.lua` files and reads `~/.config/koma/.luarc.json`.
- **Zed / VS Code (`sumneko.lua`)**: Open `~/.config/koma` as the workspace folder to enable completion across `koma.layout`, `koma.monitor`, `koma.input`, `koma.appearance`, `koma.rule.*`, `koma.macro.*`, and `koma.act.*`.

Published stubs in `komawm/koma-types` are checked against `luac -p` (Lua 5.4) and matched to `komactl gen-types` output.
