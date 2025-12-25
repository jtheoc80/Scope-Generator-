'use client';
import { useState } from "react";
import Link from "next/link";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, MapPin, Calculator, Target, Lightbulb, DollarSign, BarChart3, ChevronRight, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { templates } from "@/lib/proposal-data";
import { regionalMultipliers } from "@/lib/regional-pricing";

const areaMultipliers: Record<string, { label: string; multiplier: number }> = {
  "master-bathroom": { label: "Master Bathroom", multiplier: 1.25 },
  "bathroom": { label: "Standard Bathroom", multiplier: 1.0 },
  "guest-bathroom": { label: "Guest Bathroom", multiplier: 0.95 },
  "half-bath": { label: "Half Bath", multiplier: 0.7 },
  "kitchen": { label: "Kitchen", multiplier: 1.0 },
  "kitchenette": { label: "Kitchenette", multiplier: 0.6 },
  "outdoor-kitchen": { label: "Outdoor Kitchen", multiplier: 1.4 },
  "living-room": { label: "Living Room", multiplier: 1.0 },
  "dining-room": { label: "Dining Room", multiplier: 0.85 },
  "bedroom": { label: "Bedroom", multiplier: 0.9 },
  "master-bedroom": { label: "Master Bedroom", multiplier: 1.15 },
  "hallway": { label: "Hallway", multiplier: 0.5 },
  "basement": { label: "Basement", multiplier: 1.5 },
  "whole-house": { label: "Whole House", multiplier: 3.5 },
  "front-yard": { label: "Front Yard", multiplier: 1.0 },
  "backyard": { label: "Backyard", multiplier: 1.1 },
  "patio": { label: "Patio", multiplier: 0.8 },
  "deck": { label: "Deck", multiplier: 1.0 },
  "driveway": { label: "Driveway", multiplier: 1.2 },
  "garage": { label: "Garage", multiplier: 0.9 },
  "main-roof": { label: "Main Roof", multiplier: 1.0 },
  "full-roof": { label: "Full Roof", multiplier: 1.0 },
};

interface PricingSummary {
  totalProposals: number;
  acceptedCount: number;
  acceptanceRate: number;
  avgPriceLow: number;
  avgPriceHigh: number;
  statusBreakdown: Record<string, number>;
  tradeBreakdown: Record<string, {
    count: number;
    avgPriceLow: number;
    avgPriceHigh: number;
  }>;
}

interface Benchmarks {
  trades: Array<{
    id: string;
    name: string;
    jobTypes: Array<{
      id: string;
      name: string;
      basePriceRange: { low: number; high: number };
      estimatedDays?: { low: number; high: number };
    }>;
  }>;
  regions: Array<{
    state: string;
    abbrev: string;
    multiplier: number;
    region: string;
  }>;
}

export default function PricingInsights() {
  const { user, isLoading: authLoading } = useAuth();
  
  const [exampleBasePrice, setExampleBasePrice] = useState(5000);
  const [exampleJobSize, setExampleJobSize] = useState(1);
  const [exampleArea, setExampleArea] = useState("bathroom");
  const [exampleState, setExampleState] = useState("FL");
  const [exampleMultiplier, setExampleMultiplier] = useState(100);

  const { data: pricingSummary, isLoading: summaryLoading } = useQuery<PricingSummary>({
    queryKey: ["/api/analytics/pricing-summary"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/pricing-summary", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch pricing summary");
      return res.json();
    },
    enabled: !!user,
  });

  const { isLoading: benchmarksLoading } = useQuery<Benchmarks>({
    queryKey: ["/api/analytics/benchmarks"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/benchmarks");
      if (!res.ok) throw new Error("Failed to fetch benchmarks");
      return res.json();
    },
  });

  const regions = [...new Set(regionalMultipliers.map(r => r.region))].sort();
  const statesByRegion = regions.reduce((acc, region) => {
    acc[region] = regionalMultipliers.filter(r => r.region === region).sort((a, b) => a.state.localeCompare(b.state));
    return acc;
  }, {} as Record<string, typeof regionalMultipliers>);

  const selectedStateData = regionalMultipliers.find(r => r.abbrev === exampleState);
  const areaData = areaMultipliers[exampleArea];
  
  const calculatedPrice = {
    low: Math.round(exampleBasePrice * exampleJobSize * (areaData?.multiplier || 1) * (selectedStateData?.multiplier || 1) * (exampleMultiplier / 100)),
    high: Math.round(exampleBasePrice * 1.4 * exampleJobSize * (areaData?.multiplier || 1) * (selectedStateData?.multiplier || 1) * (exampleMultiplier / 100)),
  };

  const getAcceptanceRateColor = (rate: number) => {
    if (rate >= 70) return "text-green-600";
    if (rate >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getAcceptanceRateBadge = (rate: number) => {
    if (rate >= 70) return { variant: "default" as const, text: "Excellent" };
    if (rate >= 50) return { variant: "secondary" as const, text: "Good" };
    return { variant: "destructive" as const, text: "Needs Improvement" };
  };

  const generateRecommendations = () => {
    const recommendations: Array<{ type: "success" | "warning" | "info"; message: string }> = [];
    
    if (!pricingSummary || pricingSummary.totalProposals === 0) {
      recommendations.push({
        type: "info",
        message: "Start creating proposals to get personalized pricing recommendations based on your performance."
      });
      return recommendations;
    }

    if (pricingSummary.acceptanceRate < 50) {
      recommendations.push({
        type: "warning",
        message: "Your acceptance rate is below 50%. Consider reviewing your pricing strategy or adjusting your price multiplier."
      });
    } else if (pricingSummary.acceptanceRate >= 70) {
      recommendations.push({
        type: "success",
        message: "Great job! Your acceptance rate is strong. You might have room to increase prices slightly."
      });
    }

    if (user?.priceMultiplier === 100) {
      recommendations.push({
        type: "info",
        message: "You're using the default price multiplier. Consider adjusting it based on your experience, overhead costs, and local market conditions."
      });
    } else if (user?.priceMultiplier && user.priceMultiplier > 130) {
      recommendations.push({
        type: "warning",
        message: "Your price multiplier is set high. If you're seeing low acceptance rates, consider reducing it."
      });
    }

    const avgBenchmark = 15000;
    const userAvg = (pricingSummary.avgPriceLow + pricingSummary.avgPriceHigh) / 2;
    
    if (userAvg > avgBenchmark * 1.3) {
      recommendations.push({
        type: "info",
        message: "Your average proposal prices are above typical benchmarks. This is fine if targeting premium clients."
      });
    } else if (userAvg < avgBenchmark * 0.7) {
      recommendations.push({
        type: "warning",
        message: "Your average prices are below benchmarks. Ensure you're not undervaluing your work."
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: "success",
        message: "Your pricing strategy looks balanced. Keep monitoring your acceptance rate for optimization opportunities."
      });
    }

    return recommendations;
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const hasAccess = user?.subscriptionPlan === 'pro' || user?.subscriptionPlan === 'crew';

  if (!hasAccess) {
    return (
      <Layout>
        <div className="bg-slate-50 min-h-screen pb-12">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto text-center">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-slate-900 mb-4" data-testid="text-access-denied">
                Pricing Insights is a Pro Feature
              </h1>
              <p className="text-slate-600 mb-8">
                Unlock powerful pricing analytics, industry benchmarks, and personalized recommendations to optimize your proposals and win more jobs.
              </p>
              <Link
                href="/#pricing"
                className="inline-block bg-primary text-white px-6 py-3 rounded-md font-semibold hover:bg-primary/90 transition-colors"
                data-testid="link-upgrade"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen pb-12">
        <div className="bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-heading font-bold text-slate-900" data-testid="text-page-title">Pricing Insights</h1>
                <p className="text-slate-500 text-sm">Understand how prices are calculated and optimize your proposals</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="formula" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-2 h-auto p-1" data-testid="tabs-pricing-insights">
              <TabsTrigger value="formula" className="flex items-center gap-2 py-2" data-testid="tab-formula">
                <Calculator className="w-4 h-4" />
                <span className="hidden sm:inline">Formula</span>
              </TabsTrigger>
              <TabsTrigger value="regional" className="flex items-center gap-2 py-2" data-testid="tab-regional">
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">Regional</span>
              </TabsTrigger>
              <TabsTrigger value="benchmarks" className="flex items-center gap-2 py-2" data-testid="tab-benchmarks">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Benchmarks</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2 py-2" data-testid="tab-performance">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Performance</span>
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="flex items-center gap-2 py-2" data-testid="tab-recommendations">
                <Lightbulb className="w-4 h-4" />
                <span className="hidden sm:inline">Tips</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="formula" className="space-y-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    How Prices Are Calculated
                  </CardTitle>
                  <CardDescription>
                    Every proposal price is calculated using this formula. Adjust the sliders to see how each factor affects the final price.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="bg-slate-100 rounded-lg p-6 text-center">
                    <div className="flex flex-wrap items-center justify-center gap-2 text-lg font-medium">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded">Base Price</span>
                      <span className="text-slate-400">×</span>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded">Job Size</span>
                      <span className="text-slate-400">×</span>
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded">Area</span>
                      <span className="text-slate-400">×</span>
                      <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded">Region</span>
                      <span className="text-slate-400">×</span>
                      <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded">Your Multiplier</span>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Base Price: ${exampleBasePrice.toLocaleString()}</label>
                        <Slider
                          value={[exampleBasePrice]}
                          onValueChange={(v) => setExampleBasePrice(v[0])}
                          min={500}
                          max={50000}
                          step={500}
                          className="mt-2"
                          data-testid="slider-base-price"
                        />
                        <p className="text-xs text-slate-500 mt-1">Starting price for the job type</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700">Job Size: {exampleJobSize}x</label>
                        <Slider
                          value={[exampleJobSize]}
                          onValueChange={(v) => setExampleJobSize(v[0])}
                          min={1}
                          max={5}
                          step={1}
                          className="mt-2"
                          data-testid="slider-job-size"
                        />
                        <p className="text-xs text-slate-500 mt-1">Complexity multiplier (1-5)</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700">Area Type</label>
                        <Select value={exampleArea} onValueChange={setExampleArea}>
                          <SelectTrigger className="mt-2" data-testid="select-area-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(areaMultipliers).slice(0, 15).map(([key, { label, multiplier }]) => (
                              <SelectItem key={key} value={key}>
                                {label} ({multiplier}x)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500 mt-1">Different areas have different pricing</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">State/Region</label>
                        <Select value={exampleState} onValueChange={setExampleState}>
                          <SelectTrigger className="mt-2" data-testid="select-state">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {regionalMultipliers.map((r) => (
                              <SelectItem key={r.abbrev} value={r.abbrev}>
                                {r.state} ({r.multiplier}x)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500 mt-1">Regional cost of living adjustment</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700">Your Multiplier: {exampleMultiplier}%</label>
                        <Slider
                          value={[exampleMultiplier]}
                          onValueChange={(v) => setExampleMultiplier(v[0])}
                          min={25}
                          max={200}
                          step={5}
                          className="mt-2"
                          data-testid="slider-your-multiplier"
                        />
                        <p className="text-xs text-slate-500 mt-1">Your custom adjustment (set in Settings)</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
                    <p className="text-sm text-slate-600 mb-2">Estimated Price Range</p>
                    <p className="text-3xl font-bold text-primary" data-testid="text-calculated-price">
                      ${calculatedPrice.low.toLocaleString()} - ${calculatedPrice.high.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      ${exampleBasePrice.toLocaleString()} × {exampleJobSize} × {areaData?.multiplier || 1} × {selectedStateData?.multiplier || 1} × {exampleMultiplier/100}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="regional" className="space-y-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Regional Pricing Multipliers
                  </CardTitle>
                  <CardDescription>
                    Prices vary by region based on cost of living and local market conditions. These multipliers are automatically applied based on the project address.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {regions.map((region) => (
                      <div key={region} className="space-y-3">
                        <h3 className="font-semibold text-slate-900 border-b pb-2">{region}</h3>
                        <div className="space-y-2">
                          {statesByRegion[region].map((state) => (
                            <div
                              key={state.abbrev}
                              className="flex items-center justify-between text-sm"
                              data-testid={`row-state-${state.abbrev}`}
                            >
                              <span className="text-slate-600">{state.state}</span>
                              <Badge
                                variant={state.multiplier >= 1.1 ? "default" : state.multiplier <= 0.9 ? "secondary" : "outline"}
                                className="font-mono"
                              >
                                {state.multiplier.toFixed(2)}x
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 bg-slate-50 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 mb-2">Understanding Multipliers</h4>
                    <div className="grid gap-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Badge variant="default">1.10+</Badge>
                        <span>Higher cost of living areas (CA, NY, MA, etc.)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">0.91-1.09</Badge>
                        <span>Average cost markets</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">0.90 or less</Badge>
                        <span>Lower cost of living areas</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="benchmarks" className="space-y-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Industry Benchmarks
                  </CardTitle>
                  <CardDescription>
                    Base price ranges for different trades and job types. These are starting points before applying multipliers.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {benchmarksLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {templates.map((template) => (
                        <div key={template.id} className="border rounded-lg p-4" data-testid={`card-trade-${template.id}`}>
                          <h3 className="font-semibold text-lg text-slate-900 mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-primary" />
                            {template.trade}
                          </h3>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {template.jobTypes.map((jobType) => (
                              <div
                                key={jobType.id}
                                className="bg-slate-50 rounded-lg p-3"
                                data-testid={`card-jobtype-${jobType.id}`}
                              >
                                <p className="font-medium text-sm text-slate-900">{jobType.name}</p>
                                <p className="text-lg font-semibold text-primary mt-1">
                                  ${jobType.basePriceRange.low.toLocaleString()} - ${jobType.basePriceRange.high.toLocaleString()}
                                </p>
                                {jobType.estimatedDays && (
                                  <p className="text-xs text-slate-500 mt-1">
                                    {jobType.estimatedDays.low}-{jobType.estimatedDays.high} days typical
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              {!user ? (
                <Card className="border-none shadow-sm">
                  <CardContent className="py-12 text-center">
                    <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Sign In to View Your Performance</h3>
                    <p className="text-slate-500 mb-6">Track your proposal acceptance rates and compare your pricing to benchmarks.</p>
                    <Link
                      href="/sign-in?redirect_url=%2Fpricing-insights"
                      className="bg-primary text-white px-6 py-3 rounded-md font-semibold"
                      data-testid="link-signin"
                    >
                      Sign In
                    </Link>
                  </CardContent>
                </Card>
              ) : summaryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : !pricingSummary || pricingSummary.totalProposals === 0 ? (
                <Card className="border-none shadow-sm">
                  <CardContent className="py-12 text-center">
                    <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Proposals Yet</h3>
                    <p className="text-slate-500 mb-6">Create your first proposal to start tracking your performance metrics.</p>
                    <a href="/app" className="bg-primary text-white px-6 py-3 rounded-md font-semibold" data-testid="link-create-proposal">
                      Create a Proposal
                    </a>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-none shadow-sm">
                    <CardHeader>
                      <CardTitle>Acceptance Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <p className={`text-5xl font-bold ${getAcceptanceRateColor(pricingSummary.acceptanceRate)}`} data-testid="text-acceptance-rate">
                          {pricingSummary.acceptanceRate.toFixed(1)}%
                        </p>
                        <Badge className="mt-2" variant={getAcceptanceRateBadge(pricingSummary.acceptanceRate).variant}>
                          {getAcceptanceRateBadge(pricingSummary.acceptanceRate).text}
                        </Badge>
                        <Progress value={pricingSummary.acceptanceRate} className="mt-4" />
                        <p className="text-sm text-slate-500 mt-2">
                          {pricingSummary.acceptedCount} of {pricingSummary.totalProposals} proposals accepted
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm">
                    <CardHeader>
                      <CardTitle>Average Price Range</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-primary" data-testid="text-avg-price">
                          ${pricingSummary.avgPriceLow.toLocaleString()} - ${pricingSummary.avgPriceHigh.toLocaleString()}
                        </p>
                        <p className="text-sm text-slate-500 mt-2">
                          Based on {pricingSummary.totalProposals} proposals
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm">
                    <CardHeader>
                      <CardTitle>Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(pricingSummary.statusBreakdown).map(([status, count]) => (
                          <div key={status} className="flex items-center justify-between">
                            <span className="capitalize text-slate-600">{status}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 bg-slate-100 rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full"
                                  style={{ width: `${(count / pricingSummary.totalProposals) * 100}%` }}
                                />
                              </div>
                              <span className="font-medium w-8 text-right">{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm">
                    <CardHeader>
                      <CardTitle>Proposals by Trade</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(pricingSummary.tradeBreakdown)
                          .sort((a, b) => b[1].count - a[1].count)
                          .slice(0, 6)
                          .map(([trade, data]) => (
                            <div key={trade} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-700 font-medium capitalize">{trade.replace(/-/g, " ")}</span>
                                <Badge variant="secondary">{data.count} proposals</Badge>
                              </div>
                              <div className="flex items-center justify-between text-sm text-slate-500">
                                <span>Avg. Price Range</span>
                                <span>${Math.round(data.avgPriceLow).toLocaleString()} - ${Math.round(data.avgPriceHigh).toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Pricing Recommendations
                  </CardTitle>
                  <CardDescription>
                    Personalized tips based on your proposal history and settings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {generateRecommendations().map((rec, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 p-4 rounded-lg ${
                          rec.type === "success" ? "bg-green-50 border border-green-200" :
                          rec.type === "warning" ? "bg-yellow-50 border border-yellow-200" :
                          "bg-blue-50 border border-blue-200"
                        }`}
                        data-testid={`recommendation-${idx}`}
                      >
                        {rec.type === "success" ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        ) : rec.type === "warning" ? (
                          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        )}
                        <p className={`text-sm ${
                          rec.type === "success" ? "text-green-800" :
                          rec.type === "warning" ? "text-yellow-800" :
                          "text-blue-800"
                        }`}>
                          {rec.message}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 border-t pt-6">
                    <h4 className="font-semibold text-slate-900 mb-4">Quick Actions</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <a
                        href="/settings"
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        data-testid="link-adjust-multiplier"
                      >
                        <span className="font-medium">Adjust Price Multiplier</span>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </a>
                      <a
                        href="/app"
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        data-testid="link-new-proposal"
                      >
                        <span className="font-medium">Create New Proposal</span>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
