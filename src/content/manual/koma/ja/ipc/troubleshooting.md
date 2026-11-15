# 診断とトラブルシューティング FAQ

Koma の起動・シート権限・描画・Lua 設定・日本語 IME・XWayland に関するよくある問題と対処法をまとめます。

## 1. `koma --tty` でシートや DRM Master を開けない

**症状**：`libseat` 初期化失敗、または `Permission denied` / `Not master` が発生する。

- **シート管理デーモンの確認**：`systemd-logind` がない環境や VM・FreeBSD では `seatd` が起動しており、ユーザーが `seat` / `video` / `input` グループに所属しているか確認してください（`id -nG`）。
- **既存コンポジタ上で `--tty` を実行しない**：Hyprland 等が DRM Master を保持中に実行すると競合します。別 VT（`Ctrl+Alt+F3`）へ切り替えるか、ネスト用の `koma --winit` を使用してください。
- **QEMU/KVM 環境**：`-device virtio-vga` と `seatd` + Mesa `llvmpipe` の組み合わせで検証可能です。

## 2. ソフトウェア描画（`llvmpipe`）とハードウェア GPU

- ハードウェア 3D アクセラレーションが無い仮想 GPU 等では自動的に Mesa `llvmpipe` へフォールバックします。
- `RUST_LOG=info koma --winit` で使用中の `GL Renderer` を確認できます。
- ソフトウェア描画時や低消費電力環境ではブラーとシャドウを無効化すると軽快になります。
  ```lua
  koma.appearance({ blur = { enabled = false }, shadow = { enabled = false } })
  ```

## 3. 破損した `init.lua` からの復旧

- リロード前にオフライン検証を実行します。
  ```bash
  komactl validate ~/.config/koma/init.lua
  ```
- `komactl reload` は Phodopus シャドウ環境で事前評価するため、構文エラーや無限ループが起きても稼働中のセッションは維持され、`komactl config-status` にエラーが記録されます。
- 起動自体に失敗する場合は `koma -c /dev/null` で組み込みデフォルト設定にて起動してください。

## 4. `komactl` が `koma-admin.sock` を見つけられない

- `$XDG_RUNTIME_DIR` が自身の `0700` ディレクトリ（例 `/run/user/1000`）を指しているか確認します。
- 稼働中ソケットを確認し、複数インスタンスがある場合は `KOMA_INSTANCE_SIGNATURE` を指定してください。
  ```bash
  ls -la "$XDG_RUNTIME_DIR/koma/"
  ```

## 5. Chromium / Electron で `Fcitx5` / `IBus` が反応しない

- Koma は `text-input-v3`、`input-method-v2`、`virtual-keyboard-v1` を提供しています。
- Chromium / Electron へ Wayland IME フラグを渡して起動してください。
  ```bash
  chromium --ozone-platform=wayland --enable-wayland-ime
  ```

## 6. X11 アプリが起動しない（`xwayland-satellite`）

- `$PATH` 上に `xwayland-satellite` が存在するか確認し（または `koma.xwayland({ enabled = true, path = "..." })` でパス指定）、`isolate_agent_workspaces = true` 時はエージェント用ワークスペースでは X11 が隔離される点に留意してください。
