'use client';
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Edit, Pen } from "lucide-react";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  FileText, 
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
  Camera
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
    sent: "bg-blue-100 text-blue-700 border-blue-200",
    draft: "bg-slate-100 text-slate-700 border-slate-200",
    won: "bg-green-100 text-green-700 border-green-200",
    lost: "bg-red-100 text-red-700 border-red-200",
    accepted: "bg-green-100 text-green-700 border-green-200",
    viewed: "bg-purple-100 text-purple-700 border-purple-200",
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
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${style}`}>
      {label}
    </span>
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
    { key: 'draft', label: t.dashboard.draft, color: 'bg-slate-500' },
    { key: 'sent', label: t.dashboard.sent, color: 'bg-blue-500' },
    { key: 'viewed', label: t.dashboard.viewed, color: 'bg-purple-500' },
    { key: 'accepted', label: t.dashboard.accepted, color: 'bg-emerald-500' },
    { key: 'won', label: t.dashboard.won, color: 'bg-green-600' },
    { key: 'lost', label: t.dashboard.lost, color: 'bg-red-500' },
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
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max p-4">
        {stages.map((stage) => {
          const stageProposals = getProposalsForStage(stage.key);
          return (
            <div 
              key={stage.key} 
              className="flex flex-col w-64 bg-slate-50 rounded-lg"
              data-testid={`pipeline-column-${stage.key}`}
            >
              <div className={`px-3 py-2 rounded-t-lg ${stage.color}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-sm">{stage.label}</span>
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    {stageProposals.length}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 p-2 space-y-2 min-h-[200px] max-h-[500px] overflow-y-auto">
                {stageProposals.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    {t.dashboard.noProposals}
                  </div>
                ) : (
                  stageProposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="bg-white rounded-lg p-3 shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
                      data-testid={`pipeline-card-${proposal.id}`}
                      onClick={() => onViewProposal(proposal)}
                    >
                      <div className="font-semibold text-slate-900 text-sm truncate mb-1">
                        {proposal.clientName}
                      </div>
                      <div className="text-xs text-slate-500 truncate mb-2">
                        {proposal.jobTypeName}
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-800 text-sm">
                          {new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', { 
                            style: 'currency', 
                            currency: 'USD', 
                            maximumFractionDigits: 0 
                          }).format(Math.round((proposal.priceLow + proposal.priceHigh) / 2))}
                        </span>
                        {proposal.viewCount != null && proposal.viewCount > 0 && (
                          <span 
                            className="flex items-center gap-1 bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full"
                            data-testid={`view-count-badge-${proposal.id}`}
                          >
                            <Eye className="w-3 h-3" />
                            {proposal.viewCount} {t.dashboard.views}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-100">
                        {getPrevStatus(proposal.status) && stage.key !== 'lost' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-slate-400 hover:text-slate-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              const prev = getPrevStatus(proposal.status);
                              if (prev) onStatusChange(proposal.id, prev);
                            }}
                            data-testid={`move-prev-${proposal.id}`}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                        ) : (
                          <div className="w-7" />
                        )}
                        
                        {stage.key !== 'won' && stage.key !== 'lost' && (
                          <div className="flex gap-1">
                            {stage.key === 'accepted' ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-green-600 hover:bg-green-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusChange(proposal.id, 'won');
                                  }}
                                  data-testid={`move-won-${proposal.id}`}
                                >
                                  <Trophy className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-red-600 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusChange(proposal.id, 'lost');
                                  }}
                                  data-testid={`move-lost-${proposal.id}`}
                                >
                                  <ThumbsDown className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-slate-400 hover:text-slate-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const next = getNextStatus(proposal.status);
                                  if (next) onStatusChange(proposal.id, next);
                                }}
                                data-testid={`move-next-${proposal.id}`}
                              >
                                <ChevronRight className="w-4 h-4" />
                              </Button>
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
        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-600">
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
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      title: t.dashboard.totalProposals,
      value: proposals.length.toString(),
      change: t.dashboard.allTime,
      icon: FileText,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
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
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      title: t.dashboard.pending,
      value: proposals.filter(p => p.status === 'sent' || p.status === 'draft').length.toString(),
      change: t.dashboard.awaitingResponse,
      icon: Users,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
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

        <div className="bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 py-4 md:py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-heading font-bold text-slate-900">{t.dashboard.dashboardTitle}</h1>
                <p className="text-slate-500 text-xs md:text-sm">
                  {t.dashboard.welcomeBack}, {user.firstName || t.dashboard.contractor}
                  {user.isPro && (
                    <span className="ml-2 bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded font-bold">
                      PRO
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <Button variant="outline" className="gap-2 h-9 md:h-10 text-xs md:text-sm px-3 md:px-4 hidden md:flex">
                  <LayoutDashboard className="w-4 h-4" />
                  {t.dashboard.manageTemplates}
                </Button>
                <Link 
                  href="/m/create" 
                  className="inline-flex items-center justify-center h-9 md:h-10 px-3 md:px-4 py-2 rounded-md border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 font-medium text-xs md:text-sm transition-colors gap-2" 
                  data-testid="button-photo-capture"
                  title="Take photos to generate a proposal"
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">📷 Photo Capture</span>
                  <span className="sm:hidden">📷</span>
                </Link>
                <Link href="/app" className="inline-flex items-center justify-center h-9 md:h-10 px-3 md:px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs md:text-sm transition-colors gap-2" data-testid="button-new-proposal">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.dashboard.newProposal}</span>
                  <span className="sm:hidden">New</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
          {/* Stats Grid - 2 columns on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {stats.map((stat, i) => (
              <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3 md:p-6 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm font-medium text-slate-500 mb-0.5 md:mb-1 truncate">{stat.title}</p>
                    <div className="text-lg md:text-2xl font-heading font-bold text-slate-900 truncate">{stat.value}</div>
                    <p className="text-[10px] md:text-xs text-green-600 mt-0.5 md:mt-1 font-medium truncate">{stat.change}</p>
                  </div>
                  <div className={`h-8 w-8 md:h-12 md:w-12 rounded-full ${stat.bgColor} flex items-center justify-center flex-shrink-0 ml-2`}>
                    <stat.icon className={`w-4 h-4 md:w-6 md:h-6 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Business Insights Section */}
          <BusinessInsights />

          <Card className="border-none shadow-sm">
            <CardHeader className="px-4 md:px-6 py-4 md:py-5 border-b border-slate-100 flex flex-row items-center justify-between bg-white rounded-t-lg gap-2">
              <CardTitle className="text-base md:text-lg font-bold text-slate-800">{t.dashboard.recentProposals}</CardTitle>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden md:flex items-center bg-slate-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className={`h-7 px-3 gap-1.5 text-xs ${viewMode === 'list' ? '' : 'hover:bg-slate-200'}`}
                    onClick={() => handleViewModeChange('list')}
                    disabled={isViewSwitching}
                    data-testid="toggle-list-view"
                  >
                    {isViewSwitching && viewMode !== 'list' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <List className="w-3.5 h-3.5" />
                    )}
                    {t.dashboard.listView}
                  </Button>
                  <Button
                    variant={viewMode === 'pipeline' ? 'default' : 'ghost'}
                    size="sm"
                    className={`h-7 px-3 gap-1.5 text-xs ${viewMode === 'pipeline' ? '' : 'hover:bg-slate-200'}`}
                    onClick={() => handleViewModeChange('pipeline')}
                    disabled={isViewSwitching}
                    data-testid="toggle-pipeline-view"
                  >
                    {isViewSwitching && viewMode !== 'pipeline' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Columns className="w-3.5 h-3.5" />
                    )}
                    {t.dashboard.pipelineView}
                  </Button>
                </div>
                <div className="relative w-full max-w-[200px] md:max-w-[256px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input placeholder={t.dashboard.searchPlaceholder} className="pl-9 h-9 text-sm bg-slate-50 border-slate-200" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {proposals.length === 0 ? (
                <div className="text-center py-8 md:py-12 px-4">
                  <FileText className="w-10 h-10 md:w-12 md:h-12 mx-auto text-slate-300 mb-3 md:mb-4" />
                  <h3 className="font-bold text-slate-700 mb-2 text-sm md:text-base">{t.dashboard.noProposals}</h3>
                  <p className="text-slate-500 text-xs md:text-sm mb-4">{t.dashboard.noProposalsDesc}</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link 
                      href="/m/create" 
                      className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-orange-600 transition-colors"
                      data-testid="button-photo-capture-empty"
                    >
                      <Camera className="w-4 h-4" />
                      📷 Photo Capture
                    </Link>
                    <span className="text-slate-400 text-xs">or</span>
                    <Link href="/app" className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md font-medium text-sm">
                      <Plus className="w-4 h-4" />
                      {t.dashboard.createProposal}
                    </Link>
                  </div>
                  <p className="text-slate-400 text-xs mt-4">
                    📸 Use Photo Capture to snap job site photos and generate proposals instantly
                  </p>
                </div>
              ) : isViewSwitching ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
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
                  <div className="md:hidden divide-y divide-slate-100">
                    {proposals.map((proposal) => (
                      <div key={proposal.id} data-testid={`card-proposal-mobile-${proposal.id}`} className="p-4 bg-white hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-900 truncate">{proposal.clientName}</div>
                            <div className="text-xs text-slate-500 truncate">{proposal.address}</div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-slate-400 hover:text-blue-600"
                              onClick={() => setEmailModalData({ 
                                id: proposal.id, 
                                clientName: proposal.clientName 
                              })}
                              title={t.dashboard.quickSend}
                              data-testid={`button-quick-send-mobile-${proposal.id}`}
                            >
                              <Mail className="w-5 h-5" />
                            </Button>
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
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-100 truncate max-w-[120px]">
                            {proposal.jobTypeName}
                          </span>
                          <span className="font-bold text-slate-700">
                            {new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.round((proposal.priceLow + proposal.priceHigh) / 2))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar className="w-3 h-3" /> {formatDate(proposal.createdAt)}
                          </div>
                          <StatusBadge status={proposal.status} t={t} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-3 font-semibold">{t.dashboard.clientProject}</th>
                          <th className="px-6 py-3 font-semibold">{t.dashboard.jobType}</th>
                          <th className="px-6 py-3 font-semibold">{t.dashboard.value}</th>
                          <th className="px-6 py-3 font-semibold">{t.dashboard.date}</th>
                          <th className="px-6 py-3 font-semibold">{t.dashboard.status}</th>
                          <th className="px-6 py-3 font-semibold text-right">{t.dashboard.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {proposals.map((proposal) => (
                          <tr key={proposal.id} data-testid={`row-proposal-${proposal.id}`} className="bg-white hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900">{proposal.clientName}</div>
                              <div className="text-xs text-slate-500">{proposal.address}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                {proposal.jobTypeName}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-700">
                              {new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.round((proposal.priceLow + proposal.priceHigh) / 2))}
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {formatDate(proposal.createdAt)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={proposal.status} t={t} />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-blue-600"
                                  onClick={() => setEmailModalData({ 
                                    id: proposal.id, 
                                    clientName: proposal.clientName 
                                  })}
                                  title={t.dashboard.quickSend}
                                  data-testid={`button-quick-send-${proposal.id}`}
                                >
                                  <Mail className="w-4 h-4" />
                                </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                                  <MoreVertical className="w-4 h-4" />
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
