# Koma 概要

> [!NOTE]
> Koma は単体で動作するキーボード駆動の Wayland タイリングコンポジタです。AI ツールや連携デーモンを導入しなくても日常のウィンドウマネージャとして利用でき、[Jiku](/ja/jiku/) は完全に任意です。

![既定の Dwindle タイリングレイアウトで動作する Koma](/media/koma-dwindle.webp)

## 主な特徴

1. **検証済み Lua 5.4 設定**：`~/.config/koma/init.lua` の再読み込み時は、メモリ上限（既定 `4 MiB`）付きの隔離された Lua 5.4 サンドボックスで事前に評価され、ルールや構文の検証に成功した場合のみ実行中のコンポジタへアトミックに反映されます。
2. **ワークスペースごとのレイアウトとエフェクト**：ワークスペース単位で `"dwindle"`（有画面の既定）、`"scrolling"`（水平スクロール列）、`"deck"`（全画面ビューポート＋背面 Stash）、`"bsp"` を選択でき、Dual-Kawase ブラー・角丸・ドロップシャドウ・フォーカスリング・スプリングアニメーションを利用できます。
3. **人間優先の即時プリエンプション（`< 1 ms`）**：物理キーボード／ポインタの入力、または `Mod + G` の押下によって稼働中の操作リースを即座に無効化し、単調増加する `Epoch` カウンタで古い IPC 書き込みを拒否します（`4091 ERR_HUMAN_PREEMPTED`）。
4. **コンテナ隔離と二系統ソケット**：管理者用ソケット（`koma-admin.sock`）と機能トークン制の制限ソケット（`koma-agent.sock`）を分離し、`komactl sandbox`（`bwrap` / ルートレス `podman`）および `wp_security_context_manager_v1` によるクライアント隔離を備えています。

## ドキュメント構成

| セクション | 主な内容 | ページ |
| :--- | :--- | :--- |
| **インストール** | リポジトリ導入、`.deb`/`.rpm`/`.apk`、Arch/AUR、BSD、ソースビルド | [インストール](/ja/docs/getting-started/installation/) |
| **クイックスタート** | `--session`/`--winit`/`--tty`、既定キーマップ、`Mod + Tab` 概観、`Mod + G` | [起動と基本操作](/ja/docs/getting-started/quickstart/) |
| **対応プラットフォーム** | Apple Silicon (`M1`–`M4`)・Intel MacBook Linux、`ARM64`、FreeBSD `15.1-RELEASE`、OpenBSD | [ハードウェアと対応環境](/ja/docs/getting-started/platforms/) |
| **Lua 設定** | Lua 5.4 設定、レイアウト、モニター、入力、ルール、`koma-types` | [レイアウト・ウィンドウ・init.lua](/ja/docs/configuration/init-lua/) |
| **プロトコルと CLI** | Layer Shell、セッションロック、スクリーンコピー、Portal、IME、`komactl`、`koma-overview` | [パネル・Portal・IME・アプリ互換](/ja/docs/protocols-and-tools/wayland-protocols/) |
| **IPC とトラブルシューティング** | `koma-admin.sock` / `koma-agent.sock`、`Epoch` リース、MCP、診断情報 | [IPC とワークスペースリース](/ja/docs/ipc/sockets-and-epochs/) |

## クイック・セルフチェック

稼働中のデスクトップセッションに影響を与えずにビルドと自己診断を実行できます。

```bash
git clone https://github.com/komawm/koma.git
cd koma
cargo build --release --locked -p koma -p komactl -p koma-mcp -p koma-overview
./target/release/koma --headless-check
./target/release/komactl gen-types > /tmp/koma-types-check.lua
```

## リポジトリ構成

本マニュアルと仕様は [komawm/docs](https://github.com/komawm/docs) で管理されています。ディストリビューション向けパッケージ定義は [komawm/packaging](https://github.com/komawm/packaging)、LuaLS 型定義は [komawm/koma-types](https://github.com/komawm/koma-types)、任意の連携エージェントは [komawm/jiku](https://github.com/komawm/jiku) にあります。
