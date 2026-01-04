"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  User,
  MapPin,
} from "lucide-react";
import { mobileApiFetch, newIdempotencyKey, SubmitResponse, MobileJob } from "@/app/m/lib/api";
import JobAddressField from "@/components/job-address-field";
import { EagleViewRoofMeasurements } from "@/components/eagleview-roof-measurements";
import type { RoofingMeasurements } from "@/hooks/useEagleViewOrder";

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
    GOOD?: { total: number; lineItems?: Array<{ priceLow: number; priceHigh: number }> };
    BETTER?: { total: number; lineItems?: Array<{ priceLow: number; priceHigh: number }> };
    BEST?: { total: number; lineItems?: Array<{ priceLow: number; priceHigh: number }> };
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
  
  // Draft-first: Client details state
  const [jobInfo, setJobInfo] = useState<{ 
    clientName?: string; 
    address?: string;
    tradeId?: string;
    tradeName?: string;
  } | null>(null);
  const [loadingJobInfo, setLoadingJobInfo] = useState(true);
  
  // Roofing measurements from EagleView (stored for proposal generation)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [roofMeasurements, setRoofMeasurements] = useState<RoofingMeasurements | null>(null);
  const [editingClientDetails, setEditingClientDetails] = useState(false);
  const [clientName, setClientName] = useState("");
  const [address, setAddress] = useState("");
  const [savingClientDetails, setSavingClientDetails] = useState(false);
  const [clientDetailsErrors, setClientDetailsErrors] = useState<{ clientName?: string; address?: string }>({});

  // Draft-first: Check if client details are complete
  const hasCompleteClientDetails = Boolean(
    jobInfo?.clientName && 
    jobInfo.clientName !== "Customer" && 
    jobInfo.clientName.trim().length >= 2 &&
    jobInfo?.address && 
    jobInfo.address !== "Address TBD" && 
    jobInfo.address.trim().length >= 5
  );

  // Fetch job info to check client details
  useEffect(() => {
    const fetchJobInfo = async () => {
      try {
        const job = await mobileApiFetch<MobileJob>(`/api/mobile/jobs/${jobId}`, { method: "GET" });
        setJobInfo({ 
          clientName: job.clientName, 
          address: job.address,
          tradeId: job.tradeId,
          tradeName: job.tradeName,
        });
        setClientName(job.clientName === "Customer" ? "" : job.clientName || "");
        setAddress(job.address === "Address TBD" ? "" : job.address || "");
        
        // Auto-expand client details section if missing
        if (!job.clientName || job.clientName === "Customer" || !job.address || job.address === "Address TBD") {
          setEditingClientDetails(true);
        }
      } catch {
        // Job info fetch failed - continue without it
        console.error("Failed to fetch job info");
      } finally {
        setLoadingJobInfo(false);
      }
    };
    fetchJobInfo();
  }, [jobId]);

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

  // Save client details
  const handleSaveClientDetails = useCallback(async () => {
    const errors: { clientName?: string; address?: string } = {};
    
    if (!clientName || clientName.trim().length < 2) {
      errors.clientName = "Client name is required (min 2 characters)";
    }
    if (!address || address.trim().length < 5) {
      errors.address = "Job address is required (min 5 characters)";
    }
    
    setClientDetailsErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    setSavingClientDetails(true);
    try {
      // Update job with client details via PATCH API (Draft-first flow)
      await mobileApiFetch(`/api/mobile/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Idempotency-Key": newIdempotencyKey() },
        body: JSON.stringify({
          clientName: clientName.trim(),
          address: address.trim(),
        }),
      });
      
      // Update local state
      setJobInfo({ clientName: clientName.trim(), address: address.trim() });
      setEditingClientDetails(false);
      setClientDetailsErrors({});
      setError(null); // Clear any previous error
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save client details");
    } finally {
      setSavingClientDetails(false);
    }
  }, [clientName, address, jobId]);

  const handleSubmit = async () => {
    // Draft-first: Validate client details before submit
    if (!hasCompleteClientDetails) {
      setEditingClientDetails(true);
      setError("Please add client name and address before submitting");
      return;
    }
    
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

      {/* Draft-first: Client Details Section */}
      {!loadingJobInfo && (
        <Card className={!hasCompleteClientDetails ? "border-amber-300 bg-amber-50" : ""} data-testid="client-details-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Client Details
                {!hasCompleteClientDetails && (
                  <span className="text-xs font-normal text-amber-700 bg-amber-100 px-2 py-0.5 rounded" data-testid="badge-required">
                    Required to send
                  </span>
                )}
              </span>
              {hasCompleteClientDetails && !editingClientDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingClientDetails(true)}
                  className="text-primary"
                >
                  Edit
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editingClientDetails ? (
              <div className="space-y-3" data-testid="client-details-form">
                <div className="space-y-1.5">
                  <Label htmlFor="clientName" className="text-sm flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Client Name
                  </Label>
                  <Input
                    id="clientName"
                    placeholder="Enter client name"
                    value={clientName}
                    onChange={(e) => {
                      setClientName(e.target.value);
                      if (clientDetailsErrors.clientName) {
                        setClientDetailsErrors(prev => ({ ...prev, clientName: undefined }));
                      }
                    }}
                    disabled={savingClientDetails}
                    className={clientDetailsErrors.clientName ? "border-red-500" : ""}
                    data-testid="input-client-name"
                  />
                  {clientDetailsErrors.clientName && (
                    <p className="text-xs text-red-500" data-testid="error-client-name">
                      {clientDetailsErrors.clientName}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-sm flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Job Address
                  </Label>
                  <JobAddressField
                    value={address}
                    onChange={(val) => {
                      setAddress(val);
                      if (clientDetailsErrors.address) {
                        setClientDetailsErrors(prev => ({ ...prev, address: undefined }));
                      }
                    }}
                    placeholder="Start typing an address..."
                    disabled={savingClientDetails}
                    className={clientDetailsErrors.address ? "[&_input]:border-red-500" : ""}
                    data-testid="input-address"
                  />
                  {clientDetailsErrors.address && (
                    <p className="text-xs text-red-500" data-testid="error-address">
                      {clientDetailsErrors.address}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveClientDetails}
                    disabled={savingClientDetails}
                    className="flex-1"
                    data-testid="button-save-client-details"
                  >
                    {savingClientDetails ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save Details
                      </>
                    )}
                  </Button>
                  {hasCompleteClientDetails && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingClientDetails(false);
                        setClientName(jobInfo?.clientName || "");
                        setAddress(jobInfo?.address || "");
                        setClientDetailsErrors({});
                      }}
                      disabled={savingClientDetails}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2" data-testid="client-details-display">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{jobInfo?.clientName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-slate-600">{jobInfo?.address}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* EagleView Roof Measurements (Roofing Only) */}
      {!loadingJobInfo && jobInfo?.tradeId === 'roofing' && hasCompleteClientDetails && (
        <EagleViewRoofMeasurements
          jobId={jobId}
          trade={jobInfo.tradeId}
          address={jobInfo.address || address}
          onMeasurementsReady={setRoofMeasurements}
        />
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
          disabled={submitting || loadingJobInfo}
          data-testid="button-submit-proposal"
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
        {/* Draft-first: Show helper text when client details are missing */}
        {!hasCompleteClientDetails && !loadingJobInfo && (
          <p className="text-xs text-center text-amber-600 mt-2" data-testid="helper-client-required">
            ⚠️ Add client name & address above to submit
          </p>
        )}
        {payload.packages?.[selectedPackage]?.total !== undefined && hasCompleteClientDetails && (
          <p className="text-sm text-center text-slate-600 mt-2">
            Total: {formatCurrency(payload.packages[selectedPackage]?.total)}
          </p>
        )}
      </div>
    </div>
  );
}
