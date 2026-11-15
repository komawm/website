# インストールと承認境界

> [!WARNING]
> Koma は現在 `v0.0.1` インキュベーション段階にあります。全 9 クレートは `Rust 1.100.0`（Edition 2024）でコンパイル・単体テストおよび QEMU/KVM Arch Linux 仮想マシン上のソフトウェア KMS 検証を通過していますが、実機 GPU での DRM/KMS 出力とセキュリティ承認は `v0.1.0` の目標です。既存のログインセッションを直接置き換えず、まずは `--winit` ネスト実行または VM 上で検証してください。

> [!NOTE]
> Koma は単体で完結する Wayland タイル型コンポジタです。通常のキーボード中心のデスクトップ利用において [Jiku](/ja/jiku/) の導入は必須ではありません。

## システム要件

Linux 上で [komawm/koma](https://github.com/komawm/koma) をビルドするには、固定ツールチェーン `Rust 1.100.0` と標準的な Wayland / DRM 開発ライブラリ（`libseat`、`libinput`、`libudev`、`libgbm`、`libxkbcommon`、`libdisplay-info`、`mesa`）が必要です。X11 クライアント互換は外部の `xwayland-satellite` に委譲されます。

## ソースからのビルド手順

リポジトリを取得し、ロックされた依存関係でリリースバイナリを生成します。

```bash
git clone https://github.com/komawm/koma.git
cd koma
just fmt-check typecheck clippy test
cargo build --release --locked -p koma -p komactl -p koma-mcp -p koma-overview
./target/release/koma --headless-check
```

## ワークスペース構成（全 9 クレート）

| クレート | 種別 | 役割と責務 |
| :--- | :--- | :--- |
| `koma-proto` | ライブラリ | IPC フレーミング、`SCM_RIGHTS` FD 転送、権限トークン、Epoch 識別子 |
| `koma-model` | ライブラリ | Dwindle・Scrolling・Deck・BSP レイアウト、フローティング層、バネ物理 |
| `koma-lua` | ライブラリ | [Phodopus](https://github.com/Xuepoo/phodopus) Lua 5.4 サンドボックス連携と LuaLS 型生成 |
| `koma-render` | ライブラリ | Smithay シーングラフ、Dual-Kawase ブラー、角丸シェーダ、保護サーフェス遮蔽 |
| `koma-seat` | ライブラリ | 仮想シート入力台帳および `TextInjectStrategy` テキスト注入 |
| `koma` | バイナリ | Winit ネスト / TTY KMS バックエンド統合、Wayland プロトコル処理 |
| `komactl` | バイナリ | 設定検証・ライブリロード・`gen-types`・管理 IPC クライアント |
| `koma-mcp` | バイナリ | `koma-agent.sock` 向け stdio MCP ブリッジ |
| `koma-overview` | バイナリ | Layer-Shell ワークスペース俯瞰コンパニオン |
