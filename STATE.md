# Project Tracker

_Last updated: 2026-05-16_

## Where we are

**Current focus:** Step 6 — awaiting first real daily-use feedback

Session 4 closed the usability audit's top gaps: the parser now reports
dropped step-like lines (no more silent partial loss), Home is a
"what-needs-attention" dashboard (progress, blocked/dropped/stale badges,
sorted, aggregate header), an mtime change hint flags stale views without a
watcher, and notes can attach per step as well as per project. The contract
now states that history lives in the STATE.md document — completed steps are
retained, never pruned. Builds, parser tests, and headless launch pass; real
daily-use feedback still needs a human on a machine with a display.

## Path

1. Bootstrap scaffold — Tauri 2 + React + TS, registry, notes, two-pane view · done
2. Format contract — CLAUDE.md + STATE-FORMAT.md + conform this file · done
3. Session 2 — Home view, manual refresh, Manage screen, routing · done
3.1 Replace parser to implement STATE-FORMAT.md (ordinal tree, PR trailer) · done
   Discovered during 2 — spec-bound now with a parser test (npm test).
4. Session 3 — safe hardening pass (error/empty states, a11y, guards) · done
5. Session 4 — integrity telemetry, dashboard, mtime hint, per-step notes · done
   Audit-driven: parser reports dropped lines; Home dashboard; contract now
   keeps history in the document (done steps retained).
5.1 Resync state-viewer.html to the contract + add parser-parity test · done
   Discovered during 5 — the fallback viewer still ran the obsolete
   session-1 grammar. Rewritten to mirror parse-state.ts; npm test now
   asserts the two parsers stay byte-identical.
6. Collect first daily-use feedback, then polish from real signal · pending
   Needs a human running `npm run tauri dev`; cannot be done headless.

## Open questions

- Per-step notes are keyed by ordinal (the contract's stable handle); a note
  stamps its step title so renumber-drift is visible. Accepted v1 limitation.
- PR trailers omitted on this repo's done steps: work ships via branch
  pushes, not PRs.
- notes-sync and real-time STATE.md watching stay parked.
