# 二系統ソケット・Epoch リース・MCP

Koma は `$XDG_RUNTIME_DIR` 内で人間用の管理チャネルとエージェント操作チャネルを 2 つの独立した Unix ドメインソケットに分離しています。

- **`koma-admin.sock`**：`komactl` 専用。設定リロードやレイアウト操作を担います。
- **`koma-agent.sock`**：`koma-mcp` や [Jiku](/ja/jiku/)（`jikud`）が接続する権限制御付きソケット。画面キャプチャは封印済み `memfd`（`SCM_RIGHTS`）でゼロコピー転送され、すべての仮想入力は単調増加する `Epoch` 番号で検証されます。

> [!NOTE]
> `Mod + G` を押すか物理入力で介入すると即座に `Epoch` が進み、古い `Epoch` を持つエージェント操作は `ErrStaleEpoch` として安全に棄却され、保持中の仮想キーも自動解放されます。
