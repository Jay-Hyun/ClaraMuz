---
name: clara-muz-team
description: 한 가지 일을 Claude와 ChatGPT(Codex) 두 AI에게 나눠 맡기고, 결과를 직접 확인해서 알려준다. "둘이 같이 해줘", "다른 AI한테도 검토시켜줘", "구현은 GPT가, 검토는 Claude가", "두 AI로 교차검증" 같은 요청에 사용. Split a task between Claude and GPT (Codex), run both, verify the results.
---

# clara-muz-team: Claude + GPT 팀플레이

You are the **lead**. Task from the user: $ARGUMENTS

## 0. Know which app you are

- You are **Claude** (Claude Code, or Claude desktop app in Code mode): the other AI is GPT, reached with the `codex` command.
- You are **Codex / GPT** (Codex in the ChatGPT desktop app, or Codex CLI): the other AI is Claude, reached with the `claude` command.
- You are in a plain chat window that cannot run commands: you cannot run this skill. Tell the user to open the Code / Codex mode, or use `ai-memory` handoff for a copy-paste handover.

## 1. Setup

1. Read the shared memory in `~/.clara-muz/memory/` (format: see the `ai-memory` skill): notes addressed to you or to `all`, and open handoffs for you. If you take a handoff, change `status: open` to `status: claimed`. Put relevant notes in each worker's prompt; workers see nothing else.
2. Check the other AI's command exists: `codex --version` (or `claude --version`). If it is missing:
   - Say in plain words that the other AI's command tool is missing and that you can install it. Ask for a yes.
   - For `codex`: read https://developers.openai.com/codex/quickstart?setup=cli and run only the installer it lists for the user's system. For `claude`: use the official installer from https://claude.com/download or the Claude Code docs. Run no other install command.
   - Check the version again. If a later run says "not logged in", ask the user to sign in to that app (or run `codex login` / `claude` once) and retry.
   - If the user declines or it still fails, do the whole task yourself with your own subagents and say clearly that the other AI was not used.

## 2. Split the work

Split the task into independent pieces with non-overlapping files. For each piece write: goal, working folder, files it may touch, acceptance criteria.

- **Your own side**: use your subagents (Claude: Agent tool; Codex: its subagents) or do it yourself. State owned files and acceptance criteria. Use read-only workers when no edits are needed.
- **The other AI**: run it as a background command.
  1. Write the prompt to `~/.clara-muz/jobs/<id>/prompt.md`: goal, context, owned files, acceptance criteria, and "end with: files changed, how you verified, what remains".
  2. Run it in the background (Claude: Bash with `run_in_background`; Codex: a background terminal), with the working folder set.
     - To GPT, read-only: `codex exec -C "<folder>" --sandbox read-only --skip-git-repo-check -o "<job dir>/result.md" - < "<job dir>/prompt.md"`
     - To GPT, may edit: same with `--sandbox workspace-write`
     - To Claude, read-only: `cd "<folder>" && claude -p --allowedTools "Read,Grep,Glob" < "<job dir>/prompt.md" > "<job dir>/result.md"`
     - To Claude, may edit: `cd "<folder>" && claude -p --permission-mode acceptEdits --allowedTools "Read,Grep,Glob,Edit,Write,Bash" < "<job dir>/prompt.md" > "<job dir>/result.md"`
     - Windows PowerShell: pipe the prompt in, e.g. `Get-Content "<job dir>\prompt.md" | codex exec -C "<folder>" --sandbox workspace-write --skip-git-repo-check -o "<job dir>\result.md" -`
  3. When it finishes, read `result.md`.

Use edit mode only when edits are intended. Never let two workers own the same file. Stay inside the folder the user is working in; ask before touching anything else.

## 2b. Common patterns

The app the user is typing in is the **main** (lead). If they want the other app to lead, tell them to open that app instead. Match the pattern the user describes:

- **Main plans, other builds** (for example GPT plans, Claude builds): first write the plan as a short document with goal, steps and acceptance criteria, and save it as a note. Give the other AI the plan and let it build (edit mode, owned files only). Afterwards review the result against the plan yourself.
- **Main builds, the other AI makes what main cannot** (for example images): build your part. Send the other AI a precise brief (subject, style, size, file name, save folder inside the working folder) and ask it to save the file and reply with the path. Check the file exists, then use it. If the other AI cannot do it in this environment (for example no image generation), say so plainly and stop; never fake the result.
- **Cross-check**: send the same question or material to both AIs with the same prompt and do not show one answer to the other at first. Then compare: points both agree on, points where they differ, and claims neither supports. Check disputed facts yourself against sources. Report in a short table and state your confidence. Do not merge answers by averaging.

## 3. Check, don't trust

Compare each report with its acceptance criteria. Open the files it names and run the checks yourself. If a result falls short, send a correction with the specifics (a new run whose prompt includes the previous report).

## 4. Memory and handoff

- Save decisions the next job or the other AI needs as notes (see `ai-memory`). Workers may answer with `<memory>...</memory>` or `<handoff>...</handoff>` blocks; save those as notes with the worker as author.
- If your usage limit is close, or the other AI failed, do the `ai-memory` **handoff** steps so the user can continue in the other app.

## 5. Finish

Tell the user, in plain language: what each AI did, what you verified yourself, what is left. Say clearly if the other AI was not used.
