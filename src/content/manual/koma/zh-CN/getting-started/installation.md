# 多发行版安装与渠道

> [!WARNING]
> **当前版本边界（`v0.0.1` 孵化基线）**：Koma 当前处于 `v0.0.1` 孵化阶段。全部 9 个 Rust crate 均已在 **Rust `1.100.0`（Edition 2024）** 下通过单元测试、Arch Linux QEMU/KVM 软件 KMS 冒烟验证（`koma --tty`）以及 FreeBSD `15.1-RELEASE` 编译检查；物理 GPU 裸机 DRM/KMS 扫描输出与安全验收仍属于 `v0.1.0` 里程碑目标，请务必保留可用的 TTY 或原有桌面会话作为回退。

> [!NOTE]
> Koma 是完全独立的 Wayland 合成器，无需安装 [Jiku](/zh-CN/jiku/) 即可独立使用全部窗口管理功能。

## 分发渠道与打包矩阵

多发行版打包定义维护在 [komawm/packaging](https://github.com/komawm/packaging)，产物通过 GitHub Releases 与 Cloudflare R2 CDN（`https://cdn.komawm.org`）分发：

| 平台 / 渠道 | 产物形态 | 当前状态与说明 |
| :--- | :--- | :--- |
| **Debian / Ubuntu** | 签名 `deb822` APT 源（`https://cdn.komawm.org/apt`）+ `koma_<ver>-1_<arch>.deb`（`amd64`, `arm64`） | nFPM `.deb` + `SHA256SUMS` |
| **Arch Linux** | `PKGBUILD`（`koma` / `koma-bin`）+ `.pkg.tar.zst`（`x86_64`, `aarch64`） | QEMU/KVM Arch `10/10` 冒烟通过 |
| **Fedora / RHEL / openEuler** | Copr / nFPM `.rpm`（`x86_64`, `aarch64`） | Spec + nFPM 流水线 |
| **Alpine Linux** | `APKBUILD` / nFPM `.apk`（`x86_64`, `aarch64`） | musl 构建模板 |
| **NixOS / Nix** | 委托 `komawm/koma` `flake.nix` + Cachix（`x86_64-linux`, `aarch64-linux`） | Nix 模块模板 |
| **FreeBSD `15+`** | Ports `Makefile` + `pkg` 清单（`amd64`, `aarch64`） | FreeBSD `15.1-RELEASE` 虚拟机验证通过 |
| **OpenBSD `8+`** | Ports `Makefile`（`amd64`, `aarch64`） | 实验性模板 |
| **Homebrew (Linuxbrew)** | Formula `koma.rb`（`x86_64`, `aarch64`） | Linux 二进制配方 |
| **通用 Linux 压缩包** | `koma-<ver>-x86_64-unknown-linux-gnu.tar.gz` + `SHA256SUMS` | 自包含发布归档 |

## Debian / Ubuntu（签名 `deb822` APT 渠道）

通过 `https://cdn.komawm.org/apt` 安装 GPG 密钥环与 `deb822` 源配置：

```bash
curl -fsSL https://cdn.komawm.org/apt/setup.sh | sudo sh
sudo apt update
sudo apt install koma
```

也可以手动写入 `/etc/apt/sources.list.d/komawm.sources`（指定 `Signed-By: /usr/share/keyrings/komawm-archive-keyring.gpg`），或从 `https://cdn.komawm.org/releases/` 与 GitHub Releases 下载并校验 `SHA256SUMS` 后直接安装 `.deb`。

## Arch Linux

使用校验后的 `.pkg.tar.zst` 离线包或 `PKGBUILD` 安装：

```bash
sha256sum -c SHA256SUMS-archlinux
sudo pacman -U koma-0.0.1-1-x86_64.pkg.tar.zst
```

`pacman` 会自动解析 `seatd`（或 `systemd-libs`）、`libinput`、`mesa`、`libdisplay-info`、`libxkbcommon`、`wayland`、`pixman` 与 `libglvnd` 等运行时依赖。

## Fedora / RHEL、Alpine、NixOS 与 BSD

- **Fedora / RHEL**：安装 nFPM 或 Copr 构建的 `.rpm`（`sudo dnf install ./koma-*.rpm`）。
- **Alpine Linux**：校验 `SHA256SUMS` 后安装 `.apk`（`sudo apk add --allow-untrusted ./koma-*.apk`），并启用 `seatd` 或 `elogind`。
- **FreeBSD `15.1-RELEASE`**：需要 `seatd`、`libinput`、`libudev-devd`、`mesa-libs`、`libdisplay-info`、`libxkbcommon`、`wayland` 等包提供无特权 VT 座席访问。
- **OpenBSD `8+`**：打包模板位于 `komawm/packaging/openbsd/`（目前仍为实验性模板，待运行时验证）。

## 从源码构建

从 [komawm/koma](https://github.com/komawm/koma) 编译需要仓库锁定的 **Rust `1.100.0`** 工具链（`rust-toolchain.toml`）及 Wayland/DRM 系统开发库（`libseat`、`libinput`、`libudev`、`libgbm`、`libxkbcommon`、`libdisplay-info`、`mesa`、`pixman` 等）：

```bash
git clone https://github.com/komawm/koma.git
cd koma
just fmt-check typecheck clippy test
cargo build --release --locked -p koma -p komactl -p koma-mcp -p koma-overview
./target/release/koma --headless-check
```

如需运行传统 X11 应用，请另行安装外部无根代理 [`xwayland-satellite`](https://github.com/Supreeeme/xwayland-satellite)。

## 登录会话集成（`greetd` 与 `systemd --user`）

安装包会附带 `koma-session`、`koma.desktop`、`koma.portal`（`xdg-desktop-portal` 路由）以及 systemd 用户单元。在备用 TTY 或 `greetd` 中试运行：

```toml
# /etc/greetd/config.toml 示例
[default_session]
command = "agreety --cmd 'koma --session'"
user = "greeter"
```

在替换默认登录管理器前，建议先通过 `koma --winit` 嵌套运行或在独立 VT 执行 `koma --tty --spawn foot` 进行确认。
