'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { 
  Crown, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Loader2, 
  ArrowRight,
  Settings,
  Users,
  Sparkles,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Zap
} from "lucide-react";

export default function ProDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Redirect non-pro users to home
  useEffect(() => {
    if (!authLoading && user && user.subscriptionPlan !== 'pro') {
      if (user.subscriptionPlan === 'crew') {
        router.push("/crew");
      } else {
        router.push("/#pricing");
      }
    }
  }, [user, authLoading, router]);

  const handleBuyCredits = async (pack: string) => {
    setCheckoutLoading(pack);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productType: pack }),
      });
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.message) {
        alert(data.message);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleUpgradeToCrew = async () => {
    setCheckoutLoading('crew');
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productType: 'crew' }),
      });
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.message) {
        alert(data.message);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(null);
    }
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

  if (!user || user.subscriptionPlan !== 'pro') {
    return null;
  }

  // Calculate usage
  const monthlyLimit = 15;
  const creditsExpired = user.creditsExpireAt && new Date(user.creditsExpireAt) < new Date();
  const proposalsUsed = creditsExpired ? monthlyLimit : Math.max(0, monthlyLimit - (user.proposalCredits || 0));
  const proposalsRemaining = creditsExpired ? 0 : (user.proposalCredits || 0);
  const usagePercentage = (proposalsUsed / monthlyLimit) * 100;

  // Determine state based on usage
  const getUsageState = () => {
    if (proposalsRemaining === 0) return 'exhausted';
    if (proposalsRemaining === 1) return 'almost-out';
    if (proposalsRemaining <= 4) return 'running-low';
    return 'plenty';
  };

  const usageState = getUsageState();

  // Get progress bar color based on state
  const getProgressColor = () => {
    switch (usageState) {
      case 'exhausted': return 'bg-red-500';
      case 'almost-out': return 'bg-red-500';
      case 'running-low': return 'bg-amber-500';
      default: return 'bg-primary';
    }
  };

  // Format reset date
  const getResetDate = () => {
    if (user.creditsExpireAt) {
      const expireDate = new Date(user.creditsExpireAt);
      return expireDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    // Default to next month
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    return nextMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntilReset = () => {
    if (user.creditsExpireAt) {
      const expireDate = new Date(user.creditsExpireAt);
      const now = new Date();
      const diffTime = expireDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    }
    return 30;
  };

  const creditPacks = [
    { id: 'credits-5', count: 5, price: 25, perUnit: 5.00 },
    { id: 'credits-10', count: 10, price: 45, perUnit: 4.50, popular: true },
    { id: 'credits-25', count: 25, price: 99, perUnit: 3.96 },
  ];

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen pb-12">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 py-6 md:py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">
                    {t.pro.title}
                  </h1>
                  <p className="text-slate-500 text-sm">{t.pro.subtitle}</p>
                </div>
              </div>
              <Link href="/settings">
                <Button variant="outline" className="gap-2">
                  <Settings className="w-4 h-4" />
                  {t.pro.settings}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 md:py-8 space-y-6">
          {/* Usage Card */}
          <Card className={`border-0 shadow-sm overflow-hidden ${
            usageState === 'exhausted' ? 'ring-2 ring-red-200' : 
            usageState === 'almost-out' ? 'ring-2 ring-amber-200' : ''
          }`}>
            <CardHeader className={`pb-4 ${
              usageState === 'exhausted' ? 'bg-red-50' : 
              usageState === 'almost-out' ? 'bg-amber-50' : 
              usageState === 'running-low' ? 'bg-amber-50/50' : 'bg-white'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-600" />
                  <CardTitle className="text-lg">{t.pro.proposalsThisMonth}</CardTitle>
                </div>
                {usageState === 'exhausted' && (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="w-3 h-3" />
                    {t.pro.limitReached}
                  </Badge>
                )}
                {usageState === 'almost-out' && (
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {t.pro.onlyLeft.replace('{count}', String(proposalsRemaining))}
                  </Badge>
                )}
                {usageState === 'running-low' && (
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 gap-1">
                    <Zap className="w-3 h-3" />
                    {t.pro.runningLow}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-4xl font-bold text-slate-900">{proposalsUsed}</span>
                    <span className="text-2xl text-slate-400"> / {monthlyLimit}</span>
                    <span className="text-slate-500 ml-2">{t.pro.used}</span>
                  </div>
                  {(usageState === 'running-low') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1 text-amber-700 border-amber-300 hover:bg-amber-50"
                      onClick={() => document.getElementById('buy-more')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      <Sparkles className="w-4 h-4" />
                      {t.pro.buyMore}
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${getProgressColor()}`}
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-500">
                    {t.pro.resets} {getResetDate()} ({getDaysUntilReset()} {t.pro.days})
                  </p>
                </div>

                {/* Buy More Section - shown when almost out or exhausted */}
                {(usageState === 'almost-out' || usageState === 'exhausted') && (
                  <div id="buy-more" className="pt-4 border-t border-slate-100">
                    <p className="text-sm font-medium text-slate-700 mb-4">
                      {usageState === 'exhausted' 
                        ? t.pro.getMoreProposals 
                        : t.pro.runningLowStock}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {creditPacks.map((pack) => (
                        <div 
                          key={pack.id}
                          className={`relative rounded-xl border-2 p-4 text-center transition-all hover:shadow-md ${
                            pack.popular 
                              ? 'border-orange-300 bg-orange-50/50' 
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          {pack.popular && (
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                              <Badge className="bg-orange-500 text-white text-xs">{t.pro.popular}</Badge>
                            </div>
                          )}
                          <div className="text-2xl font-bold text-slate-900 mt-1">
                            {pack.count} <span className="text-base font-normal text-slate-500">{t.pro.proposals}</span>
                          </div>
                          <div className="text-lg font-semibold text-slate-700">${pack.price}</div>
                          <div className="text-xs text-slate-500 mb-3">${pack.perUnit.toFixed(2)} {t.pro.each}</div>
                          <Button 
                            size="sm" 
                            className={`w-full ${pack.popular ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                            onClick={() => handleBuyCredits(pack.id)}
                            disabled={checkoutLoading === pack.id}
                          >
                            {checkoutLoading === pack.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              t.pro.buyNow
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pro Features / Quick Actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-orange-500" />
                {t.pro.proFeatures}
              </CardTitle>
              <CardDescription>{t.pro.quickAccess}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Create Proposal */}
                <Link href="/app" className="block group">
                  <div className="h-full p-6 rounded-xl border-2 border-slate-200 bg-white hover:border-primary hover:shadow-md transition-all">
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">{t.pro.createProposal}</h3>
                    <p className="text-sm text-slate-500 mb-4">{t.pro.createProposalDesc}</p>
                    <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                      {t.pro.createNow} <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Link>

                {/* Market Pricing */}
                <Link href="/market-pricing" className="block group">
                  <div className="h-full p-6 rounded-xl border-2 border-slate-200 bg-white hover:border-emerald-500 hover:shadow-md transition-all">
                    <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                      <DollarSign className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">{t.pro.marketPricing}</h3>
                    <p className="text-sm text-slate-500 mb-4">{t.pro.marketPricingDesc}</p>
                    <div className="flex items-center text-emerald-600 font-medium text-sm group-hover:gap-2 transition-all">
                      {t.pro.lookUp} <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Link>

                {/* Pricing Insights */}
                <Link href="/pricing-insights" className="block group">
                  <div className="h-full p-6 rounded-xl border-2 border-slate-200 bg-white hover:border-purple-500 hover:shadow-md transition-all">
                    <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">{t.pro.pricingInsights}</h3>
                    <p className="text-sm text-slate-500 mb-4">{t.pro.pricingInsightsDesc}</p>
                    <div className="flex items-center text-purple-600 font-medium text-sm group-hover:gap-2 transition-all">
                      {t.pro.viewInsights} <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* What's Included */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="w-5 h-5 text-orange-500" />
                {t.pro.whatsIncluded}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50">
                  <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <span className="text-slate-700">{t.pro.proposalsPerMonth}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50">
                  <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <span className="text-slate-700">{t.pro.unlimitedMarketPricing}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50">
                  <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <span className="text-slate-700">{t.pro.pricingAnalytics}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50">
                  <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <span className="text-slate-700">{t.pro.prioritySupport}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade to Crew */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">{t.pro.needTeamAccess}</h3>
                    <p className="text-slate-300 text-sm">
                      {t.pro.upgradeToCrewDesc}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleUpgradeToCrew}
                  disabled={checkoutLoading === 'crew'}
                  className="bg-white text-slate-900 hover:bg-slate-100 font-bold gap-2 w-full md:w-auto"
                >
                  {checkoutLoading === 'crew' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {t.pro.upgradeToCrew}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
