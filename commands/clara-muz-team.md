---
description: Delegate a task to Claude or GPT (Codex) as background jobs, then collect and verify the results. No MCP needed.
argument-hint: <task description>
allowed-tools: Bash
---

Run the task below as a two-model team using the ClaraMuz CLI.

Task: $ARGUMENTS

The CLI is `node "${CLAUDE_PLUGIN_ROOT}/server/index.mjs" <command> --json '<JSON>'` (run `... help` to list commands). Each command prints JSON. If `${CLAUDE_PLUGIN_ROOT}` is empty, find `server/index.mjs` inside the installed clara-muz plugin directory.

1. `health`: stop and tell the user if a CLI version is `null` (not installed) or the working directory is outside `allowed_roots` (set `CLARAMUZ_ALLOWED_ROOTS`).
2. Split the task into independent pieces and choose a provider for each:
   - `delegate-claude` (default `read_only`): planning, research, review.
   - `delegate-gpt` (default `workspace_write`): implementation.
   Required fields: `title`, `goal`, `cwd` (absolute, inside an allowed root), `owned_paths` (never shared between two jobs), `acceptance_criteria`. Put prior decisions in `context`; the worker sees nothing else. Use `workspace_write` only when edits are intended.
3. Wait with `wait --json '{"job_id":"...","seconds":30}'`. Repeat while `state` is `running`. Do not poll `status` in a tight loop.
4. Read each finished job with `result` and check it against its acceptance criteria. Inspect the files it names; do not trust the report alone.
5. If a result falls short, send a correction with `continue`. Use `cancel` for jobs that are off track.
6. Save decisions the next job needs with `mem-add`. Jobs receive shared memory automatically and answer with `<memory>` / `<handoff>` blocks, which `result` saves.
7. A Claude job that fails on quota is handed to GPT automatically (`state: handed_off`). `wait`, `result` and `continue` follow the handoff. Tell the user when this happened.
8. Summarize: what each provider did, what was verified, what remains.
