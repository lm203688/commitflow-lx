'use strict';

const { execFile } = require('child_process');
const path = require('path');

// ── Whitelist of allowed git subcommands ─────────────────────────────────────

const ALLOWED_SUBCOMMANDS = new Set(['add', 'commit', 'diff', 'status', 'revert', 'log']);

/**
 * Run a whitelisted git subcommand with args passed as an array.
 * Returns { ok, stdout, stderr, exitCode }.
 */
function runGit(gitRoot, subcommand, args = []) {
  return new Promise((resolve) => {
    if (!ALLOWED_SUBCOMMANDS.has(subcommand)) {
      resolve({ ok: false, error: `Blocked command: ${subcommand}` });
      return;
    }
    const proc = execFile('git', [subcommand, ...args], {
      cwd: gitRoot,
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000,
    }, (err, stdout, stderr) => {
      if (err) {
        resolve({ ok: false, stdout: stdout || '', stderr: stderr || err.message, exitCode: err.code || -1 });
        return;
      }
      resolve({ ok: true, stdout, stderr, exitCode: 0 });
    });
  });
}

/**
 * Run arbitrary git with full array args (for advanced use). Still checks whitelist on first arg.
 */
async function safeGit(gitRoot, rawArgs) {
  if (!Array.isArray(rawArgs) || rawArgs.length === 0) {
    return { ok: false, error: 'No arguments provided' };
  }
  const subcommand = String(rawArgs[0]).toLowerCase();
  if (!ALLOWED_SUBCOMMANDS.has(subcommand)) {
    return { ok: false, error: `Blocked command: ${subcommand}. Allowed: ${[...ALLOWED_SUBCOMMANDS].join(', ')}` };
  }
  // Reject any arg containing shell metacharacters (safety net)
  for (let i = 1; i < rawArgs.length; i++) {
    const a = String(rawArgs[i]);
    if (/[\;\&\|\$\`\(\)\{\}\<\>]/.test(a)) {
      return { ok: false, error: `Unsafe argument blocked at position ${i}: ${a.slice(0, 40)}` };
    }
  }
  return runGit(gitRoot, subcommand, rawArgs.slice(1));
}

/** Get current branch name via git rev-parse. */
async function getBranch(gitRoot) {
  const r = await safeGit(gitRoot, ['rev-parse', '--abbrev-ref', 'HEAD']);
  if (!r.ok) return '';
  return r.stdout.trim();
}

/** Get diff stat summary (files changed / lines). */
async function getDiffStat(gitRoot, target = '') {
  const r = await safeGit(gitRoot, ['diff', '--stat', target]);
  return r.ok ? r.stdout : '';
}

/** List tracked + untracked files relative to git root. */
async function getStatusFiles(gitRoot) {
  const r = await safeGit(gitRoot, ['status', '--porcelain', '-uall']);
  if (!r.ok) return [];
  return r.stdout.split('\n').filter(Boolean).map(line => ({
    stage: line.slice(0, 2),
    path:  line.slice(3),
  }));
}

module.exports = { runGit, safeGit, getBranch, getDiffStat, getStatusFiles, ALLOWED_SUBCOMMANDS };
