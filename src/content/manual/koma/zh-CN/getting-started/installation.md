# 安装指南

> [!WARNING]
> **孵化阶段基线（`v0.0.1`）**：Koma 当前处于 `v0.0.1` 孵化阶段。单元测试、Arch Linux QEMU/KVM 软件 KMS 冒烟检查（`koma --tty`）以及 FreeBSD `15.1-RELEASE` 编译与测试检查已通过；物理 GPU 裸机 DRM/KMS 扫描输出与完整安全验收仍属于 `v0.1.0` 目标，请务必保留可用的备用 TTY 或原有桌面会话。

> [!NOTE]
> Koma 是完全独立的 Wayland 合成器，无需安装 [Jiku](/zh-CN/jiku/) 即可使用全部窗口管理功能。

## 分发渠道概览

多发行版打包定义维护在 [komawm/packaging](https://github.com/komawm/packaging)，发布包通过 GitHub Releases 与官方软件包仓库分发：

| 平台 / 渠道 | 产物形态 | 当前状态与说明 |
| :--- | :--- | :--- |
| **Debian / Ubuntu** | 签名 `deb822` APT 仓库 + `koma_<ver>-1_<arch>.deb`（`amd64`, `arm64`） | `.deb` + `SHA256SUMS` |
| **Arch Linux** | `PKGBUILD`（`koma` / `koma-bin`）+ `.pkg.tar.zst`（`x86_64`, `aarch64`） | QEMU/KVM Arch `10/10` 冒烟通过 |
| **Fedora / RHEL / openEuler** | Copr / `.rpm`（`x86_64`, `aarch64`） | RPM 打包 |
| **Alpine Linux** | `APKBUILD` / `.apk`（`x86_64`, `aarch64`） | musl 目标打包 |
| **NixOS / Nix** | 委托 `komawm/koma` `flake.nix` + Cachix（`x86_64-linux`, `aarch64-linux`） | Nix 模块模板 |
| **FreeBSD `15+`** | Ports `Makefile` + `pkg` 清单（`amd64`, `aarch64`） | FreeBSD `15.1-RELEASE` 虚拟机验证通过 |
| **OpenBSD `8+`** | Ports `Makefile`（`amd64`, `aarch64`） | 实验性模板 |
| **Homebrew (Linuxbrew)** | Formula `koma.rb`（`x86_64`, `aarch64`） | Linux 二进制配方 |
| **通用 Linux 压缩包** | `koma-<ver>-x86_64-unknown-linux-gnu.tar.gz` + `SHA256SUMS` | 自包含发布归档 |

## Debian / Ubuntu（签名 `deb822` APT）

安装仓库签名密钥与 `deb822` 源配置：

```bash
curl -fsSL https://cdn.komawm.org/apt/setup.sh | sudo sh
sudo apt update
sudo apt install koma
```

也可以手动配置 `/etc/apt/sources.list.d/komawm.sources`（将 `Signed-By` 指向 `/usr/share/keyrings/komawm-archive-keyring.gpg`），或从 GitHub Releases 下载并校验 `SHA256SUMS` 后直接安装 `.deb` 包。

## Arch Linux

安装多架构预构建 AUR 包 `koma-bin`（无需本地编译），或通过 `koma` 从源码构建，也可直接用 `pacman -U` 安装 `.pkg.tar.zst`：

```bash
# 安装预构建二进制包（支持 x86_64 与 aarch64）
paru -S koma-bin

# 或从源码 PKGBUILD 构建 / 安装已校验的离线包
paru -S koma
sudo pacman -U koma-0.0.1-1-x86_64.pkg.tar.zst
```

`pacman` 会自动解析 `seatd`（或 `systemd-libs`）、`libinput`、`mesa`、`libdisplay-info`、`libxkbcommon`、`wayland`、`pixman` 与 `libglvnd` 等运行时依赖。

## Fedora / RHEL、Alpine、Homebrew、NixOS 与 BSD

- **Fedora / RHEL**：安装 `.rpm` 包（`sudo dnf install ./koma-*.rpm`）。
- **Alpine Linux**：校验 `sha256sum` 后安装 `.apk`（`sudo apk add --allow-untrusted ./koma-*.apk`），并启用 `seatd` 或 `elogind`。
- **Homebrew on Linux（Linuxbrew）**：安装预构建 Linux 二进制配方：
  ```bash
  curl -fsSLO https://cdn.komawm.org/install/koma/koma.rb
  brew install --formula ./koma.rb
  ```
- **FreeBSD `15.1-RELEASE`**：需要 `seatd`、`libinput`、`libudev-devd`、`mesa-libs`、`libdisplay-info`、`libxkbcommon`、`wayland`，以及 `basu` / `consolekit2` 以支持无特权 VT 座席访问。
- **OpenBSD `8+`**：打包模板位于 `komawm/packaging/openbsd/`（目前仍为实验性模板，待运行时验证）。

## 从源码构建

从 [komawm/koma](https://github.com/komawm/koma) 构建需要 `cargo` 工具链与 Wayland/DRM 开发头文件（`libseat`、`libinput`、`libudev`、`libgbm`、`libxkbcommon`、`libdisplay-info`、`mesa`、`pixman`，以及按需安装的 `pango`/`cairo`）：

```bash
git clone https://github.com/komawm/koma.git
cd koma
just fmt-check typecheck clippy test
cargo build --release --locked -p koma -p komactl -p koma-mcp -p koma-overview
./target/release/koma --headless-check
```

如需运行传统 X11 应用，请另行安装外部无根代理 [`xwayland-satellite`](https://github.com/Supreeeme/xwayland-satellite)。

## 登录会话集成（`greetd` 与 `systemd --user`）

发行版安装包附带 `koma-session`、`koma.desktop`、`koma.portal`（`xdg-desktop-portal` 配置）以及 systemd 用户单元模板。在不改动现有配置的前提下通过 `greetd` 试运行：

```toml
# /etc/greetd/config.toml（备用 VT 示例）
[default_session]
command = "agreety --cmd 'koma --session'"
user = "greeter"
```

在替换默认登录环境前，建议先通过 `koma --winit` 嵌套运行或在备用 TTY 执行 `koma --tty --spawn foot` 进行确认。
