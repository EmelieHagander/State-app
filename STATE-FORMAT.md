# STATE.md format — the contract

`STATE.md` is a plan file that lives at the root of a project repo. It is
**written and maintained by AI services** working in that repo (any of them),
and **read** by the Project Tracker app. Because multiple different AIs write
the same file, the format is a strict contract: if an AI improvises the
format, the tracker silently drops the malformed entries. Follow this document
exactly.

**History lives in this document.** The app is a stateless read-only viewer
and keeps no history of its own. Therefore completed steps ARE the project's
history: keep every `done` step, in order, with its `PR #n "name"` trailer.
Never delete or collapse completed steps. "Concise" means short titles/bodies
and pruning only stale `## Open questions` — never the `## Path`.

## Sections (fixed order, fixed names)

```
# <Project name>

_Last updated: YYYY-MM-DD_

## Where we are

**Current focus:** <one line — name/number the step you are on>

<optional short paragraph, 1–3 sentences>

## Path

<numbered steps — see grammar below>

## Open questions

- <optional bullets>
```

Rules:

- The `# ` title is the first non-empty line.
- `_Last updated: YYYY-MM-DD_` is required and updated on every edit.
- Section headings are matched by name, case-insensitive. **Do not number the
  section headings** (`## Path`, not `## 2. Path`) — numbers are reserved for
  steps.
- `## Open questions` is optional. Architectural decisions, parked rationale,
  and anything that is not a step go here. There is **no `## Parked`
  section** — "parked" is a step status (see below).

## Step grammar (one line per step)

```
<ordinal> <title> · <status>[ · PR #<number> "<pr name>"]
```

- **Ordinal** — hierarchical dotted number, matched by
  `^(\d+(?:\.\d+)*)\.?\s+` (an optional trailing `.` is allowed):
  - `1`, `2`, `3` … = the **main path**.
  - `3.1` = a subtask discovered while doing step `3`.
  - `3.1.1` = a subtask discovered while doing `3.1`. Arbitrary depth.
  - Depth = number of dotted segments. Depth 1 = on the main path; depth > 1
    = down a subtask detour. This is the whole point of the numbering: at a
    glance you can see whether work is on the main path or in a detour.
  - Order is document order. Keep ordinals consistent; renumber siblings if
    you insert.
- **Separator** — ` · ` — a space, the middle dot `·` (U+00B7), a space.
  Exactly that. Not a hyphen, not a colon, not backticks.
- **Status** — exactly one of the five below, written **bare** (no backticks,
  no markup):

  | status        | meaning                                                |
  | ------------- | ------------------------------------------------------ |
  | `pending`     | not started                                            |
  | `in-progress` | actively being worked right now                        |
  | `done`        | complete (should carry a PR trailer)                   |
  | `blocked`     | cannot proceed; explain why in the body                |
  | `parked`      | intentionally deferred / out of scope for now          |

  Anything that is not one of these five → the tracker **skips the step
  silently**. It is never shown as an "unknown" badge. A malformed line is
  invisible, so getting the status exactly right matters.
- **PR trailer** — optional, expected on `done` steps:
  `· PR #420 "scaffold tauri app"`. The number is digits after `#`; the name
  is in straight double quotes. Parsed as `{ number: 420, name: "scaffold
  tauri app" }`. Use the PR number and a short PR name. (Cross-repo URL form
  is not part of v1.)
- **Body** — optional. One short line (or two) immediately under the step,
  not starting with an ordinal or `##`. Use it for the blocked reason or a
  one-line note. No italic `_meta_` line — keep it minimal.

## Derived "current step"

The tracker computes the current step as: the first `in-progress` step;
if none, the first `pending` step. If that step's ordinal has one segment you
are on the main path; if more, you are in a subtask at depth − 1.

## Full example (conformant)

```
# Launchpad

_Last updated: 2026-05-16_

## Where we are

**Current focus:** Step 3 — wiring the importer; on a subtask (3.1)

Core scaffold landed. Now on the data importer; hit a schema mismatch
that spawned subtask 3.1.

## Path

1. Scaffold app · done · PR #410 "scaffold launchpad"
2. Auth + session · done · PR #418 "email magic-link auth"
3. Data importer · in-progress
   Parsing the legacy export.
3.1 Reconcile legacy schema mismatch · in-progress
   Discovered during 3 — column names differ from the new model.
3.1.1 Map renamed columns · pending
4. Dashboard view · pending
5. Offline cache · parked
   Deferred until after first usable release.

## Open questions

- Should the importer dedupe by email or by external id?
```

## Add this to your project's CLAUDE.md

Copy the block below into the `CLAUDE.md` of every project that should be
tracked, so the AIs working there emit a conformant `STATE.md`:

```md
## STATE.md (project plan)

This repo has a `STATE.md` at its root: a short, live plan read by the
Project Tracker app. Keep it current and follow the format exactly — the
tracker silently drops malformed entries.

- Sections, in order: `# <Project>`, `_Last updated: YYYY-MM-DD_`,
  `## Where we are` (`**Current focus:**` one line + ≤3 sentences),
  `## Path`, optional `## Open questions`. Do not number section headings.
- Each step is one line:
  `<ordinal> <title> · <status>[ · PR #<n> "<pr name>"]`
  - Separator is ` · ` (space, U+00B7 middle dot, space). No backticks.
  - Ordinals are hierarchical: `1`,`2` = main path; `3.1` = subtask of 3;
    `3.1.1` = subtask of 3.1.
  - `status` ∈ `pending | in-progress | done | blocked | parked` (bare).
  - `done` steps carry `· PR #<number> "<short pr name>"`.
  - Optional one short body line under a step (blocked reason / note).
- History lives in this file: keep every `done` step with its PR trailer,
  in order — never delete completed steps. Keep ordinals stable; renumber
  only when unavoidable. "parked" is a status, not a section.
- Update `_Last updated:_` and `**Current focus:**` on every edit. Concise
  means short titles/bodies and pruning only stale Open questions.
```
