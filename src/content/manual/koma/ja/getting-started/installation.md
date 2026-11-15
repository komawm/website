# インストール

> [!WARNING]
> **インキュベーション段階（`v0.0.1`）**：Koma は現在 `v0.0.1` の開発ラインです。ユニットテスト、Arch Linux QEMU/KVM ソフトウェア KMS スモーク検証（`koma --tty`）、および FreeBSD `15.1-RELEASE` でのビルド／テスト検証は通過していますが、実機 GPU の DRM/KMS スキャンアウトおよびセキュリティ承認は `v0.1.0` 目標です。予備の TTY または既存セッションを残した状態で試用してください。

> [!NOTE]
> Koma は単体で完結する Wayland コンポジタです。[Jiku](/ja/jiku/) をインストールしなくても利用できます。

## 配布チャネル一覧

各ディストリビューション向けパッケージ定義は [komawm/packaging](https://github.com/komawm/packaging) で管理され、GitHub Releases および公式パッケージリポジトリから配布されます。

| プラットフォーム / チャネル | 配布形式 | ステータス / 対象 |
| :--- | :--- | :--- |
| **Debian / Ubuntu** | 署名付き `deb822` APT リポジトリ + `koma_<ver>-1_<arch>.deb`（`amd64`, `arm64`） | `.deb` + `SHA256SUMS` |
| **Arch Linux** | `PKGBUILD`（`koma`, `koma-bin`）+ `.pkg.tar.zst`（`x86_64`, `aarch64`） | QEMU/KVM Arch `10/10` スモーク合格 |
| **Fedora / RHEL / openEuler** | Copr / `.rpm`（`x86_64`, `aarch64`） | RPM パッケージング |
| **Alpine Linux** | `APKBUILD` / `.apk`（`x86_64`, `aarch64`） | musl パッケージング |
| **NixOS / Nix** | `komawm/koma` `flake.nix` 委譲 + Cachix（`x86_64-linux`, `aarch64-linux`） | Nix モジュールテンプレート |
| **FreeBSD `15+`** | Ports `Makefile` + `pkg` マニフェスト（`amd64`, `aarch64`） | FreeBSD `15.1-RELEASE` VM 検証済み |
| **OpenBSD `8+`** | Ports `Makefile`（`amd64`, `aarch64`） | 実験的テンプレート |
| **Homebrew (Linuxbrew)** | Formula `koma.rb`（`x86_64`, `aarch64`） | Linux バイナリ用 Formula |
| **汎用 Linux アーカイブ** | `koma-<ver>-x86_64-unknown-linux-gnu.tar.gz` + `SHA256SUMS` | 自己完結型アーカイブ |

## Debian / Ubuntu（署名付き `deb822` APT）

署名キーリングと `deb822` APT リポジトリ設定を導入します。

```bash
curl -fsSL https://cdn.komawm.org/apt/setup.sh | sudo sh
sudo apt update
sudo apt install koma
```

手動で `/etc/apt/sources.list.d/komawm.sources`（`Signed-By: /usr/share/keyrings/komawm-archive-keyring.gpg`）を設定するか、GitHub Releases から `SHA256SUMS` 検証済みの `.deb` を直接導入することもできます。

## Arch Linux

ビルド済みマルチアーキテクチャ AUR パッケージ `koma-bin`（ローカルビルド不要）、ソース版 `koma`、または `.pkg.tar.zst` パッケージを利用できます。

```bash
# ビルド済みバイナリを導入（x86_64 / aarch64）
paru -S koma-bin

# またはソース PKGBUILD ビルド / 検証済みパッケージの直接導入
paru -S koma
sudo pacman -U koma-0.0.1-1-x86_64.pkg.tar.zst
```

`seatd`（または `systemd-libs`）、`libinput`、`mesa`、`libdisplay-info`、`libxkbcommon`、`wayland`、`pixman`、`libglvnd` が依存関係として解決されます。

## Fedora / RHEL・Alpine・Homebrew・NixOS・BSD

- **Fedora / RHEL**：`.rpm` パッケージを導入します（`sudo dnf install ./koma-*.rpm`）。
- **Alpine Linux**：`sha256sum` 検証後に `.apk` を導入し（`sudo apk add --allow-untrusted ./koma-*.apk`）、`seatd` または `elogind` を有効化します。
- **Homebrew on Linux（Linuxbrew）**：Linux 用 Formula から導入します：
  ```bash
  curl -fsSLO https://cdn.komawm.org/install/koma/koma.rb
  brew install --formula ./koma.rb
  ```
- **FreeBSD `15.1-RELEASE`**：`seatd`、`libinput`、`libudev-devd`、`mesa-libs`、`libdisplay-info`、`libxkbcommon`、`wayland`、および非特権 VT シートアクセス用の `basu` / `consolekit2` が必要です。
- **OpenBSD `8+`**：`komawm/packaging/openbsd/` に実験的テンプレートを用意しています（ランタイム検証は未完了）。

## ソースからのビルド

[komawm/koma](https://github.com/komawm/koma) をソースからビルドするには、`cargo` と Wayland/DRM 開発ヘッダ（`libseat`、`libinput`、`libudev`、`libgbm`、`libxkbcommon`、`libdisplay-info`、`mesa`、`pixman`、必要に応じて `pango`/`cairo`）が必要です。

```bash
git clone https://github.com/komawm/koma.git
cd koma
just fmt-check typecheck clippy test
cargo build --release --locked -p koma -p komactl -p koma-mcp -p koma-overview
./target/release/koma --headless-check
```

従来の X11 アプリ互換には外部ルートレスの [`xwayland-satellite`](https://github.com/Supreeeme/xwayland-satellite) を併用してください。

## セッション統合（`greetd`・`systemd --user`）

配布パッケージには `koma-session`、`koma.desktop`、`koma.portal`（`xdg-desktop-portal` 設定）、systemd ユーザーユニットが含まれます。

```toml
# /etc/greetd/config.toml（予備 VT の例）
[default_session]
command = "agreety --cmd 'koma --session'"
user = "greeter"
```

既定のログインセッションを切り替える前に、必ず `koma --winit`（ネスト実行）または別 VT での `koma --tty --spawn foot` で動作を確認してください。
