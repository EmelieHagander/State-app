import { load, type Store } from "@tauri-apps/plugin-store";

// The project registry: the list of STATE.md files this machine tracks.
// Persisted via tauri-plugin-store to registry.json in the OS app-data dir.
// STATE.md files themselves are never modified by this app.

export interface Project {
  id: string;
  name: string;
  statePath: string;
  color?: string;
  repoUrl?: string;
  addedAt: string;
}

const STORE_FILE = "registry.json";
const PROJECTS_KEY = "projects";

let storePromise: Promise<Store> | null = null;

function getStore(): Promise<Store> {
  if (storePromise === null) {
    storePromise = load(STORE_FILE, { defaults: {}, autoSave: true });
  }
  return storePromise;
}

export async function getProjects(): Promise<Project[]> {
  const store = await getStore();
  const projects = await store.get<Project[]>(PROJECTS_KEY);
  return projects ?? [];
}

async function setProjects(projects: Project[]): Promise<void> {
  const store = await getStore();
  await store.set(PROJECTS_KEY, projects);
  await store.save();
}

function newId(): string {
  return (
    Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10)
  );
}

export async function addProject(input: {
  name: string;
  statePath: string;
  color?: string;
  repoUrl?: string;
}): Promise<Project> {
  const projects = await getProjects();
  const project: Project = {
    id: newId(),
    name: input.name,
    statePath: input.statePath,
    addedAt: new Date().toISOString(),
    ...(input.color !== undefined ? { color: input.color } : {}),
    ...(input.repoUrl !== undefined ? { repoUrl: input.repoUrl } : {}),
  };
  await setProjects([...projects, project]);
  return project;
}

export async function removeProject(id: string): Promise<void> {
  const projects = await getProjects();
  await setProjects(projects.filter((p) => p.id !== id));
}

export async function updateProject(
  id: string,
  patch: Partial<Omit<Project, "id">>,
): Promise<Project | null> {
  const projects = await getProjects();
  let updated: Project | null = null;
  const next = projects.map((p) => {
    if (p.id !== id) return p;
    updated = { ...p, ...patch };
    return updated;
  });
  if (updated !== null) await setProjects(next);
  return updated;
}
