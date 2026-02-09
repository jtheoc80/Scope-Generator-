import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Camera, Calendar, Plus, Crown, Users, Clock, AlertTriangle } from "lucide-react";

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
  subscriptionPlan,
  newProposalLabel = "New Proposal",
  scopeScanLabel = "ScopeScan",
  manageTemplatesLabel = "Manage Templates",
  upgradeLabel = "Upgrade",
  dateRange,
  onDateRangeChange,
  onUpgrade,
  language,
  hasActiveAccess,
  trialDaysRemaining,
  cancelAtPeriodEnd,
  currentPeriodEnd,
}: {
  title: string;
  subtitle: string;
  isPro?: boolean;
  subscriptionPlan?: string | null;
  newProposalLabel?: string;
  scopeScanLabel?: string;
  manageTemplatesLabel?: string;
  upgradeLabel?: string;
  dateRange?: DashboardDateRange;
  onDateRangeChange?: (range: DashboardDateRange) => void;
  onUpgrade?: () => void;
  language?: string;
  hasActiveAccess?: boolean;
  trialDaysRemaining?: number;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string | null;
}) {
  const es = language === "es";
  const isCrew = subscriptionPlan === 'crew';

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-semibold text-slate-900 md:text-3xl">
                {title}
              </h1>
              {isCrew ? (
                <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 shadow-sm animate-in fade-in zoom-in">
                  CREW
                </span>
              ) : isPro ? (
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 shadow-sm animate-in fade-in zoom-in">
                  PRO
                </span>
              ) : hasActiveAccess ? (
                <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 shadow-sm animate-in fade-in zoom-in">
                  ACTIVE
                </span>
              ) : null}
              {trialDaysRemaining !== undefined && trialDaysRemaining > 0 && !isPro && !isCrew && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-tight animate-pulse">
                  {trialDaysRemaining} {es ? "días de prueba" : "days left"}
                </span>
              )}
              {/* Subscription Expiration Badge */}
              {cancelAtPeriodEnd && currentPeriodEnd && (isPro || isCrew) && (() => {
                const endDate = new Date(currentPeriodEnd);
                const now = new Date();
                const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const isExpiringSoon = daysRemaining <= 7;

                return (
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight ${isExpiringSoon
                      ? 'border-red-300 bg-red-50 text-red-700 animate-pulse'
                      : 'border-amber-300 bg-amber-50 text-amber-700'
                    }`}>
                    <AlertTriangle className="w-3 h-3" />
                    {daysRemaining} {es ? "días restantes" : "days left"}
                  </span>
                );
              })()}
            </div>
            <p className="mt-1 truncate text-sm text-slate-500">{subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            {/* Upgrade Button - Only shown for non-Pro/non-Crew users */}
            {!isPro && !isCrew && onUpgrade && (
              <Button
                onClick={onUpgrade}
                className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 cursor-pointer shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                data-testid="button-upgrade"
              >
                <Crown className="h-4 w-4" />
                {upgradeLabel}
              </Button>
            )}

            {/* Team Button - Only shown for Crew users */}
            {isCrew && (
              <Button asChild variant="outline" className="gap-2 border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800">
                <Link href="/crew">
                  <Users className="h-4 w-4" />
                  Team
                </Link>
              </Button>
            )}

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

            <Button asChild className="gap-2 bg-orange-600 text-white hover:bg-orange-700 border border-orange-600 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200">
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

