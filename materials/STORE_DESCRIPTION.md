# CommitFlow — Store Description

## One-line tagline
**Split your messy working tree into atomic commits. In one click.**

## Full description

### Overview
Stop committing everything in one massive "WIP" message. **CommitFlow** lets you define rules that group files by directory, extension, or filename pattern — then preview each group and execute all commits atomically in a single batch run. Your git history stays clean, descriptive, and meaningful.

### Key features (Free)
- Define split rules: group changes by **directory**, **file extension**, or **regex**.
- Preview every commit group with file list before executing — no surprises.
- Built-in conventional-commit templates (`fix:`, `feat:`, `chore:` … 10 presets).
- One-click batch execution: stage + commit each group sequentially.
- Keyboard shortcut: `Ctrl+Alt+C` to open the preview panel.
- All git calls go through a strict subcommand whitelist (`add/commit/diff/status/revert/log`) — no shell injection risk.
- Fully offline after install; no telemetry or analytics.

### Pro upgrade ($9 one-time)
Unlock additional capabilities:
- Unlimited split rules (free tier: 5 max).
- Unlimited custom commit templates.
- [Phase 2 - Upcoming] AI-powered commit message generation (bring your own OpenAI/Claude API key).
- [Phase 2 - Upcoming] Conflict pre-check before batch commit.
- [Phase 2 - Upcoming] One-click revert queue (undo last N commits safely).

### Why not just `git add -p`?
| Concern | `git add -p` | CommitFlow |
|---|---|---|
| Rule-based grouping | Manual staging per hunk | Automatic by dir/ext/regex |
| Named groups | None — ad-hoc | Each group has a name + default message |
| Batch replay | Re-do each time | Save rules, re-run anytime |
| Safety | Human error possible | Whitelisted git calls + preview-confirm |

### Technical details
- Git operations use Node.js `child_process.execFile` — arguments passed as arrays, never concatenated strings.
- Every argument beyond the subcommand is scanned for shell metacharacters (`; & | $ \` () {} < >`) and rejected if found.
- Rules and templates stored locally in VS Code `globalState`; license verified via `snapmark-license.61960005.workers.dev/verify`.

### Who is this for?
Developers who work on multiple loosely-coupled changes simultaneously and want each logical unit committed separately without manual `git add` churn.

### License
MIT licensed. Free tier available indefinitely. Pro is a $9 one-time purchase via Paddle.

---

## Viral hook (for social media)
> "Your git log shouldn't look like 'fix stuff again'. Split your working tree into atomic commits with rules — preview, confirm, done. Zero cloud, zero hassle. Free + $9 Pro lifetime."

---

## X / Twitter post draft
🧹 Tired of one giant WIP commit at the end of a sprint?  
CommitFlow groups your files by rule (dir / ext / regex), previews each group, then executes batch commits in one click.  
All local. No cloud. Zero CJK in output (just kidding — full English UI).  

https://marketplace.visualstudio.com/items?itemName=LxStudio.commitflow-lx  
#VSCode #Git #DevTools

---

## LinkedIn post draft
I built CommitFlow because I kept hitting "commit everything" at 2am and regretting it the next day during code review.  
Now I define rules once — "everything in src/ui goes under ui/*", "test/*.spec.ts → test" — and let CommitFlow batch-stage + commit each group with its own message.  
Fully local, no telemetry, whitelisted git commands. Free tier covers up to 5 rules; Pro ($9 lifetime) unlocks unlimited.  
Check it out: https://marketplace.visualstudio.com/items?itemName=LxStudio.commitflow-lx
