---
description: Delegate a task to Claude or GPT through the ClaraMuz relay, then collect and verify the result
argument-hint: <task description>
---

Run the task below as a two-model team using the ClaraMuz MCP tools.

Task: $ARGUMENTS

Steps:

1. Call `team_health`. Stop and tell the user if a CLI version is `null` (not installed) or `cwd` would fall outside `allowed_roots` (set `CLARAMUZ_ALLOWED_ROOTS`).
2. Split the task into independent pieces. For each piece choose a provider:
   - `delegate_to_claude` (default `read_only`): planning, research, review.
   - `delegate_to_gpt` (default `workspace_write`): implementation.
   Give every job a `title`, `goal`, `cwd` (inside an allowed root from `team_health`), non-overlapping `owned_paths`, and concrete `acceptance_criteria`. Put prior decisions in `context`; the worker sees nothing else.
3. Use `workspace_write` only when edits are intended, and never give two jobs the same owned path.
4. Poll with `team_wait` (max 30s per call). Do not busy-loop `team_status`.
5. Read each finished job with `team_result` and check it against its acceptance criteria. Do not accept a report at face value; inspect the files it names.
6. If a result falls short, send a correction with `team_continue`. Use `team_cancel` for jobs that are off track.
7. Record decisions the next job or the other model needs with `memory_add`. Jobs get the shared memory automatically and can reply through `<memory>` blocks, which `team_result` saves.
8. If a Claude job fails on quota, the server hands it to GPT automatically (`state: handed_off`); `team_wait`/`team_result` follow the handoff. Tell the user when that happened.
9. Summarize for the user: what each provider did, what was verified, what remains.
