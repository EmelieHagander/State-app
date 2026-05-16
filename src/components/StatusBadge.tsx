import {
  CheckCircle2,
  CircleDot,
  Circle,
  AlertTriangle,
  MinusCircle,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import type { ItemStatus } from "@/lib/parse-state";
import { cn } from "@/lib/utils";

const MAP: Record<
  ItemStatus,
  { icon: LucideIcon; label: string; className: string }
> = {
  done: {
    icon: CheckCircle2,
    label: "done",
    className: "text-emerald-600 dark:text-emerald-400",
  },
  active: {
    icon: CircleDot,
    label: "active",
    className: "text-blue-600 dark:text-blue-400",
  },
  pending: {
    icon: Circle,
    label: "pending",
    className: "text-muted-foreground",
  },
  blocked: {
    icon: AlertTriangle,
    label: "blocked",
    className: "text-red-600 dark:text-red-400",
  },
  skipped: {
    icon: MinusCircle,
    label: "skipped",
    className: "text-muted-foreground line-through",
  },
  unknown: {
    icon: HelpCircle,
    label: "unknown",
    className: "text-muted-foreground",
  },
};

export function StatusIcon({ status }: { status: ItemStatus }) {
  const { icon: Icon, className } = MAP[status];
  return <Icon className={cn("size-4 shrink-0", className)} aria-hidden />;
}

export function StatusBadge({ status }: { status: ItemStatus }) {
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
