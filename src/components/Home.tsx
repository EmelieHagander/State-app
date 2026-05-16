import { useCallback, useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Plus, RefreshCw, Settings } from "lucide-react";
import { addProject, getProjects, type Project } from "@/lib/registry";
import { readStateFile } from "@/lib/state-md";
import { parseState, currentStep, type Step } from "@/lib/parse-state";
import { StatusBadge } from "@/components/StatusBadge";

interface CardState {
  current: Step | null;
  lastUpdated: string;
  error: boolean;
}

function ProjectCard({
  project,
  data,
  onOpen,
}: {
  project: Project;
  data: CardState | undefined;
  onOpen: (p: Project) => void;
}) {
  const cur = data?.current ?? null;
  const onMainPath = cur !== null && cur.depth === 1;
  return (
    <button
      onClick={() => onOpen(project)}
      className="flex w-full flex-col gap-2 rounded-lg border p-4 text-left hover:bg-accent"
    >
      <div className="flex items-center gap-2">
        <span
          className="size-3 shrink-0 rounded-full"
          style={{
            backgroundColor: project.color ?? "var(--muted-foreground)",
          }}
        />
        <span className="font-medium">{project.name}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {data === undefined
            ? "…"
            : data.error
              ? "STATE.md not found"
              : data.lastUpdated
                ? `Updated ${data.lastUpdated}`
                : ""}
        </span>
      </div>
      {data !== undefined && !data.error && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {cur === null ? (
            <span className="text-muted-foreground">No active step</span>
          ) : (
            <>
              <span className="font-mono text-xs text-muted-foreground">
                {cur.ordinal}
              </span>
              <span>{cur.title}</span>
              <StatusBadge status={cur.status} />
              <span className="text-xs text-muted-foreground">
                {onMainPath ? "on main path" : `in subtask (${cur.ordinal})`}
              </span>
            </>
          )}
        </div>
      )}
    </button>
  );
}

export function Home({
  onOpenProject,
  onManage,
}: {
  onOpenProject: (p: Project) => void;
  onManage: () => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [cards, setCards] = useState<Record<string, CardState>>({});
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [repoInput, setRepoInput] = useState("");

  const readCard = useCallback(async (p: Project): Promise<CardState> => {
    try {
      const parsed = parseState(await readStateFile(p.statePath));
      return {
        current: currentStep(parsed),
        lastUpdated: parsed.lastUpdated,
        error: false,
      };
    } catch {
      return { current: null, lastUpdated: "", error: true };
    }
  }, []);

  const refreshAll = useCallback(async () => {
    const list = await getProjects();
    setProjects(list);
    const entries = await Promise.all(
      list.map(async (p) => [p.id, await readCard(p)] as const),
    );
    setCards(Object.fromEntries(entries));
  }, [readCard]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

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
    setRepoInput("");
  }

  async function confirmAdd() {
    if (pendingPath === null) return;
    const name = nameInput.trim();
    if (name.length === 0) return;
    const repo = repoInput.trim();
    await addProject({
      name,
      statePath: pendingPath,
      ...(repo.length > 0 ? { repoUrl: repo } : {}),
    });
    setPendingPath(null);
    setNameInput("");
    setRepoInput("");
    void refreshAll();
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <div className="flex gap-2">
          <button
            onClick={() => void refreshAll()}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-accent"
          >
            <RefreshCw className="size-4" />
            Refresh all
          </button>
          <button
            onClick={() => void pickFile()}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" />
            Add project
          </button>
          <button
            onClick={onManage}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-accent"
          >
            <Settings className="size-4" />
            Manage
          </button>
        </div>
      </header>

      {pendingPath !== null && (
        <div className="mt-4 space-y-3 rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Selected:{" "}
            <span className="break-all font-mono">{pendingPath}</span>
          </p>
          <input
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.currentTarget.value)}
            placeholder="Project name"
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none"
          />
          <input
            value={repoInput}
            onChange={(e) => setRepoInput(e.currentTarget.value)}
            placeholder="Repo URL (optional, e.g. https://github.com/org/repo)"
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none"
          />
          <div className="flex gap-2">
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
          <div className="rounded-lg border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No projects yet.
            </p>
            <button
              onClick={() => void pickFile()}
              className="mt-3 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="size-4" />
              Add your first project
            </button>
          </div>
        ) : (
          projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              data={cards[p.id]}
              onOpen={onOpenProject}
            />
          ))
        )}
      </div>
    </div>
  );
}
