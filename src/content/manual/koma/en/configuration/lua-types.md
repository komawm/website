# LuaLS Type Completion (koma-types)

Editor autocompletion, hover docs, and enum diagnostics for `~/.config/koma/init.lua` are published in the standalone `Apache-2.0` repository [komawm/koma-types](https://github.com/komawm/koma-types) and reproduced byte-for-byte from `komactl gen-types` (`koma-lua/src/typegen.rs`).

## Generating or Cloning `types/koma.lua`

You can either generate the stub locally from your installed `komactl` binary or clone `komawm/koma-types`:

```bash
# Option A: Emit directly from installed komactl
mkdir -p ~/.config/koma/types
komactl gen-types > ~/.config/koma/types/koma.lua

# Option B: Clone the versioned snapshot repository
git clone --depth 1 https://github.com/komawm/koma-types.git ~/.local/share/koma-types
```

## Editor Setup (`.luarc.json`)

Place a `.luarc.json` file inside `~/.config/koma/` pointing `workspace.library` at the directory containing `koma.lua`:

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

### Editor Integrations

- **Neovim (`nvim-lspconfig` / `lazydev.nvim`)**: Ensure `lua_ls` attaches inside `~/.config/koma/` (it automatically reads `.luarc.json`), or add `~/.local/share/koma-types/types` to `lazydev.nvim` `library` paths.
- **Helix (`languages.toml`)**: Helix uses `lua-language-server` automatically for `.lua` buffers and picks up `~/.config/koma/.luarc.json`.
- **Zed / VS Code (`sumneko.lua`)**: Open `~/.config/koma` as a folder; `LuaLS` resolves `koma.layout`, `koma.monitor`, `koma.input`, `koma.appearance`, `koma.rule.*`, `koma.macro.*`, and `koma.act.*` completions immediately.

## Reproducibility Guarantee

`komawm/koma-types` verifies on every CI run that `types/koma.lua` parses cleanly under `luac -p` (`Lua 5.4`) and matches `komactl gen-types` output (`artifact.toml` `generator_reproduced = true`).
