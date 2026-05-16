# CLAUDE.md — Project Tracker

Guidance for working on **this repo** (the tracker app itself). The
cross-project `STATE.md` format is a separate contract — see
[`STATE-FORMAT.md`](./STATE-FORMAT.md). Do not improvise that format.

## What this is

A small Tauri 2 desktop app that tracks `STATE.md` plan files across multiple
project repos. Each tracked project keeps a `STATE.md` at its root; various AI
services write and update it. This app aggregates and displays them.

**Core principle:** this app is a **stateless, read-only viewer of
`STATE.md`**. It must never write to a `STATE.md` file and keeps no history
of its own — history lives in the STATE.md document (completed steps are
retained there with their PR trailers; see `STATE-FORMAT.md`). The only
things it writes are private, machine-local notes (per project **and per
step**) and its own registry — both in the OS app-data directory, never
synced.

## Stack

- Tauri 2 (not Tauri 1), Rust backend.
- React 19 + TypeScript + Vite.
- Strict TypeScript: full strict flag set including `noUncheckedIndexedAccess`
  and `exactOptionalPropertyTypes` (see `tsconfig.json`). Keep it green.
- Tailwind CSS v4 (`@tailwindcss/vite`).
- shadcn/ui set up **manually** (`components.json`, `src/lib/utils.ts` `cn`,
  neutral theme tokens in `src/index.css`) because the shadcn registry is
  blocked in the build environment. Once it is reachable,
  `npx shadcn@latest add <component>` works — the prerequisites are in place.

## Commands

```bash
npm install
npm run tauri dev                    # develop (needs a display)
npm run build                        # tsc + vite build (frontend only)
npm run tauri build                  # full OS bundle
npm run tauri build -- --no-bundle   # just the binary
```

Linux build prerequisites:
`libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev
libayatana-appindicator3-dev build-essential libssl-dev`.

Headless CI/containers cannot run the GUI or drive the native file dialog;
the click-through smoke test (add project → notes → quit → relaunch) must be
confirmed by a human on a machine with a display. Pure logic (the parser) is
testable headless via `node --experimental-strip-types <test>.mts`.

## Architecture

- `src/lib/registry.ts` — project registry via `tauri-plugin-store`
  (`registry.json` in app-data). `Project = { id, name, statePath, color?,
  addedAt, ... }`.
- `src/lib/notes.ts` — per-project notes at
  `<app-data>/projects/<id>/notes.md` and per-step notes at
  `<app-data>/projects/<id>/steps/<ordinal>.md` (step note stamps the step
  title for drift detection); recursive mkdir on first write.
- `src/lib/state-md.ts` — reads a `STATE.md` from disk and `statStateFile`
  (mtime, for the change hint); read-only, never auto-reloads.
- `src/lib/parse-state.ts` — parses `STATE.md` per `STATE-FORMAT.md`. This
  must implement the contract exactly; the parser and the spec are bound.
- `src/components/*` — views (projects list, single-project two-pane,
  checklist, status badge).
- `src-tauri/capabilities/default.json` — fs scoped to `$HOME/**` (read) and
  `$APPDATA/**` (write/mkdir); `dialog:allow-open`; `store:default`.

## Conventions

- Comments explain *why*, only when non-obvious. No narration comments, no
  multi-paragraph docstrings.
- Work in sessions on a feature branch; commit per session; do not open PRs
  unless asked.
- **Dogfood:** at the end of each session, update this repo's own `STATE.md`
  to reflect reality, following `STATE-FORMAT.md` exactly.
- The `STATE.md` parser must match `STATE-FORMAT.md`. If the format changes,
  change the spec and the parser together, and add a parser test. They must
  never drift (a past parser silently broke on the real format — do not
  reintroduce that).
