'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  DollarSign, 
  Eye, 
  FileCheck, 
  Clock, 
  BarChart3,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface InsightsData {
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
  tradeBreakdown: Record<string, { 
    count: number; 
    avgPriceLow: number; 
    avgPriceHigh: number;
    winRate: number;
  }>;
  recentProposals: number;
  recentWonValue: number;
  trends: {
    proposalsChange: number;
    valueChange: number;
    winRateChange: number;
  };
}

export function BusinessInsights() {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analytics/insights');
      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }
      const data = await response.json();
      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => `${value}%`;

  function DeltaBadge({ value, suffix = "%" }: { value: number; suffix?: string }) {
    if (value === 0) {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          0{suffix}
        </Badge>
      );
    }
    const isPositive = value > 0;
    return (
      <Badge
        variant="outline"
        className={isPositive ? "text-emerald-700 border-emerald-200 bg-emerald-50/40" : "text-red-700 border-red-200 bg-red-50/40"}
      >
        {isPositive ? "↑" : "↓"} {Math.abs(value)}
        {suffix}
      </Badge>
    );
  }

  function InsightStatCard({
    title,
    value,
    helper,
    icon: Icon,
    delta,
    deltaSuffix,
  }: {
    title: string;
    value: string;
    helper?: string;
    icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
    delta?: number;
    deltaSuffix?: string;
  }) {
    return (
      <Card className="rounded-lg border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
              {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
            </div>
            <div className="flex items-center gap-2">
              {typeof delta === "number" ? (
                <DeltaBadge value={delta} suffix={deltaSuffix} />
              ) : null}
              <Icon className="h-5 w-5 text-muted-foreground/70" aria-hidden />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function PipelineSegmentBar({ breakdown }: { breakdown: Record<string, number> }) {
    const items = [
      { key: "draft", label: "Draft", value: breakdown.draft || 0, className: "bg-muted" },
      { key: "sent", label: "Sent", value: breakdown.sent || 0, className: "bg-primary/20" },
      { key: "viewed", label: "Viewed", value: breakdown.viewed || 0, className: "bg-primary/15" },
      { key: "accepted", label: "Accepted", value: breakdown.accepted || 0, className: "bg-emerald-500/20" },
      { key: "won", label: "Won", value: breakdown.won || 0, className: "bg-emerald-500/30" },
      { key: "lost", label: "Lost", value: breakdown.lost || 0, className: "bg-red-500/15" },
    ];

    const total = items.reduce((sum, i) => sum + i.value, 0);

    return (
      <div className="space-y-3">
        <div className="flex h-3 overflow-hidden rounded-full border bg-background">
          {items.map((s) => {
            const pct = total > 0 ? (s.value / total) * 100 : 0;
            return (
              <div
                key={s.key}
                className={s.className}
                style={{ width: `${pct}%` }}
                aria-label={`${s.label}: ${s.value}`}
                title={`${s.label}: ${s.value}`}
              />
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {items.map((s) => (
            <div key={s.key} className="flex items-center justify-between rounded-md border bg-card px-3 py-2">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${s.className}`} aria-hidden />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <span className="text-xs font-semibold text-foreground">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <Card className="rounded-lg border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" aria-hidden />
            <CardTitle className="text-base">Business Insights</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="rounded-lg border-border shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-28" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-24 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-lg border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" aria-hidden />
            <CardTitle className="text-base">Business Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchInsights}>
            <RefreshCw className="w-4 h-4" aria-hidden />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!insights) return null;

  const avgWonValue = Math.round((insights.avgWonValueLow + insights.avgWonValueHigh) / 2);

  return (
    <TooltipProvider>
      <Card className="rounded-lg border-border shadow-sm">
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" aria-hidden />
              <CardTitle className="text-base">Business Insights</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchInsights();
                    }}
                    aria-label="Refresh insights"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" aria-label={expanded ? "Collapse insights" : "Expand insights"}>
                      {expanded ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
                    </Button>
                  </CollapsibleTrigger>
                </TooltipTrigger>
                <TooltipContent>{expanded ? "Collapse" : "Expand"}</TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <InsightStatCard
                  title="Win Rate"
                  value={formatPercent(insights.winRate)}
                  helper="of proposals won"
                  icon={FileCheck}
                  delta={insights.trends.winRateChange}
                  deltaSuffix=" pts"
                />
                <InsightStatCard
                  title="Avg Won Value"
                  value={formatCurrency(avgWonValue)}
                  helper="per accepted proposal"
                  icon={DollarSign}
                />
                <InsightStatCard
                  title="Won (30 days)"
                  value={formatCurrency(insights.recentWonValue)}
                  helper="total revenue won"
                  icon={DollarSign}
                  delta={insights.trends.valueChange}
                />
                <InsightStatCard
                  title="View → Accept"
                  value={formatPercent(insights.viewToAcceptRate)}
                  helper={`${insights.avgViewsPerProposal} views/proposal`}
                  icon={Eye}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">Pipeline Overview</h3>
                  <p className="text-xs text-muted-foreground">
                    {insights.totalProposals} total proposals
                  </p>
                </div>
                <PipelineSegmentBar breakdown={insights.statusBreakdown} />
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Card className="rounded-lg border-border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Avg time to first view</p>
                        <p className="text-sm font-semibold text-foreground">
                          {insights.avgTimeToView !== null
                            ? insights.avgTimeToView < 24
                              ? `${insights.avgTimeToView} hours`
                              : `${Math.round(insights.avgTimeToView / 24)} days`
                            : "No data yet"}
                        </p>
                      </div>
                      <Clock className="h-5 w-5 text-muted-foreground/70" aria-hidden />
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border-border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Avg time to accept</p>
                        <p className="text-sm font-semibold text-foreground">
                          {insights.avgTimeToAccept !== null
                            ? insights.avgTimeToAccept < 24
                              ? `${insights.avgTimeToAccept} hours`
                              : `${Math.round(insights.avgTimeToAccept / 24)} days`
                            : "No data yet"}
                        </p>
                      </div>
                      <Clock className="h-5 w-5 text-muted-foreground/70" aria-hidden />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {Object.keys(insights.tradeBreakdown).length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">Performance by trade</h3>
                    <p className="text-xs text-muted-foreground">Top 5 by volume</p>
                  </div>
                  <div className="rounded-lg border bg-card">
                    <div className="divide-y">
                      {Object.entries(insights.tradeBreakdown)
                        .sort((a, b) => b[1].count - a[1].count)
                        .slice(0, 5)
                        .map(([tradeId, data]) => (
                          <div key={tradeId} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm font-medium text-foreground capitalize">
                              {tradeId.replace(/-/g, ' ')}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span>{data.count} proposals</span>
                              <span>{formatCurrency(Math.round((data.avgPriceLow + data.avgPriceHigh) / 2))} avg</span>
                              <Badge
                                variant="outline"
                                className={data.winRate >= 50 ? "border-emerald-200 bg-emerald-50/40 text-emerald-700" : "border-amber-200 bg-amber-50/40 text-amber-700"}
                              >
                                {Math.round(data.winRate)}% win
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{insights.totalProposals}</span> total proposals ·{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(Math.round((insights.totalValueLow + insights.totalValueHigh) / 2))}
                </span>{" "}
                total value ·{" "}
                <span className="font-medium text-foreground">{insights.recentProposals}</span> created in last 30 days
              </p>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </TooltipProvider>
  );
}
