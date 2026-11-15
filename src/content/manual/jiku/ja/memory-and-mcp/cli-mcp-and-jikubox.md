# jiku CLI・MCP サーバー・JikuBox

`jiku` は、ワークスペース検査、ポリシー検証、スキル承認のためのスクリプト可能な CLI と stdio ベースの Model Context Protocol（MCP）サーバーを提供します。

## CLI コマンド一覧

すべてのサブコマンドで以下のグローバルフラグを利用できます。

- `--config <PATH>` — 設定ファイルのパスを指定します。
- `--policy <PATH>` — セキュリティポリシーファイルのパスを指定します。
- `--socket <PATH>` — Koma IPC ソケットパスを指定します。
- `--json` — 人間向け表示の代わりに JSON を出力します。

現在のリポジトリで実装されている `jiku` サブコマンドは以下の通りです。

```bash
jiku status
jiku validate-config
jiku decide "<prompt>"
jiku plan "<goal>"
jiku run "<task>"
jiku box classify [<DIR>]
jiku memory search "<QUERY>"
jiku skills list
jiku skills diff
jiku skills stage <PATH>
jiku skills approve <NAME>
```

グラフィカルセッションを起動せずに設定検証だけを行うこともできます。

```bash
jikud --headless-check
```

## MCP サーバー

標準入出力経由で MCP サーバーを起動するか、公開ツール一覧を確認します。

```bash
jiku mcp --print-tools
jiku mcp --stateless
```

公開されている 7 つのツールは以下の通りです。

| ツール名 | 用途 |
| --- | --- |
| `jiku_status` | デーモン・ソケット・ランタイム状態を取得します。 |
| `jiku_run_task` | Jiku 実行パイプラインへタスクを投入します。 |
| `jiku_decide` | 入力から構造化アクション決定を生成します。 |
| `jiku_plan` | 実行前にマルチステップ計画を作成します。 |
| `jiku_box_classify` | JikuBox によりプロジェクトディレクトリ構造を分類します。 |
| `jiku_memory_search` | ローカル階層メモリを検索します。 |
| `jiku_skills_list` | 導入済み・ステージ済みスキル一覧を取得します。 |

## JikuBox とスキル承認ゲート

`jiku box classify` は、計画生成前に対象ディレクトリ（既定はカレントディレクトリ）のプロジェクト構成を判別します。

スキルの更新は明示的なレビュー手順に従います。`jiku skills list` で一覧を確認し、`jiku skills diff` で差分を精査し、`jiku skills stage` でステージしたうえで `jiku skills approve` により承認します。

実装の詳細は [komawm/jiku リポジトリ](https://github.com/komawm/jiku) を参照してください。
