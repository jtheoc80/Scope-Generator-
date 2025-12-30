import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface InsightsData {
  totalProposals: number;
  sentCount: number;
  viewedCount: number;
  acceptedCount: number;
  wonCount: number;
  lostCount: number;
  acceptanceRate: number;
  winRate: number;
  totalValueLow: number;
  totalValueHigh: number;
  wonValueLow: number;
  wonValueHigh: number;
  avgPriceLow: number;
  avgPriceHigh: number;
  avgWonValueLow: number;
  avgWonValueHigh: number;
  totalViews: number;
  avgViewsPerProposal: number;
  viewToAcceptRate: number;
  avgTimeToView: number | null;
  avgTimeToAccept: number | null;
  statusBreakdown: Record<string, number>;
  tradeBreakdown: Record<
    string,
    { count: number; avgPriceLow: number; avgPriceHigh: number; winRate: number }
  >;
  recentProposals: number;
  recentWonValue: number;
  trends: {
    proposalsChange: number;
    valueChange: number;
    winRateChange: number;
  };
}

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function pct(value: number) {
  const v = Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(100, v));
}

export function InsightsPanel({
  insights,
  locale = "en-US",
  className,
}: {
  insights: InsightsData;
  locale?: string;
  className?: string;
}) {
  const avgWonValue = Math.round((insights.avgWonValueLow + insights.avgWonValueHigh) / 2);
  const viewToAccept = pct(insights.viewToAcceptRate);
  const winRate = pct(insights.winRate);

  const tradeRows = Object.entries(insights.tradeBreakdown || {})
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8);

  return (
    <div className={cn("space-y-6", className)}>
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="px-6 py-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Business insights
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            High-signal performance metrics
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Win rate
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">
                    {Math.round(winRate)}%
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Percent of proposals marked won
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  {insights.wonCount} won · {insights.lostCount} lost
                </div>
              </div>
              <div className="mt-3">
                <Progress value={winRate} className="h-2 bg-slate-100" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Avg won value
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">
                    {formatCurrency(avgWonValue, locale)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Average value of won proposals
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  {formatCurrency(
                    Math.round((insights.wonValueLow + insights.wonValueHigh) / 2),
                    locale,
                  )}{" "}
                  total
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    View → accept
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">
                    {Math.round(viewToAccept)}%
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Acceptance rate after a proposal is viewed
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  {insights.avgViewsPerProposal} avg views / proposal
                </div>
              </div>
              <div className="mt-3">
                <Progress value={viewToAccept} className="h-2 bg-slate-100" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="px-6 py-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Performance by trade
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            Where you win (and what it’s worth)
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          {tradeRows.length === 0 ? (
            <div className="px-6 pb-6 text-sm text-slate-500">
              No trade performance yet. Create a few proposals to start seeing benchmarks.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Trade</th>
                    <th className="px-6 py-3 text-left font-semibold">Proposals</th>
                    <th className="px-6 py-3 text-left font-semibold">Avg $</th>
                    <th className="px-6 py-3 text-left font-semibold">Win %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tradeRows.map(([tradeId, row]) => (
                    <tr key={tradeId} className="bg-white">
                      <td className="px-6 py-3 text-slate-900">
                        <span className="capitalize">{tradeId.replace(/-/g, " ")}</span>
                      </td>
                      <td className="px-6 py-3 text-slate-700">{row.count}</td>
                      <td className="px-6 py-3 text-slate-700">
                        {formatCurrency(
                          Math.round((row.avgPriceLow + row.avgPriceHigh) / 2),
                          locale,
                        )}
                      </td>
                      <td className="px-6 py-3 font-semibold text-slate-900">
                        {Math.round(pct(row.winRate))}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

