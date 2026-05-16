import { useCallback, useEffect, useRef, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Plus, RefreshCw, Settings } from "lucide-react";
import { addProject, getProjects, type Project } from "@/lib/registry";
import { readStateFile, statStateFile } from "@/lib/state-md";
import {
  parseState,
  currentStep,
  summarize,
  type Step,
} from "@/lib/parse-state";
import { StatusBadge } from "@/components/StatusBadge";

const STALE_DAYS = 14;

interface CardState {
  error: boolean;
  noSteps: boolean;
  current: Step | null;
  lastUpdated: string;
  total: number;
  done: number;
  progress: number;
  blocked: number;
  skipped: number;
  staleDays: number | null;
  dateBad: boolean;
  updatedAtMs: number;
  mtime: number | null;
}

function isAttention(c: CardState, changed: boolean): boolean {
  return (
    c.error ||
    c.noSteps ||
    c.blocked > 0 ||
    c.skipped > 0 ||
    c.dateBad ||
    (c.staleDays !== null && c.staleDays > STALE_DAYS) ||
    changed
  );
}

function ProjectCard({
  project,
  data,
  changed,
  onOpen,
}: {
  project: Project;
  data: CardState | undefined;
  changed: boolean;
  onOpen: (p: Project) => void;
}) {
  const cur = data?.current ?? null;
  const onMainPath = cur !== null && cur.depth === 1;
  return (
    <button
      onClick={() => onOpen(project)}
      className="flex w-full flex-col gap-2 rounded-lg border p-4 text-left hover:bg-accent"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="size-3 shrink-0 rounded-full"
          style={{
            backgroundColor: project.color ?? "var(--muted-foreground)",
          }}
        />
        <span className="font-medium">{project.name}</span>
        {data !== undefined && !data.error && (
          <span className="text-xs text-muted-foreground">
            {data.done}/{data.total} (
            {Math.round(data.progress * 100)}%)
          </span>
        )}
        {data !== undefined && data.blocked > 0 && (
          <span className="rounded-full border border-red-600/40 px-2 py-0.5 text-xs text-red-600 dark:text-red-400">
            {data.blocked} blocked
          </span>
        )}
        {data !== undefined && data.skipped > 0 && (
          <span className="rounded-full border border-amber-600/40 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400">
            {data.skipped} dropped
          </span>
        )}
        {data !== undefined &&
          !data.dateBad &&
          data.staleDays !== null &&
          data.staleDays > STALE_DAYS && (
            <span className="rounded-full border border-amber-600/40 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400">
              stale {data.staleDays}d
            </span>
          )}
        {data !== undefined && data.dateBad && (
          <span className="rounded-full border border-amber-600/40 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400">
            date?
          </span>
        )}
        {changed && (
          <span className="rounded-full border border-amber-600/40 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400">
            updated — refresh
          </span>
        )}
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

      {data !== undefined && !data.error && !data.noSteps && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-emerald-600 dark:bg-emerald-400"
            style={{ width: `${Math.round(data.progress * 100)}%` }}
          />
        </div>
      )}

      {data !== undefined && data.error && (
        <p className="break-all text-sm text-red-600 dark:text-red-400">
          Could not read {project.statePath}
        </p>
      )}
      {data !== undefined && !data.error && data.noSteps && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          No valid steps parsed — check the file against STATE-FORMAT.md
        </p>
      )}
      {data !== undefined && !data.error && !data.noSteps && (
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
  const [changedIds, setChangedIds] = useState<Record<string, boolean>>({});
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [repoInput, setRepoInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const recordedMtimes = useRef<Record<string, number | null>>({});

  const readCard = useCallback(async (p: Project): Promise<CardState> => {
    const mtime = await statStateFile(p.statePath);
    try {
      const parsed = parseState(await readStateFile(p.statePath));
      const s = summarize(parsed);
      let staleDays: number | null = null;
      let dateBad = false;
      let updatedAtMs = 0;
      if (parsed.lastUpdated.length > 0) {
        const d = new Date(`${parsed.lastUpdated}T00:00:00`);
        if (Number.isNaN(d.getTime())) {
          dateBad = true;
        } else {
          updatedAtMs = d.getTime();
          staleDays = Math.floor((Date.now() - d.getTime()) / 86400000);
        }
      } else {
        dateBad = true;
      }
      return {
        error: false,
        noSteps: parsed.flat.length === 0,
        current: currentStep(parsed),
        lastUpdated: parsed.lastUpdated,
        total: s.total,
        done: s.done,
        progress: s.progress,
        blocked: s.blocked,
        skipped: parsed.skipped.length,
        staleDays,
        dateBad,
        updatedAtMs,
        mtime,
      };
    } catch {
      return {
        error: true,
        noSteps: false,
        current: null,
        lastUpdated: "",
        total: 0,
        done: 0,
        progress: 0,
        blocked: 0,
        skipped: 0,
        staleDays: null,
        dateBad: false,
        updatedAtMs: 0,
        mtime,
      };
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const list = await getProjects();
      setProjects(list);
      const entries = await Promise.all(
        list.map(async (p) => [p.id, await readCard(p)] as const),
      );
      const map = Object.fromEntries(entries);
      setCards(map);
      const mt: Record<string, number | null> = {};
      for (const [id, c] of entries) mt[id] = c.mtime;
      recordedMtimes.current = mt;
      setChangedIds({});
      setLastRefresh(new Date());
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [readCard]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  // Focus-triggered staleness check (no continuous polling): when the user
  // comes back, re-stat each file and flag any that changed since refresh.
  useEffect(() => {
    const onFocus = () => {
      const current = projects;
      void Promise.all(
        current.map(
          async (p) => [p.id, await statStateFile(p.statePath)] as const,
        ),
      ).then((pairs) => {
        setChangedIds((prev) => {
          const next = { ...prev };
          for (const [id, m] of pairs) {
            const rec = recordedMtimes.current[id] ?? null;
            if (m !== null && rec !== null && m > rec) next[id] = true;
          }
          return next;
        });
      });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [projects]);

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

  const ordered = [...projects].sort((a, b) => {
    const ca = cards[a.id];
    const cb = cards[b.id];
    if (ca === undefined || cb === undefined) return 0;
    const aa = isAttention(ca, changedIds[a.id] ?? false);
    const ab = isAttention(cb, changedIds[b.id] ?? false);
    if (aa !== ab) return aa ? -1 : 1;
    if (cb.updatedAtMs !== ca.updatedAtMs) return cb.updatedAtMs - ca.updatedAtMs;
    return a.name.localeCompare(b.name);
  });

  const agg = (() => {
    let main = 0;
    let sub = 0;
    let blocked = 0;
    let stale = 0;
    let warn = 0;
    for (const p of projects) {
      const c = cards[p.id];
      if (c === undefined) continue;
      if (c.error || c.noSteps || c.skipped > 0 || c.dateBad) warn += 1;
      if (c.blocked > 0) blocked += 1;
      if (!c.dateBad && c.staleDays !== null && c.staleDays > STALE_DAYS)
        stale += 1;
      if (c.current !== null) {
        if (c.current.depth === 1) main += 1;
        else sub += 1;
      }
    }
    return { main, sub, blocked, stale, warn };
  })();

  return (
    <div className="mx-auto max-w-3xl p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <div className="flex gap-2">
          <button
            onClick={() => void refreshAll()}
            disabled={refreshing}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw
              className={`size-4 ${refreshing ? "animate-spin" : ""}`}
            />
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

      {!loading && projects.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {projects.length} project{projects.length === 1 ? "" : "s"} ·{" "}
          {agg.main} on main path · {agg.sub} in subtask · {agg.blocked}{" "}
          blocked · {agg.stale} stale · {agg.warn} with parse warnings
          {lastRefresh !== null
            ? ` · read ${lastRefresh.toLocaleTimeString()}`
            : ""}
        </p>
      )}

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
            onKeyDown={(e) => {
              if (e.key === "Enter") void confirmAdd();
              if (e.key === "Escape") setPendingPath(null);
            }}
            placeholder="Project name"
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none"
          />
          <input
            value={repoInput}
            onChange={(e) => setRepoInput(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void confirmAdd();
              if (e.key === "Escape") setPendingPath(null);
            }}
            placeholder="Repo URL (optional, e.g. https://github.com/org/repo)"
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => void confirmAdd()}
              disabled={nameInput.trim().length === 0}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
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
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : projects.length === 0 ? (
          <div className="rounded-lg border p-6 text-center">
            <p className="text-sm text-muted-foreground">No projects yet.</p>
            <button
              onClick={() => void pickFile()}
              className="mt-3 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="size-4" />
              Add your first project
            </button>
          </div>
        ) : (
          ordered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              data={cards[p.id]}
              changed={changedIds[p.id] ?? false}
              onOpen={onOpenProject}
            />
          ))
        )}
      </div>
    </div>
  );
}
