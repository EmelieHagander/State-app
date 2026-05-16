import {
  BaseDirectory,
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";

// Private, machine-local notes. Plain markdown. Never synced.
// Stored at <app-data>/projects/<project-id>/notes.md, where <app-data>
// is the OS-standard per-app data directory (the "project-tracker" folder).

function projectDir(projectId: string): string {
  return `projects/${projectId}`;
}

function notesPath(projectId: string): string {
  return `${projectDir(projectId)}/notes.md`;
}

export async function readNotes(projectId: string): Promise<string> {
  const path = notesPath(projectId);
  const present = await exists(path, { baseDir: BaseDirectory.AppData });
  if (!present) return "";
  return readTextFile(path, { baseDir: BaseDirectory.AppData });
}

export async function writeNotes(
  projectId: string,
  content: string,
): Promise<void> {
  const dir = projectDir(projectId);
  const dirExists = await exists(dir, { baseDir: BaseDirectory.AppData });
  if (!dirExists) {
    await mkdir(dir, { baseDir: BaseDirectory.AppData, recursive: true });
  }
  await writeTextFile(notesPath(projectId), content, {
    baseDir: BaseDirectory.AppData,
  });
}

// Per-step notes: <app-data>/projects/<id>/steps/<ordinal>.md
// Step identity is the ordinal — the contract's only stable handle. The
// step title at write time is stamped in a leading HTML comment so the UI
// can surface drift if an AI later renumbers/retitles the step.

const STAMP_RE = /^<!--\s*step:\s*([\s\S]*?)\s*-->\n?/;

function stepsDir(projectId: string): string {
  return `${projectDir(projectId)}/steps`;
}

function stepNotePath(projectId: string, ordinal: string): string {
  return `${stepsDir(projectId)}/${ordinal}.md`;
}

export interface StepNote {
  content: string;
  stampedTitle: string | null;
}

export async function readStepNote(
  projectId: string,
  ordinal: string,
): Promise<StepNote> {
  const path = stepNotePath(projectId, ordinal);
  const present = await exists(path, { baseDir: BaseDirectory.AppData });
  if (!present) return { content: "", stampedTitle: null };
  const raw = await readTextFile(path, { baseDir: BaseDirectory.AppData });
  const m = STAMP_RE.exec(raw);
  if (m !== null) {
    return { content: raw.slice(m[0].length), stampedTitle: m[1] ?? "" };
  }
  return { content: raw, stampedTitle: null };
}

export async function writeStepNote(
  projectId: string,
  ordinal: string,
  title: string,
  content: string,
): Promise<void> {
  const dir = stepsDir(projectId);
  const dirExists = await exists(dir, { baseDir: BaseDirectory.AppData });
  if (!dirExists) {
    await mkdir(dir, { baseDir: BaseDirectory.AppData, recursive: true });
  }
  const safeTitle = title.replace(/-->/g, "->").replace(/\r?\n/g, " ");
  const body = `<!-- step: ${safeTitle} -->\n${content}`;
  await writeTextFile(stepNotePath(projectId, ordinal), body, {
    baseDir: BaseDirectory.AppData,
  });
}

export async function stepNoteExists(
  projectId: string,
  ordinal: string,
): Promise<boolean> {
  return exists(stepNotePath(projectId, ordinal), {
    baseDir: BaseDirectory.AppData,
  });
}
