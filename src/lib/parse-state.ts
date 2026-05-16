// STATE.md parser — implements STATE-FORMAT.md exactly. Strict: any line that
// does not conform is skipped silently (never surfaced as an "unknown" badge).
//
// Step line grammar (one line per step):
//   <ordinal> <title> · <status>[ · PR #<number> "<pr name>"]
// where ordinal = \d+(.\d+)* (hierarchical), separator = " · " (U+00B7),
// status ∈ the five below (bare, no backticks), optional PR trailer.

export type StepStatus =
  | "pending"
  | "in-progress"
  | "done"
  | "blocked"
  | "parked";

const STATUSES: ReadonlySet<string> = new Set<StepStatus>([
  "pending",
  "in-progress",
  "done",
  "blocked",
  "parked",
]);

function asStatus(raw: string): StepStatus | null {
  return STATUSES.has(raw) ? (raw as StepStatus) : null;
}

export interface PR {
  number: number;
  name: string;
}

export interface Step {
  ordinal: string;
  segments: number[];
  depth: number;
  title: string;
  status: StepStatus;
  pr: PR | null;
  body: string;
  children: Step[];
}

export interface SkippedLine {
  text: string;
  reason: "malformed" | "orphan";
}

export interface ParsedState {
  title: string;
  lastUpdated: string;
  currentFocus: string;
  where: string;
  steps: Step[];
  flat: Step[];
  questions: string[];
  skipped: SkippedLine[];
}

const SEP = " · ";
const ORDINAL_RE = /^(\d+(?:\.\d+)*)\.?\s+(.*)$/;
const PR_RE = /^PR #(\d+)\s+"([^"]*)"$/;

type Section = "none" | "where" | "path" | "questions";

// Parses one Path line into a Step, or null if it does not conform.
function parseStepLine(text: string): Step | null {
  const m = ORDINAL_RE.exec(text);
  if (m === null) return null;
  const ordinal = m[1] ?? "";
  const rest = (m[2] ?? "").trim();
  if (ordinal.length === 0 || rest.length === 0) return null;

  const parts = rest.split(SEP);
  if (parts.length < 2) return null;

  const title = (parts[0] ?? "").trim();
  const status = asStatus((parts[1] ?? "").trim());
  if (title.length === 0 || status === null) return null;

  let pr: PR | null = null;
  if (parts.length >= 3) {
    const prMatch = PR_RE.exec(parts.slice(2).join(SEP).trim());
    if (prMatch !== null) {
      pr = { number: Number(prMatch[1]), name: prMatch[2] ?? "" };
    }
  }

  const segments = ordinal.split(".").map((s) => Number(s));
  return {
    ordinal,
    segments,
    depth: segments.length,
    title,
    status,
    pr,
    body: "",
    children: [],
  };
}

export function parseState(markdown: string): ParsedState {
  const lines = markdown.split(/\r?\n/);

  const result: ParsedState = {
    title: "",
    lastUpdated: "",
    currentFocus: "",
    where: "",
    steps: [],
    flat: [],
    questions: [],
    skipped: [],
  };

  let section: Section = "none";
  const whereLines: string[] = [];
  // Ancestor stack for hierarchy: each entry is a step that can parent a
  // deeper one. A step at depth d attaches to the nearest ancestor at depth
  // d-1; if none exists it is skipped (malformed hierarchy), except depth 1
  // which is always a root.
  const stack: Step[] = [];
  let lastStep: Step | null = null;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (trimmed.startsWith("# ") && result.title.length === 0) {
      result.title = trimmed.slice(2).trim();
      continue;
    }

    const lu = /^_Last updated:\s*(.+?)_$/.exec(trimmed);
    if (lu !== null && result.lastUpdated.length === 0) {
      result.lastUpdated = (lu[1] ?? "").trim();
      continue;
    }

    if (trimmed.startsWith("## ")) {
      const h = trimmed.slice(3).trim().toLowerCase();
      lastStep = null;
      if (h.includes("where we are")) section = "where";
      else if (h.includes("path")) section = "path";
      else if (h.includes("open questions")) section = "questions";
      else section = "none";
      continue;
    }

    if (section === "where") {
      const focus = /^\*\*Current focus:\*\*\s*(.+)$/.exec(trimmed);
      if (focus !== null) {
        result.currentFocus = (focus[1] ?? "").trim();
        continue;
      }
      if (trimmed.length > 0) whereLines.push(trimmed);
      continue;
    }

    if (section === "path") {
      const step = parseStepLine(trimmed);
      if (step !== null) {
        while (
          stack.length > 0 &&
          (stack[stack.length - 1]?.depth ?? 0) >= step.depth
        ) {
          stack.pop();
        }
        if (step.depth === 1) {
          result.steps.push(step);
          result.flat.push(step);
          stack.push(step);
          lastStep = step;
        } else {
          const parent = stack[stack.length - 1];
          if (parent !== undefined && parent.depth === step.depth - 1) {
            parent.children.push(step);
            result.flat.push(step);
            stack.push(step);
            lastStep = step;
          } else {
            result.skipped.push({ text: trimmed, reason: "orphan" });
            lastStep = null;
          }
        }
        continue;
      }
      // A line that looks like a step (starts with an ordinal) but does not
      // conform is a silent data-loss risk — record it instead of dropping.
      if (ORDINAL_RE.test(trimmed)) {
        result.skipped.push({ text: trimmed, reason: "malformed" });
        continue;
      }
      if (trimmed.length > 0 && lastStep !== null) {
        lastStep.body =
          lastStep.body.length === 0
            ? trimmed
            : `${lastStep.body}\n${trimmed}`;
      }
      continue;
    }

    if (section === "questions") {
      if (trimmed.startsWith("- ")) {
        result.questions.push(trimmed.slice(2).trim());
      }
      continue;
    }
  }

  result.where = whereLines.join("\n").trim();
  return result;
}

// Derived "current step": first in-progress, else first pending, in document
// order. depth === 1 means on the main path; depth > 1 means in a subtask.
export function currentStep(state: ParsedState): Step | null {
  return (
    state.flat.find((s) => s.status === "in-progress") ??
    state.flat.find((s) => s.status === "pending") ??
    null
  );
}

export interface Summary {
  total: number;
  byStatus: Record<StepStatus, number>;
  done: number;
  blocked: number;
  progress: number; // done / total, 0 when total is 0
}

export function summarize(state: ParsedState): Summary {
  const byStatus: Record<StepStatus, number> = {
    pending: 0,
    "in-progress": 0,
    done: 0,
    blocked: 0,
    parked: 0,
  };
  for (const s of state.flat) byStatus[s.status] += 1;
  const total = state.flat.length;
  return {
    total,
    byStatus,
    done: byStatus.done,
    blocked: byStatus.blocked,
    progress: total === 0 ? 0 : byStatus.done / total,
  };
}
