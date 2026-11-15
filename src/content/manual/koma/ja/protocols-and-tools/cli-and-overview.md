# komactl とワークスペース概観

`komactl` は Koma の管理 CLI（`koma-admin.sock`）兼オフライン Lua バリデータであり、`koma-overview` は全ワークスペースを俯瞰する `wlr-layer-shell` 空間概観ツールです。

## `komactl` コマンドリファレンス

`komactl` は `$XDG_RUNTIME_DIR/koma/<signature>/koma-admin.sock` を自動検出します（`KOMA_INSTANCE_SIGNATURE` で明示指定も可能）。

| コマンド | 動作モード | 説明 |
| :--- | :--- | :--- |
| `komactl validate [path/to/init.lua]` | オフライン | 隔離された Lua サンドボックスで `init.lua` を評価し、ルール正規表現・ジェスチャ検証とリソース数を出力 |
| `komactl reload [path/to/init.lua]` | IPC（`admin.sock`） | `config.reload` を送信し、実行中コンポジタの設定をアトミックに切り替え |
| `komactl config-status` | IPC（`admin.sock`） | 有効な設定パス、リロード世代、直近のエラーを表示（`config.status`） |
| `komactl gen-types` | オフライン | `koma-types`（`types/koma.lua`）用の決定論的な `LuaCATS` スタブを出力 |
| `komactl inventory` | IPC（`admin.sock`） | 稼働中のモニター、ワークスペース、`Epoch` カウンタ、Deck ウィンドウ、Stash スロットを出力（`scene.inventory`） |
| `komactl token mint [label]` | IPC（`admin.sock`） | スコープ付き `CapabilityToken` を発行（`ttl_secs = 28800`、`can_create_headless = true`、`max_owned_workspaces = 4`） |
| `komactl capture [ws_id] [out.rgba]` | IPC（`admin.sock`） | `SCM_RIGHTS` シール済み `memfd` から `grid_225` オーバーレイ付きフレームをゼロコピー取得（既定 `ws_01`） |
| `komactl sandbox <subcmd>` | コンテナ + IPC | `bwrap` またはルートレス `podman` で隔離された `Headless` ワークスペースに GUI コンテナを起動 |
| `komactl -V` / `--version` | オフライン | `komactl <version>` を表示 |

## `komactl sandbox` によるコンテナ隔離

`komactl sandbox` はホスト側の `$XDG_RUNTIME_DIR`・`koma-admin.sock`・D-Bus・PipeWire・SSH Agent を一切マウントせず、専用の `0700` `tmpfs` ランタイムディレクトリ内に制限付き `jail-<ws_id>.sock` のみを作成します：

```bash
# ネットワーク隔離された bwrap ブラウザを 1920x1080 Headless 空間で起動
komactl sandbox run --name browser-jail -- firefox

# ルートレス podman でネットワーク有効の OCI コンテナを起動する前の dry-run 確認
komactl sandbox run --runtime podman --image fedora:latest --share-net --dry-run -- glxgears

# 単一ワークスペース限定でエージェントアクセスを明示許可（koma-agent.sock + KOMA_CAPABILITY_TOKEN を付与）
komactl sandbox run --with-agent-sock --ro-bind ~/repo:/workspace -- code-oss
```

| オプション | 既定値 | 説明 |
| :--- | :--- | :--- |
| `--runtime <bwrap\|podman>` | `bwrap` | コンテナエンジン（`--image` 指定時は自動的に `podman` へ切替） |
| `--ws <ws_id\|auto>` | `auto` | 既存 `ws_id` を再利用または新規 `Headless` ワークスペースを作成 |
| `--name <name>` | `sandbox` | 新規作成する `Headless` ワークスペース名 |
| `--geometry <WxH[@scale]>` | `1920x1080` | ビューポート解像度とスケール（例：`2560x1600@1.6`） |
| `--bind <host:guest>` / `--ro-bind` | なし | ホストディレクトリの明示的なバインドマウント |
| `--share-net` | 無効 | ホストネットワーク（`bwrap`）または `pasta`（`podman`）を有効化（既定は隔離） |
| `--no-gpu` | 無効 | `/dev/dri` パススルーを省略しソフトウェア Mesa/Lavapipe を強制 |
| `--nvidia` | 無効 | Podman へ `--device=nvidia.com/gpu=all` CDI フラグを付与 |
| `--with-agent-sock` | 無効 | `koma-agent.sock` と単一ワークスペース用 `KOMA_CAPABILITY_TOKEN` を付与（`koma-admin.sock` は渡さない） |
| `--keep-jail` | 無効 | 終了後も `jail-<ws_id>.sock` を保持（`create-jail` / `revoke-jail` で手動管理可） |
| `--dry-run` | 無効 | 起動せず構築されたコンテナコマンドを表示 |

## 空間ワークスペース概観（`koma-overview`）

![koma-overview 空間ワークスペーススイッチャー](/media/koma-overview.webp)

`Mod + Tab`（または `koma.act.overview.toggle()` のキーバインド）で `koma-overview` を表示します：

- アクティブ出力へ `zwlr_layer_shell_v1` としてアタッチし、`koma-admin.sock` の `scene.inventory` を取得します。
- 有画面および `Headless`（`agent:work` デッキや背面 Stash 数を含む）全ワークスペースを、アイドル時の不要な GPU 再描画なしで空間グリッド表示します。
