"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  AlertCircle,
  Package,
  Sparkles,
  FileText,
  Check,
} from "lucide-react";
import { mobileApiFetch, newIdempotencyKey } from "@/app/m/lib/api";
import MapMeasurementStep, {
  type DrivewayMeasurements,
  type Measurements,
} from "@/components/scopescan/MapMeasurementStep";

interface JobDetails {
  jobId: number;
  jobType: string;
  address?: string;
  lat?: number;
  lng?: number;
  customer?: string;
  clientName?: string;
  measurements?: DrivewayMeasurements | null;
}

type PackageKey = "GOOD" | "BETTER" | "BEST";

interface DrivewayPackage {
  id: PackageKey;
  name: string;
  description: string;
  pricePerSqFt: number;
  features: string[];
}

const DRIVEWAY_PACKAGES: DrivewayPackage[] = [
  {
    id: "GOOD",
    name: "Standard",
    description: "Quality concrete with standard finish",
    pricePerSqFt: 8,
    features: [
      "4\" concrete thickness",
      "Broom finish",
      "Standard gray color",
      "1-year warranty",
    ],
  },
  {
    id: "BETTER",
    name: "Enhanced",
    description: "Premium concrete with decorative options",
    pricePerSqFt: 12,
    features: [
      "5\" concrete thickness",
      "Stamped or exposed aggregate finish",
      "Color options available",
      "3-year warranty",
    ],
  },
  {
    id: "BEST",
    name: "Premium",
    description: "Top-tier installation with all upgrades",
    pricePerSqFt: 18,
    features: [
      "6\" reinforced concrete",
      "Custom decorative finish",
      "Premium color staining",
      "Sealed surface",
      "5-year warranty",
    ],
  },
];

interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
}

const DRIVEWAY_ADDONS: AddOn[] = [
  {
    id: "removal",
    name: "Old Driveway Removal",
    description: "Demolition and haul-away of existing driveway",
    price: 3,
    unit: "per sq ft",
  },
  {
    id: "grading",
    name: "Site Grading",
    description: "Level and prepare the base",
    price: 2,
    unit: "per sq ft",
  },
  {
    id: "apron",
    name: "Curb Apron",
    description: "Connect driveway to street",
    price: 500,
    unit: "flat fee",
  },
  {
    id: "drainage",
    name: "Drainage Channel",
    description: "Install drainage to prevent water pooling",
    price: 25,
    unit: "per linear ft",
  },
];

/**
 * Driveway Measurement Page (Dedicated Route)
 *
 * This is the upgraded driveway experience with:
 * - Polygon drawing for area measurement
 * - Package selection (Good/Better/Best)
 * - Add-ons selection
 * - Generate proposal functionality
 * - Draft polling for AI-generated proposals
 */
export default function DrivewayMeasurePage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  // Job state
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Measurement state
  const [measurements, setMeasurements] = useState<DrivewayMeasurements | null>(
    null
  );

  // Package & Add-ons state
  const [selectedPackage, setSelectedPackage] = useState<PackageKey>("BETTER");
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());

  // Proposal generation state
  const [generating, setGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);

  // Fetch job details
  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await mobileApiFetch<JobDetails>(
          `/api/mobile/jobs/${jobId}`
        );
        setJob(res);

        // If not a driveway job, redirect to generic measure page
        if (res.jobType !== "driveway") {
          router.replace(`/m/measure/${jobId}`);
          return;
        }

        // Load existing measurements if available
        if (res.measurements) {
          setMeasurements(res.measurements);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load job");
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [jobId, router]);

  // Handle measurements change from map component
  const handleMeasurementsChange = useCallback(
    (newMeasurements: Measurements | null) => {
      // Only accept driveway measurements (type guard)
      if (newMeasurements && "drivewayPolygonPoints" in newMeasurements) {
        setMeasurements(newMeasurements);
      } else if (newMeasurements === null) {
        setMeasurements(null);
      }
    },
    []
  );

  // Calculate pricing
  const calculatePricing = useCallback(() => {
    if (!measurements) return null;

    const pkg = DRIVEWAY_PACKAGES.find((p) => p.id === selectedPackage);
    if (!pkg) return null;

    const basePrice = measurements.drivewaySF * pkg.pricePerSqFt;

    let addOnsTotal = 0;
    selectedAddOns.forEach((addOnId) => {
      const addOn = DRIVEWAY_ADDONS.find((a) => a.id === addOnId);
      if (addOn) {
        if (addOn.unit === "per sq ft") {
          addOnsTotal += addOn.price * measurements.drivewaySF;
        } else if (addOn.unit === "per linear ft") {
          addOnsTotal += addOn.price * measurements.drivewayPerimeterLF;
        } else {
          addOnsTotal += addOn.price;
        }
      }
    });

    return {
      basePrice: Math.round(basePrice),
      addOnsTotal: Math.round(addOnsTotal),
      total: Math.round(basePrice + addOnsTotal),
    };
  }, [measurements, selectedPackage, selectedAddOns]);

  // Toggle add-on selection
  const toggleAddOn = useCallback((addOnId: string) => {
    setSelectedAddOns((prev) => {
      const next = new Set(prev);
      if (next.has(addOnId)) {
        next.delete(addOnId);
      } else {
        next.add(addOnId);
      }
      return next;
    });
  }, []);

  // Save measurements to job
  const saveMeasurementsToJob = useCallback(async () => {
    if (!measurements) return;

    try {
      await mobileApiFetch(`/api/mobile/jobs/${jobId}/measurements`, {
        method: "PUT",
        body: JSON.stringify({ measurements }),
      });
    } catch (e) {
      console.error("Failed to save measurements:", e);
      // Continue anyway - measurements are saved locally
    }
  }, [jobId, measurements]);

  // Generate proposal
  const handleGenerateProposal = useCallback(async () => {
    if (!measurements || !job) return;

    setGenerating(true);
    setGenerationStatus("Saving measurements...");
    setError(null);

    try {
      // Save measurements first
      await saveMeasurementsToJob();

      setGenerationStatus("Generating proposal...");

      // Build the proposal payload
      const pricing = calculatePricing();
      const selectedPkg = DRIVEWAY_PACKAGES.find(
        (p) => p.id === selectedPackage
      );
      const selectedAddOnDetails = DRIVEWAY_ADDONS.filter((a) =>
        selectedAddOns.has(a.id)
      );

      const payload = {
        measurements,
        package: selectedPackage,
        packageDetails: selectedPkg,
        addOns: selectedAddOnDetails,
        pricing,
      };

      // Generate draft proposal via API
      const response = await mobileApiFetch<{ draftId: string }>(
        `/api/mobile/jobs/${jobId}/generate-proposal`,
        {
          method: "POST",
          headers: { "Idempotency-Key": newIdempotencyKey() },
          body: JSON.stringify(payload),
        }
      );

      setGenerationStatus("Proposal generated! Redirecting...");

      // Navigate to preview with the draft
      const previewPayload = encodeURIComponent(
        JSON.stringify({
          summary: `Driveway installation - ${measurements.drivewaySF.toLocaleString()} sq ft with ${selectedPkg?.name} package`,
          packages: {
            GOOD: {
              total:
                measurements.drivewaySF * DRIVEWAY_PACKAGES[0].pricePerSqFt,
            },
            BETTER: {
              total:
                measurements.drivewaySF * DRIVEWAY_PACKAGES[1].pricePerSqFt,
            },
            BEST: {
              total:
                measurements.drivewaySF * DRIVEWAY_PACKAGES[2].pricePerSqFt,
            },
          },
          scopeItems: [
            {
              name: `${selectedPkg?.name} Driveway Package`,
              description: selectedPkg?.description,
              price: pricing?.basePrice,
            },
            ...selectedAddOnDetails.map((addon) => ({
              name: addon.name,
              description: addon.description,
              price:
                addon.unit === "per sq ft"
                  ? addon.price * measurements.drivewaySF
                  : addon.unit === "per linear ft"
                    ? addon.price * measurements.drivewayPerimeterLF
                    : addon.price,
            })),
          ],
          totalPrice: pricing?.total,
          draftId: response.draftId,
        })
      );

      router.push(`/m/preview/${jobId}?payload=${previewPayload}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to generate proposal"
      );
      setGenerating(false);
      setGenerationStatus(null);
    }
  }, [
    measurements,
    job,
    jobId,
    selectedPackage,
    selectedAddOns,
    calculatePricing,
    saveMeasurementsToJob,
    router,
  ]);

  // Skip to capture (without proposal)
  const handleSkipToCapture = useCallback(async () => {
    if (measurements) {
      await saveMeasurementsToJob();
    }
    router.push(`/m/capture/${jobId}`);
  }, [measurements, jobId, saveMeasurementsToJob, router]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error && !job) {
    return (
      <div className="p-4">
        <div className="mx-auto max-w-lg">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Failed to load job</p>
              <p className="text-sm mt-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => router.back()}
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Job not found
  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm mx-auto p-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-medium text-slate-900 mb-2">
            Job Not Found
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            This job could not be found.
          </p>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Default location if address not available
  const defaultLat = job.lat || 30.2672; // Austin, TX
  const defaultLng = job.lng || -97.7431;

  const pricing = calculatePricing();

  return (
    <div className="flex flex-col min-h-[100dvh]">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b bg-white">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2 -ml-2"
            disabled={generating}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="text-center">
            <span className="text-sm font-medium text-slate-900">
              Driveway Measurement
            </span>
            <span className="text-xs text-muted-foreground block">
              Job #{jobId}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkipToCapture}
            className="text-muted-foreground"
            disabled={generating}
          >
            Skip
          </Button>
        </div>

        {/* Address display */}
        {job.address && (
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{job.address}</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Map Measurement Component */}
        <div className="h-[300px] border-b">
          <MapMeasurementStep
            trade="driveway"
            initialAddressLatLng={{ lat: defaultLat, lng: defaultLng }}
            onMeasurementsChange={handleMeasurementsChange}
          />
        </div>

        {/* Measurements Summary */}
        {measurements && (
          <div className="p-4 space-y-4">
            {/* Area & Concrete Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Measurements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Area</span>
                  <span className="font-medium">
                    {measurements.drivewaySF.toLocaleString()} sq ft
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Perimeter</span>
                  <span className="font-medium">
                    {measurements.drivewayPerimeterLF.toLocaleString()} ft
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">
                    Concrete ({measurements.drivewayThicknessIn}&quot; thick)
                  </span>
                  <span className="font-medium">
                    {measurements.drivewayCY} cubic yards
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Package Selection */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Select Package
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedPackage}
                  onValueChange={(v) => setSelectedPackage(v as PackageKey)}
                  disabled={generating}
                >
                  <SelectTrigger data-testid="package-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DRIVEWAY_PACKAGES.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{pkg.name}</span>
                          <span className="text-muted-foreground">
                            - ${pkg.pricePerSqFt}/sq ft
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Package Details */}
                {selectedPackage && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-2">
                      {
                        DRIVEWAY_PACKAGES.find((p) => p.id === selectedPackage)
                          ?.description
                      }
                    </p>
                    <ul className="space-y-1">
                      {DRIVEWAY_PACKAGES.find(
                        (p) => p.id === selectedPackage
                      )?.features.map((feature, i) => (
                        <li
                          key={i}
                          className="text-xs text-slate-500 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add-ons */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Add-ons
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {DRIVEWAY_ADDONS.map((addon) => (
                  <div
                    key={addon.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50"
                  >
                    <Checkbox
                      id={addon.id}
                      checked={selectedAddOns.has(addon.id)}
                      onCheckedChange={() => toggleAddOn(addon.id)}
                      disabled={generating}
                    />
                    <Label
                      htmlFor={addon.id}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium">{addon.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {addon.description}
                          </p>
                        </div>
                        <span className="text-sm text-slate-600">
                          ${addon.price} {addon.unit}
                        </span>
                      </div>
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Pricing Summary */}
            {pricing && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Estimate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Base Package</span>
                    <span className="font-medium">
                      {formatCurrency(pricing.basePrice)}
                    </span>
                  </div>
                  {pricing.addOnsTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Add-ons</span>
                      <span className="font-medium">
                        {formatCurrency(pricing.addOnsTotal)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Total Estimate</span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(pricing.total)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Empty state when no measurements */}
        {!measurements && (
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm">
              Draw the driveway outline on the map above to see measurements and
              pricing.
            </p>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg safe-area-inset-bottom">
        {generating ? (
          <div className="flex items-center justify-center gap-3 py-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              {generationStatus}
            </span>
          </div>
        ) : (
          <Button
            className="w-full h-12 text-base gap-2"
            onClick={handleGenerateProposal}
            disabled={!measurements}
          >
            <Sparkles className="w-5 h-5" />
            Generate Proposal
          </Button>
        )}
      </div>
    </div>
  );
}
