---
description: Read or write the memory shared by Claude and GPT (decisions, findings, notes for the other model)
argument-hint: show | add [to claude|gpt] <note> | search <text> | forget <id>
---

Manage the shared ClaraMuz memory. Arguments: $ARGUMENTS

- No arguments or `show`: call `memory_read` (limit 20) and list the notes: id, time, author, addressee, text.
- `add <note>`: call `memory_add` with `author: "user"`. If the text starts with `to claude` or `to gpt`, set `to` accordingly and strip that prefix; otherwise `to: "all"`.
- `search <text>`: call `memory_read` with `query`.
- `forget <id>`: confirm the note text with the user first, then call `memory_forget`.

Every delegated job automatically receives the newest notes addressed to its provider (or to all), and may leave notes back by putting `<memory>...</memory>` in its final report. Those are saved when you read the job with `team_result`.
