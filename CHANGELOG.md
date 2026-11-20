# Changelog — CommitFlow

## 1.0.0 (2026-11-20)

**Initial public release.**

### Added
- Activity-bar panel with two views: Split Rules and Commit Templates.
- **Add Rule** command: create rules by directory, file extension, or regex pattern.
- **Preview Groups** command (`Ctrl+Alt+C`): scan working tree, match against rules, show grouped summary.
- **Execute Batch** command: stage + commit each matched group sequentially with confirmed atomicity.
- Default template library seeded on install (10 conventional-commit templates).
- Right-click context actions on rule/template nodes: edit, delete, apply.
- Free tier limit: 5 rules + 10 templates.
- License activation via Paddle verification endpoint.
- Configuration settings: `commitflow.buyoutLink`, `commitflow.verifyEndpoint`.

### Security
- All git subcommands wrapped in `child_process.execFile` with explicit whitelist (`add/commit/diff/status/revert/log`).
- Arguments passed as arrays — no string concatenation or shell invocation.
- Shell metacharacter filter rejects semicolons, pipes, backticks, `$`, etc. in every arg.

### Known limitations
- Only the first workspace folder is used as git root.
- Push is not automated — must be done manually after batch commit.
- Phase 2 features (AI messages, conflict check, revert queue) not yet implemented.
