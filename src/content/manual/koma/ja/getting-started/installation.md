# インストールと配布チャネル

> [!WARNING]
> **インキュベーション段階（`v0.0.1`）**：Koma は現在 `v0.0.1` の開発ラインです。全 9 クレートが **Rust `1.100.0`（Edition 2024）** でビルド・ユニットテストに合格し、Arch Linux QEMU/KVM（ソフトウェア KMS `koma --tty`）および FreeBSD `15.1-RELEASE` でのビルド検証を完了していますが、実機 GPU DRM/KMS スキャンアウトおよびセキュリティ承認は `v0.1.0` 目標です。予備の TTY または既存セッションを残した状態で試用してください。

> [!NOTE]
> Koma は単体で完結する Wayland コンポジタです。[Jiku](/ja/jiku/) をインストールしなくても問題なく利用できます。

## 配布チャネル一覧

各ディストリビューション向けパッケージ定義は [komawm/packaging](https://github.com/komawm/packaging) で管理され、GitHub Releases および Cloudflare R2 CDN（`https://cdn.komawm.org`）経由で配信されます。

| プラットフォーム / チャネル | 配布形式 | ステータス / 対象 |
| :--- | :--- | :--- |
| **Debian / Ubuntu** | 署名付き `deb822` APT（`https://cdn.komawm.org/apt`）+ `.deb`（`amd64`, `arm64`） | nFPM `.deb` + `SHA256SUMS` |
| **Arch Linux** | `PKGBUILD`（`koma`, `koma-bin`）+ `.pkg.tar.zst`（`x86_64`, `aarch64`） | QEMU/KVM Arch `10/10` スモーク合格 |
| **Fedora / RHEL / openEuler** | Copr / nFPM `.rpm`（`x86_64`, `aarch64`） | Spec + nFPM パイプライン |
| **Alpine Linux** | `APKBUILD` / nFPM `.apk`（`x86_64`, `aarch64`） | musl パッケージング |
| **NixOS / Nix** | `komawm/koma` `flake.nix` 委譲 + Cachix（`x86_64-linux`, `aarch64-linux`） | Nix モジュールテンプレート |
| **FreeBSD `15+`** | Ports `Makefile` + `pkg` マニフェスト（`amd64`, `aarch64`） | FreeBSD `15.1-RELEASE` VM 検証済み |
| **OpenBSD `8+`** | Ports `Makefile`（`amd64`, `aarch64`） | 実験的テンプレート |
| **Homebrew (Linuxbrew)** | Formula `koma.rb`（`x86_64`, `aarch64`） | Linux バイナリ用 Formula |
| **汎用 Linux アーカイブ** | `koma-<ver>-x86_64-unknown-linux-gnu.tar.gz` + `SHA256SUMS` | 自己完結型アーカイブ |

## Debian / Ubuntu（署名付き `deb822` APT）

`https://cdn.komawm.org/apt` から GPG キーリングと `deb822` リポジトリ設定を導入します。

```bash
curl -fsSL https://cdn.komawm.org/apt/setup.sh | sudo sh
sudo apt update
sudo apt install koma
```

手動で `/etc/apt/sources.list.d/komawm.sources` を設定するか、`https://cdn.komawm.org/releases/` や GitHub Releases から `SHA256SUMS` 検証済みの `.deb` を直接導入することも可能です。

## Arch Linux

署名・ダイジェスト確認済みの `.pkg.tar.zst` を `pacman -U` で導入します。

```bash
sha256sum -c SHA256SUMS-archlinux
sudo pacman -U koma-0.0.1-1-x86_64.pkg.tar.zst
```

`seatd`（または `systemd-libs`）、`libinput`、`mesa`、`libdisplay-info`、`libxkbcommon`、`wayland`、`pixman`、`libglvnd` が依存関係として解決されます。

## Fedora / RHEL・Alpine・NixOS・BSD

- **Fedora / RHEL**：nFPM または Copr ビルドの `.rpm` を導入します（`sudo dnf install ./koma-*.rpm`）。
- **Alpine Linux**：ダイジェスト確認後に `.apk` を導入し（`sudo apk add --allow-untrusted ./koma-*.apk`）、`seatd` または `elogind` を有効化します。
- **FreeBSD `15.1-RELEASE`**：`seatd`、`libinput`、`libudev-devd`、`mesa-libs`、`libdisplay-info`、`libxkbcommon`、`wayland` が必要です。
- **OpenBSD `8+`**：`komawm/packaging/openbsd/` に実験的テンプレートを用意しています。

## ソースからのビルド

[komawm/koma](https://github.com/komawm/koma) のビルドには固定ツールチェーン **Rust `1.100.0`**（`rust-toolchain.toml`）と Wayland/DRM 開発ライブラリ（`libseat`、`libinput`、`libudev`、`libgbm`、`libxkbcommon`、`libdisplay-info`、`mesa`、`pixman`）が必要です。

```bash
git clone https://github.com/komawm/koma.git
cd koma
just fmt-check typecheck clippy test
cargo build --release --locked -p koma -p komactl -p koma-mcp -p koma-overview
./target/release/koma --headless-check
```

従来の X11 アプリ互換には外部ルートレスの [`xwayland-satellite`](https://github.com/Supreeeme/xwayland-satellite) を併用します。

## セッション統合（`greetd`・`systemd --user`）

パッケージ導入時には `koma-session`、`koma.desktop`、`koma.portal`、systemd ユーザーユニットが含まれます。

```toml
# /etc/greetd/config.toml 例
[default_session]
command = "agreety --cmd 'koma --session'"
user = "greeter"
```

既定ログイン環境を置き換える前に、必ず `koma --winit`（ネスト実行）または別 VT での `koma --tty --spawn foot` で動作を確認してください。
