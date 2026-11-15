# ハードウェアと対応環境

Koma と [Jiku](/ja/jiku/) は移植性の高い POSIX／Wayland プリミティブ（`libseat`/`seatd`、`libinput`、`SCM_RIGHTS` ファイルディスクリプタ受け渡し、組み込み Lua 5.4 ランタイム）で構築されており、`x86_64`・`aarch64`（`ARM64`）・MacBook Linux・BSD に対応しています。

> [!NOTE]
> **検証範囲（`v0.0.1`）**：現時点で隔離 QEMU/KVM VM 上の `x86_64` Arch Linux（`koma --tty`＋`seatd`＋`llvmpipe` ソフトウェア KMS）および FreeBSD `15.1-RELEASE`（`cargo check` / `cargo test` ワークスペースビルド）を検証済みです。Apple Silicon 実機、Intel MacBook、ARM64 SBC、OpenBSD `8+` の実機ランタイム検証は今後の承認対象です。

## Apple Silicon MacBook（`M1`–`M4`、Asahi / Fedora / Arch ARM）

Apple Silicon（`aarch64`）上の Linux は、一般的な `x86_64` PC とディスプレイ形状・ページサイズ・トラックパッド仕様が異なります：

1. **ノッチ領域の `safe_area` インセット**：内蔵 Liquid Retina XDR パネル（`eDP-1`）のカメラ切り欠きを避けるため、`koma.monitor({...})` に安全余白を設定してタイル配置や `wlr-layer-shell` バーを保護できます：
   ```lua
   koma.monitor({
       output = "eDP-1",
       scale = "auto",
       safe_area = { top = 38, bottom = 0, left = 0, right = 0 },
       allow_non_desktop = false,
   })
   ```
2. **`16 KiB` カーネルページサイズ整合**：Apple Silicon Linux カーネルは `16 KiB` ページ（`PAGESIZE = 16384`）を使用します。フレーム転送（`SCM_RIGHTS` `memfd`/SHM）は `4096` バイト固定ではなく実行時ページサイズを参照し、Lua 5.4 サンドボックスも JIT `mprotect` 実行可能ページを使わないため `W^X` 環境で安全に動作します。
3. **Force Touch クリックパッド**：`koma.input({ touchpad = { ... } })` で `click_method = "clickfinger"` や `pinch_sensitivity` を設定でき、1/2/3 本指のクリックフィンガー操作や 3/4 本指のワークスペース・概観ジェスチャと併用できます。
4. **Apple DRM / Mesa スタック**：カーネル `apple_drm` / `dcp` および Mesa `asahi`（`GL_OES_EGL_image` / `zwp_linux_dmabuf_v1`）が必要です。

## Intel MacBook Linux（T2 / 非 T2）

- **HiDPI フラクショナルスケーリング**：Retina `2560x1600` / `2880x1800` / `3072x1920` パネルは `wp-fractional-scale-v1` + `wp-viewporter` 経由で `scale = "auto"`（または明示的な `scale = 2.0` / `1.6`）を使用します。
- **非デスクトップ出力の除外**：Touch Bar や VR ヘッドセットなどの非デスクトップコネクタは `allow_non_desktop = false` により自動スキップされます。
- **デュアル GPU / 外部 Thunderbolt ディスプレイ**：必要に応じて `max_bpc = 10` を指定し、`seatd` / `systemd-logind` 環境を切り替える前に別 VT で `--tty` 動作を確認してください。

## 汎用 `ARM64`（`aarch64`）Linux

- [komawm/packaging](https://github.com/komawm/packaging) は Debian/Ubuntu、Arch Linux ARM、Fedora/Copr、Alpine、NixOS（`aarch64-linux`）、Homebrew 向けに `aarch64`/`arm64` ターゲットを定義しています。
- メモリ帯域が限られる低消費電力 ARM64 SBC では、`koma.appearance({ blur = { enabled = false } })` でマルチパス Dual-Kawase ブラーを無効化できます。

## FreeBSD `15.1-RELEASE` および OpenBSD `8+`

| OS | `v0.0.1` 時点の状態 | シート／入力スタック | 技術メモ |
| :--- | :--- | :--- | :--- |
| **FreeBSD `15.1-RELEASE`** | **VM 検証済み（`cargo check` / `cargo test` 合格）** | `seatd` + `libudev-devd` + `libinput` + `evdev` | `shm_open` SHM 転送、設定リロードのポーリングフォールバック、`LOCAL_PEERCRED` / `getpeereid` による同一 UID ソケット認証を使用 |
| **OpenBSD `8+`** | **実験的テンプレート** | `wscons` / `libinput` / `pledge` 対応パス | Ports テンプレートは `komawm/packaging/openbsd/` に配置（実機 DRM/`seatd` 検証待ち） |

FreeBSD で試用する際は `seatd` を有効化し（`sysrc seatd_enable="YES" && service seatd start`）、ユーザーを `video` グループへ追加のうえ、`XDG_RUNTIME_DIR` がユーザー所有の `0700` ディレクトリを指していることを確認してください。
