"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, MapPin, AlertCircle } from "lucide-react";
import { mobileApiFetch } from "@/app/m/lib/api";
import MapMeasurementStep, {
  type Measurements,
  type MeasurementTrade,
} from "@/components/scopescan/MapMeasurementStep";
import { isMeasurementTrade } from "@/app/m/lib/job-memory";

interface JobDetails {
  jobId: number;
  jobType: string;
  address?: string;
  lat?: number;
  lng?: number;
  customer?: string;
  measurements?: Measurements | null;
}

/**
 * Map Measurement Page
 * 
 * This page is shown for fence and driveway trades after job creation.
 * It allows users to draw on satellite imagery to measure:
 * - Fence: polyline -> linear feet
 * - Driveway: polygon -> area, perimeter, cubic yards
 */
export default function MeasurePage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch job details
  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await mobileApiFetch<JobDetails>(`/api/mobile/jobs/${jobId}`);
        setJob(res);
        
        // If not a measurement trade, redirect to capture
        if (!isMeasurementTrade(res.jobType)) {
          router.replace(`/m/capture/${jobId}`);
          return;
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load job");
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [jobId, router]);

  // Handle measurements change (for auto-save)
  const handleMeasurementsChange = useCallback(
    (measurements: Measurements | null) => {
      // Draft is automatically saved to localStorage by the component
      // We can also save to the server here if needed
      if (job) {
        setJob((prev) => prev ? { ...prev, measurements } : null);
      }
    },
    [job]
  );

  // Handle finish - save and navigate to capture
  const handleFinish = useCallback(
    async (measurements: Measurements) => {
      setSaving(true);
      setError(null);
      
      try {
        // Save measurements to the job
        await mobileApiFetch(`/api/mobile/jobs/${jobId}/measurements`, {
          method: "PUT",
          body: JSON.stringify({ measurements }),
        });
        
        // Navigate to capture page
        router.push(`/m/capture/${jobId}`);
      } catch (e) {
        // Even if save fails, measurements are in localStorage
        // Navigate anyway - they'll be picked up later
        console.error("Failed to save measurements:", e);
        router.push(`/m/capture/${jobId}`);
      } finally {
        setSaving(false);
      }
    },
    [jobId, router]
  );

  // Handle skip measurement
  const handleSkip = useCallback(() => {
    router.push(`/m/capture/${jobId}`);
  }, [jobId, router]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
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

  // Job not found or not a measurement trade
  if (!job || !isMeasurementTrade(job.jobType)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm mx-auto p-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-medium text-slate-900 mb-2">
            Measurement Not Required
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {!job 
              ? "This job could not be found." 
              : `This job type (${job.jobType}) doesn't require map measurements.`}
          </p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => router.push(`/m/capture/${jobId}`)}
              className="w-full"
            >
              Continue to Photo Capture
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="w-full"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default location if address not available
  const defaultLat = job.lat || 30.2672; // Austin, TX
  const defaultLng = job.lng || -97.7431;

  const trade = job.jobType as MeasurementTrade;

  return (
    <div className="flex flex-col h-[100dvh]">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b bg-white">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="text-center">
            <span className="text-sm font-medium text-slate-900 capitalize">
              {trade} Measurement
            </span>
            <span className="text-xs text-muted-foreground block">
              Job #{jobId}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground"
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

      {/* Map Measurement Component */}
      <div className="flex-1 min-h-0">
        <MapMeasurementStep
          trade={trade}
          initialAddressLatLng={{ lat: defaultLat, lng: defaultLng }}
          onMeasurementsChange={handleMeasurementsChange}
          onFinish={handleFinish}
        />
      </div>

      {/* Saving overlay */}
      {saving && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Saving measurements...</span>
          </div>
        </div>
      )}
    </div>
  );
}
