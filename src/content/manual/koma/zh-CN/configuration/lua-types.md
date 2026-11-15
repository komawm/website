# LuaLS 类型补全接入 (koma-types)

`~/.config/koma/init.lua` 的完整 LuaCATS 类型定义与悬停提示文档托管在独立的 `Apache-2.0` 仓库 [komawm/koma-types](https://github.com/komawm/koma-types) 中，并与 `komactl gen-types`（`koma-lua/src/typegen.rs`）保持逐字节确定性一致。

## 生成或克隆 `types/koma.lua`

你可以直接由本地 `komactl` 导出，也可以克隆官方版本快照仓库：

```bash
# 方式 A：由已安装的 komactl 直接导出
mkdir -p ~/.config/koma/types
komactl gen-types > ~/.config/koma/types/koma.lua

# 方式 B：克隆版本化类型快照仓库
git clone --depth 1 https://github.com/komawm/koma-types.git ~/.local/share/koma-types
```

## 编辑器配置（`.luarc.json`）

在 `~/.config/koma/.luarc.json` 中声明 `Lua 5.4` 运行时与类型库目录即可启用全量智能补全：

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

### 常见编辑器接入

- **Neovim（`nvim-lspconfig` / `lazydev.nvim`）**：在 `~/.config/koma/` 打开 `init.lua` 时 `lua_ls` 会自动加载 `.luarc.json`，也可将 `~/.local/share/koma-types/types` 加入 `lazydev.nvim` 库路径。
- **Helix（`languages.toml`）**：打开 `.lua` 文件后 `lua-language-server` 会自动读取工作区根目录的 `.luarc.json`。
- **Zed / VS Code（`sumneko.lua`）**：以文件夹形式打开 `~/.config/koma`，即可立即获得 `koma.layout`、`koma.monitor`、`koma.input`、`koma.appearance`、`koma.rule.*`、`koma.macro.*` 与 `koma.act.*` 的完整提示。

## 确定性校验保障

[komawm/koma-types](https://github.com/komawm/koma-types) 在每次 CI 中都会验证 `types/koma.lua` 可通过 `Lua 5.4` `luac -p` 语法校验，且与 `komactl gen-types` 输出逐字节匹配（`artifact.toml` 标记 `generator_reproduced = true`）。
