'use client';
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Layout from "@/components/layout";
import { Loader2 } from "lucide-react";
import EmailProposalModal from "@/components/email-proposal-modal";
import { useAuth } from "@/hooks/useAuth";

interface Proposal {
  id: number;
  clientName: string;
  address: string;
  tradeId: string;
  jobTypeName: string; // kept for compatibility with existing data
  priceLow: number;
  priceHigh: number;
  status: string;
  createdAt: string;
  publicToken?: string | null;
  viewCount?: number | null;
  lastViewedAt?: string | null;
}

type FunnelStage = "draft" | "sent" | "viewed" | "accepted" | "won" | "lost";

function toTitleCase(input: string) {
  return input
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

function formatShortDate(dateString: string) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysAgo(dateString: string) {
  const d = new Date(dateString);
  const t = d.getTime();
  if (Number.isNaN(t)) return null;
  const diffMs = Date.now() - t;
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function deriveStage(p: Proposal): FunnelStage {
  const raw = (p.status || "").toLowerCase().trim();
  if (raw === "won") return "won";
  if (raw === "lost") return "lost";
  if (raw === "accepted") return "accepted";
  if (raw === "viewed") return "viewed";
  if (raw === "sent") {
    // If the system didn't explicitly mark as viewed, infer it from viewCount.
    return (p.viewCount ?? 0) > 0 ? "viewed" : "sent";
  }
  // Default (including unknowns) to draft.
  return "draft";
}

function statusLabel(stage: FunnelStage) {
  if (stage === "draft") return "Draft";
  if (stage === "sent") return "Sent";
  if (stage === "viewed") return "Viewed";
  if (stage === "accepted") return "Accepted";
  if (stage === "won") return "Won";
  return "Lost";
}

function statusBadgeClasses(stage: FunnelStage) {
  // Minimal color, subtle borders. Reserve strong color for critical states.
  if (stage === "won") return "bg-[#f0fdf4] text-[#15803d] border-[#86efac]";
  if (stage === "accepted") return "bg-[#f0fdf4] text-[#15803d] border-[#86efac]";
  if (stage === "lost") return "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]";
  if (stage === "draft") return "bg-[#f7fafc] text-[#4a5568] border-[#cbd5e0]";
  return "bg-[#f7fafc] text-[#4a5568] border-[#e2e8f0]";
}

function trendBadgeClasses(kind: "up" | "down" | "neutral") {
  if (kind === "up") return "bg-[#f0fdf4] text-[#15803d] border-[#86efac]";
  if (kind === "down") return "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]";
  return "bg-[#f7fafc] text-[#4a5568] border-[#cbd5e0]";
}

export default function Dashboard() {
  const { user, isLoading: authLoading, error: authError } = useAuth();
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailModalData, setEmailModalData] = useState<{ id: number; clientName: string } | null>(null);

  // Table controls (must be declared before any early returns)
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | FunnelStage>("all");
  const [tradeFilter, setTradeFilter] = useState<string>("all");

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

  // Derived metrics (declared before early returns to satisfy hook rules)
  const sortedProposals = useMemo(() => {
    return [...proposals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [proposals]);

  const funnelCounts = useMemo(() => {
    const init: Record<FunnelStage, number> = {
      draft: 0,
      sent: 0,
      viewed: 0,
      accepted: 0,
      won: 0,
      lost: 0,
    };
    for (const p of proposals) init[deriveStage(p)] += 1;
    return init;
  }, [proposals]);

  const draftCount = funnelCounts.draft;

  const pipelineValue = useMemo(() => {
    // Pipeline excludes won/lost; includes draft/sent/viewed/accepted.
    return proposals
      .filter((p) => {
        const s = deriveStage(p);
        return s === "draft" || s === "sent" || s === "viewed" || s === "accepted";
      })
      .reduce((sum, p) => sum + (p.priceLow + p.priceHigh) / 2, 0);
  }, [proposals]);

  const pipelineTrend = useMemo(() => {
    // Compare pipeline value for last 30 days vs previous 30 days.
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const start0 = now - 30 * dayMs;
    const start1 = now - 60 * dayMs;

    const sumForRange = (from: number, to: number) =>
      proposals
        .filter((p) => {
          const t = new Date(p.createdAt).getTime();
          if (Number.isNaN(t) || t < from || t >= to) return false;
          const s = deriveStage(p);
          return s === "draft" || s === "sent" || s === "viewed" || s === "accepted";
        })
        .reduce((sum, p) => sum + (p.priceLow + p.priceHigh) / 2, 0);

    const current = sumForRange(start0, now);
    const previous = sumForRange(start1, start0);
    if (previous <= 0 || current <= 0) return { kind: "neutral" as const, text: "Getting started" };
    const pct = Math.round(((current - previous) / previous) * 100);
    if (pct > 0) return { kind: "up" as const, text: `+${pct}% vs last month` };
    if (pct < 0) return { kind: "down" as const, text: `${pct}% vs last month` };
    return { kind: "neutral" as const, text: "0% vs last month" };
  }, [proposals]);

  const winRate = useMemo(() => {
    // Win rate based on closed outcomes (won/lost).
    const won = proposals.filter((p) => deriveStage(p) === "won").length;
    const lost = proposals.filter((p) => deriveStage(p) === "lost").length;
    const total = won + lost;
    if (total === 0) return { value: 0, hasData: false };
    return { value: Math.round((won / total) * 100), hasData: true };
  }, [proposals]);

  const avgTimeToFirstViewDays = useMemo(() => {
    const samples = proposals
      .filter((p) => p.lastViewedAt)
      .map((p) => {
        const start = new Date(p.createdAt).getTime();
        const end = new Date(p.lastViewedAt as string).getTime();
        if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
        return (end - start) / (1000 * 60 * 60 * 24);
      })
      .filter((v): v is number => typeof v === "number");
    if (samples.length === 0) return null;
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    return Math.round(avg * 10) / 10;
  }, [proposals]);

  const tradeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of proposals) if (p.tradeId) set.add(p.tradeId);
    return Array.from(set).sort();
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sortedProposals.filter((p) => {
      const stage = deriveStage(p);
      const matchesStatus = statusFilter === "all" || stage === statusFilter;
      const matchesTrade = tradeFilter === "all" || p.tradeId === tradeFilter;
      const matchesQuery =
        q.length === 0 ||
        p.clientName.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.jobTypeName.toLowerCase().includes(q) ||
        (p.tradeId || "").toLowerCase().includes(q);
      return matchesStatus && matchesTrade && matchesQuery;
    });
  }, [sortedProposals, searchQuery, statusFilter, tradeFilter]);

  const handleReviewDrafts = () => {
    setStatusFilter("draft");
    const el = document.getElementById("proposals-table");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#2d3748]" />
        </div>
      </Layout>
    );
  }

  if (authError) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <h2 className="text-2xl font-semibold mb-4 text-[#dc2626]">Authentication Error</h2>
          <p className="text-muted-foreground mb-6">
            We couldn&apos;t verify your session. This might be due to a connection issue.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-md border border-[#cbd5e0] bg-white text-[14px] font-medium text-[#4a5568] hover:bg-[#f7fafc] hover:border-[#a0aec0] transition-colors duration-200"
            >
              Retry
            </button>
            <Link
              href="/sign-in"
              className="px-4 py-2 rounded-md bg-[#2d3748] text-white text-[14px] font-medium hover:bg-[#1a202c] transition-colors duration-200"
            >
              Sign In Again
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <h2 className="text-2xl font-semibold mb-4">Sign in required</h2>
          <p className="text-[#718096] mb-6">Sign in to view your proposals and pipeline.</p>
          <Link
            href="/sign-in?redirect_url=%2Fdashboard"
            className="px-6 py-3 rounded-md bg-[#2d3748] text-white text-[14px] font-medium hover:bg-[#1a202c] transition-colors duration-200"
          >
            Sign In
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#f5f6f8] text-[#2d3748] pb-12">
        <div className="container mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
          {/* Header */}
          <div className="bg-white border border-[#e2e8f0] shadow-sm rounded-lg px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-[#2d3748] text-white flex items-center justify-center font-semibold text-[14px]">
                SG
              </div>
              <div>
                <div className="text-[16px] font-semibold text-[#1a202c]">Proposal Dashboard</div>
                <div className="text-[12px] text-[#718096]">Clean pipeline tracking for professional contractors</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/app"
                className="px-4 py-2 rounded-md border border-[#cbd5e0] bg-white text-[14px] font-medium text-[#4a5568] hover:bg-[#f7fafc] hover:border-[#a0aec0] transition-colors duration-200"
              >
                View Templates
              </Link>
              <Link
                href="/app"
                className="px-4 py-2 rounded-md bg-[#2d3748] text-white text-[14px] font-medium hover:bg-[#1a202c] transition-colors duration-200"
              >
                Create Proposal (60s)
              </Link>
            </div>
          </div>

          {/* Alert Banner */}
          {draftCount > 0 && (
            <div className="bg-white border border-[#e2e8f0] shadow-sm rounded-md border-l-[3px] border-l-[#d69e2e] px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-[#fef5e7] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#d69e2e] font-semibold text-[16px]">!</span>
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-[#d69e2e]">
                    {draftCount} Proposal{draftCount === 1 ? "" : "s"} Need Your Attention
                  </div>
                  <div className="text-[13px] text-[#975a16] mt-1">
                    You have {draftCount} draft proposal{draftCount === 1 ? "" : "s"} ready to send. Send them now to get faster responses.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReviewDrafts}
                className="self-start sm:self-auto px-4 py-2 rounded-md bg-[#2d3748] text-white text-[13px] font-medium hover:bg-[#1a202c] transition-colors duration-200"
              >
                Review Drafts
              </button>
            </div>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {/* Pending Proposals */}
            <div className="bg-white border-[2px] border-[#d69e2e] shadow-sm rounded-lg p-6 relative">
              <div className="absolute top-2 right-2 bg-[#d69e2e] text-white text-[9px] font-semibold tracking-wide uppercase px-2 py-1 rounded">
                Action Needed
              </div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold uppercase tracking-wide text-[#718096]">Pending Proposals</div>
                  <div className="mt-3 text-[32px] font-semibold text-[#1a202c]">{draftCount}</div>
                  <div className="mt-2 text-[13px] text-[#718096]">Awaiting customer response</div>
                </div>
                <div className="h-9 w-9 rounded-md bg-[#fef5e7] text-[#975a16] flex items-center justify-center font-semibold text-[16px]">
                  2
                </div>
              </div>
            </div>

            {/* Pipeline Value */}
            <div className="bg-white border border-[#e2e8f0] shadow-sm rounded-lg p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold uppercase tracking-wide text-[#718096]">Pipeline Value</div>
                  <div className="mt-3 text-[32px] font-semibold text-[#1a202c]">{formatCurrency(pipelineValue)}</div>
                  <div className="mt-2 text-[13px] text-[#718096] flex items-center gap-2 flex-wrap">
                    <span>Total pending + draft value</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${trendBadgeClasses(
                        pipelineTrend.kind
                      )}`}
                    >
                      {pipelineTrend.text}
                    </span>
                  </div>
                </div>
                <div className="h-9 w-9 rounded-md bg-[#f0fdf4] text-[#15803d] flex items-center justify-center font-semibold text-[16px]">
                  $
                </div>
              </div>
            </div>

            {/* Win Rate */}
            <div className="bg-white border border-[#e2e8f0] shadow-sm rounded-lg p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold uppercase tracking-wide text-[#718096]">Win Rate (30d)</div>
                  <div className="mt-3 text-[32px] font-semibold text-[#1a202c]">{winRate.value}%</div>
                  <div className="mt-2 text-[13px] text-[#718096] flex items-center gap-2 flex-wrap">
                    <span>Target: 30%</span>
                    {!winRate.hasData && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border bg-[#f7fafc] text-[#4a5568] border-[#cbd5e0]">
                        Getting started
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-9 w-9 rounded-md bg-[#f7fafc] text-[#2d3748] flex items-center justify-center font-semibold text-[16px]">
                  %
                </div>
              </div>
            </div>

            {/* Avg Response Time */}
            <div className="bg-white border border-[#e2e8f0] shadow-sm rounded-lg p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold uppercase tracking-wide text-[#718096]">Avg Response Time</div>
                  <div className="mt-3 text-[32px] font-semibold text-[#1a202c]">—</div>
                  <div className="mt-2 text-[13px] text-[#718096]">Not enough data yet</div>
                </div>
                <div className="h-9 w-9 rounded-md bg-[#f7fafc] text-[#2d3748] flex items-center justify-center font-semibold text-[16px]">
                  —
                </div>
              </div>
            </div>
          </div>

          {/* Funnel */}
          <div className="bg-white border border-[#e2e8f0] shadow-sm rounded-lg p-6 md:p-7">
            <div className="text-[16px] font-semibold text-[#1a202c] mb-5">Proposal Conversion Funnel</div>

            <div className="flex items-center gap-3 flex-wrap">
              {(
                [
                  { key: "draft" as const, label: "Draft", bg: "bg-[#fef5e7]", border: "border-[#d69e2e]" },
                  { key: "sent" as const, label: "Sent", bg: "bg-[#f7fafc]", border: "border-[#e2e8f0]" },
                  { key: "viewed" as const, label: "Viewed", bg: "bg-[#f7fafc]", border: "border-[#e2e8f0]" },
                  { key: "accepted" as const, label: "Accepted", bg: "bg-[#f7fafc]", border: "border-[#e2e8f0]" },
                  { key: "won" as const, label: "Won", bg: "bg-[#f0fdf4]", border: "border-[#86efac]" },
                ] as const
              ).map((stage, idx) => (
                <div key={stage.key} className="flex items-center gap-3 flex-1 min-w-[120px]">
                  <div className={`w-full border rounded-md ${stage.bg} ${stage.border} p-4`}>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-[#718096]">{stage.label}</div>
                    <div className="mt-2 text-[24px] font-semibold text-[#1a202c]">{funnelCounts[stage.key]}</div>
                  </div>
                  {idx < 4 && <div className="text-[20px] text-[#cbd5e0] flex-shrink-0">→</div>}
                </div>
              ))}
            </div>

            <div className="mt-5 bg-[#f7fafc] border-l-[3px] border-l-[#2d3748] rounded-md p-4 text-[14px] text-[#2d3748]">
              <span className="font-semibold text-[#1a202c]">Insight:</span>{" "}
              {draftCount > 0
                ? "Your biggest bottleneck is getting proposals sent. Draft proposals do not generate revenue. Send them today to start your conversion funnel."
                : "Keep your funnel moving by sending proposals promptly and following up consistently."}
            </div>
          </div>

          {/* Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white border border-[#e2e8f0] shadow-sm rounded-lg p-6 md:p-7">
              <div className="text-[13px] font-semibold uppercase tracking-wide text-[#4a5568] mb-4">
                Performance Benchmarks
              </div>
              <div className="divide-y divide-[#f7fafc]">
                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="text-[14px] text-[#4a5568]">Industry avg win rate</div>
                  <div className="text-[14px] font-semibold text-[#1a202c]">27-35%</div>
                </div>
                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="text-[14px] text-[#4a5568]">Your current win rate</div>
                  <div className={`text-[14px] font-semibold ${winRate.value === 0 ? "text-[#dc2626]" : "text-[#1a202c]"}`}>
                    {winRate.value}%
                  </div>
                </div>
                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="text-[14px] text-[#4a5568]">Proposals needed for 30% win rate</div>
                  <div className="text-[14px] font-semibold text-[#1a202c]">7-10/month</div>
                </div>
                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="text-[14px] text-[#4a5568]">Avg time to first view</div>
                  <div className="text-[14px] font-semibold text-[#1a202c]">
                    {avgTimeToFirstViewDays == null ? "—" : `${avgTimeToFirstViewDays} days`}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#e2e8f0] shadow-sm rounded-lg p-6 md:p-7">
              <div className="text-[13px] font-semibold uppercase tracking-wide text-[#4a5568] mb-4">
                Recommended Actions
              </div>
              <div className="divide-y divide-[#f7fafc]">
                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="text-[14px] text-[#4a5568]">Send draft proposals</div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">
                    High Priority
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="text-[14px] text-[#4a5568]">Set up follow-up reminders</div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#fef5e7] text-[#d69e2e] border border-[#f4d88d]">
                    Recommended
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="text-[14px] text-[#4a5568]">Review pricing strategy</div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f7fafc] text-[#4a5568] border border-[#e2e8f0]">
                    Optional
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="text-[14px] text-[#4a5568]">Customize templates</div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f7fafc] text-[#4a5568] border border-[#e2e8f0]">
                    Optional
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Proposals Table */}
          <div id="proposals-table" className="bg-white border border-[#e2e8f0] shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e2e8f0] flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-[16px] font-semibold text-[#1a202c]">Recent Proposals ({sortedProposals.length})</div>
                <div className="text-[12px] text-[#718096] mt-1">Search and take action without leaving the dashboard.</div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search proposals..."
                  className="h-9 w-full sm:w-[260px] px-3 rounded-md border border-[#cbd5e0] bg-white text-[14px] text-[#1a202c] placeholder:text-[#718096] focus:outline-none focus:ring-2 focus:ring-[#2d3748] focus:ring-offset-0"
                  aria-label="Search proposals"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="h-9 px-3 rounded-md border border-[#cbd5e0] bg-white text-[14px] text-[#4a5568] focus:outline-none focus:ring-2 focus:ring-[#2d3748]"
                  aria-label="Filter by status"
                >
                  <option value="all">Status: All</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="viewed">Viewed</option>
                  <option value="accepted">Accepted</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
                <select
                  value={tradeFilter}
                  onChange={(e) => setTradeFilter(e.target.value)}
                  className="h-9 px-3 rounded-md border border-[#cbd5e0] bg-white text-[14px] text-[#4a5568] focus:outline-none focus:ring-2 focus:ring-[#2d3748]"
                  aria-label="Filter by trade"
                >
                  <option value="all">Trade: All</option>
                  {tradeOptions.map((t) => (
                    <option key={t} value={t}>
                      {toTitleCase(t)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#f7fafc]">
                    {["Customer", "Trade", "Amount", "Status", "Created", "Last Activity", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#718096] border-b border-[#e2e8f0]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProposals.map((p) => {
                    const stage = deriveStage(p);
                    const amount = (p.priceLow + p.priceHigh) / 2;
                    const lastActivity = p.lastViewedAt || p.createdAt;
                    const lastAgo = daysAgo(lastActivity);
                    const isDraft = stage === "draft";
                    return (
                      <tr key={p.id} className="hover:bg-[#f7fafc] transition-colors duration-200">
                        <td className="px-6 py-4 border-b border-[#f7fafc]">
                          <div className="text-[14px] font-semibold text-[#1a202c]">{p.clientName}</div>
                          <div className="text-[12px] text-[#718096] mt-1">{p.address}</div>
                        </td>
                        <td className="px-6 py-4 border-b border-[#f7fafc] text-[14px] text-[#4a5568]">
                          {toTitleCase(p.tradeId || "General")}
                        </td>
                        <td className="px-6 py-4 border-b border-[#f7fafc] text-[14px] font-semibold text-[#1a202c]">
                          {formatCurrency(amount)}
                        </td>
                        <td className="px-6 py-4 border-b border-[#f7fafc]">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded text-[11px] font-semibold border ${statusBadgeClasses(stage)}`}>
                            {statusLabel(stage)}
                          </span>
                        </td>
                        <td className="px-6 py-4 border-b border-[#f7fafc] text-[14px] text-[#718096]">
                          {formatShortDate(p.createdAt)}
                        </td>
                        <td className="px-6 py-4 border-b border-[#f7fafc]">
                          {isDraft ? (
                            <>
                              <div className="text-[14px] font-medium text-[#dc2626]">Not sent yet</div>
                              <div className="text-[12px] text-[#718096] mt-1">{daysAgo(p.createdAt) ?? "—"}</div>
                            </>
                          ) : (
                            <>
                              <div className="text-[14px] font-medium text-[#4a5568]">
                                {p.lastViewedAt ? "Viewed" : "Created"}
                              </div>
                              <div className="text-[12px] text-[#718096] mt-1">{lastAgo ?? "—"}</div>
                            </>
                          )}
                        </td>
                        <td className="px-6 py-4 border-b border-[#f7fafc]">
                          <div className="flex items-center gap-2 justify-end">
                            {isDraft ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setEmailModalData({ id: p.id, clientName: p.clientName })}
                                  className="px-3 py-2 rounded-md bg-[#2d3748] text-white text-[12px] font-medium hover:bg-[#1a202c] transition-colors duration-200"
                                >
                                  Send Now
                                </button>
                                <button
                                  type="button"
                                  onClick={() => router.push(`/app?edit=${p.id}`)}
                                  className="px-3 py-2 rounded-md border border-[#cbd5e0] bg-white text-[12px] font-medium text-[#4a5568] hover:bg-[#f7fafc] hover:border-[#a0aec0] transition-colors duration-200"
                                >
                                  Edit
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => router.push(`/proposals/${p.id}`)}
                                  className="px-3 py-2 rounded-md border border-[#cbd5e0] bg-white text-[12px] font-medium text-[#4a5568] hover:bg-[#f7fafc] hover:border-[#a0aec0] transition-colors duration-200"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => router.push(`/app?edit=${p.id}`)}
                                  className="px-3 py-2 rounded-md border border-[#cbd5e0] bg-white text-[12px] font-medium text-[#4a5568] hover:bg-[#f7fafc] hover:border-[#a0aec0] transition-colors duration-200"
                                >
                                  Edit
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredProposals.length === 0 && (
              <div className="px-6 py-12 text-center">
                <div className="text-[14px] text-[#718096]">No proposals found matching your filters.</div>
              </div>
            )}
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
    </Layout>
  );
}
