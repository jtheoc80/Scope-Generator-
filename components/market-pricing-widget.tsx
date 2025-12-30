'use client';
import { useState } from "react";
import Link from "next/link";
import { useCostServiceStatus, useTradePricing } from "@/hooks/use-cost-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, DollarSign, Hammer, MapPin, ArrowRight } from "lucide-react";

const trades = [
  { id: "bathroom", label: "Bathroom Remodel" },
  { id: "kitchen", label: "Kitchen Remodel" },
  { id: "roofing", label: "Roofing" },
  { id: "plumbing", label: "Plumbing" },
  { id: "electrical", label: "Electrical" },
  { id: "hvac", label: "HVAC" },
  { id: "painting", label: "Painting" },
  { id: "flooring", label: "Flooring" },
  { id: "drywall", label: "Drywall" },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function MarketPricingWidget() {
  const [selectedTrade, setSelectedTrade] = useState("");
  const [zipcode, setZipcode] = useState("");
  
  const { data: status } = useCostServiceStatus();
  const isValidZip = /^\d{5}$/.test(zipcode);
  
  const { data: pricing, isLoading, error } = useTradePricing(
    selectedTrade,
    isValidZip ? zipcode : ""
  );

  if (!status?.available) {
    return null;
  }

  const hasMaterials = pricing?.materials && pricing.materials.length > 0;
  const hasLabor = pricing?.labor && pricing.labor.length > 0;
  const hasResults = hasMaterials || hasLabor;

  return (
    <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50/50 to-teal-50/50" data-testid="market-pricing-widget">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Market Pricing Insights
          </CardTitle>
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[10px]">
            Live Data
          </Badge>
        </div>
        <p className="text-xs text-slate-500">
          Check real-time material & labor costs for any trade
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Trade</label>
            <Select value={selectedTrade} onValueChange={setSelectedTrade}>
              <SelectTrigger className="h-9 text-sm bg-white" data-testid="widget-select-trade">
                <SelectValue placeholder="Select trade" />
              </SelectTrigger>
              <SelectContent>
                {trades.map((trade) => (
                  <SelectItem key={trade.id} value={trade.id}>
                    {trade.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">ZIP Code</label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="e.g. 77001"
                value={zipcode}
                onChange={(e) => setZipcode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                className="h-9 pl-8 text-sm bg-white"
                data-testid="widget-input-zipcode"
              />
            </div>
          </div>
        </div>

        {isLoading && selectedTrade && isValidZip && (
          <div className="flex items-center justify-center gap-2 py-4 text-emerald-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading pricing data...</span>
          </div>
        )}

        {!isLoading && selectedTrade && isValidZip && hasResults && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
            {hasMaterials && (
              <div className="bg-white/80 rounded-lg p-3 border border-emerald-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                    Top Materials
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {pricing.materials.slice(0, 4).map((item, idx) => (
                    <div 
                      key={idx} 
                      className="text-xs"
                      data-testid={`widget-material-${idx}`}
                    >
                      <div className="text-slate-500 truncate" title={item.name}>
                        {item.name}
                      </div>
                      <div className="font-bold text-slate-800">
                        {formatCurrency(item.cost)}/{item.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasLabor && (
              <div className="bg-white/80 rounded-lg p-3 border border-emerald-100">
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
                      className="text-xs"
                      data-testid={`widget-labor-${idx}`}
                    >
                      <div className="text-slate-500 truncate" title={item.name}>
                        {item.name}
                      </div>
                      <div className="font-bold text-slate-800">
                        {formatCurrency(item.hourlyRate)}/hr
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Link href="/app" className="w-full">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                data-testid="widget-create-proposal"
              >
                Create Proposal with These Prices
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        )}

        {!isLoading && selectedTrade && isValidZip && !hasResults && !error && (
          <div className="text-center py-3 text-slate-400 text-sm">
            No pricing data available for this location
          </div>
        )}

        {!selectedTrade && !zipcode && (
          <div className="text-center py-2 text-slate-400 text-xs">
            Select a trade and enter ZIP to see pricing
          </div>
        )}

        <p className="text-[10px] text-slate-400 text-center">
          Based on industry cost databases • 3,000+ US counties
        </p>
        <p className="text-[10px] text-slate-400/70 text-center mt-0.5">
          Estimates are directional; final costs vary by site and scope.
        </p>
      </CardContent>
    </Card>
  );
}
