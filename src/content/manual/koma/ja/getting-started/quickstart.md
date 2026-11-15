# セッション起動と既定キーマップ

> [!NOTE]
> `koma.input` で `inherit_default_binds = true`（既定値）が有効な場合、Hyprland 互換の標準キーバインドが自動的に読み込まれます。`koma.bind(...)` は該当コードのみを上書きし、他の既定キーを消去しません。不要な既定バインドは `koma.unbind(chord)` で個別に解除できます。

## ネスト実行と TTY 起動

既存の Wayland セッション内では `--winit` で安全にネスト検証でき、分離された VM 環境では `--tty` で起動できます。

```bash
# 起動前に Lua 構文とサンドボックス制約を検証
komactl validate ~/.config/koma/init.lua

# 既存の Wayland デスクトップ内でネスト起動
koma --winit --config ~/.config/koma/init.lua

# 分離された VM の TTY で起動し foot を実行
koma --tty --spawn foot
```

## 既定キーバインド一覧

| キー操作 | 既定のアクション | 補足 |
| :--- | :--- | :--- |
| `Mod + Return` | ターミナル起動（`foot`） | `koma.bind` で Ghostty 等へ変更可能 |
| `Mod + Q` | フォーカス中のウィンドウを閉じる | 標準 Wayland クローズ要求 |
| `Mod + H / J / K / L` | 上下左右へフォーカス移動 | Dwindle / Scrolling 両対応 |
| `Mod + Shift + H / J / K / L` | ウィンドウ・カラムの移動 | 決定論的レイアウト木を維持 |
| `Mod + V` / `Mod + F` | フローティング / フルスクリーン切替 | 個別ウィンドウ状態遷移 |
| `Mod + S` | `special` スクラッチパッド表示切替 | オーバーレイ層として描画 |
| `Mod + G` | 人間優先プリエンプションバリア | エージェントの Epoch リースを即時失効 |
| `Mod + 1..9` | ワークスペース `1..9` 切替 | モニタ単位のワークスペース管理 |
