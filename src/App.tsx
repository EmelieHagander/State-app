import { useState } from "react";
import type { Project } from "@/lib/registry";
import { Home } from "@/components/Home";
import { ProjectView } from "@/components/ProjectView";
import { Manage } from "@/components/Manage";

type View =
  | { kind: "home" }
  | { kind: "project"; project: Project }
  | { kind: "manage" };

function App() {
  const [view, setView] = useState<View>({ kind: "home" });

  if (view.kind === "project") {
    return (
      <ProjectView
        project={view.project}
        onBack={() => setView({ kind: "home" })}
      />
    );
  }
  if (view.kind === "manage") {
    return <Manage onBack={() => setView({ kind: "home" })} />;
  }
  return (
    <Home
      onOpenProject={(project) => setView({ kind: "project", project })}
      onManage={() => setView({ kind: "manage" })}
    />
  );
}

export default App;
