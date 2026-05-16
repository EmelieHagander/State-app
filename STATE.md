# Project Tracker

_Last updated: 2026-05-16_

## Where we are

**Current focus:** Step 2 — format contract docs (CLAUDE.md + STATE-FORMAT.md)

Session 1 scaffold is shipped and merged. This session locks the `STATE.md`
format as a written contract so multiple AIs and the parser agree. Other
projects must follow `STATE-FORMAT.md` (it carries a copy-paste block for
their CLAUDE.md). The session-1 parser does not yet implement this contract —
that is subtask 3.1.

## Path

1. Bootstrap scaffold — Tauri 2 + React + TS, registry, notes, parser, two-pane view · done
2. Format contract — CLAUDE.md + STATE-FORMAT.md + conform this file · in-progress
3. Session 2 — Home view + multi-project polish · pending
   Home as default screen, current-step per project, manage screen, PR badges.
3.1 Replace parser to implement STATE-FORMAT.md · pending
   Discovered during 2 — the session-1 parser (heading-based,
   lastIndexOf split, wrong status set) silently breaks on the contract
   format. Must be ordinal-tree, bare status, PR-trailer aware.
4. Session 3 — polish + first daily-use feedback · pending

## Open questions

- notes-sync stays parked (notes are private, machine-local, never synced).
- Real-time STATE.md watching stays parked (manual Refresh for now).
- PR trailer cross-repo URL form: deferred; revisit if cross-repo links needed.
