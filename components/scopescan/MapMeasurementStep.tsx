"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Undo2, Trash2, CheckCircle, Ruler, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_LOADER_ID } from "@/lib/google-maps-config";

// ============ Types ============

export type MeasurementTrade = "fence" | "driveway";

export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface FenceMeasurements {
  fenceLinePoints: LatLngPoint[];
  fenceLF: number; // linear feet
}

export interface DrivewayMeasurements {
  drivewayPolygonPoints: LatLngPoint[];
  drivewaySF: number; // square feet
  drivewayPerimeterLF: number; // linear feet
  drivewayThicknessIn: number; // 4, 5, or 6 inches
  drivewayCY: number; // cubic yards with waste factor
}

export type Measurements = FenceMeasurements | DrivewayMeasurements;

export interface MapMeasurementStepProps {
  trade: MeasurementTrade;
  initialAddressLatLng: LatLngPoint;
  onMeasurementsChange: (measurements: Measurements | null) => void;
  onFinish?: (measurements: Measurements) => void;
}

// ============ Constants ============

const METERS_TO_FEET = 3.28084;
const SQ_METERS_TO_SQ_FEET = 10.7639;
const WASTE_FACTOR = 1.10; // 10% waste

const STORAGE_KEYS = {
  fence: "scopescan_draft_fence",
  driveway: "scopescan_draft_driveway",
} as const;

const DEFAULT_THICKNESS = 4; // inches

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

// ============ Utility Functions ============

/**
 * Compute length in feet from a path using Google's geometry library
 */
function computePathLengthFeet(path: google.maps.LatLng[]): number {
  if (path.length < 2) return 0;
  const lengthMeters = google.maps.geometry.spherical.computeLength(path);
  return lengthMeters * METERS_TO_FEET;
}

/**
 * Compute polygon area in sq ft using Google's geometry library
 */
function computePolygonAreaSqFt(path: google.maps.LatLng[]): number {
  if (path.length < 3) return 0;
  const areaM2 = google.maps.geometry.spherical.computeArea(path);
  return areaM2 * SQ_METERS_TO_SQ_FEET;
}

/**
 * Compute polygon perimeter in feet
 */
function computePolygonPerimeterFeet(path: google.maps.LatLng[]): number {
  if (path.length < 3) return 0;
  // Close the polygon by adding first point at end
  const closedPath = [...path, path[0]];
  return computePathLengthFeet(closedPath);
}

/**
 * Compute cubic yards for concrete given area and thickness
 */
function computeCubicYards(
  sqFt: number,
  thicknessInches: number
): number {
  const thicknessFeet = thicknessInches / 12;
  const cubicFeet = sqFt * thicknessFeet;
  const cubicYards = cubicFeet / 27;
  const withWaste = cubicYards * WASTE_FACTOR;
  return Math.round(withWaste * 10) / 10; // Round to 0.1
}

/**
 * Convert LatLngPoint array to google.maps.LatLng array
 */
function toGoogleLatLngArray(points: LatLngPoint[]): google.maps.LatLng[] {
  return points.map((p) => new google.maps.LatLng(p.lat, p.lng));
}

/**
 * Convert google.maps.LatLng or MVCArray to LatLngPoint array
 */
function toLatLngPointArray(
  path: google.maps.MVCArray<google.maps.LatLng> | google.maps.LatLng[]
): LatLngPoint[] {
  const arr = Array.isArray(path) ? path : path.getArray();
  return arr.map((p) => ({ lat: p.lat(), lng: p.lng() }));
}

/**
 * Fallback planar distance calculation for tests without Google Maps loaded
 */
function planarDistanceMeters(p1: LatLngPoint, p2: LatLngPoint): number {
  const R = 6371000; // Earth radius in meters
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;
  const dLat = lat2 - lat1;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Fallback planar polygon area using Shoelace formula
 */
function planarPolygonAreaM2(points: LatLngPoint[]): number {
  if (points.length < 3) return 0;
  // Convert to approximate meters using center point
  const centerLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos((centerLat * Math.PI) / 180);
  
  const coords = points.map((p) => ({
    x: p.lng * mPerDegLng,
    y: p.lat * mPerDegLat,
  }));
  
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    area += coords[i].x * coords[j].y;
    area -= coords[j].x * coords[i].y;
  }
  return Math.abs(area / 2);
}

/**
 * Compute fence measurements from points (with fallback for tests)
 */
export function computeFenceMeasurements(points: LatLngPoint[]): FenceMeasurements {
  let lengthFeet = 0;
  
  if (typeof google !== "undefined" && google.maps?.geometry?.spherical) {
    const path = toGoogleLatLngArray(points);
    lengthFeet = computePathLengthFeet(path);
  } else {
    // Fallback for tests
    for (let i = 0; i < points.length - 1; i++) {
      lengthFeet += planarDistanceMeters(points[i], points[i + 1]) * METERS_TO_FEET;
    }
  }
  
  return {
    fenceLinePoints: points,
    fenceLF: Math.round(lengthFeet * 10) / 10,
  };
}

/**
 * Compute driveway measurements from points (with fallback for tests)
 */
export function computeDrivewayMeasurements(
  points: LatLngPoint[],
  thicknessIn: number = DEFAULT_THICKNESS
): DrivewayMeasurements {
  let areaSqFt = 0;
  let perimeterFeet = 0;
  
  if (typeof google !== "undefined" && google.maps?.geometry?.spherical) {
    const path = toGoogleLatLngArray(points);
    areaSqFt = computePolygonAreaSqFt(path);
    perimeterFeet = computePolygonPerimeterFeet(path);
  } else {
    // Fallback for tests
    areaSqFt = planarPolygonAreaM2(points) * SQ_METERS_TO_SQ_FEET;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      perimeterFeet += planarDistanceMeters(points[i], points[j]) * METERS_TO_FEET;
    }
  }
  
  const cy = computeCubicYards(areaSqFt, thicknessIn);
  
  return {
    drivewayPolygonPoints: points,
    drivewaySF: Math.round(areaSqFt * 10) / 10,
    drivewayPerimeterLF: Math.round(perimeterFeet * 10) / 10,
    drivewayThicknessIn: thicknessIn,
    drivewayCY: cy,
  };
}

// ============ Local Storage ============

function loadDraftFromStorage(trade: MeasurementTrade): Measurements | null {
  if (typeof window === "undefined") return null;
  
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[trade]);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveDraftToStorage(trade: MeasurementTrade, measurements: Measurements | null): void {
  if (typeof window === "undefined") return;
  
  try {
    if (measurements) {
      localStorage.setItem(STORAGE_KEYS[trade], JSON.stringify(measurements));
    } else {
      localStorage.removeItem(STORAGE_KEYS[trade]);
    }
  } catch (e) {
    console.error("Failed to save draft:", e);
  }
}

function clearDraftFromStorage(trade: MeasurementTrade): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(STORAGE_KEYS[trade]);
  } catch {
    // Ignore
  }
}

// ============ Test Hooks ============

// Expose test hooks for Playwright testing
if (typeof window !== "undefined") {
  // These will be set by the component
  (window as Window & {
    __setFenceLinePoints?: (points: LatLngPoint[]) => void;
    __setDrivewayPolygonPoints?: (points: LatLngPoint[]) => void;
  }).__setFenceLinePoints = undefined;
  (window as Window & {
    __setDrivewayPolygonPoints?: (points: LatLngPoint[]) => void;
  }).__setDrivewayPolygonPoints = undefined;
}

// ============ Component ============

export default function MapMeasurementStep({
  trade,
  initialAddressLatLng,
  onMeasurementsChange,
  onFinish,
}: MapMeasurementStepProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);

  // State
  const [measurements, setMeasurements] = useState<Measurements | null>(null);
  const [thickness, setThickness] = useState<number>(DEFAULT_THICKNESS);
  const [isInitialized, setIsInitialized] = useState(false);

  // Determine if shape is valid
  const isFence = trade === "fence";
  const hasValidShape = isFence
    ? measurements && "fenceLinePoints" in measurements && measurements.fenceLinePoints.length >= 2
    : measurements && "drivewayPolygonPoints" in measurements && measurements.drivewayPolygonPoints.length >= 3;

  // Update measurements and save to storage
  const updateMeasurements = useCallback(
    (newMeasurements: Measurements | null) => {
      setMeasurements(newMeasurements);
      saveDraftToStorage(trade, newMeasurements);
      onMeasurementsChange(newMeasurements);
    },
    [trade, onMeasurementsChange]
  );

  // Handle fence polyline updates
  const updateFenceFromPolyline = useCallback(() => {
    if (!polylineRef.current) return;
    const path = polylineRef.current.getPath();
    const points = toLatLngPointArray(path);
    if (points.length >= 2) {
      const m = computeFenceMeasurements(points);
      updateMeasurements(m);
    } else {
      updateMeasurements(null);
    }
  }, [updateMeasurements]);

  // Handle driveway polygon updates
  const updateDrivewayFromPolygon = useCallback(() => {
    if (!polygonRef.current) return;
    const path = polygonRef.current.getPath();
    const points = toLatLngPointArray(path);
    if (points.length >= 3) {
      const m = computeDrivewayMeasurements(points, thickness);
      updateMeasurements(m);
    } else {
      updateMeasurements(null);
    }
  }, [updateMeasurements, thickness]);

  // Handle undo - remove last point
  const handleUndo = useCallback(() => {
    if (isFence && polylineRef.current) {
      const path = polylineRef.current.getPath();
      if (path.getLength() > 0) {
        path.pop();
        updateFenceFromPolyline();
      }
    } else if (!isFence && polygonRef.current) {
      const path = polygonRef.current.getPath();
      if (path.getLength() > 0) {
        path.pop();
        updateDrivewayFromPolygon();
      }
    }
  }, [isFence, updateFenceFromPolyline, updateDrivewayFromPolygon]);

  // Handle clear - remove entire shape
  const handleClear = useCallback(() => {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
    updateMeasurements(null);
    clearDraftFromStorage(trade);
    
    // Re-enable drawing manager
    if (drawingManagerRef.current && mapRef.current) {
      drawingManagerRef.current.setOptions({
        drawingMode: isFence
          ? google.maps.drawing.OverlayType.POLYLINE
          : google.maps.drawing.OverlayType.POLYGON,
      });
    }
  }, [trade, isFence, updateMeasurements]);

  // Handle finish
  const handleFinish = useCallback(() => {
    if (measurements && hasValidShape && onFinish) {
      onFinish(measurements);
    }
  }, [measurements, hasValidShape, onFinish]);

  // Handle thickness change for driveway
  const handleThicknessChange = useCallback(
    (value: string) => {
      const newThickness = parseInt(value, 10);
      setThickness(newThickness);
      
      if (measurements && "drivewayPolygonPoints" in measurements) {
        const m = computeDrivewayMeasurements(
          measurements.drivewayPolygonPoints,
          newThickness
        );
        updateMeasurements(m);
      }
    },
    [measurements, updateMeasurements]
  );

  // Create polyline from saved points
  const createPolylineFromPoints = useCallback(
    (points: LatLngPoint[], map: google.maps.Map) => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
      
      const polyline = new google.maps.Polyline({
        path: points.map((p) => ({ lat: p.lat, lng: p.lng })),
        strokeColor: "#FF6B00",
        strokeOpacity: 1,
        strokeWeight: 4,
        editable: true,
        map,
      });
      
      polylineRef.current = polyline;
      
      // Add path change listeners
      const path = polyline.getPath();
      google.maps.event.addListener(path, "set_at", updateFenceFromPolyline);
      google.maps.event.addListener(path, "insert_at", updateFenceFromPolyline);
      google.maps.event.addListener(path, "remove_at", updateFenceFromPolyline);
      
      // Disable drawing manager
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setDrawingMode(null);
      }
      
      return polyline;
    },
    [updateFenceFromPolyline]
  );

  // Create polygon from saved points
  const createPolygonFromPoints = useCallback(
    (points: LatLngPoint[], map: google.maps.Map) => {
      if (polygonRef.current) {
        polygonRef.current.setMap(null);
      }
      
      const polygon = new google.maps.Polygon({
        paths: points.map((p) => ({ lat: p.lat, lng: p.lng })),
        strokeColor: "#FF6B00",
        strokeOpacity: 1,
        strokeWeight: 3,
        fillColor: "#FF6B00",
        fillOpacity: 0.2,
        editable: true,
        map,
      });
      
      polygonRef.current = polygon;
      
      // Add path change listeners
      const path = polygon.getPath();
      google.maps.event.addListener(path, "set_at", updateDrivewayFromPolygon);
      google.maps.event.addListener(path, "insert_at", updateDrivewayFromPolygon);
      google.maps.event.addListener(path, "remove_at", updateDrivewayFromPolygon);
      
      // Disable drawing manager
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setDrawingMode(null);
      }
      
      return polygon;
    },
    [updateDrivewayFromPolygon]
  );

  // Set up test hooks
  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;
    
    const win = window as Window & {
      __setFenceLinePoints?: (points: LatLngPoint[]) => void;
      __setDrivewayPolygonPoints?: (points: LatLngPoint[]) => void;
    };
    
    if (isFence) {
      win.__setFenceLinePoints = (points: LatLngPoint[]) => {
        if (mapRef.current) {
          createPolylineFromPoints(points, mapRef.current);
        }
        const m = computeFenceMeasurements(points);
        updateMeasurements(m);
      };
    } else {
      win.__setDrivewayPolygonPoints = (points: LatLngPoint[]) => {
        if (mapRef.current) {
          createPolygonFromPoints(points, mapRef.current);
        }
        const m = computeDrivewayMeasurements(points, thickness);
        updateMeasurements(m);
      };
    }
    
    return () => {
      if (isFence) {
        win.__setFenceLinePoints = undefined;
      } else {
        win.__setDrivewayPolygonPoints = undefined;
      }
    };
  }, [isFence, createPolylineFromPoints, createPolygonFromPoints, updateMeasurements, thickness]);

  // Initialize map and drawing manager
  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;

      // Set up drawing manager
      const drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: isFence
          ? google.maps.drawing.OverlayType.POLYLINE
          : google.maps.drawing.OverlayType.POLYGON,
        drawingControl: false, // We use custom buttons
        polylineOptions: {
          strokeColor: "#FF6B00",
          strokeOpacity: 1,
          strokeWeight: 4,
          editable: true,
        },
        polygonOptions: {
          strokeColor: "#FF6B00",
          strokeOpacity: 1,
          strokeWeight: 3,
          fillColor: "#FF6B00",
          fillOpacity: 0.2,
          editable: true,
        },
      });

      drawingManager.setMap(map);
      drawingManagerRef.current = drawingManager;

      // Handle polyline complete (fence)
      google.maps.event.addListener(
        drawingManager,
        "polylinecomplete",
        (polyline: google.maps.Polyline) => {
          // Remove any existing polyline
          if (polylineRef.current) {
            polylineRef.current.setMap(null);
          }
          polylineRef.current = polyline;

          // Add path change listeners
          const path = polyline.getPath();
          google.maps.event.addListener(path, "set_at", updateFenceFromPolyline);
          google.maps.event.addListener(path, "insert_at", updateFenceFromPolyline);
          google.maps.event.addListener(path, "remove_at", updateFenceFromPolyline);

          updateFenceFromPolyline();

          // Disable drawing mode after completion
          drawingManager.setDrawingMode(null);
        }
      );

      // Handle polygon complete (driveway)
      google.maps.event.addListener(
        drawingManager,
        "polygoncomplete",
        (polygon: google.maps.Polygon) => {
          // Remove any existing polygon
          if (polygonRef.current) {
            polygonRef.current.setMap(null);
          }
          polygonRef.current = polygon;

          // Add path change listeners
          const path = polygon.getPath();
          google.maps.event.addListener(path, "set_at", updateDrivewayFromPolygon);
          google.maps.event.addListener(path, "insert_at", updateDrivewayFromPolygon);
          google.maps.event.addListener(path, "remove_at", updateDrivewayFromPolygon);

          updateDrivewayFromPolygon();

          // Disable drawing mode after completion
          drawingManager.setDrawingMode(null);
        }
      );

      // Load draft from storage
      const draft = loadDraftFromStorage(trade);
      if (draft) {
        if (isFence && "fenceLinePoints" in draft && draft.fenceLinePoints.length >= 2) {
          createPolylineFromPoints(draft.fenceLinePoints, map);
          setMeasurements(draft);
          onMeasurementsChange(draft);
        } else if (!isFence && "drivewayPolygonPoints" in draft && draft.drivewayPolygonPoints.length >= 3) {
          createPolygonFromPoints(draft.drivewayPolygonPoints, map);
          setThickness(draft.drivewayThicknessIn || DEFAULT_THICKNESS);
          setMeasurements(draft);
          onMeasurementsChange(draft);
        }
      }

      setIsInitialized(true);
    },
    [
      isFence,
      trade,
      updateFenceFromPolyline,
      updateDrivewayFromPolygon,
      createPolylineFromPoints,
      createPolygonFromPoints,
      onMeasurementsChange,
    ]
  );

  // Loading state
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        Failed to load Google Maps. Please refresh and try again.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className="relative flex flex-col h-full min-h-[500px]"
      data-testid="map-measurement"
    >
      {/* Instructions */}
      <div className="p-3 bg-slate-50 border-b">
        <div className="text-sm text-slate-700">
          {isFence ? (
            <>
              <strong>Draw your fence line:</strong> Tap points on the map to create
              a polyline. Double-tap or click Finish when done.
            </>
          ) : (
            <>
              <strong>Draw your driveway outline:</strong> Tap points on the map to
              create a polygon. Close the shape or click Finish when done.
            </>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={initialAddressLatLng}
          zoom={19}
          mapTypeId="satellite"
          onLoad={onMapLoad}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            scrollwheel: true,
            gestureHandling: "greedy",
            tilt: 0,
          }}
        />
      </div>

      {/* Measurements Display */}
      {measurements && (
        <Card className="m-3 border-primary/30 bg-primary/5">
          <CardContent className="p-3 space-y-2">
            {isFence && "fenceLF" in measurements && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Ruler className="w-4 h-4 text-primary" />
                  Total Fence Length
                </div>
                <span
                  className="text-lg font-bold text-primary"
                  data-testid="measurement-fence-lf"
                >
                  {measurements.fenceLF.toLocaleString()} ft
                </span>
              </div>
            )}

            {!isFence && "drivewaySF" in measurements && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Square className="w-4 h-4 text-primary" />
                    Driveway Area
                  </div>
                  <span
                    className="text-lg font-bold text-primary"
                    data-testid="measurement-driveway-sf"
                  >
                    {measurements.drivewaySF.toLocaleString()} sq ft
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Perimeter</span>
                  <span data-testid="measurement-driveway-perimeter">
                    {measurements.drivewayPerimeterLF.toLocaleString()} ft
                  </span>
                </div>

                {/* Thickness Selector */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="thickness-select" className="text-sm">
                      Concrete Thickness
                    </Label>
                    <Select
                      value={String(thickness)}
                      onValueChange={handleThicknessChange}
                    >
                      <SelectTrigger
                        id="thickness-select"
                        className="w-24"
                        data-testid="thickness-select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4">4&quot;</SelectItem>
                        <SelectItem value="5">5&quot;</SelectItem>
                        <SelectItem value="6">6&quot;</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Cubic Yards */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">
                    Estimated Concrete
                    <span className="text-xs text-muted-foreground ml-1">
                      (includes 10% waste)
                    </span>
                  </span>
                  <span
                    className="text-lg font-bold text-primary"
                    data-testid="measurement-driveway-cy"
                  >
                    {measurements.drivewayCY} CY
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fixed Bottom Action Bar */}
      <div className="sticky bottom-0 left-0 right-0 p-3 bg-white border-t shadow-lg safe-area-inset-bottom">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={handleUndo}
            disabled={!hasValidShape}
            className="flex-1"
          >
            <Undo2 className="w-4 h-4 mr-2" />
            Undo
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleClear}
            disabled={!measurements}
            className="flex-1"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
          <Button
            size="lg"
            onClick={handleFinish}
            disabled={!hasValidShape}
            className={cn(
              "flex-1",
              hasValidShape && "bg-primary hover:bg-primary/90"
            )}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Finish
          </Button>
        </div>
      </div>
    </div>
  );
}
