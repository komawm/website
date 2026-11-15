# セッション起動と既定キーマップ

> [!TIP]
> Koma には Hyprland 互換の既定キーマップ（`inherit_default_binds = true`）が組み込まれています。`~/.config/koma/init.lua` が存在しない状態でも、起動直後からターミナル起動・タイリング・ワークスペース切替・リロードを行えます。

## 起動モード（`koma [OPTIONS]`）

CLI オプションはディスプレイや DRM デバイスを開く前に純粋関数として解析されます。

| オプション | バックエンド / 挙動 | 主な用途 |
| :--- | :--- | :--- |
| `koma --winit` | Smithay Winit バックエンドで既存セッション内にネスト起動 | Hyprland / Sway / GNOME 上での安全な設定検証 |
| `koma --tty` | `libseat`（`seatd`/`logind`）・`udev`・`DRM/KMS`・`libinput` で VT へ直接起動 | 実機 TTY または QEMU/KVM `virtio-vga` 検証 |
| `koma --session` | ログインセッションモード（`koma-session`、`greetd`、`systemd --user`） | `WAYLAND_DISPLAY`、`DISPLAY`、`XDG_CURRENT_DESKTOP=koma`、`XDG_SESSION_TYPE=wayland`、`KOMA_INSTANCE_SIGNATURE` を `systemd --user` と D-Bus へ取り込み、`$NOTIFY_SOCKET`/`$NOTIFY_FD` へ `READY=1` を通知 |
| `koma --headless-check` | 起動前自己診断とバージョン表示 | CI やパッケージ導入後の確認 |
| `--spawn <CMD>` | 準備完了後にコマンドを自動起動 | 例：`koma --winit --spawn foot` |
| `-c, --config <PATH>` | `$XDG_CONFIG_HOME/koma/init.lua` 以外の設定ファイルを指定 | 代替設定のテスト |

> [!NOTE]
> バックエンド指定を省略した場合、通常の環境で `WAYLAND_DISPLAY` または `DISPLAY` が存在すれば `--winit`、それ以外は `--tty` が選択されます。`SIGTERM` / `SIGINT` / `SIGHUP` を受信するとソケットを清掃し終了コード `0` で停止します。

## 組み込み既定キーマップ（`Mod`：TTY は `Super`、Winit ネスト時は `Alt`）

| キー / 操作 | アクション | 説明 |
| :--- | :--- | :--- |
| `Mod + Return` | `spawn({ "ghostty" })` | 既定ターミナルを起動 |
| `Mod + Q` | `window.close()` | フォーカス中のウィンドウを閉じる |
| `Mod + V` | `window.float_toggle()` | フローティング切替 |
| `Mod + F` | `window.fullscreen_toggle()` | フルスクリーン切替 |
| `Mod + P` | `window.pseudotile_toggle()` | Dwindle 疑似タイル切替 |
| `Mod + E` | `dwindle.toggle_split()` | Dwindle 分割方向（縦／横）切替 |
| `Mod + H / J / K / L` | `focus.left/down/up/right()` | 方向別にフォーカス移動 |
| `Mod + Shift + H / J / K / L` | `window.move_direction(...)` | 方向別にウィンドウ移動／入れ替え |
| `Mod + 1..9` | `workspace.focus("1".."9")` | ワークスペース `1`〜`9` へ切替 |
| `Mod + Shift + 1..9` | `window.move_to_workspace("1".."9")` | ワークスペース `1`〜`9` へウィンドウ移動 |
| `Mod + R` / `Mod + Ctrl + R` | `scrolling.switch_preset_column_width()` | スクロール列幅プリセットの順／逆送り |
| `Mod + Ctrl + Shift + R` | `scrolling.switch_preset_window_height()` | スクロールウィンドウ高さプリセット切替 |
| `Mod + C` / `Mod + M` | `scrolling.center_column()` / `maximize_column()` | 列の中央寄せ／最大化 |
| `Mod + W` | `scrolling.toggle_column_tabbed_display()` | 列内タブ表示の切替 |
| `Mod + Comma` / `Mod + Period` | `scrolling.consume_window_into_column()` / `expel_window_from_column()` | 列への取り込み／切り離し |
| `Mod + BracketLeft` / `BracketRight` | `scrolling.consume_or_expel_window_left/right()` | 左／右の列へ統合または分離 |
| `Mod + S` / `Mod + Shift + S` | `scratchpad.toggle()` / `move_window()` | スクラッチパッド切替／移動 |
| `Mod + Tab` | `overview.toggle()` | `koma-overview` 空間ワークスペース一覧を表示 |
| `Mod + MouseLeft` / `MouseRight` | `window.drag_move()` / `drag_resize()` | ドラッグによる移動・リサイズ |
| `Mod + WheelScrollDown / Up` | `workspace.focus_next()` / `focus_prev()` | ホイールでワークスペース切替（`150 ms` クールダウン） |
| `Mod + WheelScrollLeft / Right` | `deck.cycle_prev()` / `cycle_next()` | Deck/Stash スタック巡回（`150 ms` クールダウン） |
| `Mod + Shift + R` | `compositor.reload_config()` | `init.lua` をホットリロード |
| `Mod + Shift + E` | `compositor.quit()` | コンポジタを安全終了 |
| `Mod + G`（プリエンプション障壁） | 即時人間プリエンプション | `< 1 ms` でエージェントの操作リースを無効化（`4091 ERR_HUMAN_PREEMPTED`） |

## ワークスペース概覧とキルスイッチ（`Mod + Tab` / `Mod + G`）

- **空間概覧（`koma-overview`）**：既定では `Mod + Tab` に割り当てられています（`Mod + O` を使いたい場合は `koma.bind("Mod + O", koma.act.overview.toggle())` を追記してください）。`koma-admin.sock` の `scene.inventory` を用いて空間一覧を描画します。
- **人間優先キルスイッチ（`Mod + G`）**：`Mod + G` または物理キーボード／ポインタ入力が発生した瞬間にエージェントの書き込みリースを停止し、操作の競合を防ぎます。

## `xwayland-satellite` による X11 アプリ互換

Koma は Ring 0 本体に `Xwayland` を直接組み込まず、外部ルートレスの [`xwayland-satellite`](https://github.com/Supreeeme/xwayland-satellite) に委譲します。

```lua
koma.xwayland({
    enabled = true,
    -- path = "/usr/bin/xwayland-satellite", -- 任意：バイナリパス明示
    isolate_agent_workspaces = true,        -- エージェント用ワークスペースを X11 から隔離
})
```
