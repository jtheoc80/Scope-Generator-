'use client';

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import ProposalPreview from "@/components/proposal-preview";
import { Button } from "@/components/ui/button";
import EmailProposalModal from "@/components/email-proposal-modal";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  Loader2, 
  FileWarning, 
  ArrowLeft,
  Home,
  Edit,
  Mail,
} from "lucide-react";

interface Proposal {
  id: number;
  clientName: string;
  address: string;
  jobTypeName: string;
  scope: string[];
  scopeSections?: Array<{ title: string; items: string[] }>;
  priceLow: number;
  priceHigh: number;
  estimatedDaysLow?: number;
  estimatedDaysHigh?: number;
  options: Record<string, boolean>;
  status?: string;
  isUnlocked?: boolean;
  publicToken?: string | null;
  lineItems?: Array<{
    id: string;
    tradeName: string;
    jobTypeName: string;
    scope: string[];
    scopeSections?: Array<{ title: string; items: string[] }>;
    priceLow: number;
    priceHigh: number;
    estimatedDaysLow?: number;
    estimatedDaysHigh?: number;
  }>;
}

export default function ProposalViewPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params?.id as string;
  const previewRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<"idle" | "generating" | "ready" | "sent" | "error">("idle");
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: proposal, isLoading, error } = useQuery<Proposal>({
    queryKey: ["/api/proposals", proposalId],
    queryFn: async () => {
      const res = await fetch(`/api/proposals/${proposalId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load proposal");
      }
      return res.json();
    },
    enabled: !!proposalId,
  });

  const handleExportPDF = async () => {
    if (!proposalId) return;
    setIsDownloading(true);
    setPdfStatus("generating");
    setPdfError(null);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/pdf`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to generate PDF");
      }

      const contentDisposition = res.headers.get("content-disposition") || "";
      const filenameMatch =
        /filename\*=(?:UTF-8'')?([^;]+)|filename=\"?([^\";]+)\"?/i.exec(contentDisposition);
      const rawFilename = filenameMatch?.[1] || filenameMatch?.[2];
      const filename = rawFilename ? decodeURIComponent(rawFilename) : `proposal-${proposalId}.pdf`;

      const bytes = await res.arrayBuffer();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setPdfStatus(lastSentAt ? "sent" : "ready");
      toast({
        title: "PDF ready",
        description: "Your PDF download has started.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate PDF";
      setPdfStatus("error");
      setPdfError(msg);
      toast({
        title: "PDF generation failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-slate-600">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <FileWarning className="w-16 h-16 mx-auto text-slate-400" />
          <h1 className="text-2xl font-bold mt-4 text-slate-900">Proposal Not Found</h1>
          <p className="mt-2 text-slate-600">
            {error instanceof Error ? error.message : "This proposal could not be loaded."}
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={() => router.push("/m")}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Transform proposal data for ProposalPreview component
  const proposalData = {
    clientName: proposal.clientName,
    address: proposal.address,
    jobTypeName: proposal.jobTypeName,
    scope: proposal.scope,
    scopeSections: proposal.scopeSections,
    priceRange: {
      low: proposal.priceLow,
      high: proposal.priceHigh,
    },
    estimatedDays: proposal.estimatedDaysLow && proposal.estimatedDaysHigh ? {
      low: proposal.estimatedDaysLow,
      high: proposal.estimatedDaysHigh,
    } : undefined,
    lineItems: proposal.lineItems?.map(item => ({
      serviceId: item.id,
      tradeName: item.tradeName,
      jobTypeName: item.jobTypeName,
      scope: item.scope,
      scopeSections: item.scopeSections,
      priceRange: { low: item.priceLow, high: item.priceHigh },
      estimatedDays: item.estimatedDaysLow && item.estimatedDaysHigh 
        ? { low: item.estimatedDaysLow, high: item.estimatedDaysHigh }
        : { low: 1, high: 3 },
    })),
    ...proposal.options,
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-[900px] mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push("/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="font-heading font-bold text-lg text-slate-900">
                Proposal #{proposal.id}
              </h1>
              <p className="text-sm text-slate-500">
                {proposal.clientName} • {proposal.jobTypeName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/app")}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit in App
            </Button>
            <Button
              onClick={() => setIsEmailModalOpen(true)}
              variant="outline"
              disabled={isDownloading}
              title={!proposal ? "Proposal is still loading" : undefined}
            >
              <Mail className="w-4 h-4 mr-2" />
              Email PDF
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={isDownloading}
              data-testid="export-pdf"
              title={pdfError || undefined}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  {pdfStatus === "sent" ? "Sent" : pdfStatus === "ready" ? "Ready" : "Export PDF"}
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="max-w-[900px] mx-auto px-4 pb-3">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span data-testid="pdf-generation-status">
              {pdfStatus === "idle" && "PDF: Idle"}
              {pdfStatus === "generating" && "PDF: Generating…"}
              {pdfStatus === "ready" && "PDF: Ready"}
              {pdfStatus === "sent" && "PDF: Sent"}
              {pdfStatus === "error" && "PDF: Failed (retry)"}
            </span>
            <span className="text-xs text-slate-500">
              {lastSentAt ? `Last sent: ${new Date(lastSentAt).toLocaleString("en-US")}` : "Not emailed yet"}
            </span>
          </div>
          {pdfStatus === "error" && pdfError ? (
            <div className="mt-2 text-xs text-red-600">{pdfError}</div>
          ) : null}
        </div>
      </div>

      {/* Proposal Preview */}
      <div className="py-8 px-4">
        <ProposalPreview
          ref={previewRef}
          data={proposalData}
        />
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-slate-500 text-sm">
        Powered by <span className="font-semibold">ScopeGen</span>
      </div>

      {proposal && (
        <EmailProposalModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          proposalId={proposal.id}
          clientName={proposal.clientName}
          publicToken={(proposal as any).publicToken}
          onSent={(info) => {
            setLastSentAt(info.sentAt);
            setPdfStatus("sent");
          }}
        />
      )}
    </div>
  );
}
