/**
 * Tri-lingual UI dictionary (`en`, `zh-CN`, `ja`) and route localization helpers
 * for both Koma (`komawm.org`) and the Jiku sub-site (`komawm.org/jiku/`).
 */

export type SiteLocale = "en" | "zh-CN" | "ja";
export type ProductSurface = "koma" | "jiku";

export const SUPPORTED_LOCALES: readonly SiteLocale[] = ["en", "zh-CN", "ja"] as const;

export const LOCALE_LABELS: Readonly<Record<SiteLocale, string>> = {
  en: "English",
  "zh-CN": "简体中文",
  ja: "日本語",
};

export const LOCALE_SHORT: Readonly<Record<SiteLocale, string>> = {
  en: "EN",
  "zh-CN": "简",
  ja: "日",
};

export interface HeroFeature {
  readonly title: string;
  readonly desc: string;
}

export interface ShowcaseItem {
  readonly image: string;
  readonly videoWebm?: string;
  readonly videoMp4?: string;
  readonly featured?: boolean;
  readonly title: string;
  readonly caption: string;
}

export interface UiMessages {
  readonly skipToContent: string;
  readonly searchPlaceholder: string;
  readonly searchEmpty: string;
  readonly navDocs: string;
  readonly navJiku: string;
  readonly navKoma: string;
  readonly themeSystem: string;
  readonly themeLight: string;
  readonly themeDark: string;
  readonly toggleThemeAria: string;
  readonly switchLangAria: string;
  readonly githubAria: string;
  readonly onThisPage: string;
  readonly sidebarTitle: string;
  readonly toggleSidebar: string;
  readonly prevPage: string;
  readonly nextPage: string;
  readonly copy: string;
  readonly copied: string;
  readonly copyFailed: string;
  readonly readerReadyBadge: string;
  readonly komaSiteTitle: string;
  readonly komaKanji: string;
  readonly komaTagline: string;
  readonly komaHeroTitle: string;
  readonly komaHeroDesc: string;
  readonly komaReadDocs: string;
  readonly komaInstallCta: string;
  readonly komaCompanionCta: string;
  readonly komaFeaturesHeading: string;
  readonly komaFeatures: readonly [HeroFeature, HeroFeature, HeroFeature];
  readonly komaShowcase: readonly [ShowcaseItem, ShowcaseItem, ShowcaseItem];
  readonly jikuSiteTitle: string;
  readonly jikuKanji: string;
  readonly jikuTagline: string;
  readonly jikuHeroTitle: string;
  readonly jikuHeroDesc: string;
  readonly jikuReadDocs: string;
  readonly jikuInstallCta: string;
  readonly jikuCoreCta: string;
  readonly jikuOptionalNote: string;
  readonly jikuFeaturesHeading: string;
  readonly jikuFeatures: readonly [HeroFeature, HeroFeature, HeroFeature];
  readonly jikuShowcase: readonly [ShowcaseItem, ShowcaseItem];
  readonly installHeading: string;
  readonly installPointerLabel: string;
  readonly installPackagingLabel: string;
  readonly showcaseHeading: string;
  readonly pendingBadge: string;
  readonly footerNote: string;
  readonly notFoundTitle: string;
  readonly notFoundDesc: string;
  readonly notFoundBackKoma: string;
  readonly notFoundBackDocs: string;
  readonly notFoundBackJiku: string;
}

export const UI_MESSAGES: Readonly<Record<SiteLocale, UiMessages>> = {
  en: {
    skipToContent: "Skip to main content",
    searchPlaceholder: "Search",
    searchEmpty: "No matching documentation topics found.",
    navDocs: "Docs",
    navJiku: "Jiku",
    navKoma: "Koma",
    themeSystem: "System",
    themeLight: "Light",
    themeDark: "Dark",
    toggleThemeAria: "Switch color theme (System, Light, Dark)",
    switchLangAria: "Select site language",
    githubAria: "Open GitHub repository",
    onThisPage: "On this page",
    sidebarTitle: "Documentation",
    toggleSidebar: "Menu",
    prevPage: "Previous",
    nextPage: "Next",
    copy: "Copy",
    copied: "Copied",
    copyFailed: "Failed",
    readerReadyBadge: "Reader View Ready",
    komaSiteTitle: "Koma — Wayland Tiling Compositor",
    komaKanji: "KOMA · v0.0.1",
    komaTagline: "Wayland · Lua 5.4 · Native IPC",
    komaHeroTitle: "Wayland Tiling Compositor",
    komaHeroDesc:
      "A keyboard-first Wayland compositor with dwindle, master-stack, scrolling, and monocle layouts. Configured in Lua 5.4 and scriptable over a UNIX socket.",
    komaReadDocs: "Koma Manual",
    komaInstallCta: "Install Koma",
    komaCompanionCta: "Jiku Companion",
    komaFeaturesHeading: "Key Features",
    komaFeatures: [
      {
        title: "Layouts for Every Screen",
        desc: "Switch between Shoji master-stack, dwindle, scrolling column strips, and monocle per workspace across single or multi-monitor setups.",
      },
      {
        title: "Smooth Motion & Clean Rendering",
        desc: "Spring and cubic-Bezier window transitions, blur, active borders, layer-shell bars like Waybar or Ironbar, and Waydroid/Xwayland support.",
      },
      {
        title: "Lua Config & Socket Control",
        desc: "Configure keybindings, monitor placement, and window rules in ~/.config/koma/init.lua with full editor completion via koma-types.",
      },
    ],
    komaShowcase: [
      {
        image: "/media/koma-dwindle.webp",
        videoWebm: "/media/koma-tiling.webm",
        videoMp4: "/media/koma-tiling.mp4",
        featured: true,
        title: "Live Session: Dwindle, Scrolling & Overview",
        caption:
          "Opening terminals in dwindle tiling, switching to a horizontal scrolling strip on workspace 5, and opening koma-overview.",
      },
      {
        image: "/media/koma-scrolling.webp",
        title: "Scrolling Column Strip",
        caption:
          "Wide columns arranged along a horizontal strip with live keyboard navigation.",
      },
      {
        image: "/media/koma-overview.webp",
        title: "Workspace Overview",
        caption: "Thumbnail grid across active workspaces triggered with Super + Tab.",
      },
    ],
    jikuSiteTitle: "Jiku — Optional Desktop Companion for Koma",
    jikuKanji: "JIKU · OPTIONAL COMPANION",
    jikuTagline: "Desktop Automation · CLI & MCP",
    jikuHeroTitle: "Optional Desktop Companion for Koma",
    jikuHeroDesc:
      "Runs alongside Koma when you want model-driven UI tasks, screen inspection, searchable task history, or MCP tool integration. Completely optional.",
    jikuReadDocs: "Jiku Manual",
    jikuInstallCta: "Install Jiku",
    jikuCoreCta: "Back to Koma",
    jikuOptionalNote:
      "Koma works completely on its own without Jiku. Install Jiku only if you want desktop automation.",
    jikuFeaturesHeading: "What Jiku Handles",
    jikuFeatures: [
      {
        title: "Dedicated Agent Workspace Leases",
        desc: "Requests an explicit workspace lease with a visible purple border; pressing Super + G hands control straight back to you.",
      },
      {
        title: "Local Task History & Triage",
        desc: "Indexes completed tasks in a local SQLite database (`jiku memory search`) and sorts files inside ~/JikuBox.",
      },
      {
        title: "CLI & Standard MCP Server",
        desc: "Use `jiku run`, `jiku status`, and `jiku mcp` directly from a terminal or connect external coding agents.",
      },
    ],
    jikuShowcase: [
      {
        image: "/media/jiku-paint.webp",
        videoWebm: "/media/jiku-paint.webm",
        videoMp4: "/media/jiku-paint.mp4",
        featured: true,
        title: "Live Session: Autonomous Canvas Painting",
        caption:
          "Recorded in QEMU: Jiku holds a leased workspace (purple border) and paints a multi-step scene using virtual pointer drags.",
      },
      {
        image: "/media/jiku-terminal.webp",
        title: "Daemon Status & Task Memory",
        caption:
          "Live output from `jiku status`, `jiku validate-config`, and `jiku memory search` on a tiled workspace.",
      },
    ],
    installHeading: "Installation",
    installPointerLabel: "GitHub Releases",
    installPackagingLabel: "Packages",
    showcaseHeading: "Captures from Live Sessions",
    pendingBadge: "Planned for v0.1.0",
    footerNote: "GPL-3.0-or-later",
    notFoundTitle: "Page not found",
    notFoundDesc:
      "This route does not exist. Jump back to the Koma or Jiku manuals or return home.",
    notFoundBackKoma: "Koma Home",
    notFoundBackDocs: "Koma Manual",
    notFoundBackJiku: "Jiku Manual",
  },
  "zh-CN": {
    skipToContent: "跳转到正文内容",
    searchPlaceholder: "搜索",
    searchEmpty: "未找到匹配的文档章节。",
    navDocs: "文档",
    navJiku: "Jiku",
    navKoma: "Koma",
    themeSystem: "跟随系统",
    themeLight: "浅色",
    themeDark: "深色",
    toggleThemeAria: "切换明暗主题（跟随系统 / 浅色 / 深色）",
    switchLangAria: "切换站点语言",
    githubAria: "访问 GitHub 仓库",
    onThisPage: "本页目录",
    sidebarTitle: "文档目录",
    toggleSidebar: "目录",
    prevPage: "上一篇",
    nextPage: "下一篇",
    copy: "复制",
    copied: "已复制",
    copyFailed: "失败",
    readerReadyBadge: "支持阅读器模式",
    komaSiteTitle: "Koma — Wayland 平铺合成器",
    komaKanji: "KOMA · v0.0.1",
    komaTagline: "Wayland · Lua 5.4 · 原生 IPC",
    komaHeroTitle: "Wayland 平铺合成器",
    komaHeroDesc:
      "键盘优先的 Wayland 平铺合成器，内置障子格（Shoji）、Dwindle、横向滚动与全屏独占布局。使用 Lua 5.4 配置，可通过 UNIX 套接字驱动。",
    komaReadDocs: "阅读 Koma 手册",
    komaInstallCta: "安装 Koma",
    komaCompanionCta: "了解 Jiku 伴侣",
    komaFeaturesHeading: "功能特性",
    komaFeatures: [
      {
        title: "按工作区切换布局",
        desc: "支持为不同工作区分别选用 Shoji 主从网格、Dwindle、横向滚动条带或全屏独占模式，并隔离管理多台显示器。",
      },
      {
        title: "平滑动画与桌面兼容",
        desc: "提供平滑过渡动效、模糊与焦点边框，兼容 Waybar、Ironbar、Quickshell 等面板以及 Waydroid 与 Xwayland 应用。",
      },
      {
        title: "Lua 配置与套接字控制",
        desc: "在 ~/.config/koma/init.lua 中定义快捷键、屏幕排布与窗口规则，配合 koma-types 在编辑器内获得完整补全。",
      },
    ],
    komaShowcase: [
      {
        image: "/media/koma-dwindle.webp",
        videoWebm: "/media/koma-tiling.webm",
        videoMp4: "/media/koma-tiling.mp4",
        featured: true,
        title: "实机录屏：平铺、横向滚动与工作区概览",
        caption:
          "在 Dwindle 布局中打开多个终端、切换至工作区 5 的横向滚动带，并按 Super + Tab 调出概览视图。",
      },
      {
        image: "/media/koma-scrolling.webp",
        title: "横向滚动工作区",
        caption: "宽列窗口沿水平条带排布，可通过快捷键在列间快速切换和调整宽度。",
      },
      {
        image: "/media/koma-overview.webp",
        title: "全局工作区概览",
        caption: "按 Super + Tab 显示所有活跃工作区的实时缩略图网格。",
      },
    ],
    jikuSiteTitle: "Jiku — Koma 可选桌面自动化伴侣",
    jikuKanji: "JIKU · 可选伴侣组件",
    jikuTagline: "桌面自动化 · 命令行与 MCP",
    jikuHeroTitle: "Koma 可选桌面自动化伴侣",
    jikuHeroDesc:
      "在需要由模型驱动桌面任务、屏幕识别、检索过往任务记录或对外暴露 MCP 工具时搭配 Koma 使用。平时可完全不装。",
    jikuReadDocs: "阅读 Jiku 手册",
    jikuInstallCta: "安装 Jiku",
    jikuCoreCta: "返回 Koma",
    jikuOptionalNote:
      "Koma 本身无需 Jiku 即可完整日常使用；仅在需要桌面自动化编排时安装 Jiku。",
    jikuFeaturesHeading: "主要能力",
    jikuFeatures: [
      {
        title: "明确的工作区控制租约",
        desc: "接管操作期间窗口会显示紫色边框提示；随时按下 Super + G 即可立即收回控制权。",
      },
      {
        title: "本地任务记录与文件整理",
        desc: "在本地记录任务摘要并支持 `jiku memory search` 全文检索，同时提供 `~/JikuBox` 目录整理命令。",
      },
      {
        title: "命令行与标准 MCP 服务",
        desc: "直接在终端执行 `jiku run`、`jiku status`，或通过 `jiku mcp` 接入外部编码代理。",
      },
    ],
    jikuShowcase: [
      {
        image: "/media/jiku-paint.webp",
        videoWebm: "/media/jiku-paint.webm",
        videoMp4: "/media/jiku-paint.mp4",
        featured: true,
        title: "实机录屏：驱动画板完成风景绘制",
        caption:
          "QEMU 虚拟机实测录屏：Jiku 持有紫色控制租约边框，分两轮拖拽鼠标完成风景画作。",
      },
      {
        image: "/media/jiku-terminal.webp",
        title: "运行状态与任务检索",
        caption:
          "平铺工作区下运行 `jiku status`、`jiku validate-config` 与 `jiku memory search` 的实机截图。",
      },
    ],
    installHeading: "安装与下载",
    installPointerLabel: "GitHub Releases",
    installPackagingLabel: "软件包",
    showcaseHeading: "实机录屏与截图",
    pendingBadge: "计划于 v0.1.0 提供",
    footerNote: "GPL-3.0-or-later",
    notFoundTitle: "页面未找到",
    notFoundDesc:
      "此路径暂无对应页面。您可以返回 Koma 或 Jiku 首页，或直接进入手册目录。",
    notFoundBackKoma: "Koma 首页",
    notFoundBackDocs: "Koma 手册",
    notFoundBackJiku: "Jiku 手册",
  },
  ja: {
    skipToContent: "本文へスキップ",
    searchPlaceholder: "検索",
    searchEmpty: "一致するドキュメントが見つませんでした。",
    navDocs: "ドキュメント",
    navJiku: "Jiku",
    navKoma: "Koma",
    themeSystem: "システム連動",
    themeLight: "ライト",
    themeDark: "ダーク",
    toggleThemeAria: "テーマ切り替え（システム・ライト・ダーク）",
    switchLangAria: "表示言語を選択",
    githubAria: "GitHub リポジトリを開く",
    onThisPage: "このページの目次",
    sidebarTitle: "ドキュメント目次",
    toggleSidebar: "目次",
    prevPage: "前へ",
    nextPage: "次へ",
    copy: "コピー",
    copied: "完了",
    copyFailed: "失敗",
    readerReadyBadge: "リーダー表示対応",
    komaSiteTitle: "Koma — Wayland タイル型コンポジタ",
    komaKanji: "KOMA · v0.0.1",
    komaTagline: "Wayland · Lua 5.4 · ネイティブ IPC",
    komaHeroTitle: "Wayland タイル型コンポジタ",
    komaHeroDesc:
      "キーボード中心の Wayland タイル型コンポジタです。Shoji・Dwindle・横スクロール・単一表示をワークスペース単位で切り替えられ、Lua 5.4 で設定できます。",
    komaReadDocs: "Koma マニュアル",
    komaInstallCta: "Koma を導入",
    komaCompanionCta: "Jiku コンパニオン",
    komaFeaturesHeading: "主な特徴",
    komaFeatures: [
      {
        title: "ワークスペースごとの柔軟な配置",
        desc: "Shoji マスター/スタック、Dwindle、横スクロール列、Monocle を用途別に割り当て、マルチモニターを独立管理します。",
      },
      {
        title: "滑らかな描画と周辺ツール互換",
        desc: "スプリング / ベジェ補間、背景ブラー、フォーカス枠に加え、Waybar・Ironbar・Quickshell や Waydroid にも対応しています。",
      },
      {
        title: "Lua 設定と UNIX ソケット制御",
        desc: "~/.config/koma/init.lua でキーバインドやウィンドウ規則を記述し、koma-types によるエディタ補完を利用できます。",
      },
    ],
    komaShowcase: [
      {
        image: "/media/koma-dwindle.webp",
        videoWebm: "/media/koma-tiling.webm",
        videoMp4: "/media/koma-tiling.mp4",
        featured: true,
        title: "実機録画: タイル配置・横スクロール・概観",
        caption:
          "Dwindle での端末配置、ワークスペース 5 の横スクロール表示、Super + Tab によるワークスペース概観の流れです。",
      },
      {
        image: "/media/koma-scrolling.webp",
        title: "横スクロールストリップ",
        caption: "ワイド画面向けに対象ウィンドウを中央へ寄せて水平移動できます。",
      },
      {
        image: "/media/koma-overview.webp",
        title: "ワークスペース概観",
        caption: "Super + Tab で稼働中の全ワークスペースをサムネイル一覧で表示します。",
      },
    ],
    jikuSiteTitle: "Jiku — Koma 向けデスクトップ自動化コンパニオン",
    jikuKanji: "JIKU · 任意導入コンパニオン",
    jikuTagline: "デスクトップ自動化 · CLI & MCP",
    jikuHeroTitle: "Koma 向けデスクトップ自動化コンパニオン",
    jikuHeroDesc:
      "画面操作の自動化、実行履歴の検索、MCP ツール連携が必要なときに Koma と組み合わせて使う独立デーモンです。",
    jikuReadDocs: "Jiku マニュアル",
    jikuInstallCta: "Jiku を導入",
    jikuCoreCta: "Koma へ戻る",
    jikuOptionalNote:
      "Koma 単体でもすべてのウィンドウ管理機能を利用できます。Jiku は自動化が必要な場合のみ導入してください。",
    jikuFeaturesHeading: "主な役割",
    jikuFeatures: [
      {
        title: "明示的なワークスペースリース",
        desc: "自動操作中は紫色の枠で状態を示し、Super + G を押すだけで即座に手動操作へ戻せます。",
      },
      {
        title: "ローカル履歴検索とファイル仕分け",
        desc: "過去の実行履歴を `jiku memory search` で全文検索でき、`~/JikuBox` 内のファイルを自動分類します。",
      },
      {
        title: "CLI と MCP サーバー",
        desc: "`jiku run` や `jiku status` を端末から使うほか、`jiku mcp` で外部ツールとも連携できます。",
      },
    ],
    jikuShowcase: [
      {
        image: "/media/jiku-paint.webp",
        videoWebm: "/media/jiku-paint.webm",
        videoMp4: "/media/jiku-paint.mp4",
        featured: true,
        title: "実機録画: キャンバス描画タスク",
        caption:
          "QEMU 環境での実測映像: 紫色リース枠を保持したまま仮想ポインタ操作で風景画を仕上げています。",
      },
      {
        image: "/media/jiku-terminal.webp",
        title: "デーモン状態と履歴検索",
        caption:
          "タイル配置の端末で `jiku status`・`jiku validate-config`・`jiku memory search` を実行した画面です。",
      },
    ],
    installHeading: "インストール",
    installPointerLabel: "GitHub Releases",
    installPackagingLabel: "パッケージ",
    showcaseHeading: "実機キャプチャ",
    pendingBadge: "v0.1.0 予定",
    footerNote: "GPL-3.0-or-later",
    notFoundTitle: "ページが見つかりません",
    notFoundDesc:
      "指定されたアドレスは存在しません。Koma・Jiku のトップページまたはマニュアルをご利用ください。",
    notFoundBackKoma: "Koma トップ",
    notFoundBackDocs: "Koma マニュアル",
    notFoundBackJiku: "Jiku マニュアル",
  },
};

export function getUiMessages(locale: SiteLocale = "en"): UiMessages {
  return UI_MESSAGES[locale] ?? UI_MESSAGES.en;
}

export function localizePath(pathname: string, targetLocale: SiteLocale): string {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const stripped = normalized.replace(/^\/(?:zh-CN|ja)(?=\/|$)/u, "") || "/";
  if (targetLocale === "en") return stripped;
  return stripped === "/" ? `/${targetLocale}/` : `/${targetLocale}${stripped}`;
}
