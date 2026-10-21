# ClaraMuz

Backchat between Claude and ChatGPT. A Claude Code plugin that lets one model hand planning, implementation, research or review work to the other (Claude Code CLI or Codex CLI) as background jobs, then collect and verify the results.

Everything runs **locally**. No server, no API keys: jobs use the CLIs you are already logged in to.

## What you get

- `/clara-muz-team <task>`: splits a task, delegates it, waits, and checks results against acceptance criteria.
- `/ai-memory show | add | search | forget`: read and write the memory shared by Claude and GPT.
- MCP tools: `delegate_to_claude`, `delegate_to_gpt`, `team_health`, `team_list`, `team_status`, `team_wait`, `team_result`, `team_continue`, `team_cancel`, `memory_add`, `memory_read`, `memory_forget`.
- Works with any MCP client that can launch a stdio server (`node server/index.mjs`), not only Claude Code.

## Requirements

- Node.js 18+
- `claude` (Claude Code CLI), logged in
- `codex` (Codex CLI), logged in. Optional: without it only `delegate_to_claude` works.
- macOS, Linux or Windows (pure Node; no shell scripts)

## Install

```
/plugin marketplace add Jay-Hyun/ClaraMuz
/plugin install clara-muz@clara-muz
```

Allow the directories jobs may run in (default: the directory Claude Code was started in):

```
export CLARAMUZ_ALLOWED_ROOTS="$HOME/projects:$HOME/work"
```

Run `team_health` to confirm both CLIs are detected.

## Configuration

| Variable | Default | Meaning |
|---|---|---|
| `CLARAMUZ_ALLOWED_ROOTS` | current directory | `:`-separated roots a job's `cwd` must be inside |
| `CLARAMUZ_HOME` | `~/.clara-muz` | where job files (prompt, output, status) are stored |
| `CLARAMUZ_TIMEOUT_SECONDS` | `480` | default per-job timeout |
| `CLARAMUZ_AUTO_HANDOFF` | on | set `0` to disable Claude to GPT quota handoff |
| `CLARAMUZ_MEMORY_CHARS` | `6000` | max shared-memory text injected into each job |

## How it behaves

- Claude jobs default to `read_only` (Read/Grep/Glob). `workspace_write` also allows Edit/Write/Bash with accept-edits.
- GPT jobs default to `workspace_write` (Codex sandbox); `read_only` uses the read-only sandbox.
- `owned_paths` are validated to stay inside `cwd` and are given to the worker as an instruction. They are **not** a sandbox. Do not give two jobs the same path.
- Jobs are detached processes and survive the MCP server restarting. Finished jobs stay in `CLARAMUZ_HOME/jobs/<id>/`; delete them any time.
- Prompts and outputs are stored in plain text there.

## Quota handoff

If a Claude job fails with a usage-limit / quota / rate-limit message and `codex` is installed, the server starts the same task on GPT with a checkpoint (original prompt plus Claude's last output). The original job shows `state: handed_off` and `handoff_job_id`; `team_wait`, `team_result` and `team_continue` follow the handoff automatically. The detection is a text match on CLI output, so an unusual message may not trigger it.

## Shared memory

Both models read and write one plain-text note log (`CLARAMUZ_HOME/memory.jsonl`).

- Each job's prompt includes the newest notes addressed to its provider or to everyone.
- A job leaves notes by putting `<memory>...</memory>` (or `<memory to="claude">`, `<memory to="gpt">`) in its final report; they are saved when you read the job with `team_result`.
- You manage notes with `/ai-memory`. Notes are plain text on disk: do not store secrets in them.

## Status

v0.3.0. Tested on Linux with the real Claude CLI: delegate, wait, result, continue, cancel, path restriction, memory round trip. Quota handoff and the Codex path were tested only against a fake `codex`/`claude`; the real `codex exec` flags and Windows are **untested**.

## 한국어 요약

Claude와 ChatGPT가 서로에게 작업을 맡기는 플러그인. 서버 없이 내 PC의 `claude`/`codex` CLI 로그인만으로 동작. `CLARAMUZ_ALLOWED_ROOTS`로 작업 가능한 폴더를 지정. 메모리 공유(/ai-memory)와 Claude 한도 소진 시 GPT 자동 전환 포함. Codex 실제 CLI와 Windows는 미검증.

## License

MIT
