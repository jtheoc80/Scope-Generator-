'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LayoutWrapper from "@/components/layout-wrapper";
import { useLanguage } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  Shield,
  Clock,
  CreditCard,
  Zap,
  Crown,
  Users,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";

type PlanOption = 'starter' | 'pro' | 'crew';

interface PlanCardProps {
  id: PlanOption;
  icon: React.ReactNode;
  title: string;
  description: string;
  trialNote: string;
  features: string[];
  popular?: boolean;
  comingSoon?: boolean;
  selected: boolean;
  onSelect: (id: PlanOption) => void;
}

function PlanCard({
  id,
  icon,
  title,
  description,
  trialNote,
  features,
  popular,
  comingSoon,
  selected,
  onSelect,
}: PlanCardProps) {
  return (
    <div
      data-testid={`free-trial-plan-${id}`}
      onClick={() => !comingSoon && onSelect(id)}
      className={`relative rounded-2xl border-2 p-6 sm:p-8 transition-all duration-300 ${
        comingSoon
          ? "border-slate-200 bg-slate-50 opacity-70 cursor-not-allowed"
          : selected
          ? "border-orange-500 bg-orange-50/50 shadow-xl shadow-orange-500/10 scale-[1.02]"
          : "border-slate-200 bg-white hover:border-orange-300 hover:shadow-lg cursor-pointer"
      } flex flex-col`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
          MOST POPULAR
        </div>
      )}

      {comingSoon && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
          COMING SOON
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            selected
              ? "bg-orange-500 text-white"
              : comingSoon
              ? "bg-slate-200 text-slate-400"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <div
        className={`rounded-lg px-4 py-3 mb-6 ${
          selected
            ? "bg-orange-100 border border-orange-200"
            : "bg-slate-50 border border-slate-100"
        }`}
      >
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${selected ? "text-orange-600" : "text-slate-400"}`} />
          <span
            className={`text-sm font-medium ${
              selected ? "text-orange-700" : "text-slate-600"
            }`}
          >
            {trialNote}
          </span>
        </div>
      </div>

      <ul className="space-y-3 mb-6 flex-grow">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
            <CheckCircle2
              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                selected ? "text-orange-500" : "text-green-500"
              }`}
            />
            {feature}
          </li>
        ))}
      </ul>

      {/* Selection indicator */}
      <div
        className={`mt-auto py-3 rounded-xl text-center font-bold text-sm transition-all ${
          comingSoon
            ? "bg-slate-200 text-slate-400"
            : selected
            ? "bg-orange-500 text-white shadow-md"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`}
      >
        {comingSoon ? "Coming Soon" : selected ? "Selected" : "Select This Plan"}
      </div>
    </div>
  );
}

export default function FreeTrialPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanOption>('pro');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Track free trial page view on mount
  useEffect(() => {
    trackEvent('free_trial_page_view', 'free_trial', 'page_load');
  }, []);

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

  const handleStartTrial = async () => {
    trackEvent('free_trial_start_click', 'free_trial', selectedPlan);

    // If user is not logged in, redirect to sign-up with the plan
    if (!user) {
      trackEvent('free_trial_redirect_signup', 'free_trial', selectedPlan);
      const redirectUrl = `/dashboard?checkout=${selectedPlan}`;
      router.push(
        `/sign-up?plan=${selectedPlan}&redirect_url=${encodeURIComponent(redirectUrl)}`
      );
      return;
    }

    setCheckoutLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType: selectedPlan }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.message) {
        alert(data.message);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const plans: {
    id: PlanOption;
    icon: React.ReactNode;
    title: string;
    description: string;
    trialNote: string;
    features: string[];
    popular?: boolean;
    comingSoon?: boolean;
  }[] = [
    {
      id: "starter",
      icon: <Zap className="w-6 h-6" />,
      title: t.home.freeTrialStarterTitle,
      description: t.home.freeTrialStarterDesc,
      trialNote: t.home.freeTrialStarterTrialNote,
      features: [
        t.home.starterFeature1,
        t.home.starterFeature2,
        t.home.starterFeature3,
        t.home.starterFeature4,
        t.home.starterFeature5,
      ],
    },
    {
      id: "pro",
      icon: <Crown className="w-6 h-6" />,
      title: t.home.freeTrialProTitle,
      description: t.home.freeTrialProDesc,
      trialNote: t.home.freeTrialProTrialNote,
      popular: true,
      features: [
        t.home.proFeature1,
        t.home.proFeature2,
        t.home.proFeature3,
        t.home.proFeature4,
        t.home.proFeature5,
        t.home.proFeature6,
      ],
    },
    {
      id: "crew",
      icon: <Users className="w-6 h-6" />,
      title: t.home.freeTrialCrewTitle,
      description: t.home.freeTrialCrewDesc,
      trialNote: t.home.freeTrialCrewTrialNote,
      comingSoon: true,
      features: [
        t.home.crewFeature1,
        t.home.crewFeature2,
        t.home.crewFeature3,
        t.home.crewFeature4,
        t.home.crewFeature5,
        t.home.crewFeature6,
      ],
    },
  ];

  return (
    <LayoutWrapper>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.3),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(249,115,22,0.2),transparent_50%)]" />
        </div>

        <div className="container mx-auto px-4 py-16 sm:py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              {t.home.freeTrialBadge}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold leading-tight mb-4">
              {t.home.freeTrialPageTitle}
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto">
              {t.home.freeTrialPageSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Plan Selection */}
      <section className="py-12 sm:py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  {...plan}
                  selected={selectedPlan === plan.id}
                  onSelect={(id) => {
                    setSelectedPlan(id);
                    trackEvent('free_trial_plan_select', 'free_trial', id);
                  }}
                />
              ))}
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-10">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <CreditCard className="w-4 h-4 text-green-500" />
                <span>{t.home.freeTrialNoCreditCard}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Clock className="w-4 h-4 text-orange-500" />
                <span>{t.home.freeTrialCancelAnytime}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Shield className="w-4 h-4 text-blue-500" />
                <span>{t.home.freeTrialFullAccess}</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="max-w-md mx-auto">
              <button
                onClick={handleStartTrial}
                disabled={checkoutLoading || selectedPlan === 'crew'}
                data-testid="free-trial-start-button"
                className="w-full flex items-center justify-center gap-2 h-14 sm:h-16 rounded-xl bg-orange-500 text-white font-bold text-lg sm:text-xl hover:bg-orange-600 transition-all hover:scale-[1.02] shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t.home.processing}
                  </>
                ) : (
                  <>
                    {t.home.freeTrialSelectPlan}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-slate-500 mt-4">
                {t.home.freeTrialCtaNote}
              </p>
            </div>

            {/* Back to pricing link */}
            <div className="text-center mt-8">
              <Link
                href="/#pricing"
                className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.home.freeTrialBackToPricing}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </LayoutWrapper>
  );
}
