# Project Tracker

_Last updated: 2026-05-16_

## Where we are

**Current focus:** Step 5 — awaiting first real daily-use feedback

Session 3 was a hardening pass, no new features. The strict parser's silence
is now visible: Home and the project view distinguish "STATE.md missing" from
"read OK but zero valid steps" (pointing at STATE-FORMAT.md). Added a loading
state (no empty-state flash), Esc-to-back, refresh-in-flight disabling, and
add-form guards (Enter/Escape, disabled Add when name empty). Builds, parser
tests, and headless launch all pass. The interactive click-through and actual
daily-use feedback still require a human on a machine with a display.

## Path

1. Bootstrap scaffold — Tauri 2 + React + TS, registry, notes, two-pane view · done
2. Format contract — CLAUDE.md + STATE-FORMAT.md + conform this file · done
3. Session 2 — Home view, manual refresh, Manage screen, routing · done
3.1 Replace parser to implement STATE-FORMAT.md (ordinal tree, PR trailer) · done
   Discovered during 2 — spec-bound now with a parser test (npm test).
4. Session 3 — safe hardening pass (error/empty states, a11y, guards) · done
5. Collect first daily-use feedback, then polish from real signal · pending
   Needs a human running `npm run tauri dev`; cannot be done headless.

## Open questions

- Deferred pool untouched (file-watching, search, tray, notifications,
  notes markdown-preview toggle) — pick from real usage friction.
- PR trailers omitted on done steps: work ships via branch pushes, not PRs.
- notes-sync and real-time STATE.md watching stay parked.
