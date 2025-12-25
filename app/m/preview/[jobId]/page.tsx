"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Loader2,
  FileText,
  DollarSign,
  ClipboardList,
  AlertCircle,
  Star,
  Home,
} from "lucide-react";
import { mobileApiFetch, newIdempotencyKey, SubmitResponse } from "../../lib/api";

type PackageKey = "GOOD" | "BETTER" | "BEST";

type DraftPayload = {
  scopeItems?: Array<{
    name: string;
    description?: string;
    price?: number;
  }>;
  summary?: string;
  totalPrice?: number;
  packages?: {
    GOOD?: { total: number };
    BETTER?: { total: number };
    BEST?: { total: number };
  };
};

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = params.jobId as string;

  const [payload, setPayload] = useState<DraftPayload | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageKey>("BETTER");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<SubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const payloadParam = searchParams.get("payload");
    if (payloadParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(payloadParam));
        setPayload(decoded);
      } catch {
        setError("Failed to load draft data");
      }
    }
  }, [searchParams]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await mobileApiFetch<SubmitResponse>(
        `/api/mobile/jobs/${jobId}/submit`,
        {
          method: "POST",
          headers: { "Idempotency-Key": newIdempotencyKey() },
          body: JSON.stringify({ package: selectedPackage }),
        }
      );
      setSubmitted(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit proposal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReview = () => {
    setError(null); // Clear any previous error
    if (!submitted?.webReviewUrl) {
      setError("Review URL is not available. Please try again or contact support.");
      return;
    }
    const newWindow = window.open(submitted.webReviewUrl, "_blank");
    if (!newWindow) {
      setError("Unable to open the review page. Please check if pop-ups are blocked.");
    }
  };

  const handleStartNew = () => {
    router.push("/m");
  };

  // Format currency
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!payload) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[300px]">
        {error ? (
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-slate-600">{error}</p>
            <Button onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </div>
        ) : (
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        )}
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Proposal Created!</h2>
          <p className="text-slate-600 mt-2">
            Your proposal has been submitted successfully
          </p>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Proposal ID</span>
              <span className="font-medium">#{submitted.proposalId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Package</span>
              <span className="font-medium">{selectedPackage}</span>
            </div>
          </CardContent>
        </Card>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Button
            className="w-full h-12 gap-2"
            onClick={handleOpenReview}
          >
            <ExternalLink className="w-5 h-5" />
            Review Full Proposal
          </Button>
          
          <Button
            variant="outline"
            className="w-full h-12 gap-2"
            onClick={handleStartNew}
          >
            <Home className="w-5 h-5" />
            Start New Job
          </Button>
        </div>

        <p className="text-center text-xs text-slate-500">
          You can edit prices and details in the full proposal view
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 -ml-2"
          disabled={submitting}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <span className="text-sm text-slate-500">Job #{jobId}</span>
      </div>

      {/* Title */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Draft Preview</h2>
        <p className="text-sm text-slate-600">
          Review the AI-generated proposal before submitting
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Package Selection */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Select Package
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {(["GOOD", "BETTER", "BEST"] as PackageKey[]).map((pkg) => {
              const isSelected = selectedPackage === pkg;
              const price = payload.packages?.[pkg]?.total;
              
              return (
                <button
                  key={pkg}
                  onClick={() => setSelectedPackage(pkg)}
                  disabled={submitting}
                  className={`
                    p-3 rounded-lg border-2 transition-all text-center
                    ${isSelected 
                      ? "border-primary bg-primary/5" 
                      : "border-slate-200 hover:border-slate-300"}
                    ${submitting ? "opacity-50" : ""}
                  `}
                >
                  {pkg === "BETTER" && (
                    <Star className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  )}
                  <div className="font-semibold text-sm">{pkg}</div>
                  {price !== undefined && (
                    <div className="text-xs text-slate-600 mt-1">
                      {formatCurrency(price)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {selectedPackage === "BETTER" && (
            <p className="text-xs text-amber-600 text-center mt-2">
              ⭐ Recommended package
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {payload.summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Project Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700">{payload.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Scope Items */}
      {payload.scopeItems && payload.scopeItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Scope Items ({payload.scopeItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payload.scopeItems.slice(0, 10).map((item, index) => (
              <div
                key={index}
                className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-900">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
                {item.price !== undefined && (
                  <span className="text-sm font-medium text-slate-700 shrink-0">
                    {formatCurrency(item.price)}
                  </span>
                )}
              </div>
            ))}
            {payload.scopeItems.length > 10 && (
              <p className="text-xs text-slate-500 text-center">
                + {payload.scopeItems.length - 10} more items
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pricing Details - shown when no scope items or summary available */}
      {!payload.scopeItems && !payload.summary && payload.packages && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Pricing Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">
              Your proposal includes three pricing options. Select your preferred package above to submit.
            </p>
            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
              {(["GOOD", "BETTER", "BEST"] as PackageKey[]).map((pkg) => {
                const price = payload.packages?.[pkg]?.total;
                return price !== undefined ? (
                  <div key={pkg} className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 flex items-center gap-1">
                      {pkg === "BETTER" && <Star className="w-3 h-3 text-amber-500" />}
                      {pkg}
                    </span>
                    <span className="font-medium text-slate-900">{formatCurrency(price)}</span>
                  </div>
                ) : null;
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fixed bottom action button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 safe-area-inset-bottom">
        <Button
          className="w-full h-12 text-base gap-2"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Proposal...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Submit {selectedPackage} Proposal
            </>
          )}
        </Button>
        {payload.packages?.[selectedPackage]?.total !== undefined && (
          <p className="text-sm text-center text-slate-600 mt-2">
            Total: {formatCurrency(payload.packages[selectedPackage]?.total)}
          </p>
        )}
      </div>
    </div>
  );
}
