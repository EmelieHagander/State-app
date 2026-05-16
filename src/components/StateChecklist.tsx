import type { ParsedState, Step } from "@/lib/parse-state";
import { StatusBadge, StatusIcon } from "@/components/StatusBadge";

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

function StepRow({
  step,
  repoUrl,
}: {
  step: Step;
  repoUrl: string | undefined;
}) {
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
            {step.pr !== null && (
              <PrBadge pr={step.pr} repoUrl={repoUrl} />
            )}
          </div>
          {step.body.length > 0 && (
            <p className="mt-0.5 whitespace-pre-line text-sm text-muted-foreground">
              {step.body}
            </p>
          )}
        </div>
      </div>
      {step.children.length > 0 && (
        <ul>
          {step.children.map((c) => (
            <StepRow key={c.ordinal} step={c} repoUrl={repoUrl} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function StateChecklist({
  state,
  repoUrl,
}: {
  state: ParsedState;
  repoUrl?: string;
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
              <StepRow key={s.ordinal} step={s} repoUrl={repoUrl} />
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
