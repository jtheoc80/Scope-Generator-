import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type PipelineStageKey =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "won"
  | "lost";

const STAGES: Array<{ key: PipelineStageKey; label: string }> = [
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "viewed", label: "Viewed" },
  { key: "accepted", label: "Accepted" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

function stageDot(stage: PipelineStageKey) {
  if (stage === "won") return "bg-green-500";
  if (stage === "lost") return "bg-red-500";
  return "bg-slate-300";
}

export function PipelineBar({
  title,
  counts,
  activeStage,
  onStageClick,
  className,
  t,
}: {
  title?: string;
  counts: Record<PipelineStageKey, number>;
  activeStage?: PipelineStageKey | "all";
  onStageClick?: (stage: PipelineStageKey) => void;
  className?: string;
  t?: (key: string) => string;
}) {
  const total = STAGES.reduce((sum, s) => sum + (counts[s.key] || 0), 0);
  const pipelineTitle = title ?? t?.("pipeline.title") ?? "Pipeline";
  const proposalsLabel = t?.("pipeline.proposals") ?? "proposals";

  return (
    <Card className={cn("rounded-2xl border-slate-200 bg-white shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between px-4 sm:px-6 py-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {pipelineTitle}
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {total.toLocaleString()} {proposalsLabel}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 pb-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-200 overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px">
            {STAGES.map((s) => {
              const isActive = activeStage === s.key;
              return (
                <div
                  key={s.key}
                  className={cn(
                    "bg-white px-4 py-4 transition-colors duration-200",
                    onStageClick ? "cursor-pointer hover:bg-slate-50" : "",
                    isActive ? "bg-slate-50 ring-inset ring-2 ring-primary/10" : ""
                  )}
                  onClick={() => onStageClick?.(s.key)}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", stageDot(s.key))} />
                    <div className={cn(
                      "text-xs font-semibold uppercase tracking-wide",
                      isActive ? "text-slate-900" : "text-slate-500"
                    )}>
                      {s.label}
                    </div>
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">
                    {(counts[s.key] || 0).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

