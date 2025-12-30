import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Download,
  Edit,
  Mail,
  MoreVertical,
  Pen,
  Plus,
  Search,
  ThumbsDown,
  Trophy,
  CreditCard,
} from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import type { TranslationKeys } from "@/lib/translations";

export interface ProposalRow {
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
  lastViewedAt?: string | null;
  paymentLinkUrl?: string | null;
  depositPercentage?: number | null;
}

type StatusKey = "all" | "draft" | "sent" | "viewed" | "accepted" | "won" | "lost";

function normalizeStatus(s: string): Exclude<StatusKey, "all"> {
  const v = s.toLowerCase().trim();
  if (v === "draft") return "draft";
  if (v === "sent") return "sent";
  if (v === "viewed") return "viewed";
  if (v === "accepted") return "accepted";
  if (v === "won") return "won";
  if (v === "lost") return "lost";
  return "draft";
}

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function formatShortDate(dateString: string, locale: string) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

export function RecentProposalsTable({
  title = "Recent proposals",
  proposals,
  locale = "en-US",
  t,
  showPaymentLink,
  onEdit,
  onView,
  onEmail,
  onAdjustPrice,
  onCountersign,
  onPayment,
  onMarkStatus,
  onDeleteDraft,
  className,
}: {
  title?: string;
  proposals: ProposalRow[];
  locale?: string;
  t: TranslationKeys;
  showPaymentLink: boolean;
  onEdit: (p: ProposalRow) => void;
  onView: (p: ProposalRow) => void;
  onEmail: (p: ProposalRow) => void;
  onAdjustPrice: (p: ProposalRow) => void;
  onCountersign: (p: ProposalRow) => void;
  onPayment: (p: ProposalRow) => void;
  onMarkStatus: (p: ProposalRow, status: "won" | "lost") => void;
  onDeleteDraft: (p: ProposalRow) => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusKey>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return proposals.filter((p) => {
      const matchesQuery =
        q.length === 0 ||
        p.clientName.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.jobTypeName.toLowerCase().includes(q);
      const matchesStatus = status === "all" || normalizeStatus(p.status) === status;
      return matchesQuery && matchesStatus;
    });
  }, [proposals, query, status]);

  const hasAny = proposals.length > 0;
  const empty = filtered.length === 0;

  return (
    <Card className={cn("rounded-2xl border-slate-200 bg-white shadow-sm", className)}>
      <CardHeader className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {filtered.length.toLocaleString()} {t.dashboard.shown}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center md:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.dashboard.searchProposals}
              className="h-9 rounded-xl border-slate-200 bg-slate-50 pl-9"
              aria-label="Search proposals by client name, address, or job type"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 justify-between rounded-xl">
                {t.dashboard.statusFilter}{" "}
                <span className="ml-2 font-semibold text-slate-900">
                  {status === "all" ? t.dashboard.all : status[0]!.toUpperCase() + status.slice(1)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {(
                [
                  ["all", t.dashboard.all],
                  ["draft", t.dashboard.draft],
                  ["sent", t.dashboard.sent],
                  ["viewed", t.dashboard.viewed],
                  ["accepted", t.dashboard.accepted],
                  ["won", t.dashboard.won],
                  ["lost", t.dashboard.lost],
                ] as Array<[StatusKey, string]>
              ).map(([k, label]) => (
                <DropdownMenuItem key={k} onClick={() => setStatus(k)}>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        {empty ? (
          <div className="px-6 py-10 text-center">
            <div className="mx-auto max-w-md">
              {hasAny ? (
                <>
                  <div className="text-sm font-semibold text-slate-900">{t.dashboard.noMatches}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {t.dashboard.tryAdjusting}
                  </div>
                  <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQuery("");
                        setStatus("all");
                      }}
                    >
                      {t.dashboard.clearFilters}
                    </Button>
                    <Button asChild className="gap-2 bg-orange-600 text-white hover:bg-orange-700 border border-orange-600">
                      <Link href="/app">
                        <Plus className="h-4 w-4" />
                        {t.dashboard.newProposal}
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm font-semibold text-slate-900">{t.dashboard.noProposalsYet}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {t.dashboard.createFirstProposal}
                  </div>
                  <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
                    <Button asChild className="gap-2 bg-orange-600 text-white hover:bg-orange-700 border border-orange-600">
                      <Link href="/app">
                        <Plus className="h-4 w-4" />
                        {t.dashboard.createFirstProposalButton}
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                      <Link href="/m/create">
                        {/* Keep ScopeScan CTA */}
                        <span>ScopeScan</span>
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">{t.dashboard.tableHeaderProposal}</th>
                  <th className="px-6 py-3 text-left font-semibold">{t.dashboard.tableHeaderTrade}</th>
                  <th className="px-6 py-3 text-left font-semibold">{t.dashboard.tableHeaderStatus}</th>
                  <th className="px-6 py-3 text-left font-semibold">{t.dashboard.tableHeaderAmount}</th>
                  <th className="px-6 py-3 text-left font-semibold">{t.dashboard.tableHeaderLastActivity}</th>
                  <th className="px-6 py-3 text-right font-semibold">{t.dashboard.tableHeaderActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const amount = (p.priceLow + p.priceHigh) / 2;
                  const last = p.lastViewedAt || p.createdAt;
                  const lastLabel = p.lastViewedAt ? t.dashboard.lastActivityViewed : t.dashboard.lastActivityCreated;
                  const isDraft = normalizeStatus(p.status) === "draft";

                  return (
                    <tr key={p.id} className="bg-white">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{p.clientName}</div>
                        <div className="mt-0.5 text-xs text-slate-500">{p.address}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{p.jobTypeName}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {formatCurrency(amount, locale)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-500">{lastLabel}</span>
                          <span className="font-medium text-slate-900">
                            {formatShortDate(last, locale)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => onEdit(p)}>
                              <Edit className="mr-2 h-4 w-4" />
                              {t.dashboard.actionEdit}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onView(p)}>
                              <Download className="mr-2 h-4 w-4" />
                              {t.dashboard.actionDownloadPdf}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAdjustPrice(p)}>
                              {t.dashboard.actionAdjustPrice}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEmail(p)}>
                              <Mail className="mr-2 h-4 w-4" />
                              {t.dashboard.actionSendEmail}
                            </DropdownMenuItem>
                            {showPaymentLink ? (
                              <DropdownMenuItem onClick={() => onPayment(p)} className="text-slate-900">
                                <CreditCard className="mr-2 h-4 w-4" />
                                {t.dashboard.actionRequestPayment}
                              </DropdownMenuItem>
                            ) : null}
                            {normalizeStatus(p.status) === "accepted" && !p.contractorSignature ? (
                              <DropdownMenuItem onClick={() => onCountersign(p)} className="text-green-700">
                                <Pen className="mr-2 h-4 w-4" />
                                {t.dashboard.actionCountersign}
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem onClick={() => onMarkStatus(p, "won")} className="text-green-700">
                              <Trophy className="mr-2 h-4 w-4" />
                              {t.dashboard.actionMarkWon}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onMarkStatus(p, "lost")} className="text-red-700">
                              <ThumbsDown className="mr-2 h-4 w-4" />
                              {t.dashboard.actionMarkLost}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDeleteDraft(p)}
                              disabled={!isDraft}
                              className={cn(
                                isDraft ? "text-red-700" : "cursor-not-allowed text-slate-400",
                              )}
                            >
                              {t.dashboard.actionDeleteDraft}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

