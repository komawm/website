# ARM64・MacBook Linux・BSD 対応

Koma と [Jiku](/ja/jiku/) は移植性の高い POSIX／Wayland 基盤（`Smithay`、`libseat`/`seatd`、`libinput`、`rustix` `SCM_RIGHTS`＋`File` I/O、純 Rust 製 [Phodopus](https://github.com/Xuepoo/phodopus) Lua 5.4）で構築されており、`x86_64`・`aarch64`（`ARM64`）・MacBook Linux・BSD を視野に入れて設計されています。

> [!NOTE]
> **検証範囲（`v0.0.1`）**：現時点で隔離 QEMU/KVM VM 上の `x86_64` Arch Linux（`koma --tty`＋`seatd`＋`llvmpipe` ソフトウェア KMS スモーク）および FreeBSD `15.1-RELEASE`（ワークスペースビルド／テスト）を検証済みです。Apple Silicon 実機、Intel MacBook、ARM64 SBC、OpenBSD `8+` の実機ランタイム検証は今後の承認対象です。

## Apple Silicon MacBook（`M1`–`M4`、Asahi / Fedora / Arch ARM）

Apple Silicon（`aarch64`）上の Linux では、標準的な `x86_64` PC と異なるハードウェア要件へ対応しています。

1. **ノッチ領域の `safe_area` インセット**：内蔵 Liquid Retina XDR パネル（`eDP-1`）のカメラ切り欠きを避けるため、`koma.monitor({...})` に安全余白を設定できます。
   ```lua
   koma.monitor({
       output = "eDP-1",
       scale = "auto",
       safe_area = { top = 38, bottom = 0, left = 0, right = 0 },
       allow_non_desktop = false,
   })
   ```
2. **`16 KiB` ページサイズ整合**：Apple Silicon カーネルは `16 KiB` ページ（`PAGESIZE = 16384`）を使用します。Koma の `SCM_RIGHTS` `memfd`/SHM 転送は実行時ページサイズを参照し、`Phodopus` Lua VM も JIT 実行可能ページ（`mprotect`）を使わないため `W^X` 環境で安全に動作します。
3. **Force Touch クリックパッド**：`koma.input({ touchpad = { ... } })` で `click_method = "clickfinger"` や `pinch_sensitivity` を調整できます。
4. **グラフィックス**：`apple_drm` / `dcp` カーネルドライバおよび Mesa `asahi`（`zwp_linux_dmabuf_v1`）を利用します。

## Intel MacBook Linux（T2 / 非 T2）

- **HiDPI フラクショナルスケーリング**：`scale = "auto"` または明示値により `wp-fractional-scale-v1` + `wp-viewporter` でスケーリングします。
- **非デスクトップ出力の除外**：Touch Bar や VR HMD などは `allow_non_desktop = false` により自動スキップされます。
- **外部 Thunderbolt ディスプレイ**：必要に応じて `max_bpc = 10` を指定し、まず別 VT で `--tty` 動作を確認してください。

## 汎用 `ARM64`（`aarch64`）Linux

- [komawm/packaging](https://github.com/komawm/packaging) は Debian/Ubuntu、Arch Linux ARM、Fedora/Copr、Alpine、NixOS（`aarch64-linux`）、Homebrew の各 `aarch64`/`arm64` パッケージを定義しています。
- メモリ帯域が限られる SBC では `koma.appearance({ blur = { enabled = false } })` で Dual-Kawase ブラーを無効化できます。

## FreeBSD `15.1-RELEASE` および OpenBSD `8+`

| OS | `v0.0.1` 時点の状態 | シート／入力スタック | 技術メモ |
| :--- | :--- | :--- | :--- |
| **FreeBSD `15.1-RELEASE`** | **VM 検証済み（`cargo check` / `cargo test` 合格）** | `seatd` + `libudev-devd` + `libinput` + `evdev` | `rustix` `shm_open`（`koma-proto/src/scm_unix.rs`）、クロスプラットフォーム監視フォールバック（`config_watcher.rs`）、`LOCAL_PEERCRED`/`getpeereid` 認証を使用 |
| **OpenBSD `8+`** | **実験的テンプレート** | `wscons` / `libinput` | Ports テンプレートは `komawm/packaging/openbsd/` に配置（実機ランタイム未検証） |

FreeBSD で試用する際は `seatd` を有効化し（`sysrc seatd_enable="YES" && service seatd start`）、ユーザーを `video` グループへ追加のうえ、`0700` 権限の `XDG_RUNTIME_DIR` を設定してください。
