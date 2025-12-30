import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  iconTone = "slate",
  className,
}: {
  label: string;
  value: string;
  helper?: string;
  icon: LucideIcon;
  iconTone?: "slate" | "orange" | "green" | "blue";
  className?: string;
}) {
  const chip = {
    slate: "bg-slate-100 text-slate-700",
    orange: "bg-orange-100 text-orange-700",
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
  }[iconTone];

  return (
    <Card className={cn("rounded-2xl border-slate-200 bg-white shadow-sm", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {label}
            </div>
            <div className="mt-2 text-2xl font-semibold leading-none text-slate-900">
              {value}
            </div>
            {helper ? (
              <div className="mt-2 text-xs text-slate-500">{helper}</div>
            ) : null}
          </div>

          <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", chip)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

