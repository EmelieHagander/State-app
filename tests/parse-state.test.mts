// Run: npm test  (node --experimental-strip-types, no test framework needed)
// Asserts the parser implements STATE-FORMAT.md.
import {
  parseState,
  currentStep,
  summarize,
} from "../src/lib/parse-state.ts";

const md = `# Launchpad

_Last updated: 2026-05-16_

## Where we are

**Current focus:** Step 3 — wiring the importer; on a subtask (3.1)

Core scaffold landed. Now on the data importer.

## Path

1. Scaffold app · done · PR #410 "scaffold launchpad"
2. Auth + session · done · PR #418 "email magic-link auth"
3. Data importer · in-progress
   Parsing the legacy export.
3.1 Reconcile legacy schema mismatch · in-progress
   Discovered during 3.
3.1.1 Map renamed columns · pending
4. Dashboard view · pending
5. Offline cache · parked
   Deferred until after first release.
6. Bad status here · wip
7. Backtick status · \`done\`
4.1.1 Orphan subtask (no 4.1) · pending

## Open questions

- Dedupe by email or external id?
`;

const s = parseState(md);
const checks: [string, boolean][] = [
  ["title", s.title === "Launchpad"],
  ["lastUpdated", s.lastUpdated === "2026-05-16"],
  ["currentFocus", s.currentFocus.startsWith("Step 3")],
  ["where captured", s.where.includes("Core scaffold landed")],
  ["top-level steps = 5", s.steps.length === 5],
  ["flat count = 7", s.flat.length === 7],
  ["step1 done", s.steps[0]?.status === "done"],
  ["step1 PR number", s.steps[0]?.pr?.number === 410],
  ["step1 PR name", s.steps[0]?.pr?.name === "scaffold launchpad"],
  ["step3 in-progress", s.steps[2]?.status === "in-progress"],
  ["step3 body", s.steps[2]?.body === "Parsing the legacy export."],
  ["3.1 nested under 3", s.steps[2]?.children[0]?.ordinal === "3.1"],
  ["3.1 depth 2", s.steps[2]?.children[0]?.depth === 2],
  [
    "3.1.1 nested under 3.1",
    s.steps[2]?.children[0]?.children[0]?.ordinal === "3.1.1",
  ],
  ["step5 parked", s.steps[4]?.status === "parked"],
  ["step5 no PR", s.steps[4]?.pr === null],
  [
    "malformed status skipped",
    !s.flat.some((x) => x.title.includes("Bad status")),
  ],
  [
    "backtick status skipped",
    !s.flat.some((x) => x.title.includes("Backtick")),
  ],
  ["orphan subtask skipped", !s.flat.some((x) => x.title.includes("Orphan"))],
  ["questions 1", s.questions.length === 1],
  ["currentStep = 3", currentStep(s)?.ordinal === "3"],
  ["currentStep depth 1", currentStep(s)?.depth === 1],
  ["skipped count = 3", s.skipped.length === 3],
  [
    "skipped: 2 malformed",
    s.skipped.filter((x) => x.reason === "malformed").length === 2,
  ],
  [
    "skipped: 1 orphan",
    s.skipped.filter((x) => x.reason === "orphan").length === 1,
  ],
  [
    "skipped malformed captures the wip line",
    s.skipped.some((x) => x.text.includes("Bad status here")),
  ],
  [
    "skipped orphan captures the 4.1.1 line",
    s.skipped.some(
      (x) => x.reason === "orphan" && x.text.includes("Orphan subtask"),
    ),
  ],
  ["summary total = 7", summarize(s).total === 7],
  ["summary done = 2", summarize(s).done === 2],
  ["summary blocked = 0", summarize(s).blocked === 0],
  ["summary in-progress = 2", summarize(s).byStatus["in-progress"] === 2],
  [
    "summary progress = 2/7",
    Math.abs(summarize(s).progress - 2 / 7) < 1e-9,
  ],
];

const md2 = `# X\n_Last updated: 2026-01-01_\n## Path\n1. A · done\n2. B · pending\n3. C · pending\n`;
checks.push([
  "currentStep falls back to first pending",
  currentStep(parseState(md2))?.ordinal === "2",
]);

let ok = true;
for (const [name, pass] of checks) {
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}`);
  if (!pass) ok = false;
}
console.log(ok ? "\nALL PASS" : "\nFAILURES");
process.exit(ok ? 0 : 1);
