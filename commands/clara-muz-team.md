---
description: Split a task between Claude and GPT (Codex), run both, check results. Needs only the Claude and Codex apps.
argument-hint: <task description>
---

Run the task below as a two-model team. You are the lead.

Task: $ARGUMENTS

## Setup

1. Read the shared memory: notes in `~/.clara-muz/memory/` addressed to `claude` or `all`, and open handoffs for `claude` (see `/ai-memory` for the format). Claim a handoff you take by changing `status: open` to `status: claimed`. Pass relevant notes to workers in their prompt; they see nothing else.
2. Check that Codex exists: run `codex --version`. If it is not found:
   - Tell the user in plain words that the Codex command tool is missing and that you can install it for them. Ask for a yes.
   - On yes, read the official page https://developers.openai.com/codex/quickstart?setup=cli and run the installer it lists for the user's system (a one-line standalone installer exists for macOS/Linux and for Windows PowerShell; no Node.js needed). Do not run any other install command.
   - Then run `codex --version` again. If it works but a Codex run later says the user is not logged in, ask them to sign in (open the Codex app and sign in with ChatGPT, or run `codex login` in a terminal) and retry.
   - If the user declines or it still fails, do the whole task with Claude workers only and say that GPT is not available.

## Split the work

Split the task into independent pieces with non-overlapping files. For each piece write down: goal, working folder, files it may touch, and acceptance criteria.

- **Claude pieces** (planning, research, review, or edits): run them with the Agent tool. State the owned files and the acceptance criteria in the prompt. Use read-only agents (such as Explore) when no edits are needed.
- **GPT pieces** (implementation, second opinion): use Codex:
  1. Write the prompt to `~/.clara-muz/jobs/<id>/prompt.md` (goal, context, owned files, acceptance criteria, "end with files changed, how you verified, remaining work").
  2. Run it in the background with the Bash tool (`run_in_background`), working folder as `-C`:
     - read-only: `codex exec -C "<folder>" --sandbox read-only --skip-git-repo-check -o "<job dir>/result.md" - < "<job dir>/prompt.md"`
     - edits: same with `--sandbox workspace-write`
     - Windows PowerShell: `Get-Content "<job dir>\prompt.md" | codex exec -C "<folder>" --sandbox workspace-write --skip-git-repo-check -o "<job dir>\result.md" -`
  3. When it finishes, read `result.md`.

Only use edit mode (`workspace-write`, or Claude workers that edit) when edits are intended, and never let two workers own the same file. Stay inside the folder the user is working in; ask before touching anything else.

## Check, don't trust

Compare each worker's report with its acceptance criteria. Open the files it names and run the checks yourself. If a result falls short, send the worker a correction with the specifics (new Agent call, or a new `codex exec` whose prompt includes the previous report).

## Memory and handoff

- Write down decisions that later jobs or the other model need (`/ai-memory add ...`). Workers may reply with `<memory>...</memory>` or `<handoff>...</handoff>` in their report; save those as notes (author `claude` or `gpt`).
- If Claude's usage limit is close or Codex fails, run the `/ai-memory handoff` steps so the user can continue in the other app.

## Finish

Summarize for the user in plain language: what each model did, what you verified, what is left.
