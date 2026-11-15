/**
 * Multi-distro & R2 CDN (`https://cdn.komawm.org`) install channels for Koma and Jiku,
 * aligned with `komawm/packaging` targets (`v0.0.x` incubation / `v0.1.0` acceptance).
 */

import type { ProductSurface, SiteLocale } from "../lib/i18n.ts";

export type LocalizedText = Readonly<Record<SiteLocale, string>>;

export interface InstallCommand {
  readonly label?: LocalizedText;
  readonly code: string;
}

export interface InstallChannel {
  readonly id: string;
  readonly tabLabel: LocalizedText;
  readonly name: LocalizedText;
  readonly arch: string;
  readonly summary: LocalizedText;
  readonly commands: readonly InstallCommand[];
}

export const RELEASE_POINTERS: Readonly<Record<ProductSurface, string>> = {
  koma: "https://cdn.komawm.org/install/koma/latest.txt",
  jiku: "https://cdn.komawm.org/install/jiku/latest.txt",
};

export const KOMA_INSTALL_CHANNELS: readonly InstallChannel[] = [
  {
    id: "arch",
    tabLabel: { en: "Arch Linux", "zh-CN": "Arch Linux", ja: "Arch Linux" },
    name: {
      en: "Arch Linux / AUR",
      "zh-CN": "Arch Linux / AUR",
      ja: "Arch Linux / AUR",
    },
    arch: "x86_64 · aarch64",
    summary: {
      en: "Prebuilt R2-backed binary package (`koma-bin`) or source PKGBUILD (`koma`) for x86_64 and Arch ARM.",
      "zh-CN":
        "基于 R2 CDN 的预构建二进制包（`koma-bin`）或源码 PKGBUILD（`koma`），支持 x86_64 与 Arch ARM。",
      ja: "R2 CDN 配信のバイナリ版（`koma-bin`）またはソースビルド版（`koma`）を AUR で提供します。",
    },
    commands: [
      {
        label: {
          en: "Prebuilt via AUR",
          "zh-CN": "AUR 预构建包",
          ja: "AUR ビルド済みパッケージ",
        },
        code: "paru -S koma-bin",
      },
      {
        label: {
          en: "Build from source PKGBUILD",
          "zh-CN": "源码 PKGBUILD 构建",
          ja: "ソース PKGBUILD からビルド",
        },
        code: "paru -S koma",
      },
    ],
  },
  {
    id: "apt",
    tabLabel: {
      en: "Debian / Ubuntu",
      "zh-CN": "Debian / Ubuntu",
      ja: "Debian / Ubuntu",
    },
    name: {
      en: "Debian / Ubuntu (APT deb822)",
      "zh-CN": "Debian / Ubuntu（APT deb822 源）",
      ja: "Debian / Ubuntu（APT deb822）",
    },
    arch: "amd64 · arm64",
    summary: {
      en: "GPG-signed deb822 APT repository (`komawm.sources`) served from `https://cdn.komawm.org/apt`.",
      "zh-CN":
        "托管于 `https://cdn.komawm.org/apt` 的 GPG 签名 deb822 APT 仓库（`komawm.sources`）。",
      ja: "`https://cdn.komawm.org/apt` で配信される GPG 署名付き deb822 APT リポジトリ（`komawm.sources`）。",
    },
    commands: [
      {
        label: {
          en: "One-line keyring & komawm.sources setup",
          "zh-CN": "一键配置密钥环与 komawm.sources",
          ja: "ワンラインで鍵と komawm.sources を構成",
        },
        code: "curl -fsSL https://cdn.komawm.org/apt/setup.sh | sudo bash\nsudo apt install -y koma",
      },
      {
        label: {
          en: "Manual deb822 source",
          "zh-CN": "手动配置 deb822 源",
          ja: "手動 deb822 設定",
        },
        code: "sudo install -d -m 0755 /etc/apt/keyrings\nsudo curl -fsSL https://cdn.komawm.org/apt/komawm-archive-keyring.gpg -o /etc/apt/keyrings/komawm-archive-keyring.gpg\nsudo curl -fsSL https://cdn.komawm.org/apt/komawm.sources -o /etc/apt/sources.list.d/komawm.sources\nsudo apt update && sudo apt install -y koma",
      },
    ],
  },
  {
    id: "rpm",
    tabLabel: {
      en: "Fedora / RHEL",
      "zh-CN": "Fedora / RHEL",
      ja: "Fedora / RHEL",
    },
    name: {
      en: "Fedora / RHEL / Asahi Remix (RPM)",
      "zh-CN": "Fedora / RHEL / Asahi Remix（RPM）",
      ja: "Fedora / RHEL / Asahi Remix（RPM）",
    },
    arch: "x86_64 · aarch64",
    summary: {
      en: "Copr repository and nFPM `.rpm` release packages covering Fedora Workstation and Fedora Asahi Remix.",
      "zh-CN":
        "提供 Copr 仓库与 nFPM `.rpm` 安装包，覆盖 Fedora Workstation 与 Apple Silicon Asahi Remix。",
      ja: "Fedora Workstation および Asahi Remix 向けの Copr / nFPM `.rpm` パッケージを提供します。",
    },
    commands: [
      {
        label: {
          en: "Fedora / Copr",
          "zh-CN": "Fedora / Copr",
          ja: "Fedora / Copr",
        },
        code: "sudo dnf copr enable -y komawm/koma\nsudo dnf install -y koma",
      },
      {
        label: {
          en: "Direct RPM from R2 CDN",
          "zh-CN": "从 R2 CDN 直接安装 RPM",
          ja: "R2 CDN から直接 RPM を導入",
        },
        code: 'TAG=$(curl -fsSL https://cdn.komawm.org/install/koma/latest.txt)\nsudo dnf install -y "https://cdn.komawm.org/releases/koma/$TAG/koma-${TAG#v}-1.x86_64.rpm"',
      },
    ],
  },
  {
    id: "alpine",
    tabLabel: {
      en: "Alpine",
      "zh-CN": "Alpine",
      ja: "Alpine",
    },
    name: {
      en: "Alpine Linux (musl APK)",
      "zh-CN": "Alpine Linux（musl APK）",
      ja: "Alpine Linux（musl APK）",
    },
    arch: "x86_64 · aarch64",
    summary: {
      en: "Native musl `.apk` packages published to R2 CDN alongside each release tag.",
      "zh-CN": "随版本发布至 R2 CDN 的原生 musl `.apk` 软件包。",
      ja: "各リリースに合わせて R2 CDN へ公開されるネイティブ musl `.apk` パッケージです。",
    },
    commands: [
      {
        code: 'TAG=$(curl -fsSL https://cdn.komawm.org/install/koma/latest.txt)\ncurl -fsSLO "https://cdn.komawm.org/releases/koma/$TAG/koma_${TAG#v}_linux_amd64.apk"\nsudo apk add --allow-untrusted "./koma_${TAG#v}_linux_amd64.apk"',
      },
    ],
  },
  {
    id: "nix",
    tabLabel: {
      en: "NixOS",
      "zh-CN": "NixOS",
      ja: "NixOS",
    },
    name: {
      en: "Nix / NixOS (`flake.nix`)",
      "zh-CN": "Nix / NixOS（`flake.nix`）",
      ja: "Nix / NixOS（`flake.nix`）",
    },
    arch: "x86_64-linux · aarch64-linux",
    summary: {
      en: "Canonical `flake.nix` lives in `komawm/koma` with Cachix binary closures for Linux and Apple Silicon Linux.",
      "zh-CN":
        "主 Flake 定义位于 `komawm/koma`（`flake.nix`），支持 x86_64-linux 与 aarch64-linux。",
      ja: "`komawm/koma` の `flake.nix` から直接実行またはプロファイル導入できます。",
    },
    commands: [
      {
        label: {
          en: "Run or install via Flake",
          "zh-CN": "通过 Flake 运行或安装",
          ja: "Flake で実行・導入",
        },
        code: "nix run github:komawm/koma\nnix profile install github:komawm/koma",
      },
    ],
  },
  {
    id: "homebrew",
    tabLabel: {
      en: "Homebrew",
      "zh-CN": "Homebrew",
      ja: "Homebrew",
    },
    name: {
      en: "Homebrew on Linux (Linuxbrew)",
      "zh-CN": "Homebrew on Linux（Linuxbrew）",
      ja: "Homebrew on Linux（Linuxbrew）",
    },
    arch: "x86_64 · aarch64 (Linux)",
    summary: {
      en: "Prebuilt Linux-only Homebrew formula (`depends_on :linux`) distributed from `https://cdn.komawm.org/install/koma/koma.rb`.",
      "zh-CN":
        "仅面向 Linux 的预构建 Homebrew 配方（`depends_on :linux`），直接从 `https://cdn.komawm.org/install/koma/koma.rb` 获取。",
      ja: "Linux 専用のビルド済み Homebrew フォーミュラ（`depends_on :linux`）。`https://cdn.komawm.org/install/koma/koma.rb` から直接インストールできます。",
    },
    commands: [
      {
        code: "curl -fsSLO https://cdn.komawm.org/install/koma/koma.rb\nbrew install --formula ./koma.rb",
      },
    ],
  },
  {
    id: "freebsd",
    tabLabel: {
      en: "FreeBSD",
      "zh-CN": "FreeBSD",
      ja: "FreeBSD",
    },
    name: {
      en: "FreeBSD 15.1+ (Experimental)",
      "zh-CN": "FreeBSD 15.1+（实验性支持）",
      ja: "FreeBSD 15.1+（実験的サポート）",
    },
    arch: "amd64 · aarch64",
    summary: {
      en: "Validated in FreeBSD 15.1 QEMU sessions via `komawm/packaging/freebsd/` ports template (`libseat`, `libinput`, `libxkbcommon`).",
      "zh-CN":
        "已通过 FreeBSD 15.1 QEMU 构建与校验，使用 `komawm/packaging/freebsd/` 端口模板与 Wayland/seat 依赖。",
      ja: "FreeBSD 15.1 QEMU 環境でビルド検証済みの `komawm/packaging/freebsd/` ポートテンプレートです。",
    },
    commands: [
      {
        code: "pkg install -y rust git pkgconf wayland libxkbcommon libinput mesa-libs seatd\ngit clone https://github.com/komawm/koma.git && cd koma\ncargo build --release --workspace",
      },
    ],
  },
  {
    id: "openbsd",
    tabLabel: {
      en: "OpenBSD",
      "zh-CN": "OpenBSD",
      ja: "OpenBSD",
    },
    name: {
      en: "OpenBSD 8.0+ (Portable Crates)",
      "zh-CN": "OpenBSD 8.0+（可移植控制组件）",
      ja: "OpenBSD 8.0+（ポータブルクレート）",
    },
    arch: "amd64 · aarch64",
    summary: {
      en: "Experimental OpenBSD port template covering portable `koma-ipc`, `komactl`, and `koma-mcp` crates.",
      "zh-CN":
        "实验性 OpenBSD 端口模板，支持可移植的 `koma-ipc`、`komactl` 与 `koma-mcp` 组件。",
      ja: "ポータブルな `koma-ipc` / `komactl` / `koma-mcp` 向けの実験的 OpenBSD ポートテンプレートです。",
    },
    commands: [
      {
        code: "pkg_add rust git\ngit clone https://github.com/komawm/koma.git && cd koma\ncargo check -p koma-ipc -p komactl -p koma-mcp",
      },
    ],
  },
  {
    id: "source",
    tabLabel: {
      en: "Cargo",
      "zh-CN": "Cargo 源码",
      ja: "Cargo ソース",
    },
    name: {
      en: "Build from Source (Rust 1.100.0)",
      "zh-CN": "从源码编译（Rust 1.100.0）",
      ja: "ソースからビルド（Rust 1.100.0）",
    },
    arch: "Rust 1.100.0 · 2024",
    summary: {
      en: "Compile the Koma workspace directly with the pinned Rust 1.100.0 toolchain.",
      "zh-CN": "使用仓库固定的 Rust 1.100.0 工具链直接编译安装 Koma。",
      ja: "固定された Rust 1.100.0 ツールチェーンで Koma をソースからビルドします。",
    },
    commands: [
      {
        code: "cargo +1.100.0 install --git https://github.com/komawm/koma.git koma komactl koma-mcp koma-overview --locked",
      },
    ],
  },
];

export const JIKU_INSTALL_CHANNELS: readonly InstallChannel[] = [
  {
    id: "arch",
    tabLabel: { en: "Arch Linux", "zh-CN": "Arch Linux", ja: "Arch Linux" },
    name: {
      en: "Arch Linux / AUR",
      "zh-CN": "Arch Linux / AUR",
      ja: "Arch Linux / AUR",
    },
    arch: "x86_64 · aarch64",
    summary: {
      en: "Install `jiku-bin` (R2-backed prebuilt) or `jiku` (`PKGBUILD.jiku.in`) alongside Koma.",
      "zh-CN":
        "配合 Koma 安装预构建的 `jiku-bin` 或源码包 `jiku`（`PKGBUILD.jiku.in`）。",
      ja: "Koma と連携するビルド済み `jiku-bin` またはソース版 `jiku` を AUR から導入します。",
    },
    commands: [
      {
        label: {
          en: "Prebuilt via AUR",
          "zh-CN": "AUR 预构建包",
          ja: "AUR ビルド済み",
        },
        code: "paru -S jiku-bin",
      },
      {
        label: {
          en: "Build from source PKGBUILD",
          "zh-CN": "源码 PKGBUILD 构建",
          ja: "ソース PKGBUILD",
        },
        code: "paru -S jiku",
      },
    ],
  },
  {
    id: "apt",
    tabLabel: {
      en: "Debian / Ubuntu",
      "zh-CN": "Debian / Ubuntu",
      ja: "Debian / Ubuntu",
    },
    name: {
      en: "Debian / Ubuntu (APT deb822)",
      "zh-CN": "Debian / Ubuntu（APT deb822 源）",
      ja: "Debian / Ubuntu（APT deb822）",
    },
    arch: "amd64 · arm64",
    summary: {
      en: "Shares the `https://cdn.komawm.org/apt` signed APT pool (`komawm.sources`) with Koma.",
      "zh-CN":
        "与 Koma 共用托管于 `https://cdn.komawm.org/apt` 的签名 APT 仓库（`komawm.sources`）。",
      ja: "Koma と同じ `https://cdn.komawm.org/apt` 署名付き APT リポジトリから導入できます。",
    },
    commands: [
      {
        code: "curl -fsSL https://cdn.komawm.org/apt/setup.sh | sudo bash\nsudo apt install -y jiku",
      },
    ],
  },
  {
    id: "rpm",
    tabLabel: {
      en: "Fedora / RHEL",
      "zh-CN": "Fedora / RHEL",
      ja: "Fedora / RHEL",
    },
    name: {
      en: "Fedora / RHEL (RPM / Copr)",
      "zh-CN": "Fedora / RHEL（RPM / Copr）",
      ja: "Fedora / RHEL（RPM / Copr）",
    },
    arch: "x86_64 · aarch64",
    summary: {
      en: "nFPM `.rpm` packages (`nfpm/jiku.yaml`) and Copr builds shipping `jikud` and `jiku`.",
      "zh-CN":
        "由 `nfpm/jiku.yaml` 生成的 `.rpm` 安装包与 Copr 构建，包含 `jikud` 与 `jiku`。",
      ja: "`nfpm/jiku.yaml` ベースの `.rpm` パッケージおよび Copr ビルド（`jikud` / `jiku`）。",
    },
    commands: [
      {
        label: {
          en: "Fedora / Copr",
          "zh-CN": "Fedora / Copr",
          ja: "Fedora / Copr",
        },
        code: "sudo dnf copr enable -y komawm/jiku\nsudo dnf install -y jiku",
      },
      {
        label: {
          en: "Direct RPM from R2 CDN",
          "zh-CN": "从 R2 CDN 直接安装 RPM",
          ja: "R2 CDN から直接 RPM を導入",
        },
        code: 'TAG=$(curl -fsSL https://cdn.komawm.org/install/jiku/latest.txt)\nsudo dnf install -y "https://cdn.komawm.org/releases/jiku/$TAG/jiku-${TAG#v}-1.x86_64.rpm"',
      },
    ],
  },
  {
    id: "alpine",
    tabLabel: {
      en: "Alpine",
      "zh-CN": "Alpine",
      ja: "Alpine",
    },
    name: {
      en: "Alpine Linux (musl APK)",
      "zh-CN": "Alpine Linux（musl APK）",
      ja: "Alpine Linux（musl APK）",
    },
    arch: "x86_64 · aarch64",
    summary: {
      en: "Static musl `.apk` archive distributed via `https://cdn.komawm.org/releases/jiku/`.",
      "zh-CN":
        "通过 `https://cdn.komawm.org/releases/jiku/` 分发的 musl `.apk` 安装包。",
      ja: "`https://cdn.komawm.org/releases/jiku/` で配布される musl `.apk` パッケージです。",
    },
    commands: [
      {
        code: 'TAG=$(curl -fsSL https://cdn.komawm.org/install/jiku/latest.txt)\ncurl -fsSLO "https://cdn.komawm.org/releases/jiku/$TAG/jiku_${TAG#v}_linux_amd64.apk"\nsudo apk add --allow-untrusted "./jiku_${TAG#v}_linux_amd64.apk"',
      },
    ],
  },
  {
    id: "nix",
    tabLabel: {
      en: "NixOS",
      "zh-CN": "NixOS",
      ja: "NixOS",
    },
    name: {
      en: "Nix / NixOS",
      "zh-CN": "Nix / NixOS",
      ja: "Nix / NixOS",
    },
    arch: "x86_64-linux · aarch64-linux",
    summary: {
      en: "Run or install Jiku directly from its Nix flake output.",
      "zh-CN": "通过 Nix Flake 直接运行或安装 Jiku 守护进程。",
      ja: "Nix Flake から直接 Jiku デーモンを実行・インストールします。",
    },
    commands: [
      {
        code: "nix run github:komawm/jiku\nnix profile install github:komawm/jiku",
      },
    ],
  },
  {
    id: "source",
    tabLabel: {
      en: "Cargo",
      "zh-CN": "Cargo 源码",
      ja: "Cargo ソース",
    },
    name: {
      en: "Build from Source (Rust 1.100.0)",
      "zh-CN": "从源码编译（Rust 1.100.0）",
      ja: "ソースからビルド（Rust 1.100.0）",
    },
    arch: "Rust 1.100.0 · 2024",
    summary: {
      en: "Build `jikud` and `jiku` CLI directly from `komawm/jiku` with Cargo.",
      "zh-CN": "从 `komawm/jiku` 直接使用 Cargo 编译安装 `jikud` 与 `jiku`。",
      ja: "`komawm/jiku` から Cargo で `jikud` と `jiku` をコンパイルします。",
    },
    commands: [
      {
        code: "cargo +1.100.0 install --git https://github.com/komawm/jiku.git jikud jiku --locked",
      },
    ],
  },
];

export function getInstallChannels(surface: ProductSurface): readonly InstallChannel[] {
  return surface === "jiku" ? JIKU_INSTALL_CHANNELS : KOMA_INSTALL_CHANNELS;
}
