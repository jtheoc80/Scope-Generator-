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
  title = "Pipeline",
  counts,
  className,
}: {
  title?: string;
  counts: Record<PipelineStageKey, number>;
  className?: string;
}) {
  const total = STAGES.reduce((sum, s) => sum + (counts[s.key] || 0), 0);

  return (
    <Card className={cn("rounded-2xl border-slate-200 bg-white shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between px-6 py-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {total.toLocaleString()} proposals
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        <div className="overflow-x-auto">
          <div className="min-w-[720px] rounded-2xl border border-slate-200 bg-white">
            <div className="grid grid-cols-6 divide-x divide-slate-200">
              {STAGES.map((s) => (
                <div key={s.key} className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", stageDot(s.key))} />
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {s.label}
                    </div>
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">
                    {(counts[s.key] || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

