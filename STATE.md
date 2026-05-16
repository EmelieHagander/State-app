# Project Tracker

_Last updated: 2026-05-16_

## 1. Where we are

**Current focus:** Session 1 complete — bootstrap scaffold shipped

Just-bootstrapped scaffold. Tauri 2 + React + TypeScript desktop app with a
project registry (tauri-plugin-store), per-project machine-local notes, a
strict STATE.md parser, and a two-pane single-project view (checklist on the
left, notes editor on the right). Frontend builds clean under the full strict
TypeScript flag set; the Tauri release binary compiles and launches. This app
is the read-only viewer for STATE.md files — it never writes to them.

## 2. Path

### Bootstrap · done
Scaffold Tauri 2 + React + TS, registry + notes architecture, parser, two-pane
view, push to repo.
_Session 1 — this session_

### Session 2 — Home view + multi-project polish · pending
Aggregate Home view across projects, project colors, nicer list, multi-project
navigation.
_Deferred — not started_

### Session 3 — PR tracking and completed-step indicators · pending
PR fields per step, completed-step indicators, richer status surfacing.
_Deferred — not started_

## 3. Parked

- notes-sync (intentional — notes are private, machine-local, never synced)
- real-time STATE.md watching (intentional — manual Refresh button for now)

## 4. Open questions

- Should project color be user-pickable in the Add Project flow, or derived?
- Exact STATE.md status vocabulary beyond done/active/pending/blocked/skipped?
- Should the notes pane get a markdown preview toggle (deferred to session 2)?
