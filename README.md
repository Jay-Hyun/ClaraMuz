# ClaraMuz

Backchat between Claude and ChatGPT. A Claude Code plugin that lets one model hand planning, implementation, research or review work to the other (Claude Code CLI or Codex CLI) as background jobs, then collect and verify the results.

Everything runs **locally**. No server, no API keys: jobs use the CLIs you are already logged in to.

## What you get

- `/clara-muz-team <task>`: splits a task, delegates it, waits, and checks results against acceptance criteria.
- MCP tools: `delegate_to_claude`, `delegate_to_gpt`, `team_health`, `team_list`, `team_status`, `team_wait`, `team_result`, `team_continue`, `team_cancel`.

## Requirements

- Node.js 18+
- `claude` (Claude Code CLI), logged in
- `codex` (Codex CLI), logged in. Optional: without it only `delegate_to_claude` works.
- macOS or Linux (uses `sh`, `timeout`, `env`)

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

## How it behaves

- Claude jobs default to `read_only` (Read/Grep/Glob). `workspace_write` also allows Edit/Write/Bash with accept-edits.
- GPT jobs default to `workspace_write` (Codex sandbox); `read_only` uses the read-only sandbox.
- `owned_paths` are validated to stay inside `cwd` and are given to the worker as an instruction. They are **not** a sandbox. Do not give two jobs the same path.
- Jobs are detached processes and survive the MCP server restarting. Finished jobs stay in `CLARAMUZ_HOME/jobs/<id>/`; delete them any time.
- Prompts and outputs are stored in plain text there.

## Status

v0.2.0. Claude path tested end to end (delegate, wait, result, continue, path restriction). The Codex path follows the documented `codex exec` flags but has **not** been tested yet.

## 한국어 요약

Claude와 ChatGPT가 서로에게 작업을 맡기는 플러그인. 서버 없이 내 PC의 `claude`/`codex` CLI 로그인만으로 동작. `CLARAMUZ_ALLOWED_ROOTS`로 작업 가능한 폴더를 지정. Codex 경로는 아직 미검증.

## License

MIT
