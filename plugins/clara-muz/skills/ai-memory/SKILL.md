---
name: ai-memory
description: Claude와 ChatGPT(Codex)가 같이 보는 공유 메모장. "메모해줘", "인수인계 문서 만들어줘", "다른 AI가 이어서 하게 정리해줘", "공유 메모 보여줘" 같은 요청에 사용. Shared notes and one-time handoffs between Claude and GPT, stored as plain markdown files.
---

# ai-memory: 공유 메모장

Claude와 GPT가 같은 폴더의 마크다운 메모를 읽고 써서 서로 일을 이어받게 한다.
Arguments from the user (if any): $ARGUMENTS

## Where notes live

One markdown file per note in `~/.clara-muz/memory/` (Windows: `%USERPROFILE%\.clara-muz\memory\`). Create the folder if missing. Use your normal file tools; no extra programs.

If you are in a plain chat window with no file access, you cannot save notes: only do `handoff` below and print the text for the user to copy.

File name: `<UTC time like 2026-10-21T06-51-43Z>-<8 random hex>.md`. Content:

```
---
id: <the same 8 hex>
ts: <ISO time>
author: user | claude | gpt
to: all | claude | gpt
kind: note | handoff
status: open            (handoff only; becomes "claimed" once someone takes it)
tags: a, b
---
<text>
```

## What to do

Pick by what the user asked (or by the first word of the arguments):

- **show** (default): list the 20 newest notes: id, time, author, addressee, kind, status, text. Open handoffs first.
- **add <note>**: write a note with `author: user`. If the text starts with "to claude" or "to gpt", set `to` and drop that prefix. If it also says "handoff", use `kind: handoff`, `status: open`.
- **search <text>**: search the folder and list matching notes.
- **forget <id>**: show the note, ask the user to confirm, then delete that file.
- **handoff**: the user is about to switch to the other app. Write a `kind: handoff` note addressed to the other model: what was done, what failed, what is still open, key files and folders. Then print the same text in a code block so the user can paste it into any chat window.
- **init**: make this memory a habit instead of a manual step. Show the user the block below, ask for confirmation, then append it to the global instruction file of the app you run in (`~/.claude/CLAUDE.md` for Claude, `~/.codex/AGENTS.md` for Codex), unless it is already there. Create the file if missing.

```
## ClaraMuz shared memory
Before starting work, read the notes in ~/.clara-muz/memory/ addressed to me (or to "all") and any open handoff for me. When I take a handoff, change its `status: open` to `status: claimed`. To leave a note for the other AI, write a new file in the same folder in the same format.
```

## Rules

- Taking a handoff: read it, then change its `status` to `claimed` so nobody takes it twice.
- Never store passwords, keys or personal data. Notes are plain text on disk.
- Keep each note short and concrete: files, decisions, next step.
