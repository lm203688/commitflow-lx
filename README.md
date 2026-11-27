# CommitFlow — Batch Commit Orchestrator

**Version:** 1.0.1  
**Publisher:** LxStudio  
**License:** MIT (see LICENSE.md)

## What it does

CommitFlow turns a messy working tree into **atomic, well-named commits** — automatically grouped by rules you define (by directory, file extension, or regex), previewed, then executed in one batch. No cloud, no external service — all git operations run locally via `child_process.execFile` with a strict subcommand whitelist.

## Key features (Free)

- Define split rules: group files by **directory path**, **file extension**, or **filename regex**.
- Preview each commit group with file list before executing.
- Built-in commit message templates (`fix:`, `feat:`, `chore:` … 10 free defaults).
- One-click batch execution: stages + commits each group atomically.
- Keyboard shortcut: `Ctrl+Alt+C` opens preview.
- All git calls go through a safe wrapper that whitelists only `add/commit/diff/status/revert/log` and rejects shell metacharacters in args.

## Pro upgrade ($9 one-time)

Unlock additional capabilities:
- Unlimited split rules (free tier: 5 max).
- Unlimited custom commit templates.
- [Phase 2 - Upcoming] AI-powered commit message generation (bring your own OpenAI/Claude key).
- [Phase 2 - Upcoming] Conflict pre-check before batch commit.
- [Phase 2 - Upcoming] One-click revert queue (undo last N commits safely).

**How to buy:** Click **CommitFlow: Upgrade to Pro ($9)** — the secure Paddle checkout opens automatically. Your license activates instantly after payment.

[Buy CommitFlow Pro — $9 one-time](https://snapmark-t3-checkout.pages.dev/pay?priceId=pri_01m7wkvpp105e26qhnj0hpk583)

## Quick start

1. Open the **CommitFlow** panel from the activity bar (source-control icon).
2. Click **+ Add Rule** → pick type (directory / ext / regex) → enter pattern + optional default commit message.
3. Press `Ctrl+Alt+C` → choose groups to execute → confirm.
4. Each matching group is staged and committed separately.

## Privacy & data handling

- Rules, templates, and license state are stored locally in VS Code's `globalState`. Nothing leaves your machine.
- The only network call is to the license verification endpoint when activating a Pro license key.
- See [privacy-policy.html](privacy-policy.html) for full details.

## Tech details

- Git operations use Node.js `child_process.execFile` (NOT `exec`) — arguments passed as arrays, never string-interpolated.
- Subcommand whitelist enforces only: `add`, `commit`, `diff`, `status`, `revert`, `log`.
- Every arg beyond the subcommand is scanned for shell metacharacters (`; & | $ \` () {} < >`) and rejected if found.
- No third-party npm dependencies.

## Limitations

- Only operates within the active workspace root; multi-root workspaces use the first folder.
- Templates cannot be password-encrypted in Phase 1 (feature flagged for future).
- Does not interact with remote push — use `git push` manually after batch committing.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
