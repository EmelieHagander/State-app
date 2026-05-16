import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import type { Project } from "@/lib/registry";
import { readStateFile } from "@/lib/state-md";
import { parseState, type ParsedState } from "@/lib/parse-state";
import { readNotes, writeNotes } from "@/lib/notes";
import { StateChecklist } from "@/components/StateChecklist";

export function ProjectView({
  project,
  onBack,
}: {
  project: Project;
  onBack: () => void;
}) {
  const [state, setState] = useState<ParsedState | null>(null);
  const [stateError, setStateError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [savedNotes, setSavedNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const loadState = useCallback(async () => {
    setStateError(null);
    try {
      const raw = await readStateFile(project.statePath);
      setState(parseState(raw));
    } catch (err) {
      setState(null);
      setStateError(err instanceof Error ? err.message : String(err));
    }
  }, [project.statePath]);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  useEffect(() => {
    let cancelled = false;
    void readNotes(project.id).then((content) => {
      if (cancelled) return;
      setNotes(content);
      setSavedNotes(content);
    });
    return () => {
      cancelled = true;
    };
  }, [project.id]);

  const saveNotes = useCallback(async () => {
    if (notes === savedNotes) return;
    setSaving(true);
    try {
      await writeNotes(project.id, notes);
      setSavedNotes(notes);
    } finally {
      setSaving(false);
    }
  }, [notes, savedNotes, project.id]);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm hover:bg-accent"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
        <span className="font-medium">{project.name}</span>
        <button
          onClick={() => void loadState()}
          className="ml-auto inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm hover:bg-accent"
          title="Re-read STATE.md from disk"
        >
          <RefreshCw className="size-4" />
          Refresh
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="w-3/5 overflow-y-auto border-r p-6">
          {stateError !== null ? (
            <div className="text-sm text-red-600 dark:text-red-400">
              <p className="font-medium">Could not read STATE.md</p>
              <p className="mt-1 break-all">{project.statePath}</p>
              <p className="mt-1">{stateError}</p>
            </div>
          ) : state === null ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <StateChecklist state={state} />
          )}
        </div>

        <div className="flex w-2/5 flex-col">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <span className="text-sm font-medium">Notes</span>
            <span className="text-xs text-muted-foreground">
              {saving
                ? "Saving…"
                : notes === savedNotes
                  ? "Saved"
                  : "Unsaved"}
            </span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
            onBlur={() => void saveNotes()}
            placeholder="Private, machine-local notes (markdown). Saved on blur."
            className="flex-1 resize-none bg-transparent p-4 font-mono text-sm outline-none"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
