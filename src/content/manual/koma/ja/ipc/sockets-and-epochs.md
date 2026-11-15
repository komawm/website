# 二系統ソケット・Epoch リース・MCP

Koma は `$XDG_RUNTIME_DIR/koma/<signature>/` 配下に管理用ソケットとエージェント用ソケットを分離し、人間と AI の権限境界を厳格に維持します。

## `koma-admin.sock` と `koma-agent.sock`

| ソケット | 権限・認証方式 | 許可される操作 |
| :--- | :--- | :--- |
| **`koma-admin.sock`** | `0600`、同一 UID カーネル認証（`SO_PEERCRED` / `LOCAL_PEERCRED` / `getpeereid`） | `config.reload`、`config.status`、`auth.mint_token`、`sandbox.*`、`scene.inventory`、`capture.frame`、人間接収 |
| **`koma-agent.sock`** | `0660`、フレーム `#1` で `auth.authenticate`（`CapabilityToken`）が必須 | 許可ワークスペースに限定された `ws.create`、`capture.frame`、`vseat.*`、`macro.exec` |

`koma-agent.sock` 接続時の最初のフレームは必ず `komactl token mint` 等で発行した `CapabilityToken` を含む `auth.authenticate` でなければなりません。

## 単調増加 `Epoch` による楽観的排他制御

各ワークスペースはウィンドウ変更や人間プリエンプションのたびに増加する `Epoch` を持ちます。`vseat.*` 操作では直前に観測した `expected_epoch` を送信します。

| エラーコード | シンボル | 意味と復旧方法 |
| :--- | :--- | :--- |
| **`4090`** | `ERR_STALE_EPOCH` | 観測から実行の間に画面状態が変化。入力は実行前に安全中断され、`koma-mcp` は最新の `new_observed_epoch` PNG を返却 |
| **`4091`** | `ERR_HUMAN_PREEMPTED` | `Mod + G` または物理入力による人間優先割り込み。エージェントは停止して制御を譲る |
| **`4032`** | `ERR_PROTECTED_SURFACE` | `block_out_from` 指定の保護サーフェスへの操作。入力拒否かつキャプチャ内は `#000000` で遮蔽 |

## 仮想シート（`vseat`）とゼロコピー `SCM_RIGHTS` キャプチャ

- **ワークスペース分離仮想シート**：エージェント操作は `koma-seat` により物理 `seat0` のフォーカスやクリップボードから完全に独立します。
- **3 段階 `TextInjectStrategy`**：`xkb_keymap`・`text_input_v3`・`clipboard`（`Ctrl+Shift+V`）を自動選択し、Fcitx5/IBus の候補ポップアップを誤作動させません。
- **シール済み `SCM_RIGHTS` `memfd` / SHM（`koma-proto/src/scm_unix.rs`）**：`capture.frame` は Linux ではシール済み `memfd`、BSD では `rustix::shm` 経由でゼロコピー転送を行います。

## `koma-mcp` stdio サーバー

`Claude Code`・`Codex`・`Cursor`・`OpenCode`・[Jiku](/ja/jiku/) 等へ標準 MCP ツールを公開します。

```bash
# 組み込みツールと Phodopus マクロのスキーマ一覧を表示
koma-mcp --print-tools

# 明示トークンを指定して起動
KOMA_CAPABILITY_TOKEN=koma_cap_... koma-mcp

# 開発用モード（admin.sock から自動発行）
koma-mcp --auto-mint-admin
```

提供ツール：`koma_scene_inventory`、`koma_ws_create`、`koma_capture_frame`、`koma_click`、`koma_drag`、`koma_key`、`koma_inject_text`、`koma_paste_mime`、`koma_win_activate`、`koma_exec_macro` および `koma.macro.define(...)` 由来ツール。
