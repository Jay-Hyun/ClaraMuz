# ClaraMuz

Backchat between Claude and ChatGPT. A Claude Code plugin that lets one model hand planning, implementation, research or review work to the other (Claude Code CLI or Codex CLI) as durable jobs, then collect and verify the results.

## What you get

- `/clara-muz-team <task>`: slash command that splits a task, delegates it, waits, and checks results against acceptance criteria.
- MCP tools: `delegate_to_claude`, `delegate_to_gpt`, `team_health`, `team_list`, `team_status`, `team_wait`, `team_result`, `team_continue`, `team_cancel`.

## Requirements

This plugin is only the client side. It talks to a **ClaraMuz relay** that you run yourself:

- A machine with `claude` (Claude Code CLI) and `codex` (Codex CLI) installed and logged in with your own subscriptions.
- The relay server and local agent. **Not included in this repository yet**; see "Status" below.
- No API keys are used by design; models run on your own machine.

## Install

```
/plugin marketplace add Jay-Hyun/ClaraMuz
/plugin install clara-muz@clara-muz
```

Then set:

```
export CLARAMUZ_RELAY_URL="https://your-relay.example.com/mcp"
export CLARAMUZ_TOKEN="your-relay-token"
```

Check with `team_health` that the agent is online.

## Safety

- Delegated jobs are limited to the workspace roots your relay allows.
- Claude jobs default to `read_only`; GPT jobs default to `workspace_write`. Review `owned_paths` before approving.
- Never commit your relay URL or token.

## Status

Early (v0.1.0). The plugin wrapper is done; the relay server and Mac agent source still need to be added and scrubbed of personal paths and credentials before others can self-host.

## 한국어 요약

Claude와 ChatGPT가 서로에게 작업을 맡기는 플러그인. 본인 PC에 `claude`/`codex` CLI 로그인과 릴레이 서버가 필요하며, 릴레이 소스는 아직 이 저장소에 없음.

## License

MIT
