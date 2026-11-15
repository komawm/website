# ホーム

**Koma** ドキュメントへようこそ。

Koma は Rust（`1.100.0`・Edition 2024）と `Smithay` で構築されたキーボード主体の Wayland タイル型コンポジタです。導入手順は [インストールと承認境界](/ja/docs/getting-started/installation/)、Apple Silicon（`M1`〜`M4`）や Intel MacBook Linux・BSD 対応は [ARM64・MacBook Linux・BSD 対応](/ja/docs/getting-started/platforms/)、設定のカスタマイズは [レイアウト・外観・キー上書き](/ja/docs/configuration/init-lua/) を参照してください。

## ドキュメント構成

| セクション | 内容 | ページ |
| :--- | :--- | :--- |
| **インストール** | `x86_64` / `aarch64` ソースビルド、`v0.1.0` 承認ゲート、`cdn.komawm.org` パッケージ配信 | [インストールと承認境界](/ja/docs/getting-started/installation/) |
| **クイックスタート** | `--winit` ネスト検証、TTY 起動、既定キーマップ、`<1ms` の `Mod+G` 即時奪還 | [セッション起動と既定キーマップ](/ja/docs/getting-started/quickstart/) |
| **対応プラットフォーム** | Apple Silicon（`M1`〜`M4`・`16 KiB` ページ整合）/ Intel MacBook Linux、`ARM64`、`FreeBSD` / `OpenBSD` | [ARM64・MacBook Linux・BSD 対応](/ja/docs/getting-started/platforms/) |
| **Lua 5.4 設定** | `dwindle`・`scrolling`・`deck`、スクラッチパッド、[komawm/koma-types](https://github.com/komawm/koma-types) 型補完 | [レイアウト・外観・キー上書き](/ja/docs/configuration/init-lua/) |
| **IPC と Jiku** | 二系統ソケット、Epoch リース、`koma-mcp`、任意導入デーモン [Jiku](/ja/jiku/) | [二系統ソケット・Epoch リース・MCP](/ja/docs/ipc/sockets-and-epochs/) |

## クイックビルドと自己検証

[komawm/koma](https://github.com/komawm/koma) をクローンし、現在のデスクトップ環境に影響を与えずヘッドレス検証を実行できます：

```bash
git clone https://github.com/komawm/koma.git
cd koma
cargo +1.100.0 build --release --locked -p koma -p komactl -p koma-mcp -p koma-overview
./target/release/koma --headless-check
```

## コントリビュート

ドキュメント原稿は [komawm/docs](https://github.com/komawm/docs) で管理され、Cloudflare R2（`https://cdn.komawm.org`）へ配信されます。パッケージ設定は [komawm/packaging](https://github.com/komawm/packaging)、任意導入の編成デーモンは [komawm/jiku](https://github.com/komawm/jiku) にあります。
