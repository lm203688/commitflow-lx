'use strict';

// Template store lives in VS Code globalState; no encryption by default.

const KEY_TEMPLATES = 'cf_templates';
const KEY_PRO       = 'cf_pro';

async function loadTemplates(context) {
  const raw = context.globalState.get(KEY_TEMPLATES, '[]');
  if (Array.isArray(raw)) return raw;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch (_) { return []; }
}

async function saveTemplates(context, list) {
  await context.globalState.update(KEY_TEMPLATES, JSON.stringify(list));
}

function isPro(context) { return !!context.globalState.get(KEY_PRO, false); }

const FREE_DEFAULTS = [
  { id: 'fix',   title: 'Fix bug',         message: 'fix: address issue' },
  { id: 'feat',  title: 'Add feature',     message: 'feat: add new functionality' },
  { id: 'docs',  title: 'Update docs',     message: 'docs: update documentation' },
  { id: 'style', title: 'Style change',    message: 'style: format / refactor (no logic change)' },
  { id: 'test',  title: 'Add test',        message: 'test: add or update tests' },
  { id: 'chore', title: 'Chore',           message: 'chore: maintenance task' },
  { id: 'perf',  title: 'Performance',     message: 'perf: optimize performance' },
  { id: 'refactor', title: 'Refactor',     message: 'refactor: restructure code' },
  { id: 'ci',    title: 'CI/CD',           message: 'ci: update pipeline config' },
  { id: 'release', title: 'Release',       message: 'release: version bump' },
];

async function seedTemplates(context) {
  const existing = await loadTemplates(context);
  if (existing.length > 0) return existing;
  await saveTemplates(context, FREE_DEFAULTS);
  return FREE_DEFAULTS;
}

async function addTemplate(context, template) {
  const templates = await loadTemplates(context);
  const pro = isPro(context);
  if (!pro && templates.length >= 10) {
    return { ok: false, error: `Free plan limited to ${10} templates. Upgrade to Pro for unlimited.` };
  }
  template.id = template.id || (`tpl_${Date.now()}`);
  templates.push(template);
  await saveTemplates(context, templates);
  return { ok: true, template };
}

async function deleteTemplate(context, id) {
  const templates = await loadTemplates(context);
  const filtered = templates.filter(t => t.id !== id);
  if (filtered.length === templates.length) return { ok: false, error: 'Not found' };
  await saveTemplates(context, filtered);
  return { ok: true };
}

module.exports = { loadTemplates, saveTemplates, isPro, seedTemplates, addTemplate, deleteTemplate };
