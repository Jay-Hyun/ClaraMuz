#!/usr/bin/env node
// Detached job runner: node runner.mjs <jobDir>. Cross-platform replacement for a shell wrapper.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
const spec = JSON.parse(fs.readFileSync(path.join(dir, 'spec.json'), 'utf8'));
const win = process.platform === 'win32';
const quote = (s) => (win ? `"${String(s).replace(/"/g, '\\"')}"` : s);

const env = { ...process.env };
for (const k of ['CLAUDE_CODE_SESSION_ID', 'CLAUDE_CODE_REMOTE_SESSION_ID', 'CLAUDE_CODE_CHILD_SESSION']) delete env[k];

const out = fs.openSync(path.join(dir, 'out.txt'), 'w');
const err = fs.openSync(path.join(dir, 'err.txt'), 'w');
const input = fs.openSync(path.join(dir, 'prompt.txt'), 'r');
const finish = (code) => { fs.writeFileSync(path.join(dir, 'exit'), String(code)); process.exit(0); };

// On Windows the CLIs are .cmd shims, so a shell is required; args here are fixed flags, ids and file paths.
const child = spawn(spec.bin, win ? spec.args.map(quote) : spec.args, { cwd: spec.cwd, env, stdio: [input, out, err], shell: win, windowsHide: true });
let timedOut = false;
const timer = setTimeout(() => {
  timedOut = true;
  if (win) spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  else child.kill('SIGTERM');
}, spec.timeout_seconds * 1000);
child.on('error', (e) => { fs.appendFileSync(path.join(dir, 'err.txt'), `spawn failed: ${e.message}\n`); clearTimeout(timer); finish(127); });
child.on('exit', (code, signal) => { clearTimeout(timer); finish(timedOut ? 124 : code ?? (signal ? 128 : 1)); });
