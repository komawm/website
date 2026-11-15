# Wayland プロトコル・Portal・IME

Koma は [Smithay](https://github.com/Smithay/smithay) 上に主要な Wayland プロトコル群を直接実装し、`wp_security_context_manager_v1` および `komactl sandbox` 経由のクライアントには `ClientState { restricted: true }` による厳格な権限フィルタを適用します。

## シェル・サーフェス・出力管理プロトコル

| プロトコル / グローバル | 用途と対応ツール | セキュリティ / サンドボックス規則 |
| :--- | :--- | :--- |
| `xdg_shell`（`xdg_wm_base`） | 通常ウィンドウ、ポップアップ、フルスクリーン、SSD 装飾交渉（`zxdg_decoration_manager_v1`） | サンドボックス内クライアントは割り当て `Headless` ワークスペースに隔離 |
| `zwlr_layer_shell_v1` | ステータスバー（`waybar`）、通知（`swaync`）、ランチャー（`fuzzel`/`rofi`）、`koma-overview` | `exclusive_zone` による作業領域縮小に対応。制限クライアントには非公開 |
| `ext_session_lock_v1` | フェイルクローズド画面ロック（`swaylock`、`hyprlock`） | ロック中は画面マスク、`grim` 撮影拒否（`failed`）、`xdg-activation` 保留を実行 |
| `zwlr_output_manager_v1` | 動的マルチモニター検査・`test`・`apply`（`kanshi`、`wdisplays`） | 制限クライアントには非公開 |
| `zwlr_output_power_manager_v1`・`zwlr_gamma_control_manager_v1` | DPMS 電源制御（`wlopm`）および夜間色温度（`wlsunset`、`gammastep`） | 制限クライアントには非公開 |
| `wp_fractional_scale_manager_v1`・`wp_viewporter` | ネイティブフラクショナル HiDPI（`1.25`、`1.5`、`1.6`、`"auto"`） | 出力単位でスケール値を通知 |
| `xdg_activation_v1`・`xdg_toplevel_icon_v1` | ウィンドウ間フォーカストークン（`10 s` TTL）とアイコンバッファ検証 | サンドボックス検証とロック中の遅延処理 |
| `zwlr_foreign_toplevel_manager_v1`・`ext_foreign_toplevel_list_v1` | タスクバー用ウィンドウ一覧・切替／最小化／終了 | 制限クライアント除外およびロック中保護 |

## スクリーンコピーと `xdg-desktop-portal`

- **`zwlr_screencopy_manager_v1` (v3)**：SHM / DMA-BUF キャプチャ（`grim`、`wayshot`、`slurp`）に対応し、1 フレームあたり単一の `buffer`/`linux_dmabuf` イベントを送出します。`block_out_from = "screencopy"`/`"all"` および `ext-session-lock-v1` 遮断を尊重します。
- **`xdg-desktop-portal`（`koma.portal`）**：パッケージ同梱の設定により画面共有・スクリーンショットのポータル連携を提供します。

## 日本語 IME と仮想入力スタック

Koma は X11 に頼らず Wayland ネイティブ IME スタックを実装しています。

- **`zwp_text_input_manager_v3`**（`text-input-v3`）：GTK4、Qt6、Chromium/Electron（`--enable-wayland-ime`）、ネイティブ端末に対応。
- **`zwp_input_method_manager_v2`**（`input-method-v2`）および **`zwp_virtual_keyboard_manager_v1`**：**`Fcitx5`** や **`IBus`** の候補ウィンドウ表示と変換確定に対応。
- **`zwp_pointer_constraints_v1`・`zwp_relative_pointer_manager_v1`**：ゲームや 3D ビューポート向けのポインタロック／相対移動（画面ロックやフォーカス喪失で安全解除）。
- **`wl_touch`・`wp_cursor_shape_manager_v1`**：マルチタッチ入力とコンポジタ側カーソル形状テーマ描画。

> [!TIP]
> **IME とエージェント入力の分離**：人間の入力は `Fcitx5` / `IBus`（`text-input-v3` + `input-method-v2`）を使用し、`koma-agent.sock` からの入力は `koma-seat` の `TextInjectStrategy` 経由で行われるため、エージェント入力で IME 変換候補が誤起動しません。

## `wp_security_context_manager_v1` と隔離ソケット

Flatpak / `bubblewrap` による `wp_security_context_manager_v1` または `komactl sandbox` の接続はすべて `ClientState { restricted: true }` として扱われ、`zwlr_layer_shell_v1`、`zwlr_screencopy_manager_v1`、`zwlr_data_control_manager_v1`、`zwp_virtual_keyboard_manager_v1`、`ext_session_lock_manager_v1`、`zwlr_output_manager_v1` 等へのアクセスが遮断されます。
