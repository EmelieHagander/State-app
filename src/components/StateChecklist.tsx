import { useEffect, useState } from "react";
import { StickyNote } from "lucide-react";
import type { ParsedState, Step } from "@/lib/parse-state";
import { StatusBadge, StatusIcon } from "@/components/StatusBadge";
import {
  readStepNote,
  writeStepNote,
  stepNoteExists,
} from "@/lib/notes";

function prHref(repoUrl: string | undefined, n: number): string | null {
  if (repoUrl === undefined || repoUrl.length === 0) return null;
  return `${repoUrl.replace(/\/+$/, "")}/pull/${n}`;
}

function PrBadge({
  pr,
  repoUrl,
}: {
  pr: { number: number; name: string };
  repoUrl: string | undefined;
}) {
  const label = `PR #${pr.number} ${pr.name}`;
  const href = prHref(repoUrl, pr.number);
  const cls =
    "rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground";
  if (href === null) return <span className={cls}>{label}</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`${cls} hover:bg-accent`}
    >
      {label}
    </a>
  );
}

function StepNoteEditor({
  projectId,
  step,
  onPersisted,
}: {
  projectId: string;
  step: Step;
  onPersisted: () => void;
}) {
  const [content, setContent] = useState<string | null>(null);
  const [saved, setSaved] = useState("");
  const [stampedTitle, setStampedTitle] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void readStepNote(projectId, step.ordinal).then((n) => {
      if (cancelled) return;
      setContent(n.content);
      setSaved(n.content);
      setStampedTitle(n.stampedTitle);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId, step.ordinal]);

  async function save() {
    if (content === null || content === saved) return;
    await writeStepNote(projectId, step.ordinal, step.title, content);
    setSaved(content);
    setStampedTitle(step.title);
    onPersisted();
  }

  if (content === null) {
    return (
      <p className="mt-1 text-xs text-muted-foreground">Loading note…</p>
    );
  }
  const drift =
    stampedTitle !== null &&
    stampedTitle.length > 0 &&
    stampedTitle !== step.title;
  return (
    <div className="mt-2">
      {drift && (
        <p className="mb-1 text-xs text-amber-600 dark:text-amber-400">
          Note was written for: “{stampedTitle}” — ordinal {step.ordinal} may
          have been renumbered.
        </p>
      )}
      <textarea
        value={content}
        onChange={(e) => setContent(e.currentTarget.value)}
        onBlur={() => void save()}
        placeholder="Private note for this step (saved on blur)."
        className="h-24 w-full resize-y rounded-md border bg-transparent p-2 font-mono text-xs outline-none"
        spellCheck={false}
      />
    </div>
  );
}

function StepRow({
  step,
  repoUrl,
  projectId,
}: {
  step: Step;
  repoUrl: string | undefined;
  projectId: string;
}) {
  const [open, setOpen] = useState(false);
  const [hasNote, setHasNote] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void stepNoteExists(projectId, step.ordinal).then((e) => {
      if (!cancelled) setHasNote(e);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId, step.ordinal]);

  return (
    <li className={step.depth > 1 ? "ml-6 mt-2" : "mt-3"}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5">
          <StatusIcon status={step.status} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {step.ordinal}
            </span>
            <span className="font-medium">{step.title}</span>
            <StatusBadge status={step.status} />
            {step.pr !== null && <PrBadge pr={step.pr} repoUrl={repoUrl} />}
            <button
              onClick={() => setOpen((v) => !v)}
              title={open ? "Hide note" : "Step note"}
              className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs hover:bg-accent"
            >
              <StickyNote
                className={`size-3 ${hasNote ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
              />
              {hasNote ? "Note" : "Add note"}
            </button>
          </div>
          {step.body.length > 0 && (
            <p className="mt-0.5 whitespace-pre-line text-sm text-muted-foreground">
              {step.body}
            </p>
          )}
          {open && (
            <StepNoteEditor
              projectId={projectId}
              step={step}
              onPersisted={() =>
                void stepNoteExists(projectId, step.ordinal).then(setHasNote)
              }
            />
          )}
        </div>
      </div>
      {step.children.length > 0 && (
        <ul>
          {step.children.map((c) => (
            <StepRow
              key={c.ordinal}
              step={c}
              repoUrl={repoUrl}
              projectId={projectId}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function StateChecklist({
  state,
  repoUrl,
  projectId,
}: {
  state: ParsedState;
  repoUrl?: string;
  projectId: string;
}) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">
          {state.title || "Untitled project"}
        </h1>
        {state.lastUpdated.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Last updated: {state.lastUpdated}
          </p>
        )}
      </header>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Where we are
        </h2>
        {state.currentFocus.length > 0 && (
          <p className="mt-1">
            <span className="font-medium">Current focus:</span>{" "}
            {state.currentFocus}
          </p>
        )}
        {state.where.length > 0 && (
          <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
            {state.where}
          </p>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Path
        </h2>
        {state.steps.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">No steps.</p>
        ) : (
          <ul>
            {state.steps.map((s) => (
              <StepRow
                key={s.ordinal}
                step={s}
                repoUrl={repoUrl}
                projectId={projectId}
              />
            ))}
          </ul>
        )}
      </section>

      {state.questions.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Open questions
          </h2>
          <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
            {state.questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
