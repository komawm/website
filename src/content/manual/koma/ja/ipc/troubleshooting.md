# トラブルシューティング

Koma の起動・シート権限・描画・Lua 設定・IPC ソケット・日本語 IME・XWayland に関するよくある問題と対処法です。

## 1. `koma --tty` がシートや DRM Master を開けない

**症状**：`libseat` の初期化に失敗する、または DRM が `Permission denied` / `Not master` を返す。

- **シート管理デーモンの確認**：`systemd-logind` が無い環境や VM・FreeBSD では `seatd` が動作しているか確認し（Arch/Debian は `systemctl status seatd`、FreeBSD は `service seatd status`）、`id -nG` でユーザーが `seat`・`video`・`input` グループに属しているか確かめてください。
- **稼働中のデスクトップ内で `--tty` を実行しない**：既存のコンポジタが DRM Master を保持しているため競合します。空き VT（`Ctrl+Alt+F3`）へ切り替えて `koma --tty` を起動するか、ネスト実行の `koma --winit` を使用してください。
- **QEMU/KVM 環境**：`-device virtio-vga` と `seatd` + Mesa `llvmpipe` の構成を利用できます。

## 2. ソフトウェア描画（`llvmpipe`）とハードウェア GPU

- ハードウェア DRM/GBM アクセラレーションが利用できない場合（Virgl 無効の `virtio-vga` 等）、Koma は自動的に Mesa `llvmpipe` へフォールバックします。
- 使用中の `GL Renderer` は `glxinfo -B`、`eglinfo`、または `RUST_LOG=info koma --winit` のログで確認できます。
- ソフトウェア描画や低性能 GPU 環境では `~/.config/koma/init.lua` でブラーとシャドウを無効にすると動作が軽くなります。
  ```lua
  koma.appearance({ blur = { enabled = false }, shadow = { enabled = false } })
  ```

## 3. 壊れた `~/.config/koma/init.lua` からの復旧

- リロード前にオフライン検証を行います。
  ```bash
  komactl validate ~/.config/koma/init.lua
  ```
- `komactl reload` は隔離サンドボックス内で事前にスクリプトを評価するため、構文エラー・不正な正規表現・無限ループがあっても稼働中のキーバインドやレイアウトは維持され、`komactl config-status` でエラー内容を確認できます。
- 起動自体が失敗する場合は `koma -c /dev/null` を実行する（または `~/.config/koma/init.lua` を退避する）と組み込みデフォルト設定で起動できます。

## 4. `komactl` が `koma-admin.sock` を見つけられない

- `$XDG_RUNTIME_DIR` が自身の `0700` ディレクトリ（例: `/run/user/1000`）を指しているか確認してください。
- 稼働中のインスタンス一覧を確認します。
  ```bash
  ls -la "$XDG_RUNTIME_DIR/koma/"
  ```
- 複数インスタンスを起動している場合は、`komactl` 実行前に `export KOMA_INSTANCE_SIGNATURE=<ディレクトリ名>` を設定してください。

## 5. Chromium / Electron で `Fcitx5` / `IBus` が動作しない

- Koma は `text-input-v3`・`input-method-v2`・`virtual-keyboard-v1` をサポートしています。
- Chromium / Electron アプリへ Wayland IME フラグを渡して起動してください。
  ```bash
  chromium --ozone-platform=wayland --enable-wayland-ime
  ```
- `fcitx5 -d` が同じ `WAYLAND_DISPLAY` セッション内（`koma --session` または `koma.act.spawn` 経由）で動いていることを確認してください。

## 6. X11 アプリが起動しない（`xwayland-satellite`）

- `$PATH` 上に `xwayland-satellite` がインストールされているか確認してください（または `~/.config/koma/init.lua` で `koma.xwayland({ enabled = true, path = "/path/to/xwayland-satellite" })` を指定します）。
- `isolate_agent_workspaces = true`（既定）では、エージェントがリースしたヘッドレスワークスペースへの X11 クライアント配置は意図的に制限されています。
