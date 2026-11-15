# Installation & Channels

> [!WARNING]
> **Incubation Baseline (`v0.0.1`)**: Koma is currently in its `v0.0.1` incubation line. All nine crates compile under **Rust `1.100.0` (Edition 2024)** and pass unit tests, Arch Linux QEMU/KVM software KMS smoke (`koma --tty`), and FreeBSD `15.1-RELEASE` compile/check verification. Bare-metal physical GPU DRM/KMS scanout and security acceptance remain `v0.1.0` targets—keep a fallback TTY or existing session available.

> [!NOTE]
> Koma is completely standalone. You do not need to install [Jiku](/jiku/) to run Koma as your Wayland compositor.

## Distribution Channels Overview

Packaging definitions are maintained in [komawm/packaging](https://github.com/komawm/packaging) and distribute verified artifacts through GitHub Releases and the Cloudflare R2 CDN (`https://cdn.komawm.org`):

| Platform / Channel | Artifact / Source | Status / Scope |
| :--- | :--- | :--- |
| **Debian / Ubuntu** | Signed `deb822` APT (`https://cdn.komawm.org/apt`) + `koma_<ver>-1_<arch>.deb` (`amd64`, `arm64`) | nFPM `.deb` + `SHA256SUMS` |
| **Arch Linux** | `PKGBUILD` (`koma`, `koma-bin`) + `.pkg.tar.zst` (`x86_64`, `aarch64`) | QEMU/KVM Arch `10/10` smoke verified |
| **Fedora / RHEL / openEuler** | Copr / nFPM `.rpm` (`x86_64`, `aarch64`) | Spec + nFPM pipeline |
| **Alpine Linux** | `APKBUILD` / nFPM `.apk` (`x86_64`, `aarch64`) | musl target packaging |
| **NixOS / Nix** | Delegated `flake.nix` (`komawm/koma`) + Cachix (`x86_64-linux`, `aarch64-linux`) | Nix module templates |
| **FreeBSD `15+`** | Ports `Makefile` + `pkg` manifest (`amd64`, `aarch64`) | FreeBSD `15.1-RELEASE` VM verified |
| **OpenBSD `8+`** | Ports `Makefile` (`amd64`, `aarch64`) | Experimental template |
| **Homebrew (Linuxbrew)** | Formula `koma.rb` (`x86_64`, `aarch64`) | Linux binary formula |
| **Generic Linux Tarball** | `koma-<ver>-x86_64-unknown-linux-gnu.tar.gz` + `SHA256SUMS` | Self-contained release archive |

## Debian / Ubuntu (Signed `deb822` APT Channel)

Install the GPG keyring and `deb822` source list served from `https://cdn.komawm.org/apt`:

```bash
curl -fsSL https://cdn.komawm.org/apt/setup.sh | sudo sh
sudo apt update
sudo apt install koma
```

Or configure `/etc/apt/sources.list.d/komawm.sources` manually (`Signed-By: /usr/share/keyrings/komawm-archive-keyring.gpg`). Direct `.deb` downloads are also available under `https://cdn.komawm.org/releases/` and GitHub Releases (`SHA256SUMS` verified).

## Arch Linux

Install from the release `.pkg.tar.zst` archive or build via `PKGBUILD`:

```bash
# Verify downloaded package digest first
sha256sum -c SHA256SUMS-archlinux
sudo pacman -U koma-0.0.1-1-x86_64.pkg.tar.zst
```

Runtime dependencies resolved by `pacman` include `seatd` (or `systemd-libs`), `libinput`, `mesa`, `libdisplay-info`, `libxkbcommon`, `wayland`, `pixman`, and `libglvnd`.

## Fedora / RHEL, Alpine, NixOS & BSD

- **Fedora / RHEL**: Install the nFPM/Copr `.rpm` (`sudo dnf install ./koma-*.rpm`).
- **Alpine Linux**: Install the `.apk` package (`sudo apk add --allow-untrusted ./koma-*.apk` after `sha256sum` verification) with `seatd` / `elogind` enabled.
- **FreeBSD `15.1-RELEASE`**: Requires `seatd`, `libinput`, `libudev-devd`, `mesa-libs`, `libdisplay-info`, `libxkbcommon`, `wayland`, and `basu` / `consolekit2` for unprivileged VT seat access.
- **OpenBSD `8+`**: Template provided in `komawm/packaging/openbsd/` (experimental; runtime verification pending).

## Building from Source

Building from [komawm/koma](https://github.com/komawm/koma) requires the pinned **Rust `1.100.0`** toolchain (`rust-toolchain.toml`) and Wayland/DRM development headers (`libseat`, `libinput`, `libudev`, `libgbm`, `libxkbcommon`, `libdisplay-info`, `mesa`, `pixman`, `pango`/`cairo` where applicable):

```bash
git clone https://github.com/komawm/koma.git
cd koma
just fmt-check typecheck clippy test
cargo build --release --locked -p koma -p komactl -p koma-mcp -p koma-overview
./target/release/koma --headless-check
```

Optional X11 application support is delegated to external rootless [`xwayland-satellite`](https://github.com/Supreeeme/xwayland-satellite); install `xwayland-satellite` alongside `koma` if you run legacy X11 clients.

## Session Integration (`greetd` & `systemd --user`)

When installing from packages, Koma ships `koma-session`, `koma.desktop` / `koma.portal` (`xdg-desktop-portal` config), and systemd user unit templates. To launch from `greetd` without touching your existing Hyprland/Sway setup:

```toml
# /etc/greetd/config.toml (example secondary VT)
[default_session]
command = "agreety --cmd 'koma --session'"
user = "greeter"
```

Always test nested (`koma --winit`) or on a spare TTY (`koma --tty --spawn foot`) before setting Koma as your default login session.
