import { useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Plus } from "lucide-react";
import {
  addProject,
  getProjects,
  type Project,
} from "@/lib/registry";
import { readStateFile } from "@/lib/state-md";
import { parseState } from "@/lib/parse-state";

function ProjectRow({
  project,
  onOpen,
}: {
  project: Project;
  onOpen: (p: Project) => void;
}) {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void readStateFile(project.statePath)
      .then((raw) => {
        if (cancelled) return;
        setLastUpdated(parseState(raw).lastUpdated || null);
      })
      .catch(() => {
        if (!cancelled) setMissing(true);
      });
    return () => {
      cancelled = true;
    };
  }, [project.statePath]);

  return (
    <button
      onClick={() => onOpen(project)}
      className="flex w-full items-center gap-3 rounded-lg border p-4 text-left hover:bg-accent"
    >
      <span
        className="size-3 shrink-0 rounded-full"
        style={{ backgroundColor: project.color ?? "var(--muted-foreground)" }}
      />
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{project.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {project.statePath}
        </span>
      </span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {missing
          ? "STATE.md not found"
          : lastUpdated
            ? `Updated ${lastUpdated}`
            : ""}
      </span>
    </button>
  );
}

export function ProjectsView({
  onOpenProject,
}: {
  onOpenProject: (p: Project) => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");

  const refresh = () => {
    void getProjects().then(setProjects);
  };

  useEffect(refresh, []);

  async function pickFile() {
    const selected = await open({
      multiple: false,
      directory: false,
      filters: [{ name: "Markdown", extensions: ["md"] }],
    });
    if (typeof selected !== "string") return;
    const base = selected.split(/[/\\]/).filter(Boolean);
    const parent = base.length >= 2 ? base[base.length - 2] : undefined;
    setPendingPath(selected);
    setNameInput(parent ?? "New project");
  }

  async function confirmAdd() {
    if (pendingPath === null) return;
    const name = nameInput.trim();
    if (name.length === 0) return;
    await addProject({ name, statePath: pendingPath });
    setPendingPath(null);
    setNameInput("");
    refresh();
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <button
          onClick={() => void pickFile()}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="size-4" />
          Add Project
        </button>
      </header>

      {pendingPath !== null && (
        <div className="mt-4 rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Selected:{" "}
            <span className="break-all font-mono">{pendingPath}</span>
          </p>
          <div className="mt-3 flex gap-2">
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void confirmAdd();
                if (e.key === "Escape") setPendingPath(null);
              }}
              placeholder="Project name"
              className="flex-1 rounded-md border bg-transparent px-3 py-2 text-sm outline-none"
            />
            <button
              onClick={() => void confirmAdd()}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Add
            </button>
            <button
              onClick={() => setPendingPath(null)}
              className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No projects yet. Click “Add Project” and pick a STATE.md file.
          </p>
        ) : (
          projects.map((p) => (
            <ProjectRow key={p.id} project={p} onOpen={onOpenProject} />
          ))
        )}
      </div>
    </div>
  );
}
