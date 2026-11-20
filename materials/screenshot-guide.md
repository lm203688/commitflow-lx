# CommitFlow Screenshot Guide

Three mockup screenshots for the VS Code Marketplace listing.

## Screenshot 1 — Rule editor panel
Shows the CommitFlow activity-bar panel with the "Split Rules" view.  
Title bar: "CommitFlow — Split Rules".  
Tree rows showing rules: Name | Type badge | Pattern value | Edit/Delete action.  
Example rules visible: "UI changes (directory · src/ui)", "Tests (ext · .spec.ts)".  
Status bar at bottom: "Free plan · 3/5 rules used".  
Left activity bar strip shows source-control icon highlighted.

**Alt-text:** *CommitFlow panel listing split rules with their types, patterns, and edit actions.*

## Screenshot 2 — Commit preview dialog
Modal titled "Preview: 3 commit groups detected".  
Each group card shows: group name + file count, suggested commit message, sample file paths.  
Buttons: Execute (blue) / Cancel (grey).

**Alt-text:** *Commit preview dialog showing three grouped batches with file lists and commit messages.*

## Screenshot 3 — Batch result toast
Toast notification banner at bottom confirming completion.  
Green checkmark: "CommitFlow: batch complete (3/3 succeeded)".  
Sub-lines: each group's short hash and commit message.  
Dismiss ✕ button.

**Alt-text:** *Batch commit result toast confirming three groups were successfully committed.*

---

To regenerate programmatically:
```bash
python materials/generate_screenshots.py
```

Replace with real screenshots from an installed copy before publishing.
