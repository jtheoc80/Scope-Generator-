/**
 * EagleView Roof Measurements Component
 * 
 * Displays the "Get Roof Measurements" button for roofing jobs.
 * Shows order status, progress, and measurements when available.
 * 
 * Only visible for roofing trade jobs.
 */

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Ruler,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Info,
  Home,
} from "lucide-react";
import { useEagleViewOrder, type RoofingMeasurements } from "@/hooks/useEagleViewOrder";
import { cn } from "@/lib/utils";

interface EagleViewRoofMeasurementsProps {
  jobId: string;
  trade: string;
  address: string;
  onMeasurementsReady?: (measurements: RoofingMeasurements) => void;
  className?: string;
}

export function EagleViewRoofMeasurements({
  jobId,
  trade,
  address,
  onMeasurementsReady,
  className,
}: EagleViewRoofMeasurementsProps) {
  const {
    status,
    reportUrl,
    measurements,
    errorMessage,
    isLoading,
    createOrder,
    refresh,
    canCreateOrder,
    isRoofing,
  } = useEagleViewOrder({
    jobId,
    trade,
    address,
    enabled: true,
  });

  // Call onMeasurementsReady when measurements become available
  if (measurements && onMeasurementsReady) {
    onMeasurementsReady(measurements);
  }

  // Don't render anything for non-roofing trades
  if (!isRoofing) {
    return null;
  }

  // Status display helpers
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      case 'queued':
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-slate-200 bg-slate-50';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'creating':
      case 'queued':
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Ruler className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'creating':
        return 'Creating order...';
      case 'queued':
        return 'Order submitted - waiting for processing';
      case 'processing':
        return 'EagleView is measuring the roof...';
      case 'completed':
        return 'Measurements ready!';
      case 'failed':
        return errorMessage || 'Failed to get measurements';
      case 'not_available':
        return 'EagleView measurements not available';
      default:
        return 'Get accurate roof measurements from EagleView';
    }
  };

  return (
    <Card className={cn("transition-colors", getStatusColor(), className)} data-testid="eagleview-measurements-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Home className="w-4 h-4" />
          Roof Measurements
          {status === 'completed' && (
            <span className="ml-auto text-xs font-normal text-green-700 bg-green-100 px-2 py-0.5 rounded">
              Ready
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status message */}
        <div className="flex items-start gap-3">
          {getStatusIcon()}
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">{getStatusText()}</p>
            {status === 'idle' && (
              <p className="text-xs text-slate-500 mt-1">
                EagleView provides professional aerial measurements for accurate roofing proposals
              </p>
            )}
          </div>
        </div>

        {/* Measurements summary (when completed) */}
        {status === 'completed' && measurements && (
          <MeasurementsSummary measurements={measurements} />
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {status === 'idle' && (
            <Button
              onClick={createOrder}
              disabled={!canCreateOrder || isLoading}
              className="flex-1 min-w-[200px]"
              data-testid="button-get-roof-measurements"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Ruler className="w-4 h-4 mr-2" />
                  Get Roof Measurements
                </>
              )}
            </Button>
          )}

          {status === 'failed' && (
            <>
              <Button
                onClick={createOrder}
                disabled={!canCreateOrder || isLoading}
                variant="default"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={refresh}
                disabled={isLoading}
                variant="outline"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </>
          )}

          {['queued', 'processing'].includes(status) && (
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>This may take a few minutes</span>
            </div>
          )}

          {status === 'completed' && reportUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(reportUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Full Report
            </Button>
          )}
        </div>

        {/* Address being measured */}
        {status !== 'idle' && status !== 'not_available' && (
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Info className="w-3 h-3" />
            {address}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Measurements Summary Component
 * Displays key roof measurements in a clean grid
 */
function MeasurementsSummary({ measurements }: { measurements: RoofingMeasurements }) {
  return (
    <div className="bg-white rounded-lg border border-green-200 p-4" data-testid="measurements-summary">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <MeasurementItem
          label="Total Area"
          value={measurements.roofAreaSqFt.toLocaleString()}
          unit="sq ft"
        />
        <MeasurementItem
          label="Squares"
          value={measurements.squares}
          unit="sq"
        />
        {measurements.predominantPitch && (
          <MeasurementItem
            label="Pitch"
            value={measurements.predominantPitch}
          />
        )}
        <MeasurementItem
          label="Ridges"
          value={measurements.ridgesFt}
          unit="ft"
        />
        <MeasurementItem
          label="Hips"
          value={measurements.hipsFt}
          unit="ft"
        />
        <MeasurementItem
          label="Valleys"
          value={measurements.valleysFt}
          unit="ft"
        />
        <MeasurementItem
          label="Eaves"
          value={measurements.eavesFt}
          unit="ft"
        />
        <MeasurementItem
          label="Rakes"
          value={measurements.rakesFt}
          unit="ft"
        />
        {measurements.facets && (
          <MeasurementItem
            label="Facets"
            value={measurements.facets}
          />
        )}
      </div>
      
      {/* Pitch breakdown */}
      {measurements.pitchBreakdown && measurements.pitchBreakdown.length > 1 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-600 mb-2">Pitch Breakdown</p>
          <div className="flex flex-wrap gap-2">
            {measurements.pitchBreakdown.map((p, i) => (
              <span key={i} className="text-xs bg-slate-100 px-2 py-1 rounded">
                {p.pitch}: {p.areaSqFt.toLocaleString()} sq ft
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MeasurementItem({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <span className="text-xs font-normal text-slate-500 ml-1">{unit}</span>}
      </p>
    </div>
  );
}
