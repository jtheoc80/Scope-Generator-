'use client';
import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { useCostServiceStatus, useTradePricing, useCostUsage, LimitReachedError } from "@/hooks/use-cost-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Alert components - keeping import commented for future use
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, TrendingUp, DollarSign, Hammer, MapPin, ArrowRight, Database, Sparkles, Lock, Crown } from "lucide-react";

const ANONYMOUS_USAGE_KEY = "market-pricing-anonymous-usage";
const FREE_PRICING_LOOKUPS = 3;

function getAnonymousUsage(): number {
  if (typeof window === "undefined") return 0;
  const stored = localStorage.getItem(ANONYMOUS_USAGE_KEY);
  return stored ? parseInt(stored, 10) : 0;
}

function incrementAnonymousUsage(): number {
  if (typeof window === "undefined") return 0;
  const current = getAnonymousUsage();
  const newCount = current + 1;
  localStorage.setItem(ANONYMOUS_USAGE_KEY, newCount.toString());
  return newCount;
}

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

export default function MarketPricing() {
  const [selectedTrade, setSelectedTrade] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [anonymousUsed, setAnonymousUsed] = useState(0);
  const queryClient = useQueryClient();
  
  // Initialize anonymous usage count on mount
  useEffect(() => {
    setAnonymousUsed(getAnonymousUsage());
  }, []);
  
  // Fetch user data to check subscription
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user");
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });
  
  const { data: status, isLoading: statusLoading } = useCostServiceStatus();
  const { data: usage, refetch: refetchUsage } = useCostUsage();
  const isValidZip = /^\d{5}$/.test(zipcode);
  
  // Pro/Crew users have unlimited access, free users get 3 trial lookups
  const hasSubscription = user?.subscriptionPlan === 'pro' || user?.subscriptionPlan === 'crew';
  
  // For anonymous users, check localStorage usage; for authenticated, check server usage
  const effectiveRemaining = user 
    ? (usage?.remaining ?? 0)
    : Math.max(0, FREE_PRICING_LOOKUPS - anonymousUsed);
  const hasRemainingLookups = hasSubscription || effectiveRemaining > 0;
  
  const { data: pricing, isLoading, error } = useTradePricing(
    hasRemainingLookups ? selectedTrade : "",
    hasRemainingLookups && isValidZip ? zipcode : ""
  );

  const hasMaterials = pricing?.materials && pricing.materials.length > 0;
  const hasLabor = pricing?.labor && pricing.labor.length > 0;
  const hasResults = hasMaterials || hasLabor;
  
  // Check if limit was reached
  const limitReached = error instanceof LimitReachedError || (!hasSubscription && effectiveRemaining <= 0);

  // Track anonymous usage when we get results
  useEffect(() => {
    if (hasResults && !hasSubscription) {
      if (user) {
        refetchUsage();
      } else if (pricing && (pricing as any)._anonymous) {
        // Increment anonymous usage
        const newCount = incrementAnonymousUsage();
        setAnonymousUsed(newCount);
        // Invalidate the usage query to refresh
        queryClient.invalidateQueries({ queryKey: ["cost-usage"] });
      }
    }
  }, [hasResults, hasSubscription, user, pricing, refetchUsage, queryClient]);

  const selectedTradeName = trades.find(t => t.id === selectedTrade)?.label || "";

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-50 to-emerald-50/30 min-h-screen">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Database className="w-4 h-4" />
                Real-Time Cost Data
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-3">
                Market Pricing Insights
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Look up real-time material costs and labor rates for any trade in your area. 
                Data covers 3,000+ US counties.
              </p>
              
              {hasSubscription ? (
                <div className="mt-4 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium" data-testid="pro-badge">
                  <Crown className="w-4 h-4" />
                  Unlimited lookups with {user?.subscriptionPlan === 'crew' ? 'Crew' : 'Pro'}
                </div>
              ) : (
                <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-full text-sm font-medium" data-testid="usage-indicator">
                  <Sparkles className="w-4 h-4" />
                  {effectiveRemaining > 0 ? (
                    <>Free trial: <strong>{effectiveRemaining} of {FREE_PRICING_LOOKUPS}</strong> lookups remaining</>
                  ) : (
                    <>Free trial complete - upgrade for unlimited access</>
                  )}
                </div>
              )}
            </div>

            {(statusLoading) ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : !status?.available ? (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="py-8 text-center">
                  <p className="text-red-700">Market pricing data is currently unavailable. Please try again later.</p>
                </CardContent>
              </Card>
            ) : limitReached ? (
              <Card className="shadow-lg border-0 overflow-hidden" data-testid="upgrade-card">
                <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Lock className="w-5 h-5" />
                    Free Trial Complete
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 text-center">
                  <Crown className="w-16 h-16 mx-auto mb-4 text-amber-500" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">You&apos;ve Used All 3 Free Lookups</h3>
                  <p className="text-slate-600 mb-6 max-w-md mx-auto">
                    Love the market pricing data? Upgrade to Pro for unlimited lookups and get real-time material costs and labor rates for every quote.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {!user ? (
                      <Link href="/sign-in?redirect_url=%2Fmarket-pricing">
                        <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" data-testid="button-login">
                          <ArrowRight className="w-4 h-4" />
                          Sign In to Upgrade
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/settings">
                        <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" data-testid="button-upgrade">
                          <Crown className="w-4 h-4" />
                          Upgrade to Pro - $29/mo
                        </Button>
                      </Link>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-4">
                    Pro: Unlimited market pricing + 15 proposals/month
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card className="shadow-lg border-0" data-testid="market-pricing-card">
                  <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="w-5 h-5" />
                      Price Lookup
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">
                          Select Trade
                        </label>
                        <Select value={selectedTrade} onValueChange={setSelectedTrade}>
                          <SelectTrigger className="h-12 text-base" data-testid="select-trade">
                            <SelectValue placeholder="Choose a trade category" />
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
                        <label className="text-sm font-medium text-slate-700 mb-2 block">
                          ZIP Code
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                          <Input
                            placeholder="Enter 5-digit ZIP code"
                            value={zipcode}
                            onChange={(e) => setZipcode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                            className="h-12 pl-10 text-base"
                            data-testid="input-zipcode"
                          />
                        </div>
                      </div>
                    </div>

                    {!selectedTrade && !zipcode && (
                      <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                        <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p>Select a trade and enter your ZIP code to see local pricing</p>
                      </div>
                    )}

                    {selectedTrade && !isValidZip && zipcode.length > 0 && (
                      <div className="text-center py-4 text-amber-600 bg-amber-50 rounded-lg">
                        Please enter a valid 5-digit ZIP code
                      </div>
                    )}

                    {isLoading && selectedTrade && isValidZip && (
                      <div className="flex items-center justify-center gap-3 py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                        <span className="text-slate-600">Loading {selectedTradeName} pricing for {zipcode}...</span>
                      </div>
                    )}

                    {!isLoading && selectedTrade && isValidZip && hasResults && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            {selectedTradeName}
                          </Badge>
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                            ZIP {zipcode}
                          </Badge>
                        </div>

                        {hasMaterials && (
                          <div>
                            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
                              <DollarSign className="w-5 h-5 text-emerald-600" />
                              Material Costs
                            </h3>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {pricing.materials.map((item, idx) => (
                                <div 
                                  key={idx} 
                                  className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                  data-testid={`material-${idx}`}
                                >
                                  <div className="text-sm text-slate-500 mb-1 capitalize">
                                    {item.name}
                                  </div>
                                  <div className="text-xl font-bold text-slate-900">
                                    {formatCurrency(item.cost)}
                                    <span className="text-sm font-normal text-slate-500">/{item.unit}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {hasLabor && (
                          <div>
                            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
                              <Hammer className="w-5 h-5 text-emerald-600" />
                              Labor Rates
                            </h3>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {pricing.labor.map((item, idx) => (
                                <div 
                                  key={idx} 
                                  className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                  data-testid={`labor-${idx}`}
                                >
                                  <div className="text-sm text-slate-500 mb-1 capitalize">
                                    {item.name}
                                  </div>
                                  <div className="text-xl font-bold text-slate-900">
                                    {formatCurrency(item.hourlyRate)}
                                    <span className="text-sm font-normal text-slate-500">/hr</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-4 border-t border-slate-200">
                          <Link href="/app">
                            <Button className="w-full md:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700" data-testid="button-create-proposal">
                              Create Proposal with These Prices
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}

                    {!isLoading && selectedTrade && isValidZip && !hasResults && !error && (
                      <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg">
                        <p>No pricing data available for {selectedTradeName} in ZIP {zipcode}</p>
                        <p className="text-sm mt-2">Try a different ZIP code or trade</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="text-center text-sm text-slate-500">
                  <p>Pricing based on industry cost databases and public market benchmarks. Updated regularly across 3,000+ US counties.</p>
                  <p className="mt-1 text-xs text-slate-400">Estimates are directional; final bids depend on site conditions, local labor/material pricing, and scope.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
