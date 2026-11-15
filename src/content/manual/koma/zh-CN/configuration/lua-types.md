# LuaLS 智能补全接入 (koma-types)

`~/.config/koma/init.lua` 的完整 LuaCATS 类型定义快照托管于独立的 `Apache-2.0` 仓库 [komawm/koma-types](https://github.com/komawm/koma-types)，由 `komactl gen-types` 确定性逐字节生成并通过 `luac -p` 校验。

## 配置 Neovim / VS Code (`lua-language-server`)

导出类型定义文件并在 `~/.config/koma/.luarc.json` 中指向该目录即可获得完整的字段补全与类型检查：

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
