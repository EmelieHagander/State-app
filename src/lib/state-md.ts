import { readTextFile, stat } from "@tauri-apps/plugin-fs";

// Reads a project's STATE.md from disk. The app is a read-only viewer:
// it never writes to STATE.md. Parsing happens in the view layer.
export async function readStateFile(path: string): Promise<string> {
  return readTextFile(path);
}

// Returns the file's last-modified time in epoch ms, or null if it cannot be
// stat'd (missing/unreadable). Used only for a "changed on disk" hint — never
// to auto-reload (real-time watching is intentionally parked).
export async function statStateFile(path: string): Promise<number | null> {
  try {
    const meta = await stat(path);
    return meta.mtime !== null && meta.mtime !== undefined
      ? meta.mtime.getTime()
      : null;
  } catch {
    return null;
  }
}
