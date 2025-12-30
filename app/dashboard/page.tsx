'use client';
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Coins, DollarSign, FileText, Loader2, Users, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DeleteDraftDialog from "@/components/delete-draft-dialog";
import EmailProposalModal from "@/components/email-proposal-modal";
import EditPriceModal from "@/components/edit-price-modal";
import CountersignModal from "@/components/countersign-modal";
import PaymentLinkModal from "@/components/payment-link-modal";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { DashboardPageHeader, type DashboardDateRange } from "@/components/dashboard/PageHeader";
import { InsightsPanel, type InsightsData } from "@/components/dashboard/InsightsPanel";
import { PipelineBar } from "@/components/dashboard/PipelineBar";
import { RecentProposalsTable } from "@/components/dashboard/RecentProposalsTable";
import { StatCard } from "@/components/dashboard/StatCard";

interface Proposal {
  id: number;
  clientName: string;
  address: string;
  jobTypeName: string;
  priceLow: number;
  priceHigh: number;
  status: string;
  createdAt: string;
  publicToken?: string | null;
  contractorSignature?: string | null;
  contractorSignedAt?: string | null;
  paymentLinkUrl?: string | null;
  depositPercentage?: number | null;
  depositAmount?: number | null;
  paymentStatus?: string | null;
  paidAmount?: number | null;
  viewCount?: number | null;
  lastViewedAt?: string | null;
}

export default function Dashboard() {
  const { user, isLoading: authLoading, error: authError } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(true);
  const [emailModalData, setEmailModalData] = useState<{ id: number; clientName: string } | null>(null);
  const [priceModalData, setPriceModalData] = useState<{ 
    id: number; 
    clientName: string; 
    priceLow: number; 
    priceHigh: number; 
  } | null>(null);
  const [countersignModalData, setCountersignModalData] = useState<{
    id: number;
    clientName: string;
  } | null>(null);
  const [paymentModalData, setPaymentModalData] = useState<{
    id: number;
    clientName: string;
    priceLow: number;
    priceHigh: number;
    paymentLinkUrl?: string | null;
    depositPercentage?: number | null;
  } | null>(null);
  const [deleteModalData, setDeleteModalData] = useState<{
    id: number;
    clientName: string;
  } | null>(null);
  const [dateRange, setDateRange] = useState<DashboardDateRange>("30d");
  const { toast } = useToast();

  // Proposal actions are handled inline where used to keep callbacks lightweight.

  // Handle checkout redirect after sign-up
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutPlan = urlParams.get('checkout');
    
    if (checkoutPlan && user) {
      // Clear the URL parameter
      window.history.replaceState({}, '', '/dashboard');
      
      // Trigger checkout for the selected plan
      const handleCheckout = async () => {
        try {
          const response = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productType: checkoutPlan }),
          });
          
          const data = await response.json();
          
          if (data.url) {
            window.location.href = data.url;
          } else if (data.message) {
            setSuccessMessage(data.message);
            setIsSuccess(false);
          }
        } catch (error) {
          console.error('Checkout error:', error);
          setSuccessMessage('Something went wrong. Please try subscribing from the pricing page.');
          setIsSuccess(false);
        }
      };
      
      handleCheckout();
    }
  }, [user]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      const sessionId = urlParams.get('session_id');
      if (sessionId) {
        fetch('/api/stripe/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ sessionId }),
        })
          .then(res => res.json())
          .then((data) => {
            if (data.creditsAdded) {
              setSuccessMessage(`${t.dashboard.paymentSuccessful} ${data.creditsAdded} ${t.dashboard.paymentSuccessCredits}`);
              setIsSuccess(true);
              window.location.reload();
            } else {
              setSuccessMessage(t.dashboard.paymentSuccessful);
              setIsSuccess(true);
            }
          })
          .catch(() => {
            setSuccessMessage(t.dashboard.paymentReceived);
            setIsSuccess(true);
          });
      } else {
        setSuccessMessage(t.dashboard.paymentSuccessful);
        setIsSuccess(true);
      }
      window.history.replaceState({}, '', '/dashboard');
    } else if (urlParams.get('canceled') === 'true') {
      setSuccessMessage(t.dashboard.paymentCanceled);
      setIsSuccess(false);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [t]);

  useEffect(() => {
    if (user) {
      fetch('/api/proposals', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          setProposals(Array.isArray(data) ? data : []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchInsights = useCallback(async () => {
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const response = await fetch("/api/analytics/insights", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch insights");
      const data = (await response.json()) as InsightsData;
      setInsights(data);
    } catch (err) {
      setInsightsError(err instanceof Error ? err.message : "Failed to fetch insights");
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchInsights();
  }, [user, fetchInsights]);

  const creditsExpired = user?.creditsExpireAt && new Date(user.creditsExpireAt) < new Date();
  const availableCredits = creditsExpired ? 0 : (user?.proposalCredits || 0);

  const updateProposalStatus = async (proposalId: number, status: string) => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      
      if (response.ok) {
        setProposals(prev => 
          prev.map(p => p.id === proposalId ? { ...p, status } : p)
        );
      }
    } catch (error) {
      console.error('Error updating proposal status:', error);
    }
  };

  const handleDeleteSuccess = (proposalId: number) => {
    // Optimistic UI update - remove the proposal from the list
    setProposals(prev => prev.filter(p => p.id !== proposalId));
    toast({
      title: t.dashboard.draftDeleted,
      description: t.dashboard.draftDeletedDescription,
    });
  };

  const handleDeleteError = (message: string) => {
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  };
  
  const locale = language === "es" ? "es-ES" : "en-US";

  const proposalsInRange = useMemo(() => {
    if (dateRange === "all") return proposals;
    const days = dateRange === "7d" ? 7 : dateRange === "90d" ? 90 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return proposals.filter((p) => new Date(p.createdAt) >= cutoff);
  }, [proposals, dateRange]);

  const sortedProposals = useMemo(() => {
    return [...proposalsInRange].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [proposalsInRange]);

  const pipelineCounts = useMemo(() => {
    const init = { draft: 0, sent: 0, viewed: 0, accepted: 0, won: 0, lost: 0 };
    for (const p of proposalsInRange) {
      const s = p.status.toLowerCase();
      if (s in init) (init as any)[s] += 1;
    }
    return init as { draft: number; sent: number; viewed: number; accepted: number; won: number; lost: number };
  }, [proposalsInRange]);

  const revenueWon = useMemo(() => {
    const total = proposalsInRange
      .filter((p) => p.status.toLowerCase() === "won")
      .reduce((sum, p) => sum + (p.priceLow + p.priceHigh) / 2, 0);
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(total);
  }, [proposalsInRange, locale]);

  const pendingCount = useMemo(() => {
    return proposalsInRange.filter((p) => {
      const s = p.status.toLowerCase();
      return s === "sent" || s === "draft";
    }).length;
  }, [proposalsInRange]);

  const rangeHelper = (() => {
    if (dateRange === "all") return t.dashboard.allTime;
    const es = language === "es";
    if (dateRange === "7d") return es ? "Últimos 7 días" : "Last 7 days";
    if (dateRange === "90d") return es ? "Últimos 90 días" : "Last 90 days";
    return es ? "Últimos 30 días" : "Last 30 days";
  })();

  const avgTimeLabel = (hours: number | null) => {
    if (hours == null) return "—";
    if (hours < 24) return `${hours}h`;
    return `${Math.round(hours / 24)}d`;
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (authError) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Authentication Error</h2>
          <p className="text-muted-foreground mb-6">
            We couldn&apos;t verify your session. This might be due to a connection issue.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline" className="mr-2">
            Retry
          </Button>
          <Link
            href="/sign-in"
            className="bg-primary text-white px-6 py-2.5 rounded-md font-semibold hover:bg-primary/90"
          >
            Sign In Again
          </Link>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <h2 className="text-2xl font-bold mb-4">{t.settings.signInRequired}</h2>
          <p className="text-muted-foreground mb-6">{t.dashboard.subtitle}</p>
          <Link
            href="/sign-in?redirect_url=%2Fdashboard"
            className="bg-primary text-white px-6 py-3 rounded-md font-semibold"
          >
            {t.settings.signInWithReplit}
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen pb-12">
        {successMessage && (
          <div className={`py-3 px-4 text-center text-sm font-medium ${
            isSuccess 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            <div className="flex items-center justify-center gap-2">
              {isSuccess ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {successMessage}
            </div>
          </div>
        )}
        <DashboardPageHeader
          title={t.dashboard.dashboardTitle}
          subtitle={`${t.dashboard.welcomeBack}, ${user.firstName || t.dashboard.contractor}`}
          isPro={user.isPro}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          language={language}
          newProposalLabel={t.dashboard.newProposal}
          scopeScanLabel="ScopeScan"
          manageTemplatesLabel={t.dashboard.manageTemplates}
        />

        <div className="container mx-auto space-y-6 px-4 py-6 md:space-y-8 md:py-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={t.dashboard.proposalCredits}
              value={availableCredits.toString()}
              helper={
                user?.creditsExpireAt && !creditsExpired
                  ? `${t.dashboard.expires} ${new Date(user.creditsExpireAt).toLocaleDateString(locale)}`
                  : t.dashboard.availableToUse
              }
              icon={Coins}
              iconTone="orange"
            />
            <StatCard
              label={t.dashboard.totalProposals}
              value={proposalsInRange.length.toString()}
              helper={rangeHelper}
              icon={FileText}
              iconTone="slate"
            />
            <StatCard
              label={t.dashboard.revenueWon}
              value={revenueWon}
              helper={rangeHelper}
              icon={DollarSign}
              iconTone="green"
            />
            <StatCard
              label={t.dashboard.pending}
              value={pendingCount.toString()}
              helper={t.dashboard.awaitingResponse}
              icon={Users}
              iconTone="blue"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <div className="space-y-4">
                <PipelineBar
                  title="Pipeline"
                  counts={pipelineCounts}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
                    <CardHeader className="px-6 py-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Avg time to first view
                      </div>
                      <div className="mt-2 text-2xl font-semibold text-slate-900">
                        {avgTimeLabel(insights?.avgTimeToView ?? null)}
                      </div>
                    </CardHeader>
                  </Card>
                  <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
                    <CardHeader className="px-6 py-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Avg time to accept
                      </div>
                      <div className="mt-2 text-2xl font-semibold text-slate-900">
                        {avgTimeLabel(insights?.avgTimeToAccept ?? null)}
                      </div>
                    </CardHeader>
                  </Card>
                </div>
              </div>

              <RecentProposalsTable
                title={t.dashboard.recentProposals}
                proposals={sortedProposals}
                locale={locale}
                showPaymentLink={!!user?.userStripeEnabled}
                onEdit={(p) => router.push(`/app?edit=${p.id}`)}
                onView={(p) => {
                  if (p.publicToken) window.open(`/p/${p.publicToken}`, "_blank");
                }}
                onEmail={(p) => setEmailModalData({ id: p.id, clientName: p.clientName })}
                onAdjustPrice={(p) =>
                  setPriceModalData({
                    id: p.id,
                    clientName: p.clientName,
                    priceLow: p.priceLow,
                    priceHigh: p.priceHigh,
                  })
                }
                onCountersign={(p) => setCountersignModalData({ id: p.id, clientName: p.clientName })}
                onPayment={(p) =>
                  setPaymentModalData({
                    id: p.id,
                    clientName: p.clientName,
                    priceLow: p.priceLow,
                    priceHigh: p.priceHigh,
                    paymentLinkUrl: p.paymentLinkUrl,
                    depositPercentage: p.depositPercentage,
                  })
                }
                onMarkStatus={(p, status) => updateProposalStatus(p.id, status)}
                onDeleteDraft={(p) => setDeleteModalData({ id: p.id, clientName: p.clientName })}
              />
            </div>

            <div className="space-y-6 lg:col-span-4">
              {insightsLoading ? (
                <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
                  <CardContent className="flex items-center gap-2 p-6 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    {t.dashboard.loadingInsights}
                  </CardContent>
                </Card>
              ) : insightsError ? (
                <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
                  <CardContent className="space-y-3 p-6">
                    <div className="text-sm font-semibold text-slate-900">
                      {t.dashboard.insightsUnavailable}
                    </div>
                    <div className="text-sm text-slate-500">{insightsError}</div>
                    <Button variant="outline" onClick={fetchInsights}>
                      {t.dashboard.retry}
                    </Button>
                  </CardContent>
                </Card>
              ) : insights ? (
                <InsightsPanel insights={insights} locale={locale} />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {emailModalData && (
        <EmailProposalModal
          isOpen={true}
          onClose={() => setEmailModalData(null)}
          proposalId={emailModalData.id}
          clientName={emailModalData.clientName}
          onSuccess={() => {
            fetch('/api/proposals', { credentials: 'include' })
              .then(res => res.json())
              .then(data => setProposals(Array.isArray(data) ? data : []))
              .catch(console.error);
          }}
        />
      )}

      {priceModalData && (
        <EditPriceModal
          isOpen={true}
          onClose={() => setPriceModalData(null)}
          proposalId={priceModalData.id}
          clientName={priceModalData.clientName}
          currentPriceLow={priceModalData.priceLow}
          currentPriceHigh={priceModalData.priceHigh}
          onUpdated={() => {
            fetch('/api/proposals', { credentials: 'include' })
              .then(res => res.json())
              .then(data => setProposals(Array.isArray(data) ? data : []))
              .catch(console.error);
          }}
        />
      )}

      {countersignModalData && (
        <CountersignModal
          isOpen={true}
          onClose={() => setCountersignModalData(null)}
          proposalId={countersignModalData.id}
          clientName={countersignModalData.clientName}
          onSuccess={() => {
            setSuccessMessage(t.dashboard.proposalCountersigned);
            setIsSuccess(true);
            fetch('/api/proposals', { credentials: 'include' })
              .then(res => res.json())
              .then(data => setProposals(Array.isArray(data) ? data : []))
              .catch(console.error);
          }}
        />
      )}

      {paymentModalData && (
        <PaymentLinkModal
          isOpen={true}
          onClose={() => setPaymentModalData(null)}
          proposalId={paymentModalData.id}
          clientName={paymentModalData.clientName}
          priceLow={paymentModalData.priceLow}
          priceHigh={paymentModalData.priceHigh}
          existingPaymentLink={paymentModalData.paymentLinkUrl}
          existingDepositPercentage={paymentModalData.depositPercentage}
          onSuccess={() => {
            setSuccessMessage(t.dashboard.paymentLinkCreatedSuccess);
            setIsSuccess(true);
            fetch('/api/proposals', { credentials: 'include' })
              .then(res => res.json())
              .then(data => setProposals(Array.isArray(data) ? data : []))
              .catch(console.error);
          }}
        />
      )}

      {deleteModalData && (
        <DeleteDraftDialog
          isOpen={true}
          onClose={() => setDeleteModalData(null)}
          proposalId={deleteModalData.id}
          clientName={deleteModalData.clientName}
          onSuccess={() => handleDeleteSuccess(deleteModalData.id)}
          onError={handleDeleteError}
        />
      )}
    </Layout>
  );
}
