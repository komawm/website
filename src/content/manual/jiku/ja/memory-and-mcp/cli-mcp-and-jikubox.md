# CLI・MCP・JikuBox

`jiku` は、スクリプト実行や診断向けの CLI と、外部コーディングエージェント向けの stdio Model Context Protocol（MCP）サーバーを提供します。

## CLI コマンドとグローバルフラグ

すべてのサブコマンドの前で次のグローバルフラグを指定できます。

- `--config <PATH>` — 設定ファイルのパスを上書きします。
- `--policy <PATH>` — Lua ポリシーファイルのパスを上書きします。
- `--socket <PATH>` — Koma IPC ソケットのパスを上書きします。
- `--json` — 人間向け表示の代わりに機械可読な JSON を出力します。

利用可能な `jiku` サブコマンド:

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

グラフィカルセッションを起動せずにデーモン設定をオフライン検証できます。

```bash
jikud --headless-check
```

## MCP サーバー（`jiku mcp`）

外部エージェントホストやエディタ連携向けに標準入出力で `jiku mcp` を起動します。

```bash
jiku mcp --print-tools
jiku mcp --stateless
```

公開される 7 つのツール:

| ツール名 | 用途 |
| :--- | :--- |
| `jiku_status` | デーモン・ソケット・ランタイム状態を取得します。 |
| `jiku_run_task` | Jiku 実行パイプラインへタスクを投入します。 |
| `jiku_decide` | 入力から構造化判定プロンプトを実行します。 |
| `jiku_plan` | 実行前に多段階の計画を生成します。 |
| `jiku_box_classify` | JikuBox のルールでディレクトリを分類します。 |
| `jiku_memory_search` | ローカル全文履歴とメモリ階層を検索します。 |
| `jiku_skills_list` | 導入済み・ステージ済みスキル一覧を取得します。 |

## JikuBox とスキル承認フロー

`jiku box classify [<DIR>]` は対象ディレクトリ（既定はカレントディレクトリ、主に `~/JikuBox`）を検査し、計画前にファイル整理やプロジェクト情報の要約を行います。

スキルの更新は明示的なレビュー手順を経ます。`jiku skills list` で一覧を確認し、`jiku skills diff` で差分を確認し、`jiku skills stage <PATH>` でローカル変更をステージしたうえで `jiku skills approve <NAME>` で有効化します。

ソースコードは [komawm/jiku リポジトリ](https://github.com/komawm/jiku) にあります。
