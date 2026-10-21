---
description: Read or write the memory shared by Claude and GPT (notes and handoffs). Plain markdown files, no extra software.
argument-hint: show | add [to claude|gpt] [handoff] <note> | search <text> | forget <id> | handoff | init-codex
---

Manage the shared ClaraMuz memory. Arguments: $ARGUMENTS

Memory is one markdown file per note in `~/.clara-muz/memory/` (on Windows: `%USERPROFILE%\.clara-muz\memory\`). Create the folder if missing. Use your Read, Write, Glob and Grep tools, not extra programs.

Note file name: `<UTC timestamp like 2026-10-21T06-51-43Z>-<8 random hex>.md`. Content:

```
---
id: <the same 8 hex>
ts: <ISO time>
author: user | claude | gpt
to: all | claude | gpt
kind: note | handoff
status: open            (handoff only; becomes "claimed" once taken)
tags: a, b
---
<text>
```

Subcommands:

- No arguments or `show`: list the 20 newest notes: id, time, author, addressee, kind, status, text. Show open handoffs first.
- `add <note>`: write a note with `author: user`. If the text starts with `to claude` or `to gpt`, set `to` and strip the prefix. If it also says `handoff`, set `kind: handoff`, `status: open`.
- `search <text>`: Grep the folder and list matching notes.
- `forget <id>`: show the note, ask the user to confirm, then delete that file.
- `handoff`: the user is switching to the other app. Write a `kind: handoff` note addressed to the other model: what was done, what failed, what is still open, key files. Then print the same text in a code block so the user can paste it into any chat window (Claude chat, ChatGPT, anything).
- `init-codex`: so that Codex also reads and writes this memory. Show the user the block below, ask for confirmation, then append it to `~/.codex/AGENTS.md` (create if missing) unless it is already there.

```
## ClaraMuz shared memory
Before starting work, read the notes in ~/.clara-muz/memory/ addressed to "gpt" or "all" and any open handoff for "gpt". After taking a handoff, change its `status: open` to `status: claimed`. Leave notes for Claude by writing new files in the same folder using the same format with author: gpt.
```

Never store passwords, tokens or personal data in notes. Notes are plain text.
