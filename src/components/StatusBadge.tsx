import {
  CheckCircle2,
  Loader2,
  Circle,
  OctagonAlert,
  Moon,
  type LucideIcon,
} from "lucide-react";
import type { StepStatus } from "@/lib/parse-state";
import { cn } from "@/lib/utils";

const MAP: Record<
  StepStatus,
  { icon: LucideIcon; label: string; className: string }
> = {
  done: {
    icon: CheckCircle2,
    label: "done",
    className: "text-emerald-600 dark:text-emerald-400",
  },
  "in-progress": {
    icon: Loader2,
    label: "in-progress",
    className: "text-amber-600 dark:text-amber-400",
  },
  pending: {
    icon: Circle,
    label: "pending",
    className: "text-muted-foreground",
  },
  blocked: {
    icon: OctagonAlert,
    label: "blocked",
    className: "text-red-600 dark:text-red-400",
  },
  parked: {
    icon: Moon,
    label: "parked",
    className: "text-muted-foreground",
  },
};

export function StatusIcon({ status }: { status: StepStatus }) {
  const { icon: Icon, className } = MAP[status];
  return <Icon className={cn("size-4 shrink-0", className)} aria-hidden />;
}

export function StatusBadge({ status }: { status: StepStatus }) {
  const { label, className } = MAP[status];
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {label}
    </span>
  );
}
