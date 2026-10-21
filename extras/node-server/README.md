# Optional Node server (advanced, not used by default)

The plugin itself needs no Node.js. This folder keeps the earlier Node implementation (`index.mjs`, `runner.mjs`) for people who want:

- background job tracking with timeouts and cancel
- enforced allowed-roots (`CLARAMUZ_ALLOWED_ROOTS`)
- automatic Claude to GPT handoff on quota errors
- the same tools as a stdio MCP server (`mcp.example.json`)

Requires Node 18+. CLI: `node index.mjs help`. It reads and writes the same `~/.clara-muz/memory/*.md` notes as `/ai-memory`.
Status: tested on Linux with the real Claude CLI and with fake `codex`; Windows and real `codex` untested.
