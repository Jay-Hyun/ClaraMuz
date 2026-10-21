# Install guide (terminal / CLI)

For developers. Non-developers will find the [GUI install guide](INSTALL-GUI.md) easier.

## Claude Code

Inside a session:

```
/plugin marketplace add Jay-Hyun/ClaraMuz
/plugin install clara-muz@clara-muz
```

Straight from the terminal:

```
claude plugin marketplace add Jay-Hyun/ClaraMuz
claude plugin install clara-muz@clara-muz
```

- Open a new session after installing. The names are `/clara-muz:clara-muz-team` and `/clara-muz:ai-memory`.
- Try it from a folder without installing: `claude --plugin-dir ./plugins/clara-muz`
- Validate the structure: `claude plugin validate .` (repository root), `claude plugin validate plugins/clara-muz`

## Codex CLI

```
codex plugin marketplace add Jay-Hyun/ClaraMuz
codex plugin marketplace list
```

- Then restart the ChatGPT desktop app and install from the Plugins screen. (In Codex CLI, open the plugin list with `/plugins`.)
- Pin a branch: `codex plugin marketplace add Jay-Hyun/ClaraMuz --ref main`
- Update: `codex plugin marketplace upgrade` / Remove: `codex plugin marketplace remove clara-muz`
- Try from a local folder: `codex plugin marketplace add ./` from the repository root

## The other AI's command tool

`clara-muz-team` calls the other AI with `codex exec` (when Claude leads) or `claude -p` (when Codex leads). If it is missing, the AI asks whether it may install it. To install it yourself, follow the official guides.

- Codex CLI: https://developers.openai.com/codex/quickstart?setup=cli
- Claude Code: https://claude.com/download

Sign in once in each app (`codex login`, or run `claude` and sign in).

## Optional: the older Node server

If you need job cancel, enforced allowed folders or MCP mode, see `extras/node-server/`. It is not needed for the normal install.
