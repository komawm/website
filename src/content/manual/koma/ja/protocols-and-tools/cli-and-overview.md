# komactl CLI と koma-overview

`komactl` は `koma-admin.sock` 経由の `adb` 風管理 CLI 兼オフライン Lua バリデータであり、`koma-overview` は全ワークスペースを俯瞰する `wlr-layer-shell` 製空間 Exposé です。

## `komactl` サブコマンド一覧

`komactl` は `$XDG_RUNTIME_DIR/koma/<signature>/koma-admin.sock` を自動検出します（`KOMA_INSTANCE_SIGNATURE` で明示指定も可能）。

| コマンド | 動作種別 | 説明 |
| :--- | :--- | :--- |
| `komactl validate [path/to/init.lua]` | オフライン | Phodopus シャドウ環境で `init.lua` を検証し、モニター／バインド／ルール数を出力 |
| `komactl reload [path/to/init.lua]` | IPC（`admin.sock`） | `config.reload` でコンポジタ設定をアトミックにホットリロード |
| `komactl config-status` | IPC（`admin.sock`） | 現在の設定パス・リロード世代・直近エラーを表示（`config.status`） |
| `komactl gen-types` | オフライン | `koma-types`（`types/koma.lua`）用の `LuaCATS` 型定義を決定論的に出力 |
| `komactl inventory` | IPC（`admin.sock`） | モニター・ワークスペース・Epoch・Deck/Stash 状態を出力（`scene.inventory`） |
| `komactl token mint [label]` | IPC（`admin.sock`） | スコープ付き `CapabilityToken` を発行（既定 `ttl_secs = 28800`、`max_owned_workspaces = 4`） |
| `komactl capture [ws_id] [out.rgba]` | IPC（`admin.sock`） | `SCM_RIGHTS` シール済み `memfd` から `grid_225` 付きフレームをゼロコピー保存（既定 `ws_01`） |
| `komactl sandbox <subcmd>` | コンテナ + IPC | `bwrap` またはルートレス `podman` で隔離された `Headless` ワークスペースに GUI コンテナを起動 |
| `komactl -V` / `--version` | オフライン | バージョン表示 |

## `komactl sandbox` による GUI コンテナ隔離

`komactl sandbox` はホスト側の `$XDG_RUNTIME_DIR`・`koma-admin.sock`・D-Bus・PipeWire・SSH Agent を一切マウントせず、制限付き `jail-<ws_id>.sock` のみを `0700` `tmpfs` へ配置します。

```bash
# ネットワーク隔離された bwrap ブラウザを 1920x1080 Headless 空間で起動
komactl sandbox run --name browser-jail -- firefox

# ルートレス podman で OCI コンテナを起動する前の dry-run 確認
komactl sandbox run --runtime podman --image fedora:latest --share-net --dry-run -- glxgears

# 単一ワークスペース限定で koma-agent.sock + CapabilityToken をマウント
komactl sandbox run --with-agent-sock --ro-bind ~/repo:/workspace -- code-oss
```

| オプション | 既定値 | 説明 |
| :--- | :--- | :--- |
| `--runtime <bwrap\|podman>` | `bwrap` | コンテナエンジン（`--image` 指定時は自動的に `podman`） |
| `--ws <ws_id\|auto>` | `auto` | 既存 `ws_id` を再利用または新規 `Headless` ワークスペースを作成 |
| `--name <name>` | `sandbox` | 新規作成するワークスペース名 |
| `--geometry <WxH[@scale]>` | `1920x1080` | 仮想出力サイズとスケール（例：`2560x1600@1.6`） |
| `--bind <host:guest>` / `--ro-bind` | なし | ホストディレクトリの RW / RO バインドマウント |
| `--share-net` | 無効 | コンテナのネットワーク共有を有効化（既定は遮断） |
| `--no-gpu` | 無効 | `/dev/dri` を渡さずソフトウェア Mesa/Lavapipe 描画を強制 |
| `--nvidia` | 無効 | Podman へ `--device=nvidia.com/gpu=all` CDI フラグを付与 |
| `--with-agent-sock` | 無効 | `koma-agent.sock` と単一ワークスペース用 `KOMA_CAPABILITY_TOKEN` を付与 |
| `--keep-jail` | 無効 | 終了後も `jail-<ws_id>.sock` を保持（`create-jail` / `revoke-jail` で手動管理可） |
| `--dry-run` | 無効 | 実行せず構築されたコンテナコマンドを表示 |

## 空間ワークスペース概覧（`koma-overview`）

`Mod + Tab`（または `koma.act.overview.toggle()` をバインドしたキー）で `koma-overview` を表示します。

- `zwlr_layer_shell_v1` として表示され、`koma-admin.sock` の `scene.inventory` から有画面・`Headless`（`agent:work` 等）全ワークスペースの Deck と Stash 状況を一覧表示します。
- アイドル時の不要な GPU 再描画を行わないホバーステートマシン（`hover_fsm.rs`）を採用しています。
