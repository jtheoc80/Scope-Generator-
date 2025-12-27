'use client';
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Edit, Pen } from "lucide-react";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Calendar, 
  DollarSign, 
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Coins,
  Trophy,
  ThumbsDown,
  Mail,
  CreditCard,
  List,
  Columns,
  Eye,
  ChevronRight,
  ChevronLeft,
  Camera,
  Layers
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EmailProposalModal from "@/components/email-proposal-modal";
import EditPriceModal from "@/components/edit-price-modal";
import CountersignModal from "@/components/countersign-modal";
import PaymentLinkModal from "@/components/payment-link-modal";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import type { TranslationKeys } from "@/lib/translations";
import { BusinessInsights } from "@/components/business-insights";

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

function StatusBadge({ status, t }: { status: string; t: TranslationKeys }) {
  const styles: Record<string, string> = {
    sent: "border-primary/20 bg-primary/5 text-primary",
    draft: "border-border bg-muted/40 text-muted-foreground",
    won: "border-emerald-200 bg-emerald-50/40 text-emerald-700",
    lost: "border-red-200 bg-red-50/40 text-red-700",
    accepted: "border-emerald-200 bg-emerald-50/40 text-emerald-700",
    declined: "border-red-200 bg-red-50/40 text-red-700",
    viewed: "border-primary/15 bg-primary/5 text-primary",
  };
  
  const labels: Record<string, string> = {
    sent: t.dashboard.sent,
    draft: t.dashboard.draft,
    won: t.dashboard.won,
    lost: t.dashboard.lost,
    accepted: t.dashboard.accepted,
    declined: t.dashboard.declined,
    viewed: t.dashboard.viewed,
  };
  
  const style = styles[status.toLowerCase()] || styles.draft;
  const label = labels[status.toLowerCase()] || status;

  return (
    <Badge variant="outline" className={style}>
      {label}
    </Badge>
  );
}

function KpiCard({
  title,
  value,
  helper,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string;
  helper: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  loading?: boolean;
}) {
  return (
    <Card className="rounded-lg border-border shadow-sm">
      <CardContent className="relative p-4">
        <Icon className="absolute right-4 top-4 h-5 w-5 text-muted-foreground/60" aria-hidden />
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{helper}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardHeaderActions({ t }: { t: TranslationKeys }) {
  return (
    <>
      <div className="hidden sm:flex items-center gap-2">
        <Button variant="outline" className="gap-2" type="button">
          <Layers className="h-4 w-4" aria-hidden />
          {t.dashboard.manageTemplates}
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/m/create" data-testid="button-photo-capture" title="Start ScopeScan™">
            <Camera className="h-4 w-4" aria-hidden />
            ScopeScan™
          </Link>
        </Button>
        <Button asChild className="gap-2" data-testid="button-new-proposal">
          <Link href="/app">
            <Plus className="h-4 w-4" aria-hidden />
            {t.dashboard.newProposal}
          </Link>
        </Button>
      </div>

      <div className="sm:hidden flex items-center gap-2">
        <Button asChild size="sm" className="gap-2" data-testid="button-new-proposal">
          <Link href="/app">
            <Plus className="h-4 w-4" aria-hidden />
            {t.dashboard.newProposal}
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="More actions">
              <MoreVertical className="h-4 w-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t.dashboard.actions}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/m/create" data-testid="button-photo-capture">
                <Camera className="h-4 w-4 mr-2" aria-hidden />
                ScopeScan™
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                // Preserve existing behavior (no action attached today)
                e.preventDefault();
              }}
            >
              <Layers className="h-4 w-4 mr-2" aria-hidden />
              {t.dashboard.manageTemplates}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

function PipelineView({ 
  proposals, 
  t, 
  language,
  onStatusChange,
  onViewProposal
}: { 
  proposals: Proposal[];
  t: TranslationKeys;
  language: string;
  onStatusChange: (proposalId: number, status: string) => void;
  onViewProposal: (proposal: Proposal) => void;
}) {
  const stages = [
    { key: 'draft', label: t.dashboard.draft, accent: 'border-t-muted' },
    { key: 'sent', label: t.dashboard.sent, accent: 'border-t-primary/30' },
    { key: 'viewed', label: t.dashboard.viewed, accent: 'border-t-primary/20' },
    { key: 'accepted', label: t.dashboard.accepted, accent: 'border-t-emerald-500/30' },
    { key: 'won', label: t.dashboard.won, accent: 'border-t-emerald-500/40' },
    { key: 'lost', label: t.dashboard.lost, accent: 'border-t-red-500/25' },
  ];

  const getProposalsForStage = (stageKey: string) => {
    return proposals.filter(p => p.status.toLowerCase() === stageKey);
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const order = ['draft', 'sent', 'viewed', 'accepted', 'won'];
    const idx = order.indexOf(currentStatus.toLowerCase());
    if (idx >= 0 && idx < order.length - 1) {
      return order[idx + 1];
    }
    return null;
  };

  const getPrevStatus = (currentStatus: string): string | null => {
    const order = ['draft', 'sent', 'viewed', 'accepted', 'won'];
    const idx = order.indexOf(currentStatus.toLowerCase());
    if (idx > 0) {
      return order[idx - 1];
    }
    return null;
  };

  return (
    <TooltipProvider>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max p-4">
        {stages.map((stage) => {
          const stageProposals = getProposalsForStage(stage.key);
          return (
            <div 
              key={stage.key} 
              className={`flex flex-col w-72 rounded-lg border bg-card shadow-sm ${stage.accent} border-t-2`}
              data-testid={`pipeline-column-${stage.key}`}
            >
              <div className="px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{stage.label}</span>
                  <Badge variant="outline" className="text-muted-foreground">
                    {stageProposals.length}
                  </Badge>
                </div>
              </div>
              
              <div className="flex-1 p-2 space-y-2 min-h-[200px] max-h-[520px] overflow-y-auto">
                {stageProposals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {t.dashboard.noProposals}
                  </div>
                ) : (
                  stageProposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="rounded-lg border bg-card p-3 transition-colors hover:bg-accent/40 cursor-pointer"
                      data-testid={`pipeline-card-${proposal.id}`}
                      onClick={() => onViewProposal(proposal)}
                    >
                      <div className="font-semibold text-foreground text-sm truncate mb-1">
                        {proposal.clientName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate mb-2">
                        {proposal.jobTypeName}
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-foreground text-sm">
                          {new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', { 
                            style: 'currency', 
                            currency: 'USD', 
                            maximumFractionDigits: 0 
                          }).format(Math.round((proposal.priceLow + proposal.priceHigh) / 2))}
                        </span>
                        {proposal.viewCount != null && proposal.viewCount > 0 && (
                          <Badge
                            variant="outline"
                            className="gap-1 text-xs text-muted-foreground"
                            data-testid={`view-count-badge-${proposal.id}`}
                          >
                            <Eye className="w-3 h-3" />
                            {proposal.viewCount} {t.dashboard.views}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between gap-1 pt-2 border-t border-border">
                        {getPrevStatus(proposal.status) && stage.key !== 'lost' ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const prev = getPrevStatus(proposal.status);
                                  if (prev) onStatusChange(proposal.id, prev);
                                }}
                                aria-label="Move to previous stage"
                                data-testid={`move-prev-${proposal.id}`}
                              >
                                <ChevronLeft className="w-4 h-4" aria-hidden />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Previous</TooltipContent>
                          </Tooltip>
                        ) : (
                          <div className="w-7" />
                        )}
                        
                        {stage.key !== 'won' && stage.key !== 'lost' && (
                          <div className="flex gap-1">
                            {stage.key === 'accepted' ? (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-emerald-700"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onStatusChange(proposal.id, 'won');
                                      }}
                                      aria-label="Mark as won"
                                      data-testid={`move-won-${proposal.id}`}
                                    >
                                      <Trophy className="w-4 h-4" aria-hidden />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Won</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-700"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onStatusChange(proposal.id, 'lost');
                                      }}
                                      aria-label="Mark as lost"
                                      data-testid={`move-lost-${proposal.id}`}
                                    >
                                      <ThumbsDown className="w-4 h-4" aria-hidden />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Lost</TooltipContent>
                                </Tooltip>
                              </>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const next = getNextStatus(proposal.status);
                                      if (next) onStatusChange(proposal.id, next);
                                    }}
                                    aria-label="Move to next stage"
                                    data-testid={`move-next-${proposal.id}`}
                                  >
                                    <ChevronRight className="w-4 h-4" aria-hidden />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Next</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        )}
                        
                        {(stage.key === 'won' || stage.key === 'lost') && (
                          <div className="w-7" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </TooltipProvider>
  );
}

function MobileProposalMenu({ 
  proposal, 
  t, 
  onEdit, 
  onView, 
  onEmail, 
  onPrice, 
  onCountersign,
  onPayment,
  onStatusChange,
  showPaymentLink
}: { 
  proposal: Proposal;
  t: TranslationKeys;
  onEdit: () => void;
  onView: () => void;
  onEmail: () => void;
  onPrice: () => void;
  onCountersign: () => void;
  onPayment: () => void;
  onStatusChange: (status: string) => void;
  showPaymentLink: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" aria-label="Open proposal actions">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs">{t.dashboard.actions}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onEdit} className="py-3">
          <Edit className="w-4 h-4 mr-3" />
          {t.dashboard.editProposal}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onView} className="py-3">
          <Download className="w-4 h-4 mr-3" />
          {t.dashboard.downloadPdf}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onPrice} className="py-3">
          <DollarSign className="w-4 h-4 mr-3" />
          {t.dashboard.adjustPrice}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEmail} className="py-3">
          <Mail className="w-4 h-4 mr-3" />
          {t.dashboard.sendViaEmail}
        </DropdownMenuItem>
        {showPaymentLink && (
          <DropdownMenuItem onClick={onPayment} className="py-3 text-primary" data-testid={`menu-payment-${proposal.id}`}>
            <CreditCard className="w-4 h-4 mr-3" />
            {t.dashboard.requestPayment}
          </DropdownMenuItem>
        )}
        {proposal.status === 'accepted' && !proposal.contractorSignature && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCountersign} className="py-3 text-green-600 font-medium">
              <Pen className="w-4 h-4 mr-3" />
              {t.dashboard.countersign}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs">{t.dashboard.markStatus}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onStatusChange('won')} className="py-3 text-green-600">
          <Trophy className="w-4 h-4 mr-3" />
          {t.dashboard.markAsWon}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatusChange('lost')} className="py-3 text-red-600">
          <ThumbsDown className="w-4 h-4 mr-3" />
          {t.dashboard.markAsLost}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Dashboard() {
  const { user, isLoading: authLoading, error: authError } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list');
  const [isViewSwitching, setIsViewSwitching] = useState(false);

  const handleViewModeChange = async (mode: 'list' | 'pipeline') => {
    if (mode === viewMode) return;
    setIsViewSwitching(true);
    // Small delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 150));
    setViewMode(mode);
    setIsViewSwitching(false);
  };

  const handleViewProposal = (proposal: Proposal) => {
    if (proposal.publicToken) {
      window.open(`/p/${proposal.publicToken}`, '_blank');
    }
  };

  const handleEditProposal = (proposal: Proposal) => {
    router.push(`/app?edit=${proposal.id}`);
  };

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
  
  const stats = [
    {
      title: t.dashboard.proposalCredits,
      value: availableCredits.toString(),
      change: user?.creditsExpireAt && !creditsExpired 
        ? `${t.dashboard.expires} ${new Date(user.creditsExpireAt).toLocaleDateString()}` 
        : t.dashboard.availableToUse,
      icon: Coins,
    },
    {
      title: t.dashboard.totalProposals,
      value: proposals.length.toString(),
      change: t.dashboard.allTime,
      icon: Layers,
    },
    {
      title: t.dashboard.revenueWon,
      value: new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
        proposals
          .filter(p => p.status === 'won')
          .reduce((sum, p) => sum + (p.priceLow + p.priceHigh) / 2, 0)
      ),
      change: t.dashboard.fromWonProposals,
      icon: DollarSign,
    },
    {
      title: t.dashboard.pending,
      value: proposals.filter(p => p.status === 'sent' || p.status === 'draft').length.toString(),
      change: t.dashboard.awaitingResponse,
      icon: Users,
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return t.dashboard.today;
    if (days === 1) return t.dashboard.yesterday;
    const locale = language === 'es' ? 'es-ES' : 'en-US';
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <TooltipProvider>
          <div className="min-h-screen bg-background pb-12">
            <div className="border-b bg-background">
              <div className="container mx-auto max-w-6xl px-4 py-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-32 hidden sm:block" />
                    <Skeleton className="h-9 w-28 hidden sm:block" />
                    <Skeleton className="h-9 w-32" />
                  </div>
                </div>
              </div>
            </div>
            <div className="container mx-auto max-w-6xl px-4 py-6 space-y-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <KpiCard
                    key={i}
                    title=""
                    value=""
                    helper=""
                    icon={Coins}
                    loading
                  />
                ))}
              </div>
              <Card className="rounded-lg border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-9 w-56" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </TooltipProvider>
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
      <TooltipProvider>
      <div className="bg-background min-h-screen pb-12">
        {successMessage && (
          <div className={isSuccess ? "border-b bg-emerald-50/40 text-emerald-800" : "border-b bg-amber-50/40 text-amber-800"}>
            <div className="container mx-auto max-w-6xl px-4 py-3">
              <div className="flex items-center justify-center gap-2 text-sm font-medium">
                {isSuccess ? (
                  <CheckCircle className="w-4 h-4" aria-hidden />
                ) : (
                  <XCircle className="w-4 h-4" aria-hidden />
                )}
                {successMessage}
              </div>
            </div>
          </div>
        )}

        <div className="border-b bg-background">
          <div className="container mx-auto max-w-6xl px-4 py-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl text-foreground">{t.dashboard.dashboardTitle}</h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {t.dashboard.welcomeBack}, {user.firstName || t.dashboard.contractor}
                  </span>
                  {user.isPro && (
                    <Badge variant="secondary" className="h-5 px-2 text-[10px] font-semibold">
                      PRO
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <DashboardHeaderActions t={t} />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-6xl px-4 py-6 space-y-6">
          {/* Stats Grid - 2 columns on mobile, 4 on desktop */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <KpiCard
                key={i}
                title={stat.title}
                value={stat.value}
                helper={stat.change}
                icon={stat.icon}
              />
            ))}
          </div>

          {/* Business Insights Section */}
          <BusinessInsights />

          <Card className="rounded-lg border-border shadow-sm">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">{t.dashboard.recentProposals}</CardTitle>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <div className="hidden md:flex items-center rounded-md border bg-background p-1">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => handleViewModeChange('list')}
                    disabled={isViewSwitching}
                    data-testid="toggle-list-view"
                  >
                    {isViewSwitching && viewMode !== 'list' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                    ) : (
                      <List className="w-3.5 h-3.5" aria-hidden />
                    )}
                    {t.dashboard.listView}
                  </Button>
                  <Button
                    variant={viewMode === 'pipeline' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => handleViewModeChange('pipeline')}
                    disabled={isViewSwitching}
                    data-testid="toggle-pipeline-view"
                  >
                    {isViewSwitching && viewMode !== 'pipeline' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Columns className="w-3.5 h-3.5" aria-hidden />
                    )}
                    {t.dashboard.pipelineView}
                  </Button>
                </div>
                <div className="relative w-full max-w-[200px] md:max-w-[256px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input placeholder={t.dashboard.searchPlaceholder} className="pl-9" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {proposals.length === 0 ? (
                <div className="text-center py-8 md:py-12 px-4">
                  <Camera className="w-10 h-10 md:w-12 md:h-12 mx-auto text-muted-foreground/40 mb-3 md:mb-4" aria-hidden />
                  <h3 className="font-semibold text-foreground mb-2 text-sm md:text-base">{t.dashboard.noProposals}</h3>
                  <p className="text-muted-foreground text-xs md:text-sm mb-4">{t.dashboard.noProposalsDesc}</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button asChild variant="outline" className="gap-2" data-testid="button-photo-capture-empty">
                      <Link href="/m/create">
                        <Camera className="h-4 w-4" aria-hidden />
                        ScopeScan™
                      </Link>
                    </Button>
                    <Separator className="hidden sm:block w-6" />
                    <Button asChild className="gap-2">
                      <Link href="/app">
                        <Plus className="h-4 w-4" aria-hidden />
                        {t.dashboard.createProposal}
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : isViewSwitching ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : viewMode === 'pipeline' ? (
                <PipelineView 
                  proposals={proposals}
                  t={t}
                  language={language}
                  onStatusChange={updateProposalStatus}
                  onViewProposal={handleViewProposal}
                />
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="md:hidden divide-y divide-border">
                    {proposals.map((proposal) => (
                      <div key={proposal.id} data-testid={`card-proposal-mobile-${proposal.id}`} className="p-4 bg-background hover:bg-accent/30 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-foreground truncate">{proposal.clientName}</div>
                            <div className="text-xs text-muted-foreground truncate">{proposal.address}</div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 text-muted-foreground"
                                  onClick={() => setEmailModalData({ 
                                    id: proposal.id, 
                                    clientName: proposal.clientName 
                                  })}
                                  aria-label={t.dashboard.quickSend}
                                  data-testid={`button-quick-send-mobile-${proposal.id}`}
                                >
                                  <Mail className="w-5 h-5" aria-hidden />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t.dashboard.quickSend}</TooltipContent>
                            </Tooltip>
                            <MobileProposalMenu 
                              proposal={proposal}
                              t={t}
                              onEdit={() => handleEditProposal(proposal)}
                              onView={() => handleViewProposal(proposal)}
                              onEmail={() => setEmailModalData({ id: proposal.id, clientName: proposal.clientName })}
                              onPrice={() => setPriceModalData({ id: proposal.id, clientName: proposal.clientName, priceLow: proposal.priceLow, priceHigh: proposal.priceHigh })}
                              onCountersign={() => setCountersignModalData({ id: proposal.id, clientName: proposal.clientName })}
                              onPayment={() => setPaymentModalData({ 
                                id: proposal.id, 
                                clientName: proposal.clientName, 
                                priceLow: proposal.priceLow, 
                                priceHigh: proposal.priceHigh,
                                paymentLinkUrl: proposal.paymentLinkUrl,
                                depositPercentage: proposal.depositPercentage
                              })}
                              onStatusChange={(status) => updateProposalStatus(proposal.id, status)}
                              showPaymentLink={!!user?.userStripeEnabled}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <Badge variant="outline" className="truncate max-w-[150px] text-muted-foreground">
                            {proposal.jobTypeName}
                          </Badge>
                          <span className="font-semibold text-foreground">
                            {new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.round((proposal.priceLow + proposal.priceHigh) / 2))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" aria-hidden /> {formatDate(proposal.createdAt)}
                          </div>
                          <StatusBadge status={proposal.status} t={t} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
                        <tr>
                          <th className="px-6 py-3 font-semibold">{t.dashboard.clientProject}</th>
                          <th className="px-6 py-3 font-semibold">{t.dashboard.jobType}</th>
                          <th className="px-6 py-3 font-semibold">{t.dashboard.value}</th>
                          <th className="px-6 py-3 font-semibold">{t.dashboard.date}</th>
                          <th className="px-6 py-3 font-semibold">{t.dashboard.status}</th>
                          <th className="px-6 py-3 font-semibold text-right">{t.dashboard.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {proposals.map((proposal) => (
                          <tr key={proposal.id} data-testid={`row-proposal-${proposal.id}`} className="bg-background hover:bg-accent/30 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-foreground">{proposal.clientName}</div>
                              <div className="text-xs text-muted-foreground">{proposal.address}</div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline" className="text-muted-foreground">
                                {proposal.jobTypeName}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 font-medium text-foreground">
                              {new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.round((proposal.priceLow + proposal.priceHigh) / 2))}
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" aria-hidden /> {formatDate(proposal.createdAt)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={proposal.status} t={t} />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground"
                                      onClick={() => setEmailModalData({ 
                                        id: proposal.id, 
                                        clientName: proposal.clientName 
                                      })}
                                      aria-label={t.dashboard.quickSend}
                                      data-testid={`button-quick-send-${proposal.id}`}
                                    >
                                      <Mail className="w-4 h-4" aria-hidden />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t.dashboard.quickSend}</TooltipContent>
                                </Tooltip>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="Open actions menu">
                                  <MoreVertical className="w-4 h-4" aria-hidden />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>{t.dashboard.actions}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleEditProposal(proposal)}
                                  data-testid={`button-edit-proposal-${proposal.id}`}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  {t.dashboard.editProposal}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleViewProposal(proposal)}
                                  data-testid={`button-download-proposal-${proposal.id}`}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  {t.dashboard.downloadPdf}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setPriceModalData({ 
                                    id: proposal.id, 
                                    clientName: proposal.clientName,
                                    priceLow: proposal.priceLow,
                                    priceHigh: proposal.priceHigh
                                  })}
                                  data-testid={`button-adjust-price-${proposal.id}`}
                                >
                                  <DollarSign className="w-4 h-4 mr-2" />
                                  {t.dashboard.adjustPrice}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setEmailModalData({ 
                                    id: proposal.id, 
                                    clientName: proposal.clientName 
                                  })}
                                  data-testid={`button-email-proposal-${proposal.id}`}
                                >
                                  <Mail className="w-4 h-4 mr-2" />
                                  {t.dashboard.sendViaEmail}
                                </DropdownMenuItem>
                                {user?.userStripeEnabled && (
                                  <DropdownMenuItem 
                                    onClick={() => setPaymentModalData({ 
                                      id: proposal.id, 
                                      clientName: proposal.clientName,
                                      priceLow: proposal.priceLow,
                                      priceHigh: proposal.priceHigh,
                                      paymentLinkUrl: proposal.paymentLinkUrl,
                                      depositPercentage: proposal.depositPercentage
                                    })}
                                    data-testid={`button-payment-link-${proposal.id}`}
                                    className="text-primary"
                                  >
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    {t.dashboard.requestPayment}
                                  </DropdownMenuItem>
                                )}
                                {proposal.status === 'accepted' && !proposal.contractorSignature && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => setCountersignModalData({ 
                                        id: proposal.id, 
                                        clientName: proposal.clientName 
                                      })}
                                      data-testid={`button-countersign-${proposal.id}`}
                                      className="text-green-600 font-medium"
                                    >
                                      <Pen className="w-4 h-4 mr-2" />
                                      {t.dashboard.countersignProposal}
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>{t.dashboard.markStatus}</DropdownMenuLabel>
                                <DropdownMenuItem 
                                  onClick={() => updateProposalStatus(proposal.id, 'won')}
                                  data-testid={`button-mark-won-${proposal.id}`}
                                  className="text-green-600"
                                >
                                  <Trophy className="w-4 h-4 mr-2" />
                                  {t.dashboard.markAsWon}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => updateProposalStatus(proposal.id, 'lost')}
                                  data-testid={`button-mark-lost-${proposal.id}`}
                                  className="text-red-600"
                                >
                                  <ThumbsDown className="w-4 h-4 mr-2" />
                                  {t.dashboard.markAsLost}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">{t.dashboard.delete}</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
        </div>
      </div>
      </TooltipProvider>

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
    </Layout>
  );
}
