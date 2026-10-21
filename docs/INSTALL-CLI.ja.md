# インストールガイド (ターミナル / CLI)

開発者向けです。開発者でない方は[GUIインストールガイド](INSTALL-GUI.ja.md)のほうが簡単です。

## Claude Code

セッション内で:

```
/plugin marketplace add Jay-Hyun/ClaraMuz
/plugin install clara-muz@clara-muz
```

ターミナルから直接:

```
claude plugin marketplace add Jay-Hyun/ClaraMuz
claude plugin install clara-muz@clara-muz
```

- インストール後は新しいセッションを開きます。呼び出し名は `/clara-muz:clara-muz-team`、`/clara-muz:ai-memory` です。
- インストールせずにフォルダで試す: `claude --plugin-dir ./plugins/clara-muz`
- 構造の検証: `claude plugin validate .` (リポジトリのルート)、`claude plugin validate plugins/clara-muz`

## Codex CLI

```
codex plugin marketplace add Jay-Hyun/ClaraMuz
codex plugin marketplace list
```

- その後、ChatGPTデスクトップアプリを再起動し、Plugins画面からインストールします。(Codex CLIでは `/plugins` でプラグイン一覧を開きます。)
- ブランチを固定する: `codex plugin marketplace add Jay-Hyun/ClaraMuz --ref main`
- 更新: `codex plugin marketplace upgrade` / 削除: `codex plugin marketplace remove clara-muz`
- ローカルフォルダで試す: リポジトリのルートで `codex plugin marketplace add ./`

## 相手のAIのコマンド

`clara-muz-team` は、相手のAIを `codex exec`(Claudeがリーダーのとき)または `claude -p`(Codexがリーダーのとき)で呼び出します。無ければ、AIがインストールしてよいか先に確認します。自分でインストールする場合は、公式ガイドに従ってください。

- Codex CLI: https://developers.openai.com/codex/quickstart?setup=cli
- Claude Code: https://claude.com/download

それぞれのアプリで1回ログインします(`codex login`、または `claude` を実行してログイン)。

## 任意: 以前のNodeサーバー

ジョブのキャンセル、許可フォルダの強制、MCPモードが必要な場合は `extras/node-server/` をご覧ください。通常のインストールには不要です。
