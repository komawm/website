# 编辑器类型补全 (koma-types)

`~/.config/koma/init.lua` 的 LuaLS 自动补全、悬停提示与字段诊断由 `komactl gen-types` 和 `Apache-2.0` 开源仓库 [komawm/koma-types](https://github.com/komawm/koma-types) 提供。

![在 Dwindle 平铺布局中配合 komactl 编辑 ~/.config/koma/init.lua](https://cdn.komawm.org/media/koma-dwindle.webp "Dwindle 布局下编辑 ~/.config/koma/init.lua 与使用 komactl 的示例。")

## 生成或克隆 `types/koma.lua`

建议直接由本机已安装的 `komactl` 导出（保证类型定义与当前版本完全一致），也可以克隆版本快照仓库：

```bash
# 方式 A：由已安装的 komactl 直接生成
mkdir -p ~/.config/koma/types
komactl gen-types > ~/.config/koma/types/koma.lua

# 方式 B：克隆类型仓库
git clone --depth 1 https://github.com/komawm/koma-types.git ~/.local/share/koma-types
```

升级 Koma 后重新执行 `komactl gen-types > ~/.config/koma/types/koma.lua`，即可同步最新字段与动作定义。

## 编辑器配置（`.luarc.json`）

在 `~/.config/koma/.luarc.json` 中声明 `Lua 5.4` 运行时与类型库目录：

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

若使用方式 B 克隆仓库，请将 `"workspace.library"` 设为 `["~/.local/share/koma-types/types"]`（或将其软链接到 `~/.config/koma/types`）。

### 常见编辑器接入

- **Neovim（`nvim-lspconfig` / `lazydev.nvim`）**：在 `~/.config/koma/` 打开 `init.lua` 时 `lua_ls` 会自动加载 `.luarc.json`，也可将 `~/.local/share/koma-types/types` 加入 `lazydev.nvim` 的 `library` 路径。
- **Helix**：打开 `.lua` 文件时 `lua-language-server` 会自动读取配置根目录下的 `.luarc.json`。
- **Zed / VS Code（`sumneko.lua`）**：以文件夹形式打开 `~/.config/koma`，即可获得 `koma.layout`、`koma.monitor`、`koma.input`、`koma.appearance`、`koma.rule.*`、`koma.macro.*` 与 `koma.act.*` 的完整补全提示。

[komawm/koma-types](https://github.com/komawm/koma-types) 发布的存根文件均经过 Lua 5.4（`luac -p`）语法检查，并与 `komactl gen-types` 输出保持一致。

### `v0.0.1` 新增类型亮点

- **`KomaAgentCursorSpec` 与 `KomaAppearanceSpec.agent_cursor`**：新增 `enabled?`、`size?`、`accent_color?`、`trail_enabled?`、`fog_enabled?`、`ripple_enabled?`、`label_enabled?`、`idle_timeout_ms?` 与 `idle_wobble?` 字段。
- **轨迹与路径类型**：新增 `KomaPathSplineKind`（`"auto" | "catmull_rom" | "bezier"`）、`KomaPathSpec` 与 `MacroContext:{move_path, stroke_path, path, settle_cursor}`。
