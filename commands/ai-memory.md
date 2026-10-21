---
description: Read or write the memory shared by Claude and GPT (notes and handoffs). No MCP needed.
argument-hint: show | add [to claude|gpt] [handoff] <note> | search <text> | forget <id>
allowed-tools: Bash
---

Manage the shared ClaraMuz memory. Arguments: $ARGUMENTS

CLI: `node "${CLAUDE_PLUGIN_ROOT}/server/index.mjs" <command> --json '<JSON>'`. Notes are plain markdown files in `~/.clara-muz/memory/`.

- No arguments or `show`: run `mem-read --json '{"limit":20}'` and list id, time, author, addressee, kind, status, text.
- `add <note>`: run `mem-add` with `{"text": "...", "author": "user"}`. If the text starts with `to claude` or `to gpt`, set `to` and strip the prefix. If it also says `handoff`, set `"kind":"handoff"` (an open task that the next job for that model claims exactly once).
- `search <text>`: run `mem-read` with `{"query": "..."}`.
- `forget <id>`: confirm the note text with the user first, then run `mem-forget` with `{"id": "..."}`.

Every delegated job automatically receives the newest notes addressed to its provider or to everyone, plus open handoffs for it.
