// Run via `npm test`. Guards against the recurring failure mode: the
// standalone state-viewer.html parser drifting from src/lib/parse-state.ts.
// Both must produce identical structure for the same input.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseState as tsParse } from "../src/lib/parse-state.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const html = readFileSync(`${root}state-viewer.html`, "utf8");
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (m === null) {
  console.log("FAIL  no <script> block in state-viewer.html");
  process.exit(1);
}
const stubEl = { addEventListener() {}, innerHTML: "", value: "", files: [] };
const factory = new Function(
  "document",
  `${m[1]}\nreturn { parseState };`,
);
const { parseState: htmlParse } = factory({ getElementById: () => stubEl });

function shape(s: {
  title: string;
  lastUpdated: string;
  currentFocus: string;
  where: string;
  steps: { ordinal: string }[];
  flat: {
    ordinal: string;
    status: string;
    depth: number;
    body: string;
    pr: { number: number; name: string } | null;
  }[];
  skipped: { text: string; reason: string }[];
  questions: string[];
}): string {
  return JSON.stringify({
    title: s.title,
    lastUpdated: s.lastUpdated,
    currentFocus: s.currentFocus,
    where: s.where,
    top: s.steps.map((x) => x.ordinal),
    flat: s.flat.map((x) => ({
      o: x.ordinal,
      st: x.status,
      d: x.depth,
      b: x.body,
      pr: x.pr ? `${x.pr.number}:${x.pr.name}` : null,
    })),
    skipped: s.skipped,
    questions: s.questions,
  });
}

const fixtures = [
  readFileSync(`${root}STATE.md`, "utf8"),
  `# T
_Last updated: 2026-01-02_
## Where we are
**Current focus:** x
line a
line b
## Path
1. A · done · PR #9 "nine"
2. B · in-progress
  body
2.1 sub · pending
3. bad · wip
7. Backtick · \`done\`
2.9.9 orphan · pending
## Open questions
- q1
`,
];

let ok = true;
fixtures.forEach((f, i) => {
  const pass = shape(tsParse(f)) === shape(htmlParse(f));
  console.log(`${pass ? "PASS" : "FAIL"}  parity fixture ${i}`);
  if (!pass) ok = false;
});
console.log(ok ? "\nPARSERS IN SYNC" : "\nOUT OF SYNC");
process.exit(ok ? 0 : 1);
