'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
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

interface BusinessInsightsProps {
  onClose?: () => void;
}

export function BusinessInsights({ onClose }: BusinessInsightsProps) {
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

  const TrendIndicator = ({ value, suffix = '%' }: { value: number; suffix?: string }) => {
    if (value === 0) return <span className="text-slate-400 text-xs">No change</span>;
    const isPositive = value > 0;
    return (
      <span className={`flex items-center gap-0.5 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {isPositive ? '+' : ''}{value}{suffix}
      </span>
    );
  };

  if (loading) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          <span className="ml-2 text-slate-500">Loading insights...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6 text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchInsights}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!insights) return null;

  const avgWonValue = Math.round((insights.avgWonValueLow + insights.avgWonValueHigh) / 2);
  const avgProposalValue = Math.round((insights.avgPriceLow + insights.avgPriceHigh) / 2);

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Business Insights
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); fetchInsights(); }}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="p-4 space-y-4">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Win Rate */}
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-1">
                <FileCheck className="w-4 h-4" />
                Win Rate
              </div>
              <div className="text-2xl font-bold text-green-800">
                {formatPercent(insights.winRate)}
              </div>
              <TrendIndicator value={insights.trends.winRateChange} suffix=" pts" />
            </div>

            {/* Avg Won Value */}
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-1">
                <DollarSign className="w-4 h-4" />
                Avg Won Value
              </div>
              <div className="text-2xl font-bold text-blue-800">
                {formatCurrency(avgWonValue)}
              </div>
              <span className="text-xs text-blue-600">per accepted proposal</span>
            </div>

            {/* Total Won Value (30 days) */}
            <div className="bg-amber-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-1">
                <TrendingUp className="w-4 h-4" />
                Won (30 days)
              </div>
              <div className="text-2xl font-bold text-amber-800">
                {formatCurrency(insights.recentWonValue)}
              </div>
              <TrendIndicator value={insights.trends.valueChange} />
            </div>

            {/* View to Accept Rate */}
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-purple-700 text-sm font-medium mb-1">
                <Eye className="w-4 h-4" />
                View → Accept
              </div>
              <div className="text-2xl font-bold text-purple-800">
                {formatPercent(insights.viewToAcceptRate)}
              </div>
              <span className="text-xs text-purple-600">{insights.avgViewsPerProposal} views/proposal</span>
            </div>
          </div>

          {/* Status Pipeline */}
          <div className="bg-slate-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Pipeline Overview</h4>
            <div className="flex gap-2">
              {[
                { label: 'Draft', value: insights.statusBreakdown.draft || 0, color: 'bg-slate-300' },
                { label: 'Sent', value: insights.statusBreakdown.sent || 0, color: 'bg-blue-400' },
                { label: 'Viewed', value: insights.statusBreakdown.viewed || 0, color: 'bg-purple-400' },
                { label: 'Accepted', value: insights.statusBreakdown.accepted || 0, color: 'bg-green-400' },
                { label: 'Won', value: insights.statusBreakdown.won || 0, color: 'bg-green-600' },
                { label: 'Lost', value: insights.statusBreakdown.lost || 0, color: 'bg-red-400' },
              ].map((status) => (
                <div key={status.label} className="flex-1 text-center">
                  <div className={`${status.color} h-8 rounded flex items-center justify-center text-white font-bold text-sm`}>
                    {status.value}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{status.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Time Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
                <Clock className="w-4 h-4" />
                Avg Time to First View
              </div>
              <div className="text-lg font-semibold">
                {insights.avgTimeToView !== null 
                  ? insights.avgTimeToView < 24 
                    ? `${insights.avgTimeToView} hours` 
                    : `${Math.round(insights.avgTimeToView / 24)} days`
                  : 'No data yet'}
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
                <Clock className="w-4 h-4" />
                Avg Time to Accept
              </div>
              <div className="text-lg font-semibold">
                {insights.avgTimeToAccept !== null 
                  ? insights.avgTimeToAccept < 24 
                    ? `${insights.avgTimeToAccept} hours` 
                    : `${Math.round(insights.avgTimeToAccept / 24)} days`
                  : 'No data yet'}
              </div>
            </div>
          </div>

          {/* Trade Performance */}
          {Object.keys(insights.tradeBreakdown).length > 0 && (
            <div className="bg-slate-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-slate-700 mb-3">Performance by Trade</h4>
              <div className="space-y-2">
                {Object.entries(insights.tradeBreakdown)
                  .sort((a, b) => b[1].count - a[1].count)
                  .slice(0, 5)
                  .map(([tradeId, data]) => (
                    <div key={tradeId} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 capitalize">{tradeId.replace(/-/g, ' ')}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-500">{data.count} proposals</span>
                        <span className="text-slate-500">
                          {formatCurrency(Math.round((data.avgPriceLow + data.avgPriceHigh) / 2))} avg
                        </span>
                        <span className={`font-medium ${data.winRate >= 50 ? 'text-green-600' : 'text-amber-600'}`}>
                          {Math.round(data.winRate)}% win
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="text-center text-sm text-slate-500 pt-2 border-t">
            <span className="font-medium">{insights.totalProposals}</span> total proposals · 
            <span className="font-medium"> {formatCurrency(Math.round((insights.totalValueLow + insights.totalValueHigh) / 2))}</span> total value · 
            <span className="font-medium"> {insights.recentProposals}</span> created in last 30 days
          </div>
        </CardContent>
      )}
    </Card>
  );
}
