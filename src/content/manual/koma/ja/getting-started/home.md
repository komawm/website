# ホームとアーキテクチャ概要

> [!NOTE]
> **Koma** は [Smithay](https://github.com/Smithay/smithay) と Rust（`1.100.0`、Edition 2024）で構築された独立型のキーボード駆動 Wayland タイリングコンポジタです。[Jiku](/ja/jiku/) を導入しなくても、日常のウィンドウマネージャとして単体で完結動作します。

![Koma の障子グリッド構造とマルチワークスペース概要](/placeholders/koma-shoji.webp "統一された Smithay シーングラフ上で Dwindle・Scrolling・Deck・BSP レイアウトを合成する Koma。")

## 設計原則

Koma は **Ring 0 コンポジタ機構** と **ユーザー／エージェントポリシー** を明確に分離します。

1. **スタックレス Lua 5.4 サンドボックス（[Phodopus](https://github.com/Xuepoo/phodopus)）**：`~/.config/koma/init.lua` の評価は命令燃料（Instruction Fuel）とメモリ上限（既定 `4 MiB`）を備えた純 Rust 製 Lua 5.4 VM 内のシャドウレジストリで実行され、全ルールの検証に成功した場合のみアトミックに反映されます。
2. **統一シーングラフと 4 種のレイアウト（`koma-model` + `koma-render`）**：ワークスペース単位で `"dwindle"`（有画面の既定）、`"scrolling"`（水平スクロール列）、`"deck"`（100% ビューポート単一表示＋背面 Stash）、`"bsp"` を切り替え可能。Dual-Kawase ブラー、角丸、ドロップシャドウ、フォーカスリング、減衰スプリングアニメーションを備えます。
3. **人間優先プリエンプション（`< 1 ms`）**：物理キーボード・ポインタ入力または `Mod + G` 押下でエージェント操作を即座に中断し、単調増加 `Epoch` カウンタ（`4091 ERR_HUMAN_PREEMPTED`）で後続リクエストを遮断します。
4. **不要な `unsafe` 排除ポリシー**：主要 6 クレート（`koma-model`、`koma-lua`、`koma-seat`、`komactl`、`koma-overview`、`koma-mcp`）に `#![forbid(unsafe_code)]` を強制し、`koma-proto` と `koma` も `#![deny(unsafe_code)]` と安全な `rustix` I/O を採用しています。

## ワークスペース・クレート構成

| クレート | 種別 | 役割 | `unsafe` 方針 |
| :--- | :--- | :--- | :--- |
| `koma-proto` | ライブラリ | 2 系統ソケットフレーミング、`SCM_RIGHTS` `memfd`/SHM 転送、`CapabilityToken`、`Epoch` | `#![deny(unsafe_code)]` |
| `koma-model` | ライブラリ | `dwindle`/`scrolling`/`deck`/`bsp` レイアウト、浮動スタック、スプリング物理、ルール | `#![forbid(unsafe_code)]` |
| `koma-lua` | ライブラリ | [Phodopus](https://github.com/Xuepoo/phodopus) Lua 5.4 連携、ホスト API、`LuaCATS` スタブ生成 | `#![forbid(unsafe_code)]` |
| `koma-render` | ライブラリ | Smithay シーングラフ、Dual-Kawase GLES2 ブラー、角丸、保護サーフェス遮蔽 | `#![deny(unsafe_code)]` |
| `koma-seat` | ライブラリ | 仮想シート押下台帳および 3 段階 `TextInjectStrategy` 入力ディスパッチ | `#![forbid(unsafe_code)]` |
| `koma` | バイナリ | `--tty` DRM/KMS・`--winit` ネスト起動、Wayland プロトコル登録、`calloop` IPC | `#![deny(unsafe_code)]` |
| `komactl` | バイナリ | `validate`、`reload`、`gen-types`、`inventory`、`capture`、`token mint`、`sandbox` | `#![forbid(unsafe_code)]` |
| `koma-mcp` | バイナリ | `koma-agent.sock` と接続する標準 stdio JSON-RPC 2.0 MCP ブリッジ | `#![forbid(unsafe_code)]` |
| `koma-overview` | バイナリ | `wlr-layer-shell` ベースの空間ワークスペース概覧コンパニオン | `#![forbid(unsafe_code)]` |

## ドキュメント構成

| セクション | 主な内容 | ページ |
| :--- | :--- | :--- |
| **インストール** | `cdn.komawm.org` APT、`deb`/`rpm`/`apk`、Arch/AUR、BSD、ソースビルド | [インストールと配布チャネル](/ja/docs/getting-started/installation/) |
| **クイックスタート** | `--session`/`--winit`/`--tty`、既定キーマップ、`Mod + Tab` 概覧、`Mod + G` | [セッション起動と既定キーマップ](/ja/docs/getting-started/quickstart/) |
| **対応プラットフォーム** | Apple Silicon (`M1`–`M4`)・Intel MacBook Linux、`ARM64`、FreeBSD `15.1`、OpenBSD | [ARM64・MacBook Linux・BSD 対応](/ja/docs/getting-started/platforms/) |
| **Lua 設定** | Phodopus サンドボックス、レイアウト、マルチモニター、ルール、`koma-types` | [Lua サンドボックス・レイアウト・外観](/ja/docs/configuration/init-lua/) |
| **プロトコルと CLI** | Layer Shell、セッションロック、スクリーンクライアント、Portal、IME、`komactl` | [Wayland プロトコル・Portal・IME](/ja/docs/protocols-and-tools/wayland-protocols/) |
| **IPC と FAQ** | `koma-admin.sock` / `koma-agent.sock`、Epoch リース、MCP、トラブルシューティング | [二系統ソケット・Epoch リース・MCP](/ja/docs/ipc/sockets-and-epochs/) |

## クイック・セルフチェック

稼働中のデスクトップセッションに影響を与えず、ビルドと構造チェックを実行できます。

```bash
git clone https://github.com/komawm/koma.git
cd koma
cargo +1.100.0 build --release --locked -p koma -p komactl -p koma-mcp -p koma-overview
./target/release/koma --headless-check
./target/release/komactl gen-types > /tmp/koma-types-check.lua
```

## リポジトリと配布元

本マニュアルの正本は [komawm/docs](https://github.com/komawm/docs) で管理され、Cloudflare R2（`https://cdn.komawm.org`）へ配信されます。各ディストリビューション向けパッケージ定義は [komawm/packaging](https://github.com/komawm/packaging)、LuaLS 型定義は [komawm/koma-types](https://github.com/komawm/koma-types)、任意の AI 連携デーモンは [komawm/jiku](https://github.com/komawm/jiku) にあります。
