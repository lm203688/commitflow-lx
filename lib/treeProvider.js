'use strict';

const vscode = require('vscode');
const ruleEngine = require('./ruleEngine');
const templateStore = require('./templateStore');

class RuleTreeProvider {
  constructor(context) {
    this._ctx = context;
    this._onDidChange = new vscode.EventEmitter();
  }
  get onDidChangeTreeData() { return this._onDidChange.event; }
  refresh() { this._onDidChange.fire(); }

  resolveTreeItem(element) { return element; }

  async getChildren() {
    const rules = await ruleEngine.loadRules(this._ctx);
    return rules.map(r => {
      const item = new vscode.TreeItem(
        `${r.name}  (${r.type} · "${r.value}")`,
        r.commitMessage ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.None
      );
      item.id = r.id;
      item.description = r.commitMessage ? r.commitMessage.slice(0, 40) : '';
      item.tooltip = `Type: ${r.type}\nPattern: ${r.value}\nMessage: ${r.commitMessage || '(none)'}`;
      item.contextValue = 'commitflow_rule_item';
      item.iconPath = new vscode.ThemeIcon('symbol-property');
      item.command = { command: 'commitflow.editRule', title: 'Edit rule', arguments: [r.id] };
      item.resourceUri = undefined;
      return item;
    });
  }
}

class TemplateTreeProvider {
  constructor(context) {
    this._ctx = context;
    this._onDidChange = new vscode.EventEmitter();
  }
  get onDidChangeTreeData() { return this._onDidChange.event; }
  refresh() { this._onDidChange.fire(); }

  resolveTreeItem(element) { return element; }

  async getChildren() {
    const tpls = await templateStore.loadTemplates(this._ctx);
    return tpls.map(t => {
      const item = new vscode.TreeItem(t.title || t.id, vscode.TreeItemCollapsibleState.None);
      item.id = t.id;
      item.description = (t.message || '').slice(0, 50);
      item.tooltip = `Title: ${t.title}\nMessage: ${t.message}`;
      item.contextValue = 'commitflow_tpl_item';
      item.iconPath = new vscode.ThemeIcon('symbol-file');
      item.command = { command: 'commitflow.applyTemplate', title: 'Copy template message', arguments: [t.id] };
      return item;
    });
  }
}

module.exports = { RuleTreeProvider, TemplateTreeProvider };
