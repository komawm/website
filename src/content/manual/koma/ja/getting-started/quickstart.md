# 起動と基本操作

> [!TIP]
> Koma には Hyprland 互換の既定キーマップ（`inherit_default_binds = true`）が組み込まれています。`~/.config/koma/init.lua` が存在しない状態でも、起動直後からターミナル起動・タイリングやフロートの切替・ワークスペース切替・設定リロードを行えます。

![Koma の既定 Dwindle タイリングワークスペース](https://cdn.komawm.org/media/koma-dwindle.webp)

## 起動モード（`koma [OPTIONS]`）

CLI オプションはディスプレイ、シート、または DRM デバイスを開く前に解析されます。

| オプション | バックエンド / 挙動 | 主な用途 |
| :--- | :--- | :--- |
| `koma --winit` | 既存の Wayland / X11 セッション内にネストウィンドウとして起動 | Hyprland / Sway / GNOME 上での安全な設定テスト |
| `koma --tty` | `libseat`（`seatd`/`logind`）・`udev`・`DRM/KMS`・`libinput` で VT へ直接起動 | 実機 TTY 起動または隔離された QEMU/KVM `virtio-vga` テスト |
| `koma --session` | ログインセッションモード（`koma-session`、`greetd`、`systemd --user`） | `WAYLAND_DISPLAY`、`DISPLAY`、`XDG_CURRENT_DESKTOP=koma`、`XDG_SESSION_TYPE=wayland`、`KOMA_INSTANCE_SIGNATURE` を `systemd --user` と D-Bus へ取り込み、`$NOTIFY_SOCKET`/`$NOTIFY_FD` へ `READY=1` を通知 |
| `koma --headless-check` | CLI と設定ステートマシンの自己診断 | CI、パッケージング、導入後の動作確認 |
| `--spawn <CMD>` | コンポジタソケットの準備完了後に `<CMD>` を起動 | 例：`koma --winit --spawn foot`、`koma --tty --spawn ghostty` |
| `-c, --config <PATH>` | `$XDG_CONFIG_HOME/koma/init.lua` 以外の設定ファイルを指定 | 代替 Lua 設定のテスト |

> [!NOTE]
> バックエンド指定を省略した場合、通常の環境で `WAYLAND_DISPLAY` または `DISPLAY` が設定されていれば `--winit`（`--session` 時は物理シート対象）、それ以外は `--tty` が選択されます。`SIGTERM` / `SIGINT` / `SIGHUP` を受信するとソケットを清掃し終了コード `0` で終了します。

## 組み込み既定キーマップ（`Mod`：TTY は `Super`、`--winit` ネスト時は `Alt`）

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
| `Mod + Tab` | `overview.toggle()` | `koma-overview` 空間ワークスペーススイッチャーを表示 |
| `Mod + MouseLeft` / `MouseRight` | `window.drag_move()` / `drag_resize()` | ドラッグによる移動・リサイズ |
| `Mod + WheelScrollDown / Up` | `workspace.focus_next()` / `focus_prev()` | ホイールでワークスペース切替（`150 ms` クールダウン） |
| `Mod + WheelScrollLeft / Right` | `deck.cycle_prev()` / `cycle_next()` | Deck/Stash スタック巡回（`150 ms` クールダウン） |
| `Mod + Shift + R` | `compositor.reload_config()` | `init.lua` をホットリロード |
| `Mod + Shift + E` | `compositor.quit()` | コンポジタを安全終了 |
| `Mod + G`（プリエンプション障壁） | 即時人間プリエンプション | `< 1 ms` でエージェントの操作リースを無効化（`4091 ERR_HUMAN_PREEMPTED`） |

## ワークスペース概観とキルスイッチ（`Mod + Tab` / `Mod + G`）

- **空間概観（`koma-overview`）**：既定では `Mod + Tab` に割り当てられています（`init.lua` に `koma.bind("Mod + O", koma.act.overview.toggle())` を追加して変更も可能です）。`koma-admin.sock` の `scene.inventory` を用いてワークスペースとウィンドウ一覧を描画します。
- **人間優先プリエンプション（`Mod + G`）**：`Mod + G` または物理キーボード／ポインタ入力が発生した瞬間にエージェントの書き込みリースを停止し、ポインタや操作の競合を防ぎます。

## `xwayland-satellite` による X11 アプリ互換

Koma はコンポジタ本体に `Xwayland` を直接組み込まず、外部ルートレスの [`xwayland-satellite`](https://github.com/Supreeeme/xwayland-satellite) に委譲します。`~/.config/koma/init.lua` で設定できます：

```lua
koma.xwayland({
    enabled = true,
    -- path = "/usr/bin/xwayland-satellite", -- 任意：バイナリパス明示
    isolate_agent_workspaces = true,        -- エージェント用ワークスペースを X11 から隔離
})
```
