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
    komaSiteTitle: "Koma — Precision Wayland Tiling Compositor",
    komaKanji: "KOMA · v0.0.x",
    komaTagline: "Rust 1.100 · Smithay · Phodopus Lua 5.4",
    komaHeroTitle: "Precision Wayland Tiling Compositor",
    komaHeroDesc:
      "Built for pure keyboard workflows and concurrent GUI orchestration. Separates deterministic window state, Dual-Kawase rendering, virtual-seat dispatch, and a sandboxed Lua 5.4 policy layer.",
    komaReadDocs: "Koma Manual",
    komaInstallCta: "Install Koma",
    komaCompanionCta: "Explore Jiku Companion",
    komaFeaturesHeading: "Architecture Highlights",
    komaFeatures: [
      {
        title: "Deterministic Shoji & Dwindle Layouts",
        desc: "Pure window-tree state transitions across Shoji, Dwindle, Scrolling, and Monocle modes with multi-monitor DRM/KMS isolation and zero implicit side effects.",
      },
      {
        title: "Dual-Kawase & Virtual Seat",
        desc: "Multi-pass rounded-clipping GPU shaders paired with virtual-seat input isolation so concurrent desktop automation never steals your physical cursor or focus.",
      },
      {
        title: "Phodopus Lua 5.4 & Dual IPC",
        desc: "Sandboxed configuration backed by versioned LuaLS definitions (koma-types), dual control/data UNIX sockets, Epoch lease fencing, and native MCP integration.",
      },
    ],
    komaShowcase: [
      {
        image: "/placeholders/koma-shoji.webp",
        title: "Shoji Master-Stack",
        caption: "Balanced asymmetric grid with keyboard-first focus rings.",
      },
      {
        image: "/placeholders/koma-dwindle.webp",
        title: "Recursive Dwindle",
        caption: "Deterministic binary space partitioning with crisp gaps.",
      },
      {
        image: "/placeholders/koma-scrolling.webp",
        title: "Scrolling Strip",
        caption: "Viewport-centered horizontal columns for wide-screen editing.",
      },
    ],
    jikuSiteTitle: "Jiku — Standalone Desktop Orchestration Companion",
    jikuKanji: "JIKU · OPTIONAL COMPANION",
    jikuTagline: "Three-Driver · Sealed memfd · SQLite FTS5",
    jikuHeroTitle: "Standalone Desktop Orchestration Companion",
    jikuHeroDesc:
      "Pairs with Koma over sealed memfd IPC and Epoch fencing, uniting zero-output-token visual routing, planner execution, three-tier episodic memory, and MCP tools.",
    jikuReadDocs: "Jiku Manual",
    jikuInstallCta: "Install Jiku",
    jikuCoreCta: "Back to Koma",
    jikuOptionalNote:
      "Koma runs 100% standalone without Jiku. Install Jiku only when you want desktop agent orchestration.",
    jikuFeaturesHeading: "Orchestration Highlights",
    jikuFeatures: [
      {
        title: "Three-Driver Split Pipeline",
        desc: "Decouples Planner, Executor, and Vision-Router drivers so complex desktop workflows run cleanly across isolated background workspaces.",
      },
      {
        title: "Sealed memfd & Epoch Fencing",
        desc: "Consumes zero-copy compositor frames and validates every action against Koma's monotonic Epoch lease, preventing stale-frame misclicks.",
      },
      {
        title: "L0–L2 SQLite FTS5 & MCP",
        desc: "Local three-tier working, episodic, and semantic memory with FTS5 retrieval, skill approval gates, and standard MCP tool exposure.",
      },
    ],
    jikuShowcase: [
      {
        image: "/placeholders/jiku-grid.webp",
        title: "Multi-Workspace Matrix",
        caption: "Concurrent visual inspection across virtual Koma outputs.",
      },
      {
        image: "/placeholders/jiku-kumiko.webp",
        title: "Kumiko Orchestration Loop",
        caption: "Structured planner checkpoints, memory recall, and MCP dispatch.",
      },
    ],
    installHeading: "Installation & Channels",
    installPointerLabel: "R2 CDN Pointer",
    installPackagingLabel: "komawm/packaging",
    showcaseHeading: "Workspace Architecture & Visuals",
    pendingBadge: "Pending v0.1.0",
    footerNote: "Pure Rust · GPL-3.0-or-later · Served via Cloudflare Workers & R2",
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
    komaSiteTitle: "Koma — 静谧克制的 Wayland 平铺合成器",
    komaKanji: "KOMA · v0.0.x",
    komaTagline: "Rust 1.100 · Smithay · Phodopus Lua 5.4",
    komaHeroTitle: "静谧克制的 Wayland 平铺合成器",
    komaHeroDesc:
      "专为纯键盘桌面流与并发 GUI 编排打造。将确定性窗口状态、Dual-Kawase 渲染管线、虚拟座席分发与沙箱化 Lua 5.4 策略层彻底解耦。",
    komaReadDocs: "阅读 Koma 手册",
    komaInstallCta: "安装 Koma",
    komaCompanionCta: "了解 Jiku 伴侣",
    komaFeaturesHeading: "核心架构特性",
    komaFeatures: [
      {
        title: "确定性 Shoji 与 Dwindle 布局",
        desc: "在障子格（Shoji）、Dwindle、横向滚动与单片（Monocle）模式间实现纯状态树切换，兼顾多显示器 DRM/KMS 隔离。",
      },
      {
        title: "Dual-Kawase 着色与虚拟座席",
        desc: "多通道圆角裁剪 GPU 渲染管线配合独立虚拟座席输入，确保并发桌面自动化不会抢占物理键鼠焦点。",
      },
      {
        title: "Phodopus Lua 5.4 与双通道 IPC",
        desc: "沙箱化 Lua 配置配对版本化 LuaLS 类型（koma-types）、控制/数据双 UNIX 套接字、Epoch 租约栅栏与原生 MCP。",
      },
    ],
    komaShowcase: [
      {
        image: "/placeholders/koma-shoji.webp",
        title: "Shoji 障子布局",
        caption: "克制平衡的主从网格，全键盘焦点高亮。",
      },
      {
        image: "/placeholders/koma-dwindle.webp",
        title: "递归 Dwindle 切分",
        caption: "确定性二叉空间分割与精准留白间距。",
      },
      {
        image: "/placeholders/koma-scrolling.webp",
        title: "Scrolling 横向滚动带",
        caption: "面向宽屏工作流的视口居中列式排布。",
      },
    ],
    jikuSiteTitle: "Jiku — 面向 Koma 的独立桌面编排守护进程",
    jikuKanji: "JIKU · 可选独立伴侣",
    jikuTagline: "Three-Driver · 密封 memfd · SQLite FTS5",
    jikuHeroTitle: "面向 Koma 的独立桌面编排守护进程",
    jikuHeroDesc:
      "通过密封 memfd 零拷贝帧传输与 Epoch 租约栅栏连接 Koma，整合零输出 Token 视觉决策路由、三层本地记忆与标准 MCP 协议。",
    jikuReadDocs: "阅读 Jiku 手册",
    jikuInstallCta: "安装 Jiku",
    jikuCoreCta: "返回 Koma",
    jikuOptionalNote:
      "Koma 无需安装 Jiku 即可完整独立运行；仅在需要桌面自动化编排时按需启用 Jiku。",
    jikuFeaturesHeading: "编排系统特性",
    jikuFeatures: [
      {
        title: "Three-Driver 三驱动流水线",
        desc: "解耦 Planner 规划器、Executor 执行器与 Vision-Router 视觉路由，在隔离虚拟工作区中并发执行任务。",
      },
      {
        title: "密封 memfd 与 Epoch 租约栅栏",
        desc: "直接消费合成器零拷贝帧并校验单调递增的 Epoch 租约，彻底杜绝过期界面误触。",
      },
      {
        title: "L0–L2 SQLite FTS5 与 MCP",
        desc: "本地三层工作、情景与语义记忆库，结合 FTS5 全文检索、技能审批门禁与标准 MCP 工具输出。",
      },
    ],
    jikuShowcase: [
      {
        image: "/placeholders/jiku-grid.webp",
        title: "多工作区并发视图",
        caption: "跨虚拟 Koma 输出的无干扰并发视觉巡检。",
      },
      {
        image: "/placeholders/jiku-kumiko.webp",
        title: "Kumiko 编排闭环",
        caption: "结构化检查点、记忆检索与 MCP 工具调度。",
      },
    ],
    installHeading: "安装方式与发行渠道",
    installPointerLabel: "R2 CDN 版本指针",
    installPackagingLabel: "komawm/packaging",
    showcaseHeading: "工作区形态与界面预览",
    pendingBadge: "待 v0.1.0 开放",
    footerNote: "纯 Rust 构建 · GPL-3.0-or-later · 由 Cloudflare Workers 与 R2 驱动",
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
    komaSiteTitle: "Koma — 静謐かつ俊敏な Wayland タイル型コンポジタ",
    komaKanji: "KOMA · v0.0.x",
    komaTagline: "Rust 1.100 · Smithay · Phodopus Lua 5.4",
    komaHeroTitle: "静謐かつ俊敏な Wayland タイル型コンポジタ",
    komaHeroDesc:
      "純粋なキーボード操作と並行 GUI オーケストレーションのために設計。ウィンドウ状態、Dual-Kawase 描画、仮想シート入力、サンドボックス Lua 5.4 ポリシー層を美しく分離します。",
    komaReadDocs: "Koma マニュアル",
    komaInstallCta: "Koma を導入",
    komaCompanionCta: "Jiku コンパニオンを見る",
    komaFeaturesHeading: "アーキテクチャの特長",
    komaFeatures: [
      {
        title: "決定論的 Shoji・Dwindle レイアウト",
        desc: "障子（Shoji）・Dwindle・横スクロール・Monocle を純粋な状態木で切り替え、マルチモニタの DRM/KMS 出力をクリーンに分離します。",
      },
      {
        title: "Dual-Kawase 描画と仮想シート",
        desc: "マルチパス角丸シェーダと仮想シート入力分離により、裏側の GUI 自動操作が物理カーソルやフォーカスを奪いません。",
      },
      {
        title: "Phodopus Lua 5.4 と二系統 IPC",
        desc: "型補完 (koma-types) 付き Lua 設定、制御/データの二系統 UNIX ソケット、Epoch フェンシング、ネイティブ MCP を備えます。",
      },
    ],
    komaShowcase: [
      {
        image: "/placeholders/koma-shoji.webp",
        title: "Shoji 障子グリッド",
        caption: "視認性とキーボード移動を両立した非対称マスター/スタック。",
      },
      {
        image: "/placeholders/koma-dwindle.webp",
        title: "再帰 Dwindle 分割",
        caption: "均整なギャップを備えた決定論的バイナリ空間分割。",
      },
      {
        image: "/placeholders/koma-scrolling.webp",
        title: "Scrolling ストリップ",
        caption: "ワイド画面での並列作業に適した水平カラム表示。",
      },
    ],
    jikuSiteTitle: "Jiku — Koma と連携するデスクトップ編成デーモン",
    jikuKanji: "JIKU · 任意導入コンパニオン",
    jikuTagline: "Three-Driver · 封印 memfd · SQLite FTS5",
    jikuHeroTitle: "Koma と連携するデスクトップ編成デーモン",
    jikuHeroDesc:
      "封印 memfd ゼロコピー転送と Epoch フェンシングで Koma と接続し、ゼロ出力トークン視覚ルーティング・3層エピソード記憶・MCP サーバを統合します。",
    jikuReadDocs: "Jiku マニュアル",
    jikuInstallCta: "Jiku を導入",
    jikuCoreCta: "Koma へ戻る",
    jikuOptionalNote:
      "Koma 単体で完全に動作します。Jiku はデスクトップ自動編成が必要な場合のみ導入できる独立サブシステムです。",
    jikuFeaturesHeading: "オーケストレーションの特長",
    jikuFeatures: [
      {
        title: "Three-Driver 分離パイプライン",
        desc: "Planner・Executor・Vision-Router の3系統を分離し、隔離された仮想ワークスペースで複数の作業を安全に並行実行します。",
      },
      {
        title: "封印 memfd と Epoch フェンシング",
        desc: "ゼロコピー映像フレームを取得し、単調増加する Epoch リースで状態の一致を検証することで古い画面への誤操作を防ぎます。",
      },
      {
        title: "L0–L2 SQLite FTS5 と MCP",
        desc: "作業・エピソード・意味記憶の3層ローカルメモリと FTS5 検索、スキル承認ゲート、標準 MCP 連携を提供します。",
      },
    ],
    jikuShowcase: [
      {
        image: "/placeholders/jiku-grid.webp",
        title: "マルチワークスペース監視",
        caption: "仮想 Koma 出力をまたいだ非干渉な視覚ルーティング。",
      },
      {
        image: "/placeholders/jiku-kumiko.webp",
        title: "Kumiko 実行ループ",
        caption: "チェックポイント管理・記憶検索・MCP ディスパッチの統合。",
      },
    ],
    installHeading: "インストールと配信チャネル",
    installPointerLabel: "R2 CDN ポインタ",
    installPackagingLabel: "komawm/packaging",
    showcaseHeading: "ワークスペース構成とプレビュー",
    pendingBadge: "v0.1.0 公開予定",
    footerNote: "Pure Rust · GPL-3.0-or-later · Cloudflare Workers & R2 配信",
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
