#!/usr/bin/env node
// ClaraMuz local MCP server (stdio, zero dependencies).
// Delegates work to Claude Code CLI or Codex CLI as detached background jobs.
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const HOME = process.env.CLARAMUZ_HOME || path.join(os.homedir(), '.clara-muz');
const JOBS = path.join(HOME, 'jobs');
const ROOTS = (process.env.CLARAMUZ_ALLOWED_ROOTS || process.cwd())
  .split(path.delimiter).filter(Boolean).map((p) => fs.realpathSync(path.resolve(p)));
const DEFAULT_TIMEOUT = Number(process.env.CLARAMUZ_TIMEOUT_SECONDS || 480);
fs.mkdirSync(JOBS, { recursive: true });

const delegateSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'goal', 'cwd', 'owned_paths', 'acceptance_criteria'],
  properties: {
    title: { type: 'string', maxLength: 160 },
    goal: { type: 'string', maxLength: 30000 },
    context: { type: 'string', maxLength: 30000, description: 'Prior decisions, files, constraints. The worker sees nothing else.' },
    cwd: { type: 'string', description: 'Existing absolute directory inside an allowed root.' },
    owned_paths: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 60, description: 'Relative files/dirs this job may touch. Use ["."] for the whole cwd.' },
    acceptance_criteria: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 30 },
    mode: { type: 'string', enum: ['read_only', 'workspace_write'] },
    timeout_seconds: { type: 'integer', minimum: 30, maximum: 1800 },
  },
};
const jobIdSchema = (extra = {}, required = []) => ({
  type: 'object', additionalProperties: false, required: ['job_id', ...required],
  properties: { job_id: { type: 'string', format: 'uuid' }, ...extra },
});

const TOOLS = [
  { name: 'delegate_to_claude', description: 'Assign planning, implementation, research or review to Claude via Claude Code CLI. Returns a job id immediately. Default mode read_only.', inputSchema: delegateSchema },
  { name: 'delegate_to_gpt', description: 'Assign planning, implementation, research or review to GPT via Codex CLI. Returns a job id immediately. Default mode workspace_write.', inputSchema: delegateSchema },
  { name: 'team_health', description: 'Check CLI versions, allowed workspace roots and settings.', inputSchema: { type: 'object', additionalProperties: false, properties: {} } },
  { name: 'team_list', description: 'List recent jobs from both providers.', inputSchema: { type: 'object', additionalProperties: false, properties: { limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 } } } },
  { name: 'team_status', description: 'Get job status, provider, mode and saved session id.', inputSchema: jobIdSchema() },
  { name: 'team_wait', description: 'Wait up to 30 seconds for a job to finish, then return status. No new model call.', inputSchema: jobIdSchema({ seconds: { type: 'integer', minimum: 1, maximum: 30, default: 15 } }) },
  { name: 'team_result', description: "Read a finished job's final report. Check it against the acceptance criteria and inspect the files it names.", inputSchema: jobIdSchema() },
  { name: 'team_continue', description: 'Send a follow-up in the same provider session. Original job must have finished; returns a new job id.', inputSchema: jobIdSchema({ instruction: { type: 'string', minLength: 1, maxLength: 30000 }, acceptance_criteria: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 30 } }, ['instruction']) },
  { name: 'memory_add', description: 'Append a note to the shared memory both Claude and GPT read. Use for decisions, findings, handoffs and questions for the other model.', inputSchema: { type: 'object', additionalProperties: false, required: ['text'], properties: { text: { type: 'string', minLength: 1, maxLength: 4000 }, author: { type: 'string', description: 'claude, gpt, or user (default user)' }, to: { type: 'string', description: 'Optional addressee: claude, gpt or all' }, kind: { type: 'string', enum: ['note', 'handoff'], description: 'handoff = open task for the addressee, claimed by the next job that receives it' }, tags: { type: 'array', items: { type: 'string' }, maxItems: 10 } } } },
  { name: 'memory_read', description: 'Read shared memory notes, newest last. Optional substring query and tag filter.', inputSchema: { type: 'object', additionalProperties: false, properties: { query: { type: 'string' }, tag: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 200, default: 20 } } } },
  { name: 'memory_forget', description: 'Delete a shared memory note by id.', inputSchema: { type: 'object', additionalProperties: false, required: ['id'], properties: { id: { type: 'string' } } } },
  { name: 'team_cancel', description: 'Request cancellation of a job. Existing files are preserved.', inputSchema: jobIdSchema() },
];

const MEMDIR = path.join(HOME, 'memory');
const MEM_INJECT_CHARS = Number(process.env.CLARAMUZ_MEMORY_CHARS || 6000);
fs.mkdirSync(MEMDIR, { recursive: true });
// One plain markdown file per note (frontmatter + body), so it can be grepped, edited by hand, or put in git.
function parseNote(file) {
  const m = slurp(path.join(MEMDIR, file)).match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return null;
  const n = { file, text: m[2].trim() };
  for (const line of m[1].split('\n')) { const i = line.indexOf(':'); if (i > 0) n[line.slice(0, i).trim()] = line.slice(i + 1).trim(); }
  n.tags = n.tags ? n.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
  return n;
}
const readMem = () => fs.readdirSync(MEMDIR).filter((f) => f.endsWith('.md')).sort().map(parseNote).filter(Boolean);
function saveNote(n) {
  const head = ['id', 'ts', 'author', 'to', 'kind', 'status', 'claimed_by'].filter((k) => n[k]).map((k) => `${k}: ${n[k]}`);
  head.push(`tags: ${(n.tags || []).join(', ')}`);
  fs.writeFileSync(path.join(MEMDIR, n.file), `---\n${head.join('\n')}\n---\n${n.text}\n`);
}
function addMem({ text, author = 'user', to = 'all', kind = 'note', tags = [] }) {
  const ts = new Date().toISOString();
  const id = randomUUID().slice(0, 8);
  const note = { id, ts, author, to, kind, status: kind === 'handoff' ? 'open' : undefined, tags, text: String(text).slice(0, 4000), file: `${ts.replace(/[:.]/g, '-')}-${id}.md` };
  saveNote(note);
  return { id, ts, author, to, kind, status: note.status, file: note.file };
}
function memoryDigest(forProvider) {
  const all = readMem().filter((n) => n.to === 'all' || n.to === forProvider || n.author === forProvider);
  const handoffs = all.filter((n) => n.kind === 'handoff' && n.status === 'open' && n.to !== 'all' && n.author !== forProvider);
  const notes = all.filter((n) => !handoffs.includes(n));
  const fmt = (n) => `- [${n.id}] ${n.ts.slice(0, 16)} ${n.author}${n.to !== 'all' ? ' -> ' + n.to : ''}${n.kind === 'handoff' ? ' (handoff)' : ''}: ${n.text.replace(/\n/g, ' ')}`;
  const lines = handoffs.map(fmt); let len = lines.join('\n').length;
  const rest = [];
  for (let i = notes.length - 1; i >= 0; i--) { const l = fmt(notes[i]); if (len + l.length > MEM_INJECT_CHARS) break; len += l.length; rest.unshift(l); }
  return { text: [...lines, ...rest].join('\n'), handoffIds: handoffs.map((n) => n.id) };
}
function claimHandoffs(ids, jobId) {
  for (const n of readMem()) if (ids.includes(n.id) && n.status === 'open') { n.status = 'claimed'; n.claimed_by = jobId; saveNote(n); }
}
const ingestMemory = (job, report) => {
  const flag = path.join(JOBS, job.id, 'memory_ingested');
  if (fs.existsSync(flag)) return;
  fs.writeFileSync(flag, '');
  for (const m of String(report).matchAll(/<(memory|handoff)(?: to="(claude|gpt|all)")?>([\s\S]*?)<\/\1>/g)) {
    if (m[3].trim()) addMem({ text: m[3].trim(), author: job.provider, to: m[2] || (m[1] === 'handoff' ? (job.provider === 'claude' ? 'gpt' : 'claude') : 'all'), kind: m[1] === 'handoff' ? 'handoff' : 'note', tags: ['job:' + job.id.slice(0, 8)] });
  }
};

const dirOf = (id) => {
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error('invalid job_id');
  const d = path.join(JOBS, id);
  if (!fs.existsSync(path.join(d, 'job.json'))) throw new Error(`unknown job ${id}`);
  return d;
};
const readJob = (id) => JSON.parse(fs.readFileSync(path.join(dirOf(id), 'job.json'), 'utf8'));
const writeJob = (job) => fs.writeFileSync(path.join(JOBS, job.id, 'job.json'), JSON.stringify(job, null, 2));
const slurp = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '');
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };

function checkCwd(cwd) {
  if (!path.isAbsolute(cwd) || !fs.existsSync(cwd) || !fs.statSync(cwd).isDirectory()) throw new Error('cwd must be an existing absolute directory');
  const real = fs.realpathSync(cwd);
  const norm = (p) => (process.platform === 'win32' ? p.toLowerCase() : p);
  if (!ROOTS.some((r) => norm(real) === norm(r) || norm(real).startsWith(norm(r) + path.sep))) throw new Error(`cwd outside allowed roots (${ROOTS.join(', ')}). Set CLARAMUZ_ALLOWED_ROOTS.`);
  return real;
}
function checkOwned(cwd, owned) {
  for (const p of owned) {
    const abs = path.resolve(cwd, p);
    if (path.isAbsolute(p) || (abs !== cwd && !abs.startsWith(cwd + path.sep))) throw new Error(`owned_paths entry escapes cwd: ${p}`);
  }
}

function buildPrompt(a, mode, mem) {
  return [
    `# Task: ${a.title}`, '', a.goal, '',
    a.context ? `## Context\n${a.context}\n` : '',
    mem.text ? `## Shared memory (notes and handoffs from the user and the other model)\n${mem.text}\n` : '',
    `## Owned paths\nOnly touch: ${a.owned_paths.join(', ')}. Other paths are read-only.`, '',
    `## Mode\n${mode === 'read_only' ? 'READ ONLY. Do not modify any file.' : 'You may edit files inside the owned paths.'}`, '',
    '## Acceptance criteria', ...a.acceptance_criteria.map((c) => `- ${c}`), '',
    '## Final report',
    'To leave a note for the other model or future jobs, put it in <memory>...</memory> (or <memory to="claude">...</memory> / <memory to="gpt">...</memory>) in your final report. To hand unfinished work to the other model, use <handoff>what is done, what failed, what is open</handoff>.',
    'End with: files changed, how you verified each criterion (commands and results), and remaining work. Do not claim anything you did not run.',
  ].join('\n');
}

function commandFor(job, resumeId) {
  if (job.provider === 'claude') {
    const write = job.mode === 'workspace_write';
    const args = ['-p', '--output-format', 'json', '--allowedTools', write ? 'Read,Grep,Glob,Edit,Write,Bash' : 'Read,Grep,Glob'];
    if (write) args.push('--permission-mode', 'acceptEdits');
    if (resumeId) args.push('--resume', resumeId);
    return ['claude', args];
  }
  const args = ['exec'];
  if (resumeId) args.push('resume', resumeId);
  args.push('--json', '--skip-git-repo-check', '-o', path.join(JOBS, job.id, 'last.txt'));
  if (!resumeId) args.push('-C', job.cwd, '--sandbox', job.mode === 'read_only' ? 'read-only' : 'workspace-write');
  args.push('-');
  return ['codex', args];
}

function launch(provider, a, prompt, resumeId) {
  const mode = a.mode || (provider === 'claude' ? 'read_only' : 'workspace_write');
  const cwd = checkCwd(a.cwd);
  const id = randomUUID();
  const d = path.join(JOBS, id);
  fs.mkdirSync(d, { recursive: true });
  const job = { id, provider, title: a.title, mode, cwd, created_at: new Date().toISOString(), resumed_from: resumeId ? a.job_id : undefined, timeout_seconds: a.timeout_seconds || DEFAULT_TIMEOUT };
  fs.writeFileSync(path.join(d, 'prompt.txt'), prompt);
  const [bin, args] = commandFor(job, resumeId);
  fs.writeFileSync(path.join(d, 'spec.json'), JSON.stringify({ bin, args, cwd, timeout_seconds: job.timeout_seconds }));
  const child = spawn(process.execPath, [path.join(path.dirname(fileURLToPath(import.meta.url)), 'runner.mjs'), d], { detached: true, stdio: 'ignore', windowsHide: true });
  child.on('error', () => {});
  child.unref();
  job.pid = child.pid;
  writeJob(job);
  return job;
}

function sessionId(job) {
  const out = slurp(path.join(JOBS, job.id, 'out.txt'));
  if (job.provider === 'claude') { try { return JSON.parse(out).session_id; } catch { return undefined; } }
  for (const line of out.split('\n')) {
    try { const e = JSON.parse(line); if (e.type === 'thread.started' && e.thread_id) return e.thread_id; } catch { /* skip */ }
  }
  return undefined;
}

const QUOTA_RE = /usage limit|quota|rate.?limit|limit reached|credit balance|out of (credits|usage)|too many requests|overloaded|429/i;
function maybeHandoff(job, d) {
  if (job.provider !== 'claude' || job.handoff_job || process.env.CLARAMUZ_AUTO_HANDOFF === '0') return job;
  if (!QUOTA_RE.test(slurp(path.join(d, 'err.txt')) + slurp(path.join(d, 'out.txt')).slice(0, 4000))) return job;
  if (!version('codex')) return job;
  let partial = '';
  try { partial = JSON.parse(slurp(path.join(d, 'out.txt'))).result || ''; } catch { /* none */ }
  const prompt = slurp(path.join(d, 'prompt.txt')) + `\n\n## Handoff checkpoint\nThis task was started by Claude, which hit its usage limit. Inspect the working tree for any partial changes before acting, and continue rather than restart.${partial ? `\nClaude's last output:\n${partial.slice(0, 4000)}` : ''}\n`;
  const next = launch('gpt', { title: job.title + ' (handoff from Claude)', cwd: job.cwd, mode: job.mode, timeout_seconds: job.timeout_seconds }, prompt);
  next.requested_provider = 'claude'; next.handoff_from = job.id; writeJob(next);
  job.handoff_job = next.id; job.requested_provider = 'claude';
  writeJob(job);
  return job;
}
const effective = (id) => {
  for (let i = 0; i < 5; i++) { const st = statusOf(id); if (!st.handoff_job_id) return id; id = st.handoff_job_id; }
  return id;
};

function statusOf(id) {
  const job = readJob(id);
  const d = path.join(JOBS, id);
  const exitFile = path.join(d, 'exit');
  let state = 'running';
  let exit_code;
  if (fs.existsSync(exitFile)) {
    exit_code = Number(slurp(exitFile).trim());
    state = exit_code === 0 ? 'completed' : exit_code === 124 ? 'timed_out' : fs.existsSync(path.join(d, 'cancelled')) ? 'cancelled' : 'failed';
  } else if (fs.existsSync(path.join(d, 'cancelled'))) state = alive(job.pid) ? 'running' : 'cancelled';
  else if (!alive(job.pid)) state = 'failed';
  let handoff_job_id;
  if (state === 'failed' || state === 'timed_out') { const j2 = maybeHandoff(job, d); handoff_job_id = j2.handoff_job; if (handoff_job_id) state = 'handed_off'; }
  else handoff_job_id = job.handoff_job;
  return { ...job, state, exit_code, session_id: sessionId(job), handoff_job_id };
}

function resultOf(id) {
  id = effective(id);
  const st = statusOf(id);
  if (st.state === 'running') return { ...st, report: null, note: 'still running' };
  const d = path.join(JOBS, id);
  let report = '';
  if (st.provider === 'claude') { try { report = JSON.parse(slurp(path.join(d, 'out.txt'))).result || ''; } catch { report = slurp(path.join(d, 'out.txt')); } }
  else report = slurp(path.join(d, 'last.txt'));
  ingestMemory(st, report);
  return { ...st, report: report || '(empty report)', stderr_tail: slurp(path.join(d, 'err.txt')).slice(-2000) };
}

const vcache = {};
const version = (bin) => (bin in vcache ? vcache[bin] : (vcache[bin] = versionRaw(bin)));
const versionRaw = (bin) => {
  const r = spawnSync(bin, ['--version'], { encoding: 'utf8' });
  return r.error ? null : (r.stdout || r.stderr).trim();
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(name, a) {
  switch (name) {
    case 'delegate_to_claude':
    case 'delegate_to_gpt': {
      const provider = name === 'delegate_to_claude' ? 'claude' : 'gpt';
      const cwd = checkCwd(a.cwd);
      checkOwned(cwd, a.owned_paths);
      const mode = a.mode || (provider === 'claude' ? 'read_only' : 'workspace_write');
      const mem = memoryDigest(provider);
      const job = launch(provider, a, buildPrompt(a, mode, mem));
      claimHandoffs(mem.handoffIds, job.id);
      return { job_id: job.id, provider, mode, state: 'running' };
    }
    case 'team_health':
      return { claude_version: version('claude'), codex_version: version('codex'), allowed_roots: ROOTS, default_timeout_seconds: DEFAULT_TIMEOUT, jobs_dir: JOBS, api_key_used: false };
    case 'team_list':
      return fs.readdirSync(JOBS).filter((i) => fs.existsSync(path.join(JOBS, i, 'job.json'))).map((i) => statusOf(i))
        .sort((x, y) => y.created_at.localeCompare(x.created_at)).slice(0, a.limit || 20)
        .map(({ id, provider, title, mode, state, created_at }) => ({ id, provider, title, mode, state, created_at }));
    case 'team_status': return statusOf(a.job_id);
    case 'team_wait': {
      const end = Date.now() + (a.seconds || 15) * 1000;
      let st = statusOf(effective(a.job_id));
      while (st.state === 'running' && Date.now() < end) { await sleep(1000); st = statusOf(effective(a.job_id)); }
      return st;
    }
    case 'team_result': return resultOf(a.job_id);
    case 'team_continue': {
      const prev = statusOf(effective(a.job_id));
      if (prev.state === 'running') throw new Error('original job still running');
      if (!prev.session_id) throw new Error('original job has no saved session id');
      const prompt = [a.instruction, '', ...(a.acceptance_criteria ? ['## Acceptance criteria', ...a.acceptance_criteria.map((c) => `- ${c}`)] : [])].join('\n');
      const job = launch(prev.provider, { ...prev, job_id: a.job_id, title: `${prev.title} (follow-up)`, cwd: prev.cwd, mode: prev.mode }, prompt, prev.session_id);
      return { job_id: job.id, provider: prev.provider, state: 'running' };
    }
    case 'memory_add': return addMem(a);
    case 'memory_read': {
      let n = readMem().map(({ file, ...rest }) => rest);
      if (a.tag) n = n.filter((x) => x.tags?.includes(a.tag));
      if (a.query) n = n.filter((x) => x.text.toLowerCase().includes(a.query.toLowerCase()));
      return n.slice(-(a.limit || 20));
    }
    case 'memory_forget': { const hit = readMem().filter((x) => x.id === a.id); for (const x of hit) fs.unlinkSync(path.join(MEMDIR, x.file)); return { removed: hit.length }; }
    case 'team_cancel': {
      const job = readJob(a.job_id);
      fs.writeFileSync(path.join(JOBS, job.id, 'cancelled'), '');
      if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(job.pid), '/T', '/F'], { stdio: 'ignore' });
      else { try { process.kill(job.pid, 'SIGTERM'); } catch { /* gone */ } }
      // runner is killed with its child tree on POSIX via the group below
      if (process.platform !== 'win32') { try { process.kill(-job.pid, 'SIGTERM'); } catch { /* gone */ } }
      return { job_id: job.id, cancel_requested: true };
    }
    default: throw new Error(`unknown tool ${name}`);
  }
}

// ---- CLI mode (no MCP): node index.mjs <tool> [--json '{...}']  or JSON on stdin ----
const ALIASES = { 'delegate-claude': 'delegate_to_claude', 'delegate-gpt': 'delegate_to_gpt', health: 'team_health', list: 'team_list', status: 'team_status', wait: 'team_wait', result: 'team_result', continue: 'team_continue', cancel: 'team_cancel', 'mem-add': 'memory_add', 'mem-read': 'memory_read', 'mem-forget': 'memory_forget' };
async function runCli(cmd) {
  if (cmd === 'help' || cmd === '--help') {
    console.log('Usage: node index.mjs <command> [--json \'{...}\' | --stdin]\nCommands: ' + Object.entries(ALIASES).map(([k, v]) => `${k} (${v})`).join(', ') + '\nNo command: run as an MCP stdio server.');
    return;
  }
  const name = ALIASES[cmd] || cmd.replace(/-/g, '_');
  if (!TOOLS.some((t) => t.name === name)) { console.error(`unknown command: ${cmd}. Try: help`); process.exit(2); }
  let raw = '';
  const j = process.argv.indexOf('--json');
  if (j > 0) raw = process.argv[j + 1] || '';
  else if (process.argv.includes('--stdin')) raw = await new Promise((r) => { let d = ''; process.stdin.on('data', (c) => (d += c)); process.stdin.on('end', () => r(d)); });
  let args = {};
  if (raw.trim()) { try { args = JSON.parse(raw); } catch { console.error('arguments must be valid JSON'); process.exit(2); } }
  try { console.log(JSON.stringify(await call(name, args), null, 2)); } catch (e) { console.error(`error: ${e.message || e}`); process.exit(1); }
}

if (process.argv[2] && process.argv[2] !== 'mcp') { await runCli(process.argv[2]); process.exit(process.exitCode || 0); }

const send = (m) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...m }) + '\n');
readline.createInterface({ input: process.stdin }).on('line', async (line) => {
  let msg;
  try { msg = JSON.parse(line); } catch { return; }
  const { id, method, params } = msg;
  if (id === undefined) return; // notification
  try {
    if (method === 'initialize') send({ id, result: { protocolVersion: params?.protocolVersion || '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'clara-muz', version: '0.4.0' } } });
    else if (method === 'ping') send({ id, result: {} });
    else if (method === 'tools/list') send({ id, result: { tools: TOOLS } });
    else if (method === 'tools/call') {
      try {
        const out = await call(params.name, params.arguments || {});
        send({ id, result: { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] } });
      } catch (e) {
        send({ id, result: { isError: true, content: [{ type: 'text', text: String(e.message || e) }] } });
      }
    } else send({ id, error: { code: -32601, message: `method not found: ${method}` } });
  } catch (e) { send({ id, error: { code: -32603, message: String(e.message || e) } }); }
});
