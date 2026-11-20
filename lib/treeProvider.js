'use strict';

const vscode = require('vscode');
const ruleEngine = require('./ruleEngine');
const templateStore = require('./templateStore');
const gitExec = require('./gitExec');

class RuleTreeProvider {
  constructor(context) {
    this._ctx = context;
    this._onDidChange = new vscode.EventEmitter();
  }
  get onDidChangeTreeData() { return this._onDidChange.event; }
  refresh() { this._onDidChange.fire(); }

  async getChildren(/*el*/) {
    const rules = await ruleEngine.loadRules(this._ctx);
    const pro = ruleEngine.isPro(this._ctx);
    return rules.map(r => ({
      id:       r.id,
      label:    `${r.name}  (${r.type} · "${r.value}")`,
      description: r.commitMessage ? r.commitMessage.slice(0, 40) : '',
      tooltip:  `Type: ${r.type}\nPattern: ${r.value}\nMessage: ${r.commitMessage || '(none)'}`,
      cmdEdit:  { command: 'commitflow.editRule',   arguments: [r.id] },
      cmdDelete:{ command: 'commitflow.deleteRule', arguments: [r.id] },
    }));
  }
}

class TemplateTreeProvider {
  constructor(context) {
    this._ctx = context;
    this._onDidChange = new vscode.EventEmitter();
  }
  get onDidChangeTreeData() { return this._onDidChange.event; }
  refresh() { this._onDidChange.fire(); }

  async getChildren(/*el*/) {
    const tpls = await templateStore.loadTemplates(this._ctx);
    return tpls.map(t => ({
      id:        t.id,
      label:     t.title || t.id,
      description: (t.message || '').slice(0, 50),
      tooltip:   `Title: ${t.title}\nMessage: ${t.message}`,
      cmdUse:    { command: 'commitflow.applyTemplate', arguments: [t.id] },
      cmdDelete: { command: 'commitflow.deleteTemplate', arguments: [t.id] },
    }));
  }
}

module.exports = { RuleTreeProvider, TemplateTreeProvider };
