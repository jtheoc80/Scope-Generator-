'use client';
import { useRef, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ProposalPreview from "@/components/proposal-preview";
import SignaturePad, { SignaturePadRef } from "@/components/signature-pad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Loader2, FileWarning, CheckCircle2, FileSignature } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface PublicProposalResponse {
  proposal: {
    id: number;
    clientName: string;
    address: string;
    jobTypeName: string;
    scope: string[];
    priceLow: number;
    priceHigh: number;
    options: Record<string, boolean>;
    status?: string;
    acceptedAt?: string;
    acceptedByName?: string;
    acceptedByEmail?: string;
    signature?: string | null;
  };
  companyInfo: {
    companyName?: string | null;
    companyAddress?: string | null;
    companyPhone?: string | null;
    companyLogo?: string | null;
  } | null;
}

export default function PublicProposal() {
  const params = useParams<{ token: string }>();
  const previewRef = useRef<HTMLDivElement>(null);
  const signaturePadRef = useRef<SignaturePadRef>(null);
  const queryClient = useQueryClient();
  const [isDownloading, setIsDownloading] = useState(false);
  const [showAcceptForm, setShowAcceptForm] = useState(false);
  const [acceptName, setAcceptName] = useState("");
  const [acceptEmail, setAcceptEmail] = useState("");
  const [signature, setSignature] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<PublicProposalResponse>({
    queryKey: ["/api/public/proposal", params.token],
    queryFn: async () => {
      const res = await fetch(`/api/public/proposal/${params.token}`);
      if (!res.ok) {
        throw new Error("Proposal not found");
      }
      return res.json();
    },
    enabled: !!params.token,
  });

  const acceptMutation = useMutation({
    mutationFn: async ({ name, email, signature }: { name: string; email: string; signature: string }) => {
      const res = await fetch(`/api/public/proposal/${params.token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, signature }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to accept proposal");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/public/proposal", params.token] });
      setShowAcceptForm(false);
      setSignature(null);
    },
  });

  const handleDownloadPDF = async () => {
    if (!previewRef.current || !data) return;

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
      
      const filename = `proposal-${data.proposal.clientName.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("Error generating PDF:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAcceptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (acceptName.trim() && acceptEmail.trim() && signature) {
      acceptMutation.mutate({ 
        name: acceptName.trim(), 
        email: acceptEmail.trim(),
        signature 
      });
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

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <FileWarning className="w-16 h-16 mx-auto text-slate-400" />
          <h1 className="text-2xl font-bold mt-4 text-slate-900">Proposal Not Found</h1>
          <p className="mt-2 text-slate-600">
            This proposal link may have expired or is no longer available.
          </p>
        </div>
      </div>
    );
  }

  const isAccepted = data.proposal.status === 'accepted';

  const proposalData = {
    clientName: data.proposal.clientName,
    address: data.proposal.address,
    jobTypeName: data.proposal.jobTypeName,
    scope: data.proposal.scope,
    priceRange: {
      low: data.proposal.priceLow,
      high: data.proposal.priceHigh,
    },
    ...data.proposal.options,
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-[900px] mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-lg text-slate-900">
              {data.companyInfo?.companyName || "Proposal"}
            </h1>
            <p className="text-sm text-slate-500">
              Proposal for {data.proposal.clientName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isAccepted ? (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium" data-testid="status-accepted">Accepted</span>
              </div>
            ) : (
              <Button
                onClick={() => setShowAcceptForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-accept-proposal"
              >
                <FileSignature className="w-4 h-4 mr-2" />
                Accept Proposal
              </Button>
            )}
            <Button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              variant="outline"
              data-testid="button-download-pdf"
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

      {showAcceptForm && !isAccepted && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileSignature className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Accept This Proposal</h2>
              <p className="text-slate-600 mt-1">
                Please provide your information and signature to accept
              </p>
            </div>
            
            <form onSubmit={handleAcceptSubmit} className="space-y-4">
              <div>
                <Label htmlFor="accept-name">Your Full Name</Label>
                <Input
                  id="accept-name"
                  type="text"
                  value={acceptName}
                  onChange={(e) => setAcceptName(e.target.value)}
                  placeholder="John Smith"
                  required
                  data-testid="input-accept-name"
                />
              </div>
              <div>
                <Label htmlFor="accept-email">Your Email Address</Label>
                <Input
                  id="accept-email"
                  type="email"
                  value={acceptEmail}
                  onChange={(e) => setAcceptEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                  data-testid="input-accept-email"
                />
              </div>
              
              <div>
                <Label>Your Signature</Label>
                <p className="text-xs text-slate-500 mb-2">
                  Draw your signature below using your mouse or finger
                </p>
                <SignaturePad
                  ref={signaturePadRef}
                  onSignatureChange={setSignature}
                />
                {!signature && (
                  <p className="text-amber-600 text-sm mt-1" data-testid="text-signature-required">
                    Please sign above to continue
                  </p>
                )}
              </div>
              
              {acceptMutation.isError && (
                <p className="text-red-600 text-sm" data-testid="text-accept-error">
                  {acceptMutation.error?.message || "Failed to accept proposal"}
                </p>
              )}
              
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAcceptForm(false);
                    setSignature(null);
                  }}
                  className="flex-1"
                  data-testid="button-cancel-accept"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={acceptMutation.isPending || !acceptName.trim() || !acceptEmail.trim() || !signature}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  data-testid="button-confirm-accept"
                >
                  {acceptMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    "Accept Proposal"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAccepted && data.proposal.acceptedAt && (
        <div className="max-w-[900px] mx-auto px-4 pt-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-green-800">
                  This proposal was accepted by {data.proposal.acceptedByName}
                </p>
                <p className="text-green-700 text-sm">
                  {new Date(data.proposal.acceptedAt).toLocaleString('en-US', {
                    dateStyle: 'long',
                    timeStyle: 'short'
                  })}
                </p>
              </div>
            </div>
            {data.proposal.signature && (
              <div className="mt-4 pt-4 border-t border-green-200">
                <p className="text-sm font-medium text-green-800 mb-2">Signature:</p>
                <div className="bg-white rounded-lg p-2 inline-block border border-green-200">
                  <img 
                    src={data.proposal.signature} 
                    alt="Client signature" 
                    className="max-h-20"
                    data-testid="img-signature"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="py-8 px-4">
        <ProposalPreview
          ref={previewRef}
          data={proposalData}
          blurred={false}
          companyInfo={data.companyInfo || undefined}
        />
      </div>

      <div className="text-center py-8 text-slate-500 text-sm">
        Powered by <span className="font-semibold">ScopeGen</span>
      </div>
    </div>
  );
}
