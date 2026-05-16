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
