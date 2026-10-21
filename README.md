# ClaraMuz

Backchat between Claude and ChatGPT. A Claude Code plugin that lets one model hand planning, implementation, research or review work to the other (Claude Code CLI or Codex CLI) as durable jobs, then collect and verify the results.

## What you get

- `/clara-muz-team <task>`: slash command that splits a task, delegates it, waits, and checks results against acceptance criteria.
- MCP tools: `delegate_to_claude`, `delegate_to_gpt`, `team_health`, `team_list`, `team_status`, `team_wait`, `team_result`, `team_continue`, `team_cancel`.

## Requirements

The plugin connects to the hosted ClaraMuz MCP endpoint (`https://amuze.kr/mcp/clara_muz`), which uses OAuth (scopes `relay:read relay:submit`). Jobs run on a local agent on **your own machine**, so you need:

- `claude` (Claude Code CLI) and `codex` (Codex CLI) installed and logged in with your own subscriptions.
- The ClaraMuz local agent running and linked to your account. Setup instructions are not in this repository yet; see "Status".
- No API keys are used; models run locally.

## Install

```
/plugin marketplace add Jay-Hyun/ClaraMuz
/plugin install clara-muz@clara-muz
```

Then run `/mcp`, pick `ClaraMuz`, and complete the OAuth login in your browser. Check with `team_health` that your agent is online.

## Safety

- Delegated jobs are limited to the workspace roots your relay allows.
- Claude jobs default to `read_only`; GPT jobs default to `workspace_write`. Review `owned_paths` before approving.
- Authentication is OAuth; no token is stored in this repository.

## Status

Early (v0.1.0). The plugin wrapper is done. Open question: whether the hosted endpoint accepts accounts other than the maintainer's, and how others install the local agent. Until the agent is published, only the maintainer can use it end to end.

## 한국어 요약

Claude와 ChatGPT가 서로에게 작업을 맡기는 플러그인. 본인 PC에 `claude`/`codex` CLI 로그인과 릴레이 서버가 필요하며, 릴레이 소스는 아직 이 저장소에 없음.

## License

MIT
