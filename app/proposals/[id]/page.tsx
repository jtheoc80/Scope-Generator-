'use client';

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import ProposalPreview from "@/components/proposal-preview";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Loader2, 
  FileWarning, 
  ArrowLeft,
  Home,
  Edit,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Proposal {
  id: number;
  clientName: string;
  address: string;
  jobTypeName: string;
  scope: string[];
  priceLow: number;
  priceHigh: number;
  estimatedDaysLow?: number;
  estimatedDaysHigh?: number;
  options: Record<string, boolean>;
  status?: string;
  isUnlocked?: boolean;
  lineItems?: Array<{
    serviceId: string;
    tradeName: string;
    jobTypeName: string;
    scope: string[];
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

  const handleDownloadPDF = async () => {
    if (!previewRef.current || !proposal) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      
      const filename = `proposal-${proposal.clientName.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("Error generating PDF:", err);
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
    priceRange: {
      low: proposal.priceLow,
      high: proposal.priceHigh,
    },
    estimatedDays: proposal.estimatedDaysLow && proposal.estimatedDaysHigh ? {
      low: proposal.estimatedDaysLow,
      high: proposal.estimatedDaysHigh,
    } : undefined,
    lineItems: proposal.lineItems?.map(item => ({
      serviceId: item.serviceId,
      tradeName: item.tradeName,
      jobTypeName: item.jobTypeName,
      scope: item.scope,
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
              onClick={() => router.back()}
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
              onClick={handleDownloadPDF}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Proposal Preview */}
      <div className="py-8 px-4">
        <ProposalPreview
          ref={previewRef}
          data={proposalData}
          blurred={!proposal.isUnlocked}
        />
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-slate-500 text-sm">
        Powered by <span className="font-semibold">ScopeGen</span>
      </div>
    </div>
  );
}
