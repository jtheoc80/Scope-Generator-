import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Camera, Calendar, Plus } from "lucide-react";

export type DashboardDateRange = "7d" | "30d" | "90d" | "all";

function rangeLabel(range: DashboardDateRange, language?: string) {
  const es = language === "es";
  if (range === "7d") return es ? "Últimos 7 días" : "Last 7 days";
  if (range === "30d") return es ? "Últimos 30 días" : "Last 30 days";
  if (range === "90d") return es ? "Últimos 90 días" : "Last 90 days";
  return es ? "Todo el tiempo" : "All time";
}

export function DashboardPageHeader({
  title,
  subtitle,
  isPro,
  newProposalLabel = "New Proposal",
  scopeScanLabel = "ScopeScan",
  manageTemplatesLabel = "Manage Templates",
  dateRange,
  onDateRangeChange,
  language,
}: {
  title: string;
  subtitle: string;
  isPro?: boolean;
  newProposalLabel?: string;
  scopeScanLabel?: string;
  manageTemplatesLabel?: string;
  dateRange?: DashboardDateRange;
  onDateRangeChange?: (range: DashboardDateRange) => void;
  language?: string;
}) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-semibold text-slate-900 md:text-3xl">
                {title}
              </h1>
              {isPro ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  PRO
                </span>
              ) : null}
            </div>
            <p className="mt-1 truncate text-sm text-slate-500">{subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            {dateRange && onDateRangeChange ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 text-slate-700">
                    <Calendar className="h-4 w-4" />
                    {rangeLabel(dateRange, language)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onDateRangeChange("7d")}>
                    {rangeLabel("7d", language)}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDateRangeChange("30d")}>
                    {rangeLabel("30d", language)}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDateRangeChange("90d")}>
                    {rangeLabel("90d", language)}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDateRangeChange("all")}>
                    {rangeLabel("all", language)}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}

            <Button asChild className="gap-2 bg-orange-600 text-white hover:bg-orange-700 border border-orange-600">
              <Link href="/app" data-testid="button-new-proposal">
                <Plus className="h-4 w-4" />
                {newProposalLabel}
              </Link>
            </Button>

            <Button asChild variant="outline" className="gap-2" >
              <Link
                href="/m/create"
                data-testid="button-photo-capture"
                title="Start ScopeScan™"
              >
                <Camera className="h-4 w-4" />
                {scopeScanLabel}
              </Link>
            </Button>

            <Button asChild variant="ghost" className="text-slate-700">
              <Link href="/settings">{manageTemplatesLabel}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

