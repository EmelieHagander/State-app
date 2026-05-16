import { readTextFile } from "@tauri-apps/plugin-fs";

// Reads a project's STATE.md from disk. The app is a read-only viewer:
// it never writes to STATE.md. Parsing happens in the view layer.
export async function readStateFile(path: string): Promise<string> {
  return readTextFile(path);
}
