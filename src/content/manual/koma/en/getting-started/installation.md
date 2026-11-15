# Installation

> [!WARNING]
> **Incubation Baseline (`v0.0.1`)**: Koma is currently in its `v0.0.1` incubation line. Unit tests, Arch Linux QEMU/KVM software KMS smoke tests (`koma --tty`), and FreeBSD `15.1-RELEASE` compile/test checks pass. Bare-metal GPU DRM/KMS scanout and security acceptance remain `v0.1.0` targets—keep a fallback TTY or existing session available.

> [!NOTE]
> Koma is standalone. You do not need to install [Jiku](/jiku/) to run Koma as your Wayland compositor.

## Distribution Channels Overview

Packaging definitions are maintained in [komawm/packaging](https://github.com/komawm/packaging), and release artifacts are published via GitHub Releases and the official package repository:

| Platform / Channel | Artifact / Source | Status / Scope |
| :--- | :--- | :--- |
| **Debian / Ubuntu** | Signed `deb822` APT repository + `koma_<ver>-1_<arch>.deb` (`amd64`, `arm64`) | `.deb` + `SHA256SUMS` |
| **Arch Linux** | `PKGBUILD` (`koma`, `koma-bin`) + `.pkg.tar.zst` (`x86_64`, `aarch64`) | QEMU/KVM Arch `10/10` smoke verified |
| **Fedora / RHEL / openEuler** | Copr / `.rpm` (`x86_64`, `aarch64`) | RPM packaging |
| **Alpine Linux** | `APKBUILD` / `.apk` (`x86_64`, `aarch64`) | musl target packaging |
| **NixOS / Nix** | Delegated `flake.nix` (`komawm/koma`) + Cachix (`x86_64-linux`, `aarch64-linux`) | Nix module templates |
| **FreeBSD `15+`** | Ports `Makefile` + `pkg` manifest (`amd64`, `aarch64`) | FreeBSD `15.1-RELEASE` VM verified |
| **OpenBSD `8+`** | Ports `Makefile` (`amd64`, `aarch64`) | Experimental template |
| **Homebrew (Linuxbrew)** | Formula `koma.rb` (`x86_64`, `aarch64`) | Linux binary formula |
| **Generic Linux Tarball** | `koma-<ver>-x86_64-unknown-linux-gnu.tar.gz` + `SHA256SUMS` | Self-contained release archive |

## Debian / Ubuntu (Signed `deb822` APT)

Install the signing keyring and `deb822` APT source list:

```bash
curl -fsSL https://cdn.komawm.org/apt/setup.sh | sudo sh
sudo apt update
sudo apt install koma
```

To configure APT manually, create `/etc/apt/sources.list.d/komawm.sources` referencing `/usr/share/keyrings/komawm-archive-keyring.gpg` in `Signed-By`, or download `.deb` packages and `SHA256SUMS` directly from GitHub Releases.

## Arch Linux

Install the prebuilt multi-arch AUR package (`koma-bin`), build from source via `koma`, or install a release `.pkg.tar.zst` archive directly:

```bash
# Prebuilt binary package (x86_64 & aarch64)
paru -S koma-bin

# Or build from source PKGBUILD / install downloaded package
paru -S koma
sudo pacman -U koma-0.0.1-1-x86_64.pkg.tar.zst
```

Runtime dependencies resolved by `pacman` include `seatd` (or `systemd-libs`), `libinput`, `mesa`, `libdisplay-info`, `libxkbcommon`, `wayland`, `pixman`, and `libglvnd`.

## Fedora / RHEL, Alpine, Homebrew, NixOS & BSD

- **Fedora / RHEL**: Install the `.rpm` package (`sudo dnf install ./koma-*.rpm`).
- **Alpine Linux**: Install the `.apk` package (`sudo apk add --allow-untrusted ./koma-*.apk` after verifying `sha256sum`) with `seatd` or `elogind` enabled.
- **Homebrew on Linux (Linuxbrew)**: Install the Linux binary formula:
  ```bash
  curl -fsSLO https://cdn.komawm.org/install/koma/koma.rb
  brew install --formula ./koma.rb
  ```
- **FreeBSD `15.1-RELEASE`**: Requires `seatd`, `libinput`, `libudev-devd`, `mesa-libs`, `libdisplay-info`, `libxkbcommon`, `wayland`, and `basu` / `consolekit2` for unprivileged VT seat access.
- **OpenBSD `8+`**: Template provided in `komawm/packaging/openbsd/` (experimental; runtime verification pending).

## Build from Source

Building from [komawm/koma](https://github.com/komawm/koma) requires `cargo` and Wayland/DRM development headers (`libseat`, `libinput`, `libudev`, `libgbm`, `libxkbcommon`, `libdisplay-info`, `mesa`, `pixman`, `pango`/`cairo` where applicable):

```bash
git clone https://github.com/komawm/koma.git
cd koma
just fmt-check typecheck clippy test
cargo build --release --locked -p koma -p komactl -p koma-mcp -p koma-overview
./target/release/koma --headless-check
```

Optional X11 application support is delegated to external rootless [`xwayland-satellite`](https://github.com/Supreeeme/xwayland-satellite); install `xwayland-satellite` alongside `koma` if you run legacy X11 clients.

## Session Integration (`greetd` & `systemd --user`)

Distribution packages ship `koma-session`, `koma.desktop`, `koma.portal` (`xdg-desktop-portal` config), and systemd user unit templates. To test launching from `greetd` without touching your existing setup:

```toml
# /etc/greetd/config.toml (example secondary VT)
[default_session]
command = "agreety --cmd 'koma --session'"
user = "greeter"
```

Always test nested (`koma --winit`) or on a spare TTY (`koma --tty --spawn foot`) before setting Koma as your default login session.
