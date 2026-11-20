'use strict';

const vscode = require('vscode');
const path = require('path');
const gitExec = require('./gitExec');

// ── Rule schema ──────────────────────────────────────────────────────────────
// Each rule: { id, name, type: 'directory'|'ext'|'regex', value, commitMessage }
//   directory: matches files under this subdir
//   ext:       matches file extension (e.g. ".ts")
//   regex:     matches filename against regex

const RULE_TYPES = ['directory', 'ext', 'regex'];
const RESERVED_NAMES = new Set(['default', '_system']);

function makeRule(name, type, value, message) {
  return {
    id:          `rule_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name:        String(name || '').trim() || 'Unnamed rule',
    type:        RULE_TYPES.includes(String(type)) ? type : 'directory',
    value:       String(value || ''),
    commitMessage: String(message || ''),
  };
}

// ── Storage helpers (VS Code globalState) ────────────────────────────────────

const KEY_RULES = 'cf_rules';
const KEY_PRO   = 'cf_pro';
const MAX_FREE_RULES = 5;
const MAX_FREE_TEMPLATES = 10;

async function loadRules(context) {
  try { return JSON.parse(context.globalState.get(KEY_RULES, '[]') || '[]'); }
  catch (_) { return []; }
}

async function saveRules(context, list) {
  await context.globalState.update(KEY_RULES, JSON.stringify(list));
}

function isPro(context) { return !!context.globalState.get(KEY_PRO, false); }

// ── File matching ─────────────────────────────────────────────────────────────

function matchRule(rule, relPath) {
  switch (rule.type) {
    case 'directory':
      return relPath.startsWith(String(rule.value || '').trim() + path.sep)
          || relPath === String(rule.value || '').trim();
    case 'ext': {
      const ext = String(rule.value || '').trim();
      if (!ext.startsWith('.')) return false;
      return path.extname(relPath).toLowerCase() === ext.toLowerCase();
    }
    case 'regex': {
      try { return new RegExp(rule.value, 'i').test(path.basename(relPath)); }
      catch (_) { return false; }
    }
    default: return false;
  }
}

// ── Grouping ──────────────────────────────────────────────────────────────────

async function groupFilesByRules(statusEntries, rules, context) {
  const groups = rules.map(r => ({ ruleId: r.id, ruleName: r.name, messages: [], files: [] }));
  const unmatched = [];
  for (const entry of statusEntries) {
    const matched = groups.find(g => matchRule(rules.find(r => r.id === g.ruleId) || {}, entry.path));
    if (matched) {
      matched.files.push(entry);
    } else {
      unmatched.push(entry);
    }
  }
  if (unmatched.length > 0) {
    groups.push({ ruleId: '__unmatched__', ruleName: '(Unmatched)', messages: [], files: unmatched });
  }
  return groups.filter(g => g.files.length > 0);
}

// ── Command: preview groups ───────────────────────────────────────────────────

async function previewCommitGroups(context, gitRoot) {
  const rules = await loadRules(context);
  const pro = isPro(context);
  const entries = await gitExec.getStatusFiles(gitRoot);
  const groups = await groupFilesByRules(entries, rules, context);
  const summary = groups.map(g => ({
    ruleName: g.ruleName,
    fileCount: g.files.length,
    sample: g.files.slice(0, 3).map(f => f.path),
  }));
  return { ok: true, summary, total: entries.length, groups };
}

// ── Command: add rule ─────────────────────────────────────────────────────────

async function addRuleCmd(context, ruleInput) {
  const rules = await loadRules(context);
  const pro = isPro(context);
  if (!pro && rules.length >= MAX_FREE_RULES) {
    return { ok: false, error: `Free plan supports up to ${MAX_FREE_RULES} rules. Upgrade to Pro.` };
  }
  const rule = makeRule(ruleInput.name, ruleInput.type, ruleInput.value, ruleInput.commitMessage);
  rules.push(rule);
  await saveRules(context, rules);
  return { ok: true, rule };
}

// ── Command: remove rule ──────────────────────────────────────────────────────

async function removeRuleCmd(context, ruleId) {
  const rules = await loadRules(context);
  const idx = rules.findIndex(r => r.id === ruleId);
  if (idx < 0) return { ok: false, error: 'Not found' };
  rules.splice(idx, 1);
  await saveRules(context, rules);
  return { ok: true };
}

// ── Command: execute batch ────────────────────────────────────────────────────

async function executeBatch(context, gitRoot, groups) {
  const results = [];
  for (const g of groups) {
    const rule = g.ruleId === '__unmatched__' ? null : (await loadRules(context)).find(r => r.id === g.ruleId);
    const msg = g.commitMessage || (rule ? rule.commitMessage : '[manual] ' + g.ruleName);
    // Stage files for this group
    for (const f of g.files) {
      const r = await gitExec.safeGit(gitRoot, ['add', f.path]);
      if (!r.ok) results.push({ file: f.path, ok: false, error: r.error });
    }
    // Commit the group
    const cr = await gitExec.safeGit(gitRoot, ['commit', '-m', msg]);
    results.push({ group: g.ruleName, files: g.files.length, ok: cr.ok, commit: cr.stdout.trim(), error: cr.error });
  }
  return { results, ok: results.every(r => r.ok !== false) };
}

module.exports = {
  makeRule,
  loadRules, saveRules,
  isPro,
  MAX_FREE_RULES, MAX_FREE_TEMPLATES,
  matchRule,
  groupFilesByRules,
  previewCommitGroups,
  addRuleCmd, removeRuleCmd,
  executeBatch,
};
