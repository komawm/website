# ARM64・MacBook Linux・BSD 対応

Koma と Jiku は移植性の高い基盤（`Smithay`、`libseat`/`seatd`、`libinput`、`rustix` `SCM_RIGHTS`、純 Rust 製 Lua 5.4 [Phodopus](https://github.com/Xuepoo/phodopus)）上に構築されており、一般的な `x86_64` PC だけでなく **ARM64 環境**、**Linux を導入した MacBook（Apple Silicon / Intel）**、および **FreeBSD / OpenBSD** を見据えて設計されています。

## Linux を導入した MacBook（Apple Silicon & Intel）

MacBook 上の Linux は世代によってアーキテクチャが異なりますが、[komawm/packaging](https://github.com/komawm/packaging) は双方をサポートします。

| MacBook 世代 | CPU とターゲットトリプル | カーネル / KMS ドライバ構成 | パッケージング・設定のポイント |
| :--- | :--- | :--- | :--- |
| **Apple Silicon（`M1` / `M2` / `M3` / `M4`）** | `aarch64-unknown-linux-gnu`（`arm64`） | Fedora Asahi Remix / Debian / Arch ARM（`apple-dcp` KMS + Mesa `asahi` EGL・**16 KiB ページサイズ**） | 16K ページカーネルでそのまま起動できるよう `-Wl,-z,max-page-size=16384` を強制指定。Retina スケーリングと 3本指ジェスチャに対応 |
| **Intel Mac（`Core i5` / `i7` / `i9`）** | `x86_64-unknown-linux-gnu`（`amd64`） | 標準 Linux / T2 Linux（Intel `i915` または `amdgpu` デュアル GPU） | 標準の `x86_64` パッケージをそのまま利用可能。ハイブリッド GPU 搭載 MacBook Pro のフォーマット折衝にも対応 |

```lua
-- MacBook Linux 向け Retina スケール & Command キー設定例 (~/.config/koma/init.lua)
koma.output("eDP-1", { scale = 2.0 })
koma.input({
  mod_key = "Super", -- Apple キーボードの Command (⌘) キーに対応
  inherit_default_binds = true,
  touchpad = { natural_scroll = true, tap_to_click = true },
})
```

## ARM64 ワークステーション・SBC

ARM64 ネイティブランナー上で `aarch64-unknown-linux-gnu` バイナリ（`.deb` / `.rpm` / `.tar.zst`）をビルドし、Panfrost/Panthor や Freedreno などの Mesa GBM/EGL ドライバと連携します。

## FreeBSD・OpenBSD ポータビリティ

> [!NOTE]
> FreeBSD および OpenBSD は現在 `v0.1.0` に向けた移植トラックにあります。CI では BSD ターゲット向けのコア検証を実施しており、実機 DRM/Wayland 承認を順次進めています。

- **FreeBSD（`x86_64` / `aarch64`）**：`drm-kmod`、`seatd`（`libseat`）、`libudev-devd`、`wayland` と組み合わせます。Jiku のプロセス隔離は `Capsicum` へマッピングされます。
- **OpenBSD（`amd64` / `arm64`）**：Xenocara `drm`/`mesa`、`libinput-openbsd`、`wayland` ポートを対象とし、Jiku の隔離には Linux の Landlock に代わり `pledge(2)` と `unveil(2)` を用います。
