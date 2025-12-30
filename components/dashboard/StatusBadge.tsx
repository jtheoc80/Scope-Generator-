import type React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Clock, Eye, Send } from "lucide-react";

type ProposalStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "won"
  | "lost"
  | "declined";

const STATUS_META: Record<
  ProposalStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }
> = {
  draft: {
    label: "Draft",
    icon: Clock,
    className: "border-border bg-muted text-muted-foreground",
  },
  sent: {
    label: "Sent",
    icon: Send,
    className: "border-border bg-card text-card-foreground",
  },
  viewed: {
    label: "Viewed",
    icon: Eye,
    className: "border-border bg-card text-card-foreground",
  },
  accepted: {
    label: "Accepted",
    icon: CheckCircle2,
    className: "border-border bg-card text-card-foreground",
  },
  won: {
    label: "Won",
    icon: CheckCircle2,
    className: "border-green-200 bg-green-50 text-green-700",
  },
  lost: {
    label: "Lost",
    icon: AlertCircle,
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  declined: {
    label: "Declined",
    icon: AlertCircle,
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
};

function normalizeStatus(status: string): ProposalStatus {
  const s = status.toLowerCase().trim();
  if (s === "draft") return "draft";
  if (s === "sent") return "sent";
  if (s === "viewed") return "viewed";
  if (s === "accepted") return "accepted";
  if (s === "won") return "won";
  if (s === "lost") return "lost";
  if (s === "declined") return "declined";
  // Fallback to "draft" for unknown statuses to keep the UI stable,
  // but log a warning so data quality issues are visible during development.
  console.warn(
    '[StatusBadge] Unknown proposal status encountered in normalizeStatus:',
    status,
  );
  return "draft";
}

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const meta = STATUS_META[normalizeStatus(status)];
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none",
        meta.className,
        className,
      )}
      title={label ?? meta.label}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label ?? meta.label}</span>
    </span>
  );
}

