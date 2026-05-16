// Strict STATE.md parser. No defensive parsing: lines that do not match the
// template are skipped rather than coerced.
//
// Template shape:
//
//   # <title>
//
//   _Last updated: <date>_
//
//   ## 1. Where we are
//
//   **Current focus:** <one line>
//
//   <free-text "where" paragraph(s)>
//
//   ## 2. Path
//
//   ### <step title> · <status>
//   <body line>
//   _<meta line>_
//
//   #### <sub-item title> · <status>
//   <body line>
//   _<meta line>_
//
//   ## 3. Parked
//
//   - <item>
//
//   ## 4. Open questions
//
//   - <item>

export type ItemStatus =
  | "done"
  | "active"
  | "pending"
  | "blocked"
  | "skipped"
  | "unknown";

export interface PathItem {
  title: string;
  status: ItemStatus;
  body: string;
  meta: string;
  subItems: PathItem[];
}

export interface ParsedState {
  title: string;
  lastUpdated: string;
  currentFocus: string;
  where: string;
  path: PathItem[];
  parked: string[];
  questions: string[];
}

const STATUS_VALUES: ReadonlySet<string> = new Set([
  "done",
  "active",
  "pending",
  "blocked",
  "skipped",
]);

function normalizeStatus(raw: string): ItemStatus {
  const s = raw.trim().toLowerCase();
  return STATUS_VALUES.has(s) ? (s as ItemStatus) : "unknown";
}

// Splits a heading on the " · " (U+00B7) trailer into [title, status].
// Returns null if there is no valid trailer — strict template.
function splitTrailer(text: string): { title: string; status: ItemStatus } | null {
  const idx = text.lastIndexOf(" · ");
  if (idx === -1) return null;
  const title = text.slice(0, idx).trim();
  const status = text.slice(idx + 3).trim();
  if (title.length === 0 || status.length === 0) return null;
  return { title, status: normalizeStatus(status) };
}

type Section = "none" | "where" | "path" | "parked" | "questions";

export function parseState(markdown: string): ParsedState {
  const lines = markdown.split(/\r?\n/);

  const result: ParsedState = {
    title: "",
    lastUpdated: "",
    currentFocus: "",
    where: "",
    path: [],
    parked: [],
    questions: [],
  };

  let section: Section = "none";
  const whereLines: string[] = [];
  let currentMain: PathItem | null = null;
  let currentSub: PathItem | null = null;

  const pendingBody = (item: PathItem, line: string): void => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return;
    if (trimmed.startsWith("_") && trimmed.endsWith("_") && trimmed.length > 1) {
      if (item.meta.length === 0) {
        item.meta = trimmed.slice(1, -1).trim();
      }
      return;
    }
    if (item.body.length === 0) {
      item.body = trimmed;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine;
    const trimmed = line.trim();

    if (trimmed.startsWith("# ") && result.title.length === 0) {
      result.title = trimmed.slice(2).trim();
      continue;
    }

    const lastUpdatedMatch = /^_Last updated:\s*(.+?)_$/.exec(trimmed);
    if (lastUpdatedMatch && result.lastUpdated.length === 0) {
      result.lastUpdated = (lastUpdatedMatch[1] ?? "").trim();
      continue;
    }

    if (trimmed.startsWith("## ")) {
      const heading = trimmed.slice(3).trim().toLowerCase();
      currentMain = null;
      currentSub = null;
      if (heading.includes("where we are")) section = "where";
      else if (heading.includes("path")) section = "path";
      else if (heading.includes("parked")) section = "parked";
      else if (heading.includes("open questions")) section = "questions";
      else section = "none";
      continue;
    }

    if (section === "where") {
      const focusMatch = /^\*\*Current focus:\*\*\s*(.+)$/.exec(trimmed);
      if (focusMatch) {
        result.currentFocus = (focusMatch[1] ?? "").trim();
        continue;
      }
      if (trimmed.length > 0) whereLines.push(trimmed);
      continue;
    }

    if (section === "path") {
      if (trimmed.startsWith("#### ")) {
        const split = splitTrailer(trimmed.slice(5).trim());
        if (split && currentMain) {
          currentSub = {
            title: split.title,
            status: split.status,
            body: "",
            meta: "",
            subItems: [],
          };
          currentMain.subItems.push(currentSub);
        } else {
          currentSub = null;
        }
        continue;
      }
      if (trimmed.startsWith("### ")) {
        const split = splitTrailer(trimmed.slice(4).trim());
        if (split) {
          currentMain = {
            title: split.title,
            status: split.status,
            body: "",
            meta: "",
            subItems: [],
          };
          result.path.push(currentMain);
        } else {
          currentMain = null;
        }
        currentSub = null;
        continue;
      }
      const target = currentSub ?? currentMain;
      if (target) pendingBody(target, line);
      continue;
    }

    if (section === "parked") {
      if (trimmed.startsWith("- ")) result.parked.push(trimmed.slice(2).trim());
      continue;
    }

    if (section === "questions") {
      if (trimmed.startsWith("- ")) result.questions.push(trimmed.slice(2).trim());
      continue;
    }
  }

  result.where = whereLines.join("\n").trim();
  return result;
}
