'use client';
import { useCostServiceStatus, useTradePricing } from "@/hooks/use-cost-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, DollarSign, Hammer } from "lucide-react";

interface CostInsightsProps {
  tradeId: string;
  address: string;
}

function extractZipCode(address: string): string | null {
  const zipMatch = address.match(/\b(\d{5})(?:-\d{4})?\b/);
  return zipMatch ? zipMatch[1] : null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function CostInsights({ tradeId, address }: CostInsightsProps) {
  const zipcode = extractZipCode(address);
  const { data: status } = useCostServiceStatus();
  const { data: pricing, isLoading, error } = useTradePricing(
    tradeId || "",
    zipcode || ""
  );

  if (!status?.available) {
    return null;
  }

  if (!tradeId || !zipcode) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-4 flex items-center justify-center gap-2 text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading market pricing for {zipcode}...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !pricing) {
    return null;
  }

  const hasMaterials = pricing.materials && pricing.materials.length > 0;
  const hasLabor = pricing.labor && pricing.labor.length > 0;

  if (!hasMaterials && !hasLabor) {
    return null;
  }

  const tradeNames: Record<string, string> = {
    bathroom: "Bathroom Remodel",
    kitchen: "Kitchen Remodel",
    roofing: "Roofing",
    plumbing: "Plumbing",
    electrical: "Electrical",
    hvac: "HVAC",
    painting: "Painting",
    flooring: "Flooring",
    drywall: "Drywall",
  };

  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200" data-testid="cost-insights-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-emerald-800">
          <TrendingUp className="w-4 h-4" />
          Market Pricing Insights
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
            ZIP {zipcode}
          </Badge>
        </CardTitle>
        <p className="text-xs text-emerald-600">
          Real-time {tradeNames[tradeId] || tradeId} costs for your area
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasMaterials && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                Material Costs
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {pricing.materials.slice(0, 6).map((item, idx) => (
                <div 
                  key={idx} 
                  className="bg-white/70 rounded-md p-2 border border-emerald-100"
                  data-testid={`material-cost-${idx}`}
                >
                  <div className="text-xs text-slate-600 truncate" title={item.name}>
                    {item.name}
                  </div>
                  <div className="text-sm font-bold text-emerald-700">
                    {formatCurrency(item.cost)}/{item.unit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasLabor && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Hammer className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                Labor Rates
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {pricing.labor.slice(0, 4).map((item, idx) => (
                <div 
                  key={idx} 
                  className="bg-white/70 rounded-md p-2 border border-emerald-100"
                  data-testid={`labor-rate-${idx}`}
                >
                  <div className="text-xs text-slate-600 truncate" title={item.name}>
                    {item.name}
                  </div>
                  <div className="text-sm font-bold text-emerald-700">
                    {formatCurrency(item.hourlyRate)}/hr
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[10px] text-emerald-600/70 pt-1 border-t border-emerald-100">
          Based on industry cost databases • Updated pricing for 3,000+ US counties
        </p>
        <p className="text-[10px] text-emerald-600/50 mt-0.5">
          Estimates are directional; final costs vary by site conditions and scope.
        </p>
      </CardContent>
    </Card>
  );
}
