# レイアウト・外観・キー上書き

Koma は純 Rust 製のスタックレス Lua 5.4 ランタイム [Phodopus](https://github.com/Xuepoo/phodopus) 上で `~/.config/koma/init.lua` を評価します。命令燃料（Instruction Fuel）とメモリ上限が厳密に強制されるため、設定スクリプトの不備で Wayland コンポジタ全体がフリーズすることはありません。

![Koma 水平スクロールレイアウトのプレビュー](/placeholders/koma-scrolling.webp "連続水平スクロールレイアウトのプレビュー。")

## グローバルおよびワークスペース別レイアウト

標準の `"dwindle"` 分割に加え、Niri 互換の操作感を備えた水平スクロール `"scrolling"`（`preset_column_widths`、カラム内縦スタック、3本指タッチパッド慣性スクロール対応）をワークスペース単位で混在させることができます。

```lua
-- ~/.config/koma/init.lua
koma.layout("dwindle")

koma.workspace({
  name = "2",
  layout = "scrolling",
  gaps = { inner = 8, outer = 14 },
})

koma.scrolling({
  preset_column_widths = { 0.333, 0.5, 0.667 },
  center_focused_column = "on_overflow",
})
```

## 外観・Dual-Kawase ブラー・臨界減衰スプリング

`koma.appearance({...})` では、Koma の象徴である氷青色（`#CBDCEB`）のフォーカス枠、エージェントリース枠、Dual-Kawase ブラー、臨界減衰バネアニメーションを型安全に定義できます。

```lua
koma.appearance({
  corner_radius = 12,
  border = {
    enabled = true,
    width = 2,
    active_color = "#CBDCEB",
    inactive_color = "#2A394D",
    agent_leased_color = "#7AA8D6",
    human_preempt_color = "#E07A5F",
  },
  blur = {
    enabled = true,
    passes = 3,
    radius = 6.0,
  },
  animations = {
    enabled = true,
    stiffness = 420.0,
    damping_ratio = 1.0,
  },
})
```
