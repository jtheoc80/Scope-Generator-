'use client';
// Force dynamic rendering to prevent static generation errors
// This page uses useQuery which requires QueryClientProvider
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import LayoutWrapper from "@/components/layout-wrapper";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, Clock, DollarSign, FileCheck, Loader2, Bath, ChefHat, Home as HomeIcon, Paintbrush, Plug, Wrench, Thermometer, TreePine, Calculator, Sparkles, Star, Users, TrendingUp, Target, FileText } from "lucide-react";
import { ScopeScanTeaser } from "@/components/marketing/ScopeScanTeaser";
import { ProposalPreviewSection } from "@/components/marketing/ProposalPreviewSection";
import { PlanCompareTable } from "@/components/pricing/PlanCompareTable";
import { useLanguage } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";

const calculatorTrades = [
  {
    id: "bathroom",
    name: "Bathroom Remodel",
    icon: Bath,
    jobTypes: [
      { id: "tub-to-shower", name: "Tub-to-Shower Conversion", low: 8500, high: 12000 },
      { id: "full-gut", name: "Full Bathroom Remodel", low: 18000, high: 28000 },
      { id: "half-bath", name: "Half Bath / Powder Room", low: 6500, high: 9500 },
      { id: "vanity-refresh", name: "Vanity & Faucet Replacement", low: 1800, high: 3500 },
    ]
  },
  {
    id: "kitchen",
    name: "Kitchen Remodel",
    icon: ChefHat,
    jobTypes: [
      { id: "full-kitchen", name: "Full Kitchen Remodel", low: 45000, high: 85000 },
      { id: "cabinet-refresh", name: "Cabinet & Countertop Refresh", low: 8500, high: 15000 },
      { id: "appliance-upgrade", name: "Appliance Package Install", low: 2500, high: 5000 },
    ]
  },
  {
    id: "painting",
    name: "Painting",
    icon: Paintbrush,
    jobTypes: [
      { id: "single-room", name: "Single Room (Interior)", low: 450, high: 850 },
      { id: "whole-house", name: "Whole House Interior", low: 3500, high: 8000 },
      { id: "exterior", name: "Exterior House Painting", low: 4000, high: 12000 },
    ]
  },
  {
    id: "plumbing",
    name: "Plumbing",
    icon: Wrench,
    jobTypes: [
      { id: "water-heater", name: "Water Heater Replacement", low: 1800, high: 3500 },
      { id: "repipe", name: "Whole House Repipe", low: 8000, high: 15000 },
      { id: "drain-cleaning", name: "Drain Cleaning", low: 150, high: 500 },
    ]
  },
  {
    id: "electrical",
    name: "Electrical",
    icon: Plug,
    jobTypes: [
      { id: "panel-upgrade", name: "Panel Upgrade", low: 2500, high: 4500 },
      { id: "ev-charger", name: "EV Charger Installation", low: 800, high: 2000 },
      { id: "rewiring", name: "Whole House Rewiring", low: 8000, high: 15000 },
    ]
  },
  {
    id: "hvac",
    name: "HVAC",
    icon: Thermometer,
    jobTypes: [
      { id: "ac-install", name: "AC Unit Installation", low: 4500, high: 12000 },
      { id: "furnace", name: "Furnace Replacement", low: 3500, high: 8000 },
      { id: "maintenance", name: "Maintenance / Tune-Up", low: 99, high: 299 },
    ]
  },
];

const sizeMultipliers = {
  small: { label: "Small", multiplier: 0.75, description: "Basic scope" },
  medium: { label: "Medium", multiplier: 1.0, description: "Standard scope" },
  large: { label: "Large", multiplier: 1.4, description: "Premium scope" },
};

function InstantPriceCalculator({ t }: { t: any }) {
  const [selectedTrade, setSelectedTrade] = useState<string>("");
  const [selectedJobType, setSelectedJobType] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const [animatedLow, setAnimatedLow] = useState(0);
  const [animatedHigh, setAnimatedHigh] = useState(0);

  const trade = calculatorTrades.find(t => t.id === selectedTrade);
  const jobType = trade?.jobTypes.find(j => j.id === selectedJobType);
  const size = sizeMultipliers[selectedSize as keyof typeof sizeMultipliers];

  const canCalculate = selectedTrade && selectedJobType && selectedSize;

  useEffect(() => {
    if (canCalculate && jobType && size) {
      setIsCalculating(true);
      setShowPrice(false);

      console.log("[Price Calculator] User interaction:", {
        trade: selectedTrade,
        jobType: selectedJobType,
        size: selectedSize,
        timestamp: new Date().toISOString()
      });

      const targetLow = Math.round(jobType.low * size.multiplier);
      const targetHigh = Math.round(jobType.high * size.multiplier);

      setTimeout(() => {
        setIsCalculating(false);
        setShowPrice(true);

        let frame = 0;
        const totalFrames = 20;
        const interval = setInterval(() => {
          frame++;
          const progress = frame / totalFrames;
          const easeOut = 1 - Math.pow(1 - progress, 3);
          setAnimatedLow(Math.round(targetLow * easeOut));
          setAnimatedHigh(Math.round(targetHigh * easeOut));
          if (frame >= totalFrames) clearInterval(interval);
        }, 30);
      }, 600);
    } else {
      setShowPrice(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrade, selectedJobType, selectedSize]);

  const handleTradeChange = (value: string) => {
    setSelectedTrade(value);
    setSelectedJobType("");
    console.log("[Price Calculator] Trade selected:", value);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const TradeIcon = trade?.icon || Calculator;

  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-gradient-to-br from-orange-500/30 via-orange-400/20 to-amber-500/30 rounded-2xl blur-2xl -z-10"></div>
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
            <Calculator className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">{t.calculator.title}</h3>
            <p className="text-slate-400 text-xs">{t.calculator.subtitle}</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.calculator.projectType}</label>
            <select
              data-testid="select-trade"
              value={selectedTrade}
              onChange={(e) => handleTradeChange(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
            >
              <option value="">{t.calculator.selectTrade}</option>
              {calculatorTrades.map((trade) => (
                <option key={trade.id} value={trade.id}>{trade.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.calculator.jobType}</label>
            <select
              data-testid="select-job-type"
              value={selectedJobType}
              onChange={(e) => setSelectedJobType(e.target.value)}
              disabled={!selectedTrade}
              className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">{t.calculator.selectJobType}</option>
              {trade?.jobTypes.map((job) => (
                <option key={job.id} value={job.id}>{job.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.calculator.projectSize}</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(sizeMultipliers).map(([key]) => (
                <button
                  key={key}
                  data-testid={`button-size-${key}`}
                  onClick={() => setSelectedSize(key)}
                  disabled={!selectedJobType}
                  className={`py-2.5 px-3 rounded-lg border-2 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed ${selectedSize === key
                    ? "border-orange-500 bg-orange-500/10 text-slate-900 font-bold"
                    : "border-slate-200 hover:border-slate-300 text-slate-600"
                    }`}
                >
                  <div className="font-medium text-sm">{key === 'small' ? t.calculator.small : key === 'medium' ? t.calculator.medium : t.calculator.large}</div>
                </button>
              ))}
            </div>
          </div>

          <div className={`mt-4 p-4 rounded-xl transition-all duration-500 ${showPrice
            ? "bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
            : isCalculating
              ? "bg-slate-50 border border-slate-200"
              : "bg-slate-50 border border-dashed border-slate-300"
            }`}>
            {isCalculating ? (
              <div className="flex items-center justify-center gap-3 py-2">
                <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                <span className="text-slate-600 font-medium">{t.calculator.calculating}</span>
              </div>
            ) : showPrice ? (
              <div className="text-center animate-in fade-in zoom-in duration-500">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-green-700">{t.calculator.estimatedRange}</span>
                  <Sparkles className="w-4 h-4 text-orange-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">
                  {formatPrice(animatedLow)} – {formatPrice(animatedHigh)}
                </div>
                <p className="text-xs text-slate-500 mt-1">{t.calculator.basedOnScope.replace('{scope}', size?.description?.toLowerCase() || '')}</p>
              </div>
            ) : (
              <div className="text-center py-2">
                <div className="flex items-center justify-center gap-2 text-slate-400">
                  <TradeIcon className="w-5 h-5" />
                  <span className="text-sm">{t.calculator.selectOptions}</span>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/app"
            data-testid="button-get-full-proposal"
            className={`block w-full text-center py-3 rounded-lg font-bold transition-all ${showPrice
              ? "bg-orange-500 text-white hover:bg-orange-600 shadow-lg hover:shadow-xl hover:scale-[1.02]"
              : "bg-slate-200 text-slate-500 cursor-not-allowed pointer-events-none"
              }`}
            onClick={() => {
              if (showPrice) {
                console.log("[Price Calculator] CTA clicked - Get Full Proposal", {
                  trade: selectedTrade,
                  jobType: selectedJobType,
                  size: selectedSize,
                  estimatedRange: { low: animatedLow, high: animatedHigh }
                });
              }
            }}
          >
            {t.calculator.getFullProposal}
          </Link>

          <p className="text-center text-xs text-slate-500">
            {t.calculator.freeToCreate}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();
  const router = useRouter();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  // Check if user is logged in
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    enabled: typeof window !== "undefined",
    queryFn: async () => {
      const res = await fetch("/api/auth/user");
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  const handleCheckout = async (productType: 'starter' | 'pro' | 'crew') => {
    // If user is not logged in, redirect to sign-up with the plan
    if (!user) {
      const redirectUrl = `/dashboard?checkout=${productType}`;
      router.push(`/sign-up?plan=${productType}&redirect_url=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    setCheckoutLoading(productType);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productType }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.message) {
        alert(data.message);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <LayoutWrapper>
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 bg-gradient-to-br from-slate-700 to-slate-900">
        </div>

        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-in slide-in-from-left duration-700">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-300 text-sm font-medium px-4 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              {t.home.freeTrialBadge}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-[1.1] tracking-tight">
              {t.home.heroTitle1} <br />
              <span className="text-orange-500">{t.home.heroTitle2}</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-lg leading-relaxed">
              {t.home.heroSubtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <Link
                href="/app"
                data-testid="button-try-free-proposal"
                className="inline-flex items-center justify-center h-12 sm:h-14 px-6 sm:px-8 rounded-md bg-orange-500 text-white font-bold text-base sm:text-lg hover:bg-orange-600 transition-all hover:scale-105 shadow-[0_0_20px_rgba(249,115,22,0.3)] whitespace-nowrap"
              >
                {t.home.startFreeTrial}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <a
                href="#demo"
                data-testid="button-view-sample-proposal"
                className="inline-flex items-center justify-center h-12 sm:h-14 px-6 sm:px-8 rounded-md border border-slate-700 bg-slate-800/50 text-white font-medium hover:bg-slate-800 transition-colors backdrop-blur-sm whitespace-nowrap"
              >
                {t.home.viewSampleProposal}
              </a>
            </div>

            <p className="text-sm text-slate-400">{t.home.freeTrialHeroNote}</p>

          </div>

          <div className="animate-in slide-in-from-right duration-1000 delay-200">
            <InstantPriceCalculator t={t} />
          </div>
        </div>
      </section>

      {/* Stats Bar - Social Proof */}
      <section className="bg-slate-800 border-y border-slate-700">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10 max-w-5xl mx-auto">
            <div className="flex items-center justify-center gap-4 text-white" data-testid="stat-proposals">
              <Users className="w-6 h-6 text-orange-500 flex-shrink-0" />
              <span className="font-bold text-xl">500+</span>
              <span className="text-slate-300 text-base">{t.home.proposalsGenerated}</span>
            </div>
            <div className="flex items-center justify-center gap-4 text-white" data-testid="stat-rating">
              <Star className="w-6 h-6 text-orange-500 fill-orange-500 flex-shrink-0" />
              <span className="font-bold text-xl">4.9★</span>
              <span className="text-slate-300 text-base">{t.home.contractorRating}</span>
            </div>
            <div className="flex items-center justify-center gap-4 text-white" data-testid="stat-won-jobs">
              <TrendingUp className="w-6 h-6 text-orange-500 flex-shrink-0" />
              <span className="font-bold text-xl">$2.5M+</span>
              <span className="text-slate-300 text-base">{t.home.inWonJobs}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Point Section - After Calculator */}
      <section className="py-20 sm:py-28 bg-white" data-testid="section-pain-points">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-14">
              <div className="order-2 md:order-1">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-8">
                  {t.home.tiredOfWriting}
                </h2>
                <p className="text-xl sm:text-2xl text-slate-600 leading-relaxed">
                  {t.home.scopeGenLets}
                </p>
              </div>
              <div className="order-1 md:order-2">
                <div className="w-full h-72 md:h-80 rounded-xl shadow-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&h=400&fit=crop&crop=center"
                    alt="Modern bathroom renovation with white tiles and fixtures"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-12 mb-14 text-left max-w-4xl mx-auto">
              <div data-testid="benefit-prebuilt-scopes">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-6 h-6 text-slate-700" />
                  <h3 className="font-bold text-slate-900 text-lg">{t.home.preBuiltScopes}</h3>
                </div>
                <p className="text-slate-600 text-base leading-relaxed">
                  {t.home.preBuiltScopesDesc}
                </p>
              </div>
              <div data-testid="benefit-clear-descriptions">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-6 h-6 text-slate-700" />
                  <h3 className="font-bold text-slate-900 text-lg">{t.home.clearLineItems}</h3>
                </div>
                <p className="text-slate-600 text-base leading-relaxed">
                  {t.home.clearLineItemsDesc}
                </p>
              </div>
              <div data-testid="benefit-consistent-pricing">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="w-6 h-6 text-slate-700" />
                  <h3 className="font-bold text-slate-900 text-lg">{t.home.consistentPricing}</h3>
                </div>
                <p className="text-slate-600 text-base leading-relaxed">
                  {t.home.consistentPricingDesc}
                </p>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/app"
                data-testid="button-bathroom-proposal-cta"
                className="inline-flex items-center justify-center h-14 px-10 rounded-md bg-slate-900 text-white font-bold text-lg hover:bg-slate-800 transition-all"
              >
                {t.home.createFirstProposalFree}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ScopeScan Teaser - After Pain Point Section */}
      <ScopeScanTeaser />

      {/* Testimonial Preview Cards */}
      <section className="bg-slate-50 py-16 sm:py-20 border-t border-slate-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-base font-medium text-slate-500 uppercase tracking-wide">{t.home.trustedByContractors}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            <div data-testid="testimonial-1">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-700 text-lg leading-relaxed mb-4">
                &quot;{t.home.testimonial1}&quot;
              </p>
              <div className="text-base">
                <span className="font-medium text-slate-900">{t.home.testimonial1Author}</span>
                <span className="text-slate-400 ml-2">· {t.home.testimonial1Business}</span>
              </div>
            </div>
            <div data-testid="testimonial-2">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-700 text-lg leading-relaxed mb-4">
                &quot;{t.home.testimonial2}&quot;
              </p>
              <div className="text-base">
                <span className="font-medium text-slate-900">{t.home.testimonial2Author}</span>
                <span className="text-slate-400 ml-2">· {t.home.testimonial2Business}</span>
              </div>
            </div>
            <div data-testid="testimonial-3">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-700 text-lg leading-relaxed mb-4">
                &quot;{t.home.testimonial3}&quot;
              </p>
              <div className="text-base">
                <span className="font-medium text-slate-900">{t.home.testimonial3Author}</span>
                <span className="text-slate-400 ml-2">· {t.home.testimonial3Business}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trade-Specific Landing Pages Section */}
      <section className="py-16 sm:py-20 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-4">
              Proposal Templates for Every Trade
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              ScopeGen offers specialized proposal templates for plumbing, electrical, HVAC, bathroom, kitchen, and painting contractors.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {[
              { slug: "bathroom-remodeling", name: "Bathroom", icon: Bath },
              { slug: "kitchen-remodeling", name: "Kitchen", icon: ChefHat },
              { slug: "hvac", name: "HVAC", icon: Thermometer },
              { slug: "plumbing", name: "Plumbing", icon: Wrench },
              { slug: "electrical", name: "Electrical", icon: Plug },
              { slug: "painting", name: "Painting", icon: Paintbrush },
            ].map((trade) => (
              <Link
                key={trade.slug}
                href={`/for/${trade.slug}`}
                className="flex flex-col items-center gap-2 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 hover:border-primary/30 transition-all group"
              >
                <trade.icon className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">{trade.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How ScopeGen Works - Enhanced */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-slate-900" data-testid="section-how-it-works">
        <div className="max-w-[95vw] xl:max-w-[90vw] 2xl:max-w-[85vw] mx-auto px-4 sm:px-8">
          <div className="text-center mb-12 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white mb-4 sm:mb-6">
              {t.home.howScopeGenWorks}
            </h2>
            <p className="text-slate-300 text-lg sm:text-xl lg:text-2xl">
              {t.home.threeSimpleSteps}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-16">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 lg:p-12" data-testid="step-1">
              <div className="text-6xl lg:text-8xl font-heading font-bold text-orange-500 mb-6">1</div>
              <h3 className="text-xl lg:text-2xl font-bold text-white mb-4">{t.home.pickYourTrade}</h3>
              <p className="text-slate-300 text-base lg:text-lg leading-relaxed">
                {t.home.pickYourTradeDesc}
              </p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 lg:p-12" data-testid="step-2">
              <div className="text-6xl lg:text-8xl font-heading font-bold text-orange-500 mb-6">2</div>
              <h3 className="text-xl lg:text-2xl font-bold text-white mb-4">{t.home.answerQuickQuestions}</h3>
              <p className="text-slate-300 text-base lg:text-lg leading-relaxed">
                {t.home.answerQuickQuestionsDesc}
              </p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 lg:p-12" data-testid="step-3">
              <div className="text-6xl lg:text-8xl font-heading font-bold text-orange-500 mb-6">3</div>
              <h3 className="text-xl lg:text-2xl font-bold text-white mb-4">{t.home.sendYourProposal}</h3>
              <p className="text-slate-300 text-base lg:text-lg leading-relaxed">
                {t.home.sendYourProposalDesc}
              </p>
            </div>
          </div>

          <div className="mt-12 sm:mt-16 flex flex-wrap justify-center gap-8 sm:gap-12 lg:gap-16 text-white/80">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-orange-500" />
              <span className="text-base lg:text-lg">{t.home.saveHours}</span>
            </div>
            <div className="flex items-center gap-3">
              <FileCheck className="w-5 h-5 lg:w-6 lg:h-6 text-orange-500" />
              <span className="text-base lg:text-lg">{t.home.lookLikePro}</span>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-orange-500" />
              <span className="text-base lg:text-lg">{t.home.closeDealsFaster}</span>
            </div>
          </div>

          <div className="text-center mt-12 lg:mt-16">
            <Link
              href="/app"
              data-testid="button-create-first-proposal-how"
              className="inline-flex items-center justify-center h-14 lg:h-16 px-10 lg:px-14 rounded-md bg-orange-500 text-white font-bold text-lg lg:text-xl hover:bg-orange-600 transition-all"
            >
              {t.home.createFirstProposal}
              <ArrowRight className="ml-2 w-5 h-5 lg:w-6 lg:h-6" />
            </Link>
          </div>
        </div>
      </section>

      {/* See What Your Proposals Look Like - Professional Preview Section */}
      <ProposalPreviewSection />

      {/* Pricing Section */}
      <section id="pricing" className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-[95vw] xl:max-w-[90vw] 2xl:max-w-[85vw] mx-auto px-4 sm:px-8">
          <div className="text-center mb-12 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-slate-900 mb-4 sm:mb-6">{t.home.simpleAffordablePricing}</h2>
            <p className="text-muted-foreground text-lg sm:text-xl lg:text-2xl">{t.home.pricingSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {/* Starter - Pay per proposal */}
            <div className="bg-white p-8 sm:p-10 lg:p-12 rounded-2xl border border-slate-200 shadow-sm flex flex-col" data-testid="pricing-card-starter">
              <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-3">{t.home.starterPlan}</h3>
              <p className="text-muted-foreground text-base lg:text-lg mb-8">{t.home.starterDesc}</p>
              <div className="text-5xl lg:text-6xl font-heading font-bold text-slate-900 mb-2">{t.home.starterPrice}</div>
              <p className="text-muted-foreground text-base lg:text-lg mb-8">{t.home.starterPriceLabel}</p>
              <ul className="space-y-4 lg:space-y-5 mb-10 flex-grow">
                <li className="flex items-center gap-3 text-base lg:text-lg text-slate-600">
                  <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-green-500 flex-shrink-0" /> {t.home.starterFeature1}
                </li>
                <li className="flex items-center gap-3 text-base lg:text-lg text-slate-600">
                  <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-green-500 flex-shrink-0" /> {t.home.starterFeature2}
                </li>
                <li className="flex items-center gap-3 text-base lg:text-lg text-slate-600">
                  <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-green-500 flex-shrink-0" /> {t.home.starterFeature3}
                </li>
                <li className="flex items-center gap-3 text-base lg:text-lg text-slate-600">
                  <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-green-500 flex-shrink-0" /> {t.home.starterFeature4}
                </li>
                <li className="flex items-center gap-3 text-base lg:text-lg text-slate-600">
                  <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-green-500 flex-shrink-0" /> {t.home.starterFeature5}
                </li>
                <li className="flex items-center gap-3 text-base lg:text-lg text-slate-400">
                  <span className="w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center text-slate-300">—</span> {t.home.starterFeature6}
                </li>
              </ul>
              <button
                onClick={() => handleCheckout('starter')}
                disabled={checkoutLoading === 'starter'}
                className="block w-full text-center py-4 lg:py-5 border-2 border-slate-300 rounded-xl font-bold text-lg lg:text-xl hover:bg-slate-50 transition-colors disabled:opacity-50  hover:cursor-pointer"
                data-testid="button-get-started"
              >
                {checkoutLoading === 'starter' ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> {t.home.processing}
                  </span>
                ) : (
                  t.home.getStarted
                )}
              </button>
            </div>

            {/* Pro - Most Popular */}
            <div className="bg-slate-900 p-8 sm:p-10 lg:p-12 rounded-2xl shadow-xl relative overflow-hidden flex flex-col" data-testid="pricing-card-pro">
              <div className="absolute top-5 right-5 lg:top-6 lg:right-6 bg-orange-500 text-sm lg:text-base font-bold px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg text-white">{t.home.mostPopular}</div>
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3">{t.home.proPlan}</h3>
              <p className="text-slate-300 text-base lg:text-lg mb-8">{t.home.proDesc}</p>
              <div className="text-5xl lg:text-6xl font-heading font-bold text-white mb-2">{t.home.proPrice}<span className="text-xl lg:text-2xl font-normal">{t.home.proPriceLabel}</span></div>
              <p className="text-sm text-orange-300 mb-2">{t.home.freeTrialPricingNote} {t.home.proPrice}{t.home.proPriceLabel}</p>
              <p className="text-slate-400 text-base lg:text-lg mb-8">{t.home.proFeature1}</p>
              <ul className="space-y-4 lg:space-y-5 mb-10 flex-grow">
                <li className="flex items-center gap-3 text-base lg:text-lg text-white" data-testid="pro-esignature-feature">
                  <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-orange-500 flex-shrink-0" /> {t.home.proFeature2}
                </li>
                <li className="flex items-center gap-3 text-base lg:text-lg text-white">
                  <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-orange-500 flex-shrink-0" /> {t.home.proFeature3}
                </li>
                <li className="flex items-center gap-3 text-base lg:text-lg text-white">
                  <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-orange-500 flex-shrink-0" /> {t.home.proFeature4}
                </li>
                <li className="flex items-center gap-3 text-base lg:text-lg text-white">
                  <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-orange-500 flex-shrink-0" /> {t.home.proFeature5}
                </li>
                <li className="flex items-center gap-3 text-base lg:text-lg text-white">
                  <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-orange-500 flex-shrink-0" /> {t.home.proFeature6}
                </li>
              </ul>
              {user?.isPro ? (
                <div className="space-y-2">
                  {user?.cancelAtPeriodEnd && user?.currentPeriodEnd && (() => {
                    const endDate = new Date(user.currentPeriodEnd);
                    const now = new Date();
                    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    const isExpiringSoon = daysRemaining <= 7;

                    return (
                      <div className={`rounded-lg p-3 text-center text-sm ${isExpiringSoon ? 'bg-red-500/20 text-red-200' : 'bg-amber-500/20 text-amber-200'}`}>
                        <p className="font-semibold">Ending in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</p>
                        <p className="text-xs opacity-80">{endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    );
                  })()}
                  <button
                    disabled
                    className="block w-full text-center py-4 lg:py-5 bg-green-500 text-white rounded-xl font-bold text-lg lg:text-xl opacity-90 cursor-default"
                    data-testid="button-current-plan-pro"
                  >
                    Current Plan
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleCheckout('pro')}
                  disabled={checkoutLoading === 'pro'}
                  className="block w-full text-center py-4 lg:py-5 bg-orange-500 text-white rounded-xl font-bold text-lg lg:text-xl hover:bg-orange-600 transition-colors disabled:opacity-50  hover:cursor-pointer"
                  data-testid="button-subscribe-pro"
                >
                  {checkoutLoading === 'pro' ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" /> {t.home.processing}
                    </span>
                  ) : (
                    t.home.startFreeTrial
                  )}
                </button>
              )}
            </div>

            {/* Crew - For Teams */}
            <div className="bg-white p-8 sm:p-10 lg:p-12 rounded-2xl border-2 border-slate-900 shadow-sm relative flex flex-col" data-testid="pricing-card-crew">
              <div className="absolute top-5 right-5 lg:top-6 lg:right-6 bg-slate-900 text-white text-sm lg:text-base font-bold px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg">{t.home.forTeams}</div>
              <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-3">{t.home.crewPlan}</h3>
              <p className="text-muted-foreground text-base lg:text-lg mb-8">{t.home.crewDesc}</p>
              <div className="text-5xl lg:text-6xl font-heading font-bold text-slate-900 mb-2">{t.home.crewPrice}<span className="text-xl lg:text-2xl font-normal text-muted-foreground">{t.home.crewPriceLabel}</span></div>
              <p className="text-sm text-orange-600 mb-2">{t.home.freeTrialPricingNote} {t.home.crewPrice}{t.home.crewPriceLabel}</p>
              <p className="text-muted-foreground text-base lg:text-lg mb-8">{t.home.crewFeature1}</p>
              <ul className="space-y-4 lg:space-y-5 mb-10 flex-grow">
                <li className="flex items-center gap-3 text-base lg:text-lg text-slate-600" data-testid="crew-esignature-feature">
                  <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-green-500 flex-shrink-0" /> {t.home.crewFeature2}
                </li>
                <li className="flex items-center gap-3 text-base lg:text-lg text-slate-600">
                  <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-green-500 flex-shrink-0" /> {t.home.crewFeature3}
                </li>
                <li className="flex items-center gap-3 text-base lg:text-lg text-slate-600">
                  <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-green-500 flex-shrink-0" /> {t.home.crewFeature4}
                </li>
                <li className="flex items-center gap-3 text-base lg:text-lg text-slate-600">
                  <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-green-500 flex-shrink-0" /> {t.home.crewFeature5}
                </li>
                <li className="flex items-center gap-3 text-base lg:text-lg text-slate-600">
                  <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-green-500 flex-shrink-0" /> {t.home.crewFeature6}
                </li>
              </ul>
              <button
                className="block w-full text-center py-4 lg:py-5 bg-slate-900 text-white rounded-xl font-bold text-lg lg:text-xl hover:bg-slate-800 transition-colors disabled:opacity-50 hover:cursor-pointer"
                data-testid="button-subscribe-crew"
              >
                Coming soon...
              </button>
            </div>
          </div>

          {/* Compare Plans Table */}
          <div className="mt-16 lg:mt-20" data-testid="compare-plans-section">
            <PlanCompareTable t={t} />
          </div>

          <p className="text-center text-muted-foreground text-base lg:text-lg mt-10 lg:mt-14">
            {t.home.allPlansInclude}
          </p>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-slate-900 py-12 sm:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-white mb-4 sm:mb-6">
            {t.home.readyToLookLikePro}
          </h2>
          <Link
            href="/app"
            data-testid="button-create-first-proposal-cta"
            className="inline-block bg-orange-500 text-white font-bold text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 rounded-md hover:bg-orange-600 transition-colors shadow-lg"
          >
            {t.home.startFreeTrial}
          </Link>
          <p className="mt-3 sm:mt-4 text-slate-400 text-xs sm:text-sm">{t.home.freeTrialCtaNote}</p>
        </div>
      </section>
    </LayoutWrapper>
  );
}
