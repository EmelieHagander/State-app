import { useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import {
  addProject,
  getProjects,
  removeProject,
  updateProject,
  type Project,
} from "@/lib/registry";

const PALETTE = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

function Row({
  project,
  onChanged,
}: {
  project: Project;
  onChanged: () => void;
}) {
  const [name, setName] = useState(project.name);
  const [repoUrl, setRepoUrl] = useState(project.repoUrl ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function commit(patch: Partial<Omit<Project, "id">>) {
    await updateProject(project.id, patch);
    onChanged();
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          onBlur={() => {
            const v = name.trim();
            if (v.length > 0 && v !== project.name) void commit({ name: v });
          }}
          className="flex-1 rounded-md border bg-transparent px-3 py-2 text-sm outline-none"
        />
        {confirmDelete ? (
          <>
            <button
              onClick={() => {
                void removeProject(project.id).then(onChanged);
              }}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Confirm remove
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            title="Remove project (keeps its notes)"
            className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-accent"
          >
            <Trash2 className="size-4" />
            Remove
          </button>
        )}
      </div>

      <p className="break-all font-mono text-xs text-muted-foreground">
        {project.statePath}
      </p>

      <input
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.currentTarget.value)}
        onBlur={() => {
          const v = repoUrl.trim();
          if (v !== (project.repoUrl ?? "")) void commit({ repoUrl: v });
        }}
        placeholder="Repo URL (optional)"
        className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none"
      />

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Color:</span>
        {PALETTE.map((c) => (
          <button
            key={c}
            onClick={() => void commit({ color: c })}
            className="size-5 rounded-full border"
            style={{
              backgroundColor: c,
              outline: project.color === c ? "2px solid var(--ring)" : "none",
            }}
            aria-label={`Set color ${c}`}
          />
        ))}
      </div>
    </div>
  );
}

export function Manage({ onBack }: { onBack: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");

  const refresh = () => {
    void getProjects().then(setProjects);
  };

  useEffect(refresh, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && pendingPath === null) onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack, pendingPath]);

  async function pickFile() {
    const selected = await open({
      multiple: false,
      directory: false,
      filters: [{ name: "Markdown", extensions: ["md"] }],
    });
    if (typeof selected !== "string") return;
    const parts = selected.split(/[/\\]/).filter(Boolean);
    const parent = parts.length >= 2 ? parts[parts.length - 2] : undefined;
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
      <header className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm hover:bg-accent"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
        <h1 className="text-2xl font-semibold">Manage projects</h1>
        <button
          onClick={() => void pickFile()}
          className="ml-auto inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="size-4" />
          Add project
        </button>
      </header>

      {pendingPath !== null && (
        <div className="mt-4 space-y-3 rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Selected:{" "}
            <span className="break-all font-mono">{pendingPath}</span>
          </p>
          <div className="flex gap-2">
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
            No projects yet. Add one above.
          </p>
        ) : (
          projects.map((p) => (
            <Row key={p.id} project={p} onChanged={refresh} />
          ))
        )}
      </div>
    </div>
  );
}
