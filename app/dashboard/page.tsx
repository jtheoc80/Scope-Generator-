'use client';
// Force dynamic rendering to prevent static generation errors
// This page uses useAuth() which requires QueryClientProvider
export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LayoutWrapper from "@/components/layout-wrapper";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Coins, DollarSign, FileText, Users, XCircle, Lock, Unlock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DeleteDraftDialog from "@/components/delete-draft-dialog";
import EmailProposalModal from "@/components/email-proposal-modal";
import EditPriceModal from "@/components/edit-price-modal";
import CountersignModal from "@/components/countersign-modal";
import PaymentLinkModal from "@/components/payment-link-modal";
import PaywallModal from "@/components/paywall-modal";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardPageHeader, type DashboardDateRange } from "@/components/dashboard/PageHeader";
import { InsightsPanel, type InsightsData } from "@/components/dashboard/InsightsPanel";
import { PipelineBar, type PipelineStageKey } from "@/components/dashboard/PipelineBar";
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
  photoCount?: number | null;
  thumbnailUrl?: string | null;
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
  isUnlocked?: boolean;
}

export default function Dashboard() {
  const { user, isLoading: authLoading, error: authError, refetch } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(true);
  const [dashboardStats, setDashboardStats] = useState<{
    proposalCredits: number;
    creditsExpireAt: string | null;
    totalProposals: number;
    revenueWon: number;
    pending: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [emailModalData, setEmailModalData] = useState<{ id: number; clientName: string; publicToken?: string } | null>(null);
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
  const [statusFilter, setStatusFilter] = useState<PipelineStageKey | "all">("all");
  const [showPaywall, setShowPaywall] = useState(false);
  const [unlockingProposalId, setUnlockingProposalId] = useState<number | null>(null);
  const { toast } = useToast();

  // Handle unlock proposal (deducts 1 credit for free users)
  const handleUnlockProposal = async (proposalId: number) => {
    setUnlockingProposalId(proposalId);
    try {
      const response = await fetch(`/api/proposals/${proposalId}/unlock`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.status === 402) {
        // No credits - show paywall
        setShowPaywall(true);
        toast({
          title: "Credits Required",
          description: data.message || "You need credits to unlock this proposal",
          variant: "destructive"
        });
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to unlock proposal");
      }

      toast({
        title: t.common.success,
        description: data.creditDeducted
          ? `Proposal unlocked! ${data.remainingCredits} credits remaining.`
          : "Proposal unlocked!",
      });

      // Invalidate React Query caches first
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/billing/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });

      // Refresh proposals list from server to get updated data
      fetch('/api/proposals', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        }
      })
        .then(res => res.json())
        .then(data => {
          setProposals(Array.isArray(data) ? data : []);
        })
        .catch(console.error);

      // Refresh dashboard stats (includes fresh credits from database)
      fetchDashboardStats();

      // Refresh insights
      fetchInsights();
    } catch (error) {
      console.error("Error unlocking proposal:", error);
      toast({
        title: t.common.error,
        description: error instanceof Error ? error.message : "Failed to unlock proposal",
        variant: "destructive"
      });
    } finally {
      setUnlockingProposalId(null);
    }
  };

  // State for tracking which proposal is being downloaded
  const [downloadingProposalId, setDownloadingProposalId] = useState<number | null>(null);

  // Handle direct PDF download from dashboard
  const handleDownloadPdf = async (proposal: Proposal) => {
    setDownloadingProposalId(proposal.id);

    // Show loading toast
    toast({
      title: "Downloading PDF...",
      description: `Generating PDF for ${proposal.clientName}`,
    });

    try {
      const response = await fetch(`/api/proposals/${proposal.id}/pdf`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 402 && errorData.requiresUnlock) {
          toast({
            title: t.common.error,
            description: "Please unlock the proposal first to download the PDF.",
            variant: "destructive"
          });
          return;
        }
        throw new Error(errorData.message || "Failed to generate PDF");
      }

      // Get the filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `proposal-${proposal.clientName || 'draft'}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="([^"]+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Download the PDF blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: t.common.success,
        description: t.toast?.downloadSuccess || "PDF downloaded successfully",
      });
    } catch (error) {
      console.error("PDF Download Error:", error);
      toast({
        title: t.common.error,
        description: error instanceof Error ? error.message : "Failed to download PDF",
        variant: "destructive"
      });
    } finally {
      setDownloadingProposalId(null);
    }
  };

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
  }, [user, refetch]);

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
            console.log('[Dashboard] Verify session response:', data);
            if (data.type === 'subscription') {
              setSuccessMessage(`${t.dashboard.paymentSuccessful} Your ${data.planActivated} plan is now active.`);
              setIsSuccess(true);
            } else if (data.creditsAdded) {
              setSuccessMessage(`${t.dashboard.paymentSuccessful} ${data.creditsAdded} ${t.dashboard.paymentSuccessCredits}`);
              setIsSuccess(true);
            } else {
              setSuccessMessage(t.dashboard.paymentSuccessful);
              setIsSuccess(true);
            }
            // Force refetch user data to update UI immediately
            // Invalidate the cache and refetch to ensure fresh data
            // The verify-session endpoint clears the cookie cache, so this will fetch fresh data
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            queryClient.invalidateQueries({ queryKey: ["/api/billing/status"] });
            // Use a small delay to ensure cookie is cleared and backend is ready
            setTimeout(() => {
              // Force a fresh fetch with skipCache to bypass any remaining cache
              fetch('/api/auth/user?skipCache=true', {
                credentials: 'include',
                cache: 'no-store',
              })
                .then(() => {
                  queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
                  refetch();
                })
                .catch(console.error);
            }, 500);
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
  }, [t, refetch]);

  useEffect(() => {
    if (user) {
      fetch('/api/proposals', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        }
      })
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

  // Fetch dashboard stats (fresh from database, no cache)
  const fetchDashboardStats = useCallback(async () => {
    if (!user) return;

    setStatsLoading(true);
    try {
      const response = await fetch('/api/dashboard/stats', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      setDashboardStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user, fetchDashboardStats]);

  // REMOVED: Auto-grant credits logic was removed because it was incorrectly
  // granting 15/50 credits every browser session when credits hit 0.
  // Credits should ONLY be added via:
  // 1. New subscription activation (checkout.session.completed webhook)
  // 2. Monthly subscription renewal (customer.subscription.updated webhook)
  // 3. Credit pack purchases (checkout.session.completed webhook)

  // Use dashboard stats if available, otherwise fall back to user data
  const creditsExpired = dashboardStats?.creditsExpireAt
    ? new Date(dashboardStats.creditsExpireAt) < new Date()
    : (user?.creditsExpireAt && new Date(user.creditsExpireAt) < new Date());
  const availableCredits = dashboardStats?.proposalCredits ??
    (creditsExpired ? 0 : (user?.proposalCredits || 0));

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
        fetchDashboardStats();
        fetchInsights();
      }
    } catch (error) {
      console.error('Error updating proposal status:', error);
    }
  };

  const handleDeleteSuccess = (proposalId: number) => {
    // Optimistic UI update - remove the proposal from the list
    setProposals(prev => prev.filter(p => p.id !== proposalId));
    fetchDashboardStats();
    fetchInsights();
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
    return proposals.filter((p) => {
      const createdAtDate = new Date(p.createdAt);
      const createdAtTime = createdAtDate.getTime();
      if (Number.isNaN(createdAtTime)) {
        console.error("Invalid proposal createdAt date encountered during range filter", {
          proposalId: p.id,
          createdAt: p.createdAt,
        });
        return false;
      }
      return createdAtDate >= cutoff;
    });
  }, [proposals, dateRange]);

  const sortedProposals = useMemo(() => {
    const getCreatedAtTime = (proposal: Proposal): number => {
      const date = new Date(proposal.createdAt);
      const time = date.getTime();
      if (Number.isNaN(time)) {
        console.error("Invalid proposal createdAt date encountered during sort", {
          proposalId: proposal.id,
          createdAt: proposal.createdAt,
        });
        // Place proposals with invalid dates at the beginning of the array
        // by returning 0; they can then be handled or surfaced in the UI if needed.
        return 0;
      }
      return time;
    };

    return [...proposalsInRange].sort(
      (a, b) => getCreatedAtTime(b) - getCreatedAtTime(a),
    );
  }, [proposalsInRange]);

  const pipelineCounts = useMemo(() => {
    const init: Record<string, number> = { draft: 0, sent: 0, viewed: 0, accepted: 0, won: 0, lost: 0 };
    for (const p of proposalsInRange) {
      const s = p.status.toLowerCase();
      if (s in init) init[s] += 1;
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
      <LayoutWrapper>
        <DashboardSkeleton />
      </LayoutWrapper>
    );
  }

  if (authError) {
    return (
      <LayoutWrapper>
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
      </LayoutWrapper>
    );
  }

  if (!user) {
    return (
      <LayoutWrapper>
        <DashboardSkeleton />
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="bg-slate-50 min-h-screen pb-12">
        {successMessage && (
          <div className={`py-3 px-4 text-center text-sm font-medium ${isSuccess
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
          subscriptionPlan={user.subscriptionPlan}
          hasActiveAccess={user.hasActiveAccess}
          trialDaysRemaining={user.trialDaysRemaining}
          cancelAtPeriodEnd={user.cancelAtPeriodEnd}
          currentPeriodEnd={user.currentPeriodEnd}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onUpgrade={() => setShowPaywall(true)}
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
                (dashboardStats?.creditsExpireAt || user?.creditsExpireAt) && !creditsExpired
                  ? `${t.dashboard.expires} ${new Date((dashboardStats?.creditsExpireAt || user.creditsExpireAt)!).toLocaleDateString(locale)}`
                  : t.dashboard.availableToUse
              }
              icon={Coins}
              iconTone="orange"
            />
            <StatCard
              label={t.dashboard.totalProposals}
              value={
                dashboardStats && dateRange === "30d"
                  ? dashboardStats.totalProposals.toString()
                  : proposalsInRange.length.toString()
              }
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
                  activeStage={statusFilter}
                  onStageClick={(stage) => setStatusFilter(filter => filter === stage ? "all" : stage)}
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
                status={statusFilter}
                onStatusChange={(s) => setStatusFilter(s as PipelineStageKey | "all")}
                locale={locale}
                showPaymentLink={!!user?.userStripeEnabled}
                onEdit={(p) => router.push(`/app?edit=${p.id}`)}
                onView={(p) => {
                  if (p.publicToken) window.open(`/p/${p.publicToken}`, "_blank");
                }}
                onDownload={(p) => handleDownloadPdf(p)}
                downloadingProposalId={downloadingProposalId}
                onEmail={(p) => setEmailModalData({ id: p.id, clientName: p.clientName, publicToken: p.publicToken ?? undefined })}
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
                onUnlock={(p) => handleUnlockProposal(p.id)}
                unlockingProposalId={unlockingProposalId}
              />
            </div>

            <div className="space-y-6 lg:col-span-4">
              {insightsLoading ? (
                <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
                  <CardHeader className="px-6 py-4 border-b border-slate-100">
                    <Skeleton className="h-6 w-40" />
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                    <div className="pt-4">
                      <Skeleton className="h-48 w-full rounded-xl" />
                    </div>
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
          publicToken={emailModalData.publicToken}
          onSuccess={() => {
            fetch('/api/proposals', {
              credentials: 'include',
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
              }
            })
              .then(res => res.json())
              .then(data => setProposals(Array.isArray(data) ? data : []))
              .catch(console.error);
            fetchDashboardStats();
            fetchInsights();
          }}
          onRequiresPayment={() => setShowPaywall(true)}
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
            fetch('/api/proposals', {
              credentials: 'include',
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
              }
            })
              .then(res => res.json())
              .then(data => setProposals(Array.isArray(data) ? data : []))
              .catch(console.error);
            fetchDashboardStats();
            fetchInsights();
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
            fetch('/api/proposals', {
              credentials: 'include',
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
              }
            })
              .then(res => res.json())
              .then(data => setProposals(Array.isArray(data) ? data : []))
              .catch(console.error);
            fetchDashboardStats();
            fetchInsights();
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
            fetch('/api/proposals', {
              credentials: 'include',
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
              }
            })
              .then(res => res.json())
              .then(data => setProposals(Array.isArray(data) ? data : []))
              .catch(console.error);
            fetchDashboardStats();
            fetchInsights();
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

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </LayoutWrapper>
  );
}

function DashboardSkeleton() {
  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-5 w-48" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto space-y-6 px-4 py-6 md:space-y-8 md:py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="rounded-2xl border-slate-200 bg-white shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <Skeleton className="h-24 w-full rounded-2xl" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>

            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
          <div className="space-y-6 lg:col-span-4">
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
