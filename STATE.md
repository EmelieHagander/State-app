# Project Tracker

_Last updated: 2026-05-16_

## Where we are

**Current focus:** Step 4 — first daily-use feedback (Session 2 complete)

Session 2 shipped: parser rewritten to implement STATE-FORMAT.md exactly
(hierarchical ordinals, five bare statuses, PR trailers, malformed lines
skipped), Home view as the default screen with per-project current-step and
main-path-vs-subtask indicator, manual refresh + last-read in the project
view, and a Manage screen (rename, color, repo URL, remove). Headless launch
and parser tests pass; the click-through smoke test still needs a human on a
machine with a display.

## Path

1. Bootstrap scaffold — Tauri 2 + React + TS, registry, notes, two-pane view · done
2. Format contract — CLAUDE.md + STATE-FORMAT.md + conform this file · done
3. Session 2 — Home view, manual refresh, Manage screen, routing · done
3.1 Replace parser to implement STATE-FORMAT.md (ordinal tree, PR trailer) · done
   Discovered during 2 — the session-1 parser silently broke on the
   contract format. Now spec-bound with a parser test (npm test).
4. Session 3 — polish + first daily-use feedback · pending

## Open questions

- PR trailers omitted on done steps: work ships via branch pushes, not PRs,
  so no PR numbers yet. Backfill if/when PRs are opened.
- notes-sync stays parked (private, machine-local, never synced).
- Real-time STATE.md watching stays parked (manual Refresh for now).
