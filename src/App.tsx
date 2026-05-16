import { useState } from "react";
import type { Project } from "@/lib/registry";
import { ProjectsView } from "@/components/ProjectsView";
import { ProjectView } from "@/components/ProjectView";

function App() {
  const [active, setActive] = useState<Project | null>(null);

  if (active !== null) {
    return <ProjectView project={active} onBack={() => setActive(null)} />;
  }
  return <ProjectsView onOpenProject={setActive} />;
}

export default App;
