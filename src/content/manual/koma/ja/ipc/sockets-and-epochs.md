# 二系統ソケット・Epoch リース・MCP

Koma は `$XDG_RUNTIME_DIR/koma/<signature>/`（ディレクトリ権限 `0700`）配下に 2 つの Unix ドメインソケットを設け、デスクトップ管理操作とエージェント自動化を分離しています。

## `koma-admin.sock` と `koma-agent.sock`

| ソケット | 権限・認証 | 許可される操作 |
| :--- | :--- | :--- |
| **`koma-admin.sock`** | `0600`、同一 UID カーネル認証（`SO_PEERCRED` / `LOCAL_PEERCRED` / `getpeereid`）、サンドボックス制限付き Wayland クライアントからは遮断 | `config.reload`、`config.status`、`auth.mint_token`、`sandbox.create_wayland_jail`、`sandbox.revoke_wayland_jail`、`scene.inventory`、`capture.frame`、人間接収（`ws.set_mode`） |
| **`koma-agent.sock`** | `0600`、最初のフレームで `CapabilityToken` を伴う `auth.authenticate` が必須 | 許可ワークスペースに限定された `ws.create`、`capture.frame`、`vseat.*`、`macro.exec` / `lua.exec_tx` |

`koma-agent.sock` のフレーム `#1` には、`komactl token mint`（または `koma-admin.sock` の `auth.mint_token`）で発行した `CapabilityToken` を含む `auth.authenticate` を送信する必要があります。未認証リクエストや管理者専用 RPC は即座に拒否されます。両ソケットとも 4 バイトのリトルエンディアン長プレフィックス付き UTF-8 JSON フレーム（最大 `16 MiB`）と、任意の `SCM_RIGHTS` ファイルディスクリプタを使用します。

## 単調増加 `Epoch` による排他制御

各ワークスペースには、リース切替・ウィンドウ生成／フォーカス／ジオメトリ変更・人間による割り込みのたびに増加する `Epoch` カウンタがあります。エージェントは `vseat.*` 入力を行う前に `scene.inventory` または `capture.frame` で状態を確認し、`expected_epoch` を渡します。

| エラーコード | シンボル | 意味と復旧方法 |
| :--- | :--- | :--- |
| **`4090`** | `ERR_STALE_EPOCH` | 観測から実行までの間に状態が変化。操作は入力実行前に安全中断されます（`koma-mcp` は最新の `new_observed_epoch` PNG を添付して返却） |
| **`4091`** | `ERR_HUMAN_PREEMPTED` | `Mod + G` または物理入力による人間側の優先割り込み。エージェントは停止して制御を譲る必要があります |
| **`4032`** | `ERR_PROTECTED_SURFACE` | `block_out_from` 指定の保護サーフェスへの操作。入力は遮断され、該当領域は `#000000` でマスクされます |

## 仮想シート（`vseat`）とゼロコピー `SCM_RIGHTS` キャプチャ

- **ワークスペース分離仮想シート**：エージェントがリースしたワークスペースごとに独立した仮想ポインタ・キーボード・クリップボード状態を持ち、人間の物理 `seat0` のフォーカスやクリップボードに影響しません。
- **高精度スプライン・`ClickGrab`・`LabelPill`**：`vseat.pointer_move`、`vseat.click`（`modifiers` と `label` 対応）、`vseat.drag` に加え、`vseat.path` / `vseat.stroke`（Smithay `ClickGrab` ドラッグ配送付き `250 Hz` 求心 Catmull-Rom / Bezier 再標本化）、`vseat.relative_move`、`vseat.wheel`、`vseat.hit_test`、`vseat.cursor_label`、`vseat.cursor_settle` を備えています。
- **明示的な `DeliverySemantics`**：IPC エラーには構造化された `DeliveryDisposition`（`Unknown`、`NotDelivered`、`DeliveryUncertain`、`DeliveredUnverified`、`DeliveredVerified`）と `RetryDisposition`（`Safe`、`Unsafe`、`Unknown`）が付与され、安全に再試行できるかを判定できます。
- **3 段階 `TextInjectStrategy`**：UTF-8 テキスト注入は `xkb_keymap`・`text_input_v3`・`clipboard`（`Ctrl+Shift+V`）を自動選択し、Fcitx5/IBus の変換候補ポップアップを誤作動させません。
- **シール済み `SCM_RIGHTS` `memfd` / SHM**：`capture.frame` は RGBA8 ピクセルを書き込み禁止シール済みの `memfd`（Linux/FreeBSD）または POSIX 共有メモリ記述子（BSD フォールバック）に書き込み、`SCM_RIGHTS` 経由でファイルディスクリプタを渡すことで JSON への大きな画像コピーを避けます。

## `koma-mcp` stdio サーバー

`koma-mcp` は `koma-agent.sock` へ遅延接続し、メッセージ単位で `Content-Length`（LSP 形式）と改行区切り JSON（`NDJSON`）の stdio フレーミングを自動判別します。`Claude Code`・`Codex`・`Cursor`・`OpenCode`・`pi`・[Jiku](/ja/jiku/) 等からそのまま利用できます：

```bash
# 組み込み MCP ツールスキーマをオフライン表示
koma-mcp --print-tools

# 明示トークンを指定して起動
KOMA_CAPABILITY_TOKEN=koma_cap_... koma-mcp

# ローカル開発向けモード（koma-admin.sock から自動でトークン発行）
koma-mcp --auto-mint-admin
```

組み込み `koma-mcp` は 17 個のコアツール（`koma_ping`、`koma_scene_inventory`、`koma_ws_create`、`koma_capture_frame`、`koma_click`、`koma_drag`、`koma_key`、`koma_inject_text`、`koma_paste_mime`、`koma_win_activate`、`koma_exec_macro`、`koma_path`、`koma_cursor_settle`、`koma_wheel`、`koma_relative_move`、`koma_hit_test`、`koma_cursor_label`）と、`~/.config/koma/init.lua` の `koma.macro.define(...)` で登録された `macro__<id>` ツールを公開します。
