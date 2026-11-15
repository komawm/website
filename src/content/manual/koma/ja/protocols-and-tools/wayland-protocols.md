# パネル・Portal・IME・アプリ互換

Koma はパネル・ロック画面・ポータル・リモートデスクトップ・IME 向けの主要な Wayland プロトコルを実装しており、`wp_security_context_manager_v1` および `komactl sandbox` 経由の接続は制限付きとして扱い、特権グローバルへのアクセスを遮断します。

## シェル・サーフェス・出力管理プロトコル

| プロトコル / グローバル | 用途と対応ツール | セキュリティ / サンドボックス規則 |
| :--- | :--- | :--- |
| `xdg_shell`（`xdg_wm_base`） | デスクトップウィンドウ、ポップアップ、フルスクリーン、SSD 装飾交渉（`zxdg_decoration_manager_v1`） | サンドボックス内クライアントは割り当て `Headless` ワークスペースに隔離 |
| `zwlr_layer_shell_v1` | バー（`waybar`、`ironbar`、`quickshell`）、通知（`swaync`）、ランチャー（`fuzzel`/`rofi`）、`koma-overview` | 排他領域、`get_popup` -> `xdg_popup` 制約解除とグラブ対応。制限クライアントには非公開 |
| `ext_session_lock_v1` | フェイルクローズド画面ロック（`swaylock`、`hyprlock`） | ロック中は画面マスク、`grim` 撮影拒否（`failed`）、`xdg-activation` 保留を実行 |
| `zwlr_output_manager_v1` | 動的マルチモニター検査・`test`・`apply`（`kanshi`、`wdisplays`） | サンドボックス／制限クライアントには非公開 |
| `zwlr_output_power_manager_v1`・`zwlr_gamma_control_manager_v1` | DPMS スリープ／復帰（`wlopm`）および夜間色温度（`wlsunset`、`gammastep`） | 制限クライアントには非公開 |
| `wp_fractional_scale_manager_v1`・`wp_viewporter` | シャープなフラクショナル HiDPI スケーリング（`1.25`、`1.5`、`1.6`、`"auto"`） | 出力単位でスケール値を通知 |
| `wp_single_pixel_buffer_v1`・`wp_presentation`・`wl_shm` 形式 | 単色ウィジェット（`ironbar`/`quickshell`）、スキャンアウト時刻通知、`Abgr8888`/`Xbgr8888` バッファ（`Waydroid`） | グラフィカルクライアントに公開 |
| `xdg_activation_v1`・`xdg_toplevel_icon_v1` | ウィンドウ間フォーカストークン（`10 s` TTL）と検証済みアイコンバッファ | サンドボックス検証とロック中の遅延処理 |
| `zwlr_foreign_toplevel_manager_v1`・`ext_foreign_toplevel_list_v1` | タスクバー／パネルのウィンドウ一覧・切替／最小化／終了 | 制限クライアントから除外およびロック中保護 |
| `zwlr_virtual_pointer_manager_v1`・`zwp_keyboard_shortcuts_inhibit_manager_v1` | リモートデスクトップ仮想ポインタとショートカット抑制転送（`RustDesk`） | 制限クライアントには非公開。`Mod + G` プリエンプションと VT 切替は抑制対象外 |

## スクリーンコピーと `xdg-desktop-portal`

- **`zwlr_screencopy_manager_v1` (v3)**：SHM / DMA-BUF キャプチャ（`grim`、`wayshot`、`slurp`）に対応し、1 フレームあたり単一の `buffer` / `linux_dmabuf` イベントを送出します。`block_out_from = "screencopy"` / `"all"` の黒塗りマスクおよび `ext-session-lock-v1` のフェイルクローズド遮断を遵守します。
- **`xdg-desktop-portal`（`koma.portal`）**：パッケージ同梱の設定により `xdg-desktop-portal-wlr` / `xdg-desktop-portal-gtk` 経由で `ScreenCast`、`Screenshot`、`GlobalShortcuts` / `Inhibit` を仲介します。

## 日本語 IME と仮想入力スタック

Koma は X11 に依存せず Wayland ネイティブの CJK/IME スタックを実装しています：

- **`zwp_text_input_manager_v3`**（`text-input-v3`）：GTK4、Qt6、Chromium/Electron（`--enable-wayland-ime`）、ネイティブ Wayland 端末に対応。
- **`zwp_input_method_manager_v2`**（`input-method-v2`）および **`zwp_virtual_keyboard_manager_v1`**：**`Fcitx5`** や **`IBus`** の候補ウィンドウ表示と変換前プリエディット入力に対応。
- **`zwp_pointer_constraints_v1`・`zwp_relative_pointer_manager_v1`**：ゲームや 3D ビューポート向けのポインタロック／制限と相対移動（`ext-session-lock` やフォーカス喪失時に安全解除）。
- **`wl_touch`・`wp_cursor_shape_manager_v1`**：マルチタッチ入力ルーティングとコンポジタ側カーソル形状テーマ描画。

> [!TIP]
> **通常 IME と自動テキスト注入の分離**：対話入力では `Fcitx5` / `IBus`（`text-input-v3`＋`input-method-v2`）を使用する一方、`koma-agent.sock` 経由の自動化ではキーマップ、`text-input-v3`、またはクリップボード貼り付け（`Ctrl+Shift+V`）で直接注入するため、自動入力時に IME 変換候補ポップアップが誤って開きません。

## `wp_security_context_manager_v1` と隔離クライアント

Wayland ネイティブの `wp_security_context_manager_v1`（Flatpak / `bubblewrap` が使用）および `komactl sandbox` からの接続は制限付きとしてマークされます。制限付き接続は特権グローバル（`zwlr_layer_shell_v1`、`zwlr_screencopy_manager_v1`、`zwlr_data_control_manager_v1`、`zwp_virtual_keyboard_manager_v1`、`ext_session_lock_manager_v1`、`zwlr_output_manager_v1`、`wp_security_context_manager_v1` 自体）をバインドできません。
