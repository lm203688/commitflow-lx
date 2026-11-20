'use strict';

const vscode = require('vscode');
const ruleEngine = require('./lib/ruleEngine');
const templateStore = require('./lib/templateStore');
const gitExec = require('./lib/gitExec');
const { RuleTreeProvider, TemplateTreeProvider } = require('./lib/treeProvider');

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGitRoot() {
  const ws = vscode.workspace;
  if (!ws.workspaceFolders?.length) return '';
  return ws.workspaceFolders[0].uri.fsPath;
}

function readCfg() {
  const c = vscode.workspace.getConfiguration('commitflow');
  return {
    verifyEndpoint: (c.get('verifyEndpoint') || '').trim() || 'https://snapmark-license.61960005.workers.dev/verify',
    buyoutLink:     (c.get('buyoutLink') || '').trim(),
  };
}

async function verifyLicense(endpoint, license) {
  try {
    const res = await fetch(endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license }),
    });
    const data = await res.json();
    return { ok: !!data.valid, error: data.valid ? '' : (data.error || 'License is not active.') };
  } catch (e) {
    return { ok: false, error: 'Could not reach license service: ' + String(e.message || e) };
  }
}

// ── Commands ──────────────────────────────────────────────────────────────────

function registerCommands(context) {
  const ruleTree  = new RuleTreeProvider(context);
  const tplTree   = new TemplateTreeProvider(context);

  context.subscriptions.push(vscode.window.registerTreeDataProvider('commitflow-rules',    ruleTree));
  context.subscriptions.push(vscode.window.registerTreeDataProvider('commitflow-templates', tplTree));

  // Refresh both trees
  context.subscriptions.push(vscode.commands.registerCommand('commitflow.refreshTree', () => {
    ruleTree.refresh();
    tplTree.refresh();
  }));

  // ── Preview split groups ────────────────────────────────────────────────
  context.subscriptions.push(vscode.commands.registerCommand('commitflow.previewGroups', async () => {
    const gitRoot = getGitRoot();
    if (!gitRoot) {
      vscode.window.showErrorMessage('CommitFlow: no workspace folder open.');
      return;
    }
    const result = await ruleEngine.previewCommitGroups(context, gitRoot);
    if (!result.ok) {
      vscode.window.showErrorMessage(`CommitFlow: ${result.error}`);
      return;
    }
    // Show quick pick of groups
    const picks = result.summary.map((s, i) => ({
      label: `${s.ruleName} (${s.fileCount} files)`,
      description: s.sample.join(', '),
      groupIndex: i,
    }));
    const selected = await vscode.window.showQuickPick(picks, {
      placeHolder: 'Select a group to preview or apply a template …',
      canPickMany: true,
    });
    if (!selected?.length) return;
    // Show detail panel
    let detail = `CommitFlow: ${selected.length} group(s) selected.\n\n`;
    for (const sel of selected) {
      const g = result.groups[sel.groupIndex];
      detail += `Group: ${g.ruleName}\n  Files (${g.files.length}):\n` +
                g.files.slice(0, 5).map(f => `    ${f.path}`).join('\n') +
                (g.files.length > 5 ? `\n    ... and ${g.files.length - 5} more` : '') + '\n\n';
    }
    vscode.window.showInformationMessage(detail.trimEnd());
    ruleTree.refresh();
  }));

  // ── Add rule ─────────────────────────────────────────────────────────────
  context.subscriptions.push(vscode.commands.registerCommand('commitflow.addRule', async () => {
    const type = await vscode.window.showQuickPick(
      ['directory', 'ext', 'regex'].map(t => ({ label: t, description: t === 'directory' ? 'Match files under a subdir' : t === 'ext' ? 'Match by file extension' : 'Match by regex on filename' }))
    );
    if (!type) return;
    const value = await vscode.window.showInputBox({ prompt: `Enter ${type.label} pattern`, ignoreFocusOut: true });
    if (value === undefined) return;
    const msg = await vscode.window.showInputBox({ prompt: 'Default commit message for this group (optional)', ignoreFocusOut: true });
    const name = await vscode.window.showInputBox({ prompt: 'Rule name', placeHolder: 'UI changes', ignoreFocusOut: true });
    const r = await ruleEngine.addRuleCmd(context, { name, type: type.label, value, commitMessage: msg || '' });
    if (!r.ok) { vscode.window.showWarningMessage(r.error); return; }
    ruleTree.refresh();
    vscode.window.showInformationMessage(`CommitFlow: rule "${r.rule.name}" added.`);
  }));

  // ── Edit rule ────────────────────────────────────────────────────────────
  context.subscriptions.push(vscode.commands.registerCommand('commitflow.editRule', async (ruleId) => {
    const rules = await ruleEngine.loadRules(context);
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;
    const newName = await vscode.window.showInputBox({ prompt: 'New rule name', value: rule.name, ignoreFocusOut: true });
    if (newName === undefined) return;
    const newVal = await vscode.window.showInputBox({ prompt: 'New pattern value', value: rule.value, ignoreFocusOut: true });
    if (newVal === undefined) return;
    const newMsg = await vscode.window.showInputBox({ prompt: 'New commit message', value: rule.commitMessage, ignoreFocusOut: true });
    if (newMsg === undefined) return;
    rule.name = newName;
    rule.value = newVal;
    rule.commitMessage = newMsg;
    await ruleEngine.saveRules(context, rules);
    ruleTree.refresh();
    vscode.window.showInformationMessage('CommitFlow: rule updated.');
  }));

  // ── Delete rule ──────────────────────────────────────────────────────────
  context.subscriptions.push(vscode.commands.registerCommand('commitflow.deleteRule', async (ruleId) => {
    const r = await ruleEngine.removeRuleCmd(context, ruleId);
    if (!r.ok) { vscode.window.showErrorMessage(r.error); return; }
    ruleTree.refresh();
    vscode.window.showInformationMessage('CommitFlow: rule deleted.');
  }));

  // ── Execute batch commits ───────────────────────────────────────────────
  context.subscriptions.push(vscode.commands.registerCommand('commitflow.executeBatch', async () => {
    const gitRoot = getGitRoot();
    if (!gitRoot) { vscode.window.showErrorMessage('CommitFlow: no workspace folder open.'); return; }
    const rules = await ruleEngine.loadRules(context);
    if (!rules.length) {
      vscode.window.showWarningMessage('CommitFlow: no split rules defined. Add a rule first.');
      return;
    }
    const entries = await gitExec.getStatusFiles(gitRoot);
    if (!entries.length) {
      vscode.window.showInformationMessage('CommitFlow: nothing to commit (working tree clean).');
      return;
    }
    const groups = await ruleEngine.groupFilesByRules(entries, rules, context);
    if (!groups.length) {
      vscode.window.showWarningMessage('CommitFlow: no files matched any rule.');
      return;
    }
    // Confirm before executing
    const confirm = await vscode.window.showWarningMessage(
      `Execute ${groups.length} batch commit(s)? This will create real git commits.`,
      { modal: true }, 'Execute', 'Cancel'
    );
    if (confirm !== 'Execute') return;
    const result = await ruleEngine.executeBatch(context, gitRoot, groups);
    const lines = result.results.map(r => r.ok ? `  ✓ ${r.group}: committed` : `  ✗ ${r.group}: ${r.error || 'failed'}`);
    vscode.window.showInformationMessage('CommitFlow: batch complete.\n' + lines.join('\n'));
    ruleTree.refresh();
  }));

  // ── Template commands ────────────────────────────────────────────────────
  context.subscriptions.push(vscode.commands.registerCommand('commitflow.applyTemplate', async (tplId) => {
    const tpls = await templateStore.loadTemplates(context);
    const tpl = tpls.find(t => t.id === tplId);
    if (!tpl) return;
    // Copy template message into clipboard so user can paste it when editing a rule
    await vscode.env.clipboard.writeText(tpl.message || '');
    vscode.window.showInformationMessage(`CommitFlow: template "${tpl.title}" message copied to clipboard.`);
  }));

  context.subscriptions.push(vscode.commands.registerCommand('commitflow.deleteTemplate', async (tplId) => {
    const r = await templateStore.deleteTemplate(context, tplId);
    if (!r.ok) { vscode.window.showErrorMessage(r.error); return; }
    tplTree.refresh();
    vscode.window.showInformationMessage('CommitFlow: template deleted.');
  }));

  // ── Upgrade to Pro ───────────────────────────────────────────────────────
  context.subscriptions.push(vscode.commands.registerCommand('commitflow.upgradeToPro', async () => {
    const cfg = readCfg();
    if (!cfg.buyoutLink) {
      vscode.window.showWarningMessage('CommitFlow: set commitflow.buyoutLink in settings before upgrading.');
      return;
    }
    await vscode.env.openExternal(vscode.Uri.parse(cfg.buyoutLink));
  }));

  // ── Activate Pro license ─────────────────────────────────────────────────
  context.subscriptions.push(vscode.commands.registerCommand('commitflow.activatePro', async () => {
    const license = await vscode.window.showInputBox({
      prompt:         'Enter your CommitFlow Pro license key',
      placeHolder:    'e.g. cf-xxxxxxxxxxxxxxxxxxxx',
      ignoreFocusOut: true,
    });
    if (!license) return;
    const cfg   = readCfg();
    const result = await verifyLicense(cfg.verifyEndpoint, license.trim());
    if (result.ok) {
      await context.globalState.update(ruleEngine.KEY_PRO, true);
      await context.globalState.update('cf_license', license.trim());
      ruleTree.refresh();
      tplTree.refresh();
      vscode.window.showInformationMessage('CommitFlow: Pro license active! Unlimited rules and templates unlocked.');
    } else {
      vscode.window.showErrorMessage(`CommitFlow: ${result.error || 'Invalid license key.'}`);
    }
  }));
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

async function activate(context) {
  await templateStore.seedTemplates(context);
  registerCommands(context);

  if (!context.globalState.get('cf_welcomed', false)) {
    context.globalState.update('cf_welcomed', true);
    vscode.window.showInformationMessage(
      'CommitFlow installed! Define split rules in the CommitFlow panel, then preview and execute batch commits from your working tree.'
    );
  }
}

function deactivate() {}

module.exports = { activate, deactivate };
