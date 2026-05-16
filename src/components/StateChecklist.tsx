import type { ParsedState, PathItem } from "@/lib/parse-state";
import { StatusBadge, StatusIcon } from "@/components/StatusBadge";

function Item({ item, depth }: { item: PathItem; depth: number }) {
  return (
    <li className={depth > 0 ? "ml-6 mt-2" : "mt-3"}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5">
          <StatusIcon status={item.status} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{item.title}</span>
            <StatusBadge status={item.status} />
          </div>
          {item.body.length > 0 && (
            <p className="mt-0.5 text-sm text-muted-foreground">{item.body}</p>
          )}
          {item.meta.length > 0 && (
            <p className="mt-0.5 text-xs italic text-muted-foreground">
              {item.meta}
            </p>
          )}
        </div>
      </div>
      {item.subItems.length > 0 && (
        <ul>
          {item.subItems.map((sub, i) => (
            <Item key={i} item={sub} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function StateChecklist({ state }: { state: ParsedState }) {
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
        {state.path.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">No path items.</p>
        ) : (
          <ul>
            {state.path.map((item, i) => (
              <Item key={i} item={item} depth={0} />
            ))}
          </ul>
        )}
      </section>

      {state.parked.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Parked
          </h2>
          <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
            {state.parked.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </section>
      )}

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
