"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useJsApiLoader, GoogleMap, DrawingManager } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mobileApiFetch, newIdempotencyKey, type DraftStatus, type MobileJob } from "@/app/m/lib/api";
import { ArrowLeft, Loader2, MapPin, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type LatLng = { lat: number; lng: number };

type DrivewayRemovalType = "none" | "asphalt" | "concrete";
type DrivewayBaseCondition = "good" | "unknown" | "poor";
type DrivewayAccessType = "easy" | "tight" | "no-truck-access";
type DrivewayFinishType = "broom" | "exposed" | "stamped";
type DrivewayPackage = "good" | "better" | "best";
type DrivewayReinforcement = "fiber" | "wire-mesh" | "#3-rebar" | "#4-rebar" | "none";

const GOOGLE_MAPS_LIBRARIES: ("drawing" | "geometry")[] = ["drawing", "geometry"];

const DEFAULT_CENTER: LatLng = { lat: 30.2672, lng: -97.7431 }; // Austin fallback

// Conversion factor: 1 square meter = 10.7639104167 square feet
const SQ_METERS_TO_SQ_FEET = 10.7639104167;

function metersToFeet(m: number) {
  return m * 3.28084;
}

function meters2ToSqft(m2: number) {
  return m2 * SQ_METERS_TO_SQ_FEET;
}

function haversineMeters(a: LatLng, b: LatLng) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function polylineLengthMeters(points: LatLng[]) {
  let m = 0;
  for (let i = 1; i < points.length; i++) {
    m += haversineMeters(points[i - 1], points[i]);
  }
  return m;
}

function polygonAreaMeters2(points: LatLng[]) {
  // Small-area approximation: project to meters with local scale, then shoelace.
  if (points.length < 3) return 0;
  const lat0 = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const mPerDegLat = 111320;
  const mPerDegLng = Math.cos((lat0 * Math.PI) / 180) * 111320;
  const xy = points.map((p) => ({
    x: p.lng * mPerDegLng,
    y: p.lat * mPerDegLat,
  }));
  let sum = 0;
  for (let i = 0; i < xy.length; i++) {
    const a = xy[i];
    const b = xy[(i + 1) % xy.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function formatNumber(n: number | null | undefined, decimals = 0) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

function computeConcreteCY(totalSF: number, thicknessIn: number) {
  // (TotalSF * (thicknessIn/12)) / 27 * 1.10 waste, rounded to 0.1
  const cy = ((totalSF * (thicknessIn / 12)) / 27) * 1.1;
  return round1(cy);
}

const DRIVEWAY_PACKAGE_THICKNESS_BETTER_MIN_IN = 5;

const DRIVEWAY_PACKAGE_PREMIUM_FINISH_TYPES: DrivewayFinishType[] = ["stamped", "exposed"];

const DRIVEWAY_PACKAGE_REINFORCEMENT_BETTER: DrivewayReinforcement[] = [
  "wire-mesh",
  "#3-rebar",
  "#4-rebar",
];

function normalizePackageFromSelections(params: {
  finishType: DrivewayFinishType;
  thicknessIn: number;
  reinforcement: DrivewayReinforcement;
}): DrivewayPackage {
  if (DRIVEWAY_PACKAGE_PREMIUM_FINISH_TYPES.includes(params.finishType)) {
    return "best";
  }

  if (
    params.thicknessIn >= DRIVEWAY_PACKAGE_THICKNESS_BETTER_MIN_IN ||
    DRIVEWAY_PACKAGE_REINFORCEMENT_BETTER.includes(params.reinforcement)
  ) {
    return "better";
  }
  return "good";
}

export default function DrivewayMeasurePage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [demoMode, setDemoMode] = useState(jobId === "demo");
  const [loadingJob, setLoadingJob] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<MobileJob | null>(null);

  // Driveway + Walkway selections
  const [includeDrivewaySlab, setIncludeDrivewaySlab] = useState(true);
  const [includeWalkway, setIncludeWalkway] = useState(false);

  // Shapes
  const [drivewayPolygonPoints, setDrivewayPolygonPoints] = useState<LatLng[]>([]);
  const [walkwayLinePoints, setWalkwayLinePoints] = useState<LatLng[]>([]);

  // Walkway width
  const [walkwayWidthPreset, setWalkwayWidthPreset] = useState<3 | 4 | 5 | "custom">(4);
  const [walkwayWidthCustom, setWalkwayWidthCustom] = useState<number>(4);

  // Toggles
  const [removalType, setRemovalType] = useState<DrivewayRemovalType>("none");
  const [baseCondition, setBaseCondition] = useState<DrivewayBaseCondition>("unknown");
  const [accessType, setAccessType] = useState<DrivewayAccessType>("easy");
  const [finishType, setFinishType] = useState<DrivewayFinishType>("broom");

  // Derived selectors
  const [thicknessIn, setThicknessIn] = useState<4 | 5 | 6>(4);
  const [reinforcement, setReinforcement] = useState<DrivewayReinforcement>("none");

  // Packages
  const [selectedPackage, setSelectedPackage] = useState<DrivewayPackage>("better");

  const mapRef = useRef<google.maps.Map | null>(null);
  const drivewayOverlayRef = useRef<google.maps.Polygon | null>(null);
  const walkwayOverlayRef = useRef<google.maps.Polyline | null>(null);

  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-maps-driveway-measure",
    googleMapsApiKey: mapsKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const walkwayWidthFt = useMemo(() => {
    return walkwayWidthPreset === "custom" ? walkwayWidthCustom : walkwayWidthPreset;
  }, [walkwayWidthPreset, walkwayWidthCustom]);

  const drivewaySF = useMemo(() => {
    if (!includeDrivewaySlab) return 0;
    if (drivewayPolygonPoints.length < 3) return 0;
    const m2 = isLoaded && google?.maps?.geometry?.spherical
      ? google.maps.geometry.spherical.computeArea(
          drivewayPolygonPoints.map((p) => new google.maps.LatLng(p.lat, p.lng))
        )
      : polygonAreaMeters2(drivewayPolygonPoints);
    return meters2ToSqft(m2);
  }, [drivewayPolygonPoints, includeDrivewaySlab, isLoaded]);

  const drivewayPerimeterLF = useMemo(() => {
    if (!includeDrivewaySlab) return 0;
    if (drivewayPolygonPoints.length < 3) return 0;
    const m = isLoaded && google?.maps?.geometry?.spherical
      ? (() => {
          const path = drivewayPolygonPoints.map((p) => new google.maps.LatLng(p.lat, p.lng));
          const closed = [...path, path[0]];
          return google.maps.geometry.spherical.computeLength(closed);
        })()
      : (() => {
          const closed = [...drivewayPolygonPoints, drivewayPolygonPoints[0]];
          return polylineLengthMeters(closed);
        })();
    return metersToFeet(m);
  }, [drivewayPolygonPoints, includeDrivewaySlab, isLoaded]);

  const walkwayLF = useMemo(() => {
    if (!includeWalkway) return 0;
    if (walkwayLinePoints.length < 2) return 0;
    const m = isLoaded && google?.maps?.geometry?.spherical
      ? google.maps.geometry.spherical.computeLength(
          walkwayLinePoints.map((p) => new google.maps.LatLng(p.lat, p.lng))
        )
      : polylineLengthMeters(walkwayLinePoints);
    return metersToFeet(m);
  }, [walkwayLinePoints, includeWalkway, isLoaded]);

  const walkwaySF = useMemo(() => {
    if (!includeWalkway) return 0;
    if (walkwayLF <= 0) return 0;
    const width = Math.max(0, walkwayWidthFt);
    return walkwayLF * width;
  }, [includeWalkway, walkwayLF, walkwayWidthFt]);

  const totalSF = useMemo(() => {
    return Math.max(0, drivewaySF) + Math.max(0, walkwaySF);
  }, [drivewaySF, walkwaySF]);

  const concreteCY = useMemo(() => {
    if (totalSF <= 0) return 0;
    return computeConcreteCY(totalSF, thicknessIn);
  }, [totalSF, thicknessIn]);

  // Always keep package selection aligned with key toggles (fast UX).
  useEffect(() => {
    setSelectedPackage(
      normalizePackageFromSelections({ finishType, thicknessIn, reinforcement })
    );
  }, [finishType, thicknessIn, reinforcement]);

  const drivewayScopeSelection = useMemo(() => {
    return {
      drivewaySlabSelected: includeDrivewaySlab,
      walkwaySelected: includeWalkway,

      drivewayPolygonPoints,
      drivewaySF,
      drivewayPerimeterLF,

      walkwayLinePoints,
      walkwayLF,
      walkwayWidthFt,
      walkwaySF,

      totalSF,
      thicknessIn,
      concreteCY,

      removalType,
      baseCondition,
      accessType,
      finishType,

      reinforcement,

      selectedPackage,
    };
  }, [
    includeDrivewaySlab,
    includeWalkway,
    drivewayPolygonPoints,
    drivewaySF,
    drivewayPerimeterLF,
    walkwayLinePoints,
    walkwayLF,
    walkwayWidthFt,
    walkwaySF,
    totalSF,
    thicknessIn,
    concreteCY,
    removalType,
    baseCondition,
    accessType,
    finishType,
    reinforcement,
    selectedPackage,
  ]);

  const saveToJob = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      if (demoMode) {
        localStorage.setItem(
          "scopegen-demo-driveway-scopeSelection",
          JSON.stringify({ driveway: drivewayScopeSelection })
        );
        return;
      }
      await mobileApiFetch(`/api/mobile/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Idempotency-Key": newIdempotencyKey() },
        body: JSON.stringify({
          scopeSelection: {
            ...(job?.scopeSelection ?? {}),
            driveway: drivewayScopeSelection,
          },
        }),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [demoMode, drivewayScopeSelection, job?.scopeSelection, jobId]);

  // Detect demo mode via query param (keeps Playwright runnable without DB).
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("demo") === "1") setDemoMode(true);
    } catch {
      // ignore
    }
  }, []);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoadingJob(true);
      try {
        if (demoMode) {
          const raw = localStorage.getItem("scopegen-demo-driveway-scopeSelection");
          const parsed = raw ? JSON.parse(raw) : null;
          setJob({ jobId: 0, tradeId: "concrete", tradeName: "Driveway", jobTypeId: "driveway", jobTypeName: "Driveway", scopeSelection: parsed ?? {} });
          const driveway = parsed?.driveway as Partial<typeof drivewayScopeSelection> | undefined;
          if (driveway) {
            setIncludeDrivewaySlab(driveway.drivewaySlabSelected ?? true);
            setIncludeWalkway(driveway.walkwaySelected ?? false);
            setDrivewayPolygonPoints(Array.isArray(driveway.drivewayPolygonPoints) ? (driveway.drivewayPolygonPoints as LatLng[]) : []);
            setWalkwayLinePoints(Array.isArray(driveway.walkwayLinePoints) ? (driveway.walkwayLinePoints as LatLng[]) : []);
            const width = typeof driveway.walkwayWidthFt === "number" ? driveway.walkwayWidthFt : 4;
            if (width === 3 || width === 4 || width === 5) {
              setWalkwayWidthPreset(width);
              setWalkwayWidthCustom(width);
            } else {
              setWalkwayWidthPreset("custom");
              setWalkwayWidthCustom(width);
            }
            setThicknessIn((driveway.thicknessIn as 4 | 5 | 6) ?? 4);
            setRemovalType((driveway.removalType as DrivewayRemovalType) ?? "none");
            setBaseCondition((driveway.baseCondition as DrivewayBaseCondition) ?? "unknown");
            setAccessType((driveway.accessType as DrivewayAccessType) ?? "easy");
            setFinishType((driveway.finishType as DrivewayFinishType) ?? "broom");
            setReinforcement((driveway.reinforcement as DrivewayReinforcement) ?? "none");
            setSelectedPackage((driveway.selectedPackage as DrivewayPackage) ?? "better");
          }
          return;
        }

        const j = await mobileApiFetch<MobileJob>(`/api/mobile/jobs/${jobId}`, { method: "GET" });
        setJob(j);

        const driveway = (j.scopeSelection as any)?.driveway as Partial<typeof drivewayScopeSelection> | undefined;
        if (driveway) {
          setIncludeDrivewaySlab(driveway.drivewaySlabSelected ?? true);
          setIncludeWalkway(driveway.walkwaySelected ?? false);

          setDrivewayPolygonPoints(Array.isArray(driveway.drivewayPolygonPoints) ? (driveway.drivewayPolygonPoints as LatLng[]) : []);
          setWalkwayLinePoints(Array.isArray(driveway.walkwayLinePoints) ? (driveway.walkwayLinePoints as LatLng[]) : []);

          const width = typeof driveway.walkwayWidthFt === "number" ? driveway.walkwayWidthFt : 4;
          if (width === 3 || width === 4 || width === 5) {
            setWalkwayWidthPreset(width);
            setWalkwayWidthCustom(width);
          } else {
            setWalkwayWidthPreset("custom");
            setWalkwayWidthCustom(width);
          }

          setThicknessIn((driveway.thicknessIn as 4 | 5 | 6) ?? 4);
          setRemovalType((driveway.removalType as DrivewayRemovalType) ?? "none");
          setBaseCondition((driveway.baseCondition as DrivewayBaseCondition) ?? "unknown");
          setAccessType((driveway.accessType as DrivewayAccessType) ?? "easy");
          setFinishType((driveway.finishType as DrivewayFinishType) ?? "broom");
          setReinforcement((driveway.reinforcement as DrivewayReinforcement) ?? "none");
          setSelectedPackage((driveway.selectedPackage as DrivewayPackage) ?? "better");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load job");
      } finally {
        setLoadingJob(false);
      }
    };
    load();
  }, [demoMode, jobId]);

  // Test hooks (no map clicks required). Assign immediately so Playwright can call them
  // even before effects settle/hydration completes.
  if (typeof window !== "undefined") {
    (window as any).__setDrivewayPolygonPoints = (pts: LatLng[]) => {
      setIncludeDrivewaySlab(true);
      setDrivewayPolygonPoints(Array.isArray(pts) ? pts : []);
    };
    (window as any).__setWalkwayLinePoints = (pts: LatLng[]) => {
      setIncludeWalkway(true);
      setWalkwayLinePoints(Array.isArray(pts) ? pts : []);
    };
    (window as any).__getDrivewayScopeSelection = () => drivewayScopeSelection;
  }

  // Keep overlays in sync when points are set via hooks
  useEffect(() => {
    if (!isLoaded) return;
    if (!mapRef.current) return;

    // Driveway polygon
    if (drivewayOverlayRef.current) {
      drivewayOverlayRef.current.setMap(null);
      drivewayOverlayRef.current = null;
    }
    if (includeDrivewaySlab && drivewayPolygonPoints.length >= 3) {
      drivewayOverlayRef.current = new google.maps.Polygon({
        paths: drivewayPolygonPoints,
        strokeColor: "#f97316",
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: "#fb923c",
        fillOpacity: 0.25,
        clickable: false,
        editable: false,
      });
      drivewayOverlayRef.current.setMap(mapRef.current);
    }

    // Walkway polyline
    if (walkwayOverlayRef.current) {
      walkwayOverlayRef.current.setMap(null);
      walkwayOverlayRef.current = null;
    }
    if (includeWalkway && walkwayLinePoints.length >= 2) {
      walkwayOverlayRef.current = new google.maps.Polyline({
        path: walkwayLinePoints,
        strokeColor: "#2563eb",
        strokeOpacity: 0.9,
        strokeWeight: 3,
        clickable: false,
        editable: false,
      });
      walkwayOverlayRef.current.setMap(mapRef.current);
    }
  }, [drivewayPolygonPoints, includeDrivewaySlab, includeWalkway, isLoaded, walkwayLinePoints]);

  const handleGenerateProposal = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      await saveToJob();

      if (demoMode) {
        // Client-side payload for demo/test mode (no DB required).
        const buildSections = () => {
          const sections = [
            {
              title: "Measurements & quantities",
              items: [
                `Driveway area: ${formatNumber(round1(drivewaySF), 1)} SF`,
                `Walkway area: ${formatNumber(round1(walkwaySF), 1)} SF`,
                `Total area: ${formatNumber(round1(totalSF), 1)} SF`,
                `Thickness: ${thicknessIn}"`,
                `Estimated concrete: ${formatNumber(concreteCY, 1)} CY (includes 10% waste)`,
                `Forms perimeter (driveway): ${formatNumber(round1(drivewayPerimeterLF), 1)} LF`,
              ],
            },
            {
              title: "Drainage considerations",
              items: [
                "Verify slope away from structures.",
                "Confirm existing drainage paths and discharge points.",
                "Recommend control joints to reduce cracking and improve drainage performance.",
                "Suggested add-ons: Channel drain, Catch basin, Regrade, Downspout tie-in / extensions.",
                ...(baseCondition === "poor" ? ["NOTE: Base condition marked poor — additional base work may be required."] : []),
                ...(accessType === "no-truck-access" ? ["NOTE: No truck access — plan for alternative concrete placement."] : []),
              ],
            },
          ];
          return sections;
        };

        const mkLineItem = (pkg: "GOOD" | "BETTER" | "BEST") => {
          const sections = buildSections();
          if (pkg === "BEST") {
            sections.unshift({
              title: "Premium upgrades",
              items: ["Include sealing after cure (recommended for longevity and stain resistance)."],
            });
          }
          return {
            id: crypto.randomUUID(),
            tradeName: "Driveway",
            jobTypeName: "Driveway",
            scope: sections.flatMap((s) => [`${s.title}:`, ...s.items]),
            scopeSections: sections,
            priceLow: 0,
            priceHigh: 0,
          };
        };

        const demoPayload = {
          defaultPackage: selectedPackage.toUpperCase(),
          packages: {
            GOOD: { label: "Good", lineItems: [mkLineItem("GOOD")] },
            BETTER: { label: "Better", lineItems: [mkLineItem("BETTER")] },
            BEST: { label: "Best", lineItems: [mkLineItem("BEST")] },
          },
        };
        const encodedPayload = encodeURIComponent(JSON.stringify(demoPayload));
        router.push(`/m/preview/demo?payload=${encodedPayload}`);
        return;
      }

      await mobileApiFetch<{ status: string }>(`/api/mobile/jobs/${jobId}/draft`, {
        method: "POST",
        headers: { "Idempotency-Key": newIdempotencyKey() },
        body: JSON.stringify({
          selectedTierId: selectedPackage.toUpperCase(),
          scopeSelection: {
            selectedTierId: selectedPackage,
            answers: {
              // Small, explicit keys to make worker parsing deterministic
              driveway_removalType: removalType,
              driveway_baseCondition: baseCondition,
              driveway_accessType: accessType,
              driveway_finishType: finishType,
              driveway_reinforcement: reinforcement,
              driveway_selectedPackage: selectedPackage,
              driveway_thicknessIn: thicknessIn,
              driveway_drivewaySlabSelected: includeDrivewaySlab,
              driveway_walkwaySelected: includeWalkway,
              driveway_drivewayPerimeterLF: round1(drivewayPerimeterLF),
              driveway_drivewaySF: round1(drivewaySF),
              driveway_walkwayLF: round1(walkwayLF),
              driveway_walkwayWidthFt: walkwayWidthFt,
              driveway_walkwaySF: round1(walkwaySF),
              driveway_totalSF: round1(totalSF),
              driveway_concreteCY: concreteCY,
              // Persist shapes too (for backend persistence if needed)
              driveway_drivewayPolygonPoints: drivewayPolygonPoints,
              driveway_walkwayLinePoints: walkwayLinePoints,
            },
            measurements: {
              squareFeet: round1(totalSF),
              linearFeet: round1(drivewayPerimeterLF),
            },
            problemStatement: "Driveway scope generated from measurements.",
          },
        }),
      });

      // Poll until READY with exponential backoff
      // Strategy: Start with quick polls (500ms), gradually increase to max 5s
      // Total timeout: ~90 seconds (accommodates AI generation + potential retries)
      // Backoff schedule: 500ms → 1s → 2s → 3s → 5s (repeating 5s thereafter)
      const maxAttempts = 30;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Calculate delay with exponential backoff, capped at 5 seconds
        const delay = Math.min(500 * Math.pow(1.5, attempt), 5000);
        await new Promise((r) => setTimeout(r, delay));
        
        const draft = await mobileApiFetch<DraftStatus>(`/api/mobile/jobs/${jobId}/draft`, { method: "GET" });
        if (draft.status === "READY" && (draft as any).payload) {
          const encodedPayload = encodeURIComponent(JSON.stringify((draft as any).payload));
          router.push(`/m/preview/${jobId}?payload=${encodedPayload}`);
          return;
        }
        if (draft.status === "FAILED") {
          throw new Error("Scope generation failed. Please try again or contact support if the issue persists.");
        }
      }
      throw new Error("Scope generation is taking longer than expected. Please refresh the page and check if your scope was created, or try again in a few moments.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate proposal");
    } finally {
      setGenerating(false);
    }
  }, [
    demoMode,
    accessType,
    baseCondition,
    concreteCY,
    drivewayPerimeterLF,
    drivewayPolygonPoints,
    drivewaySF,
    finishType,
    includeDrivewaySlab,
    includeWalkway,
    jobId,
    removalType,
    reinforcement,
    router,
    saveToJob,
    selectedPackage,
    thicknessIn,
    totalSF,
    walkwayLF,
    walkwayLinePoints,
    walkwaySF,
    walkwayWidthFt,
  ]);

  const drainageNotes = useMemo(() => {
    const notes: string[] = [];
    if (baseCondition === "poor") notes.push("Base condition marked poor — additional base work may be required.");
    if (accessType === "no-truck-access") notes.push("No truck access — plan for alternative concrete placement (pump, buggy, or hand carry).");
    return notes;
  }, [accessType, baseCondition]);

  if (loadingJob) {
    return (
      <div
        className="p-4 flex items-center justify-center min-h-[50vh]"
        data-testid="driveway-measure-page"
      >
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (mapsKey && loadError) {
    return (
      <div className="p-4">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          Map failed to load. Please refresh and try again.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-28" data-testid="driveway-measure-page">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 -ml-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <MapPin className="w-3 h-3" />
          Driveway
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Include driveway/walkway */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Areas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={includeDrivewaySlab}
                onCheckedChange={(checked) => {
                  const next = Boolean(checked);
                  // Keep at least one selected.
                  setIncludeDrivewaySlab(next);
                  if (!next && !includeWalkway) setIncludeWalkway(true);
                }}
                data-testid="checkbox-include-driveway"
              />
              <span>Driveway slab</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={includeWalkway}
                onCheckedChange={(checked) => {
                  const next = Boolean(checked);
                  // Keep at least one selected.
                  setIncludeWalkway(next);
                  if (!next && !includeDrivewaySlab) setIncludeDrivewaySlab(true);
                }}
                data-testid="checkbox-include-walkway"
              />
              <span>Walkway / sidewalk</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Map + drawing */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Measurements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg overflow-hidden border border-slate-200">
            {mapsKey && isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: 280 }}
                center={DEFAULT_CENTER}
                zoom={18}
                onLoad={(map) => {
                  mapRef.current = map;
                }}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false,
                }}
              >
                <DrawingManager
                  options={{
                    drawingControl: true,
                    drawingControlOptions: {
                      position: google.maps.ControlPosition.TOP_CENTER,
                      drawingModes: [
                        ...(includeDrivewaySlab ? [google.maps.drawing.OverlayType.POLYGON] : []),
                        ...(includeWalkway ? [google.maps.drawing.OverlayType.POLYLINE] : []),
                      ],
                    },
                    polygonOptions: {
                      fillColor: "#fb923c",
                      fillOpacity: 0.25,
                      strokeColor: "#f97316",
                      strokeOpacity: 0.9,
                      strokeWeight: 2,
                      clickable: false,
                      editable: false,
                      zIndex: 1,
                    },
                    polylineOptions: {
                      strokeColor: "#2563eb",
                      strokeOpacity: 0.9,
                      strokeWeight: 3,
                      clickable: false,
                      editable: false,
                      zIndex: 2,
                    },
                  }}
                  onPolygonComplete={(poly) => {
                    const path = poly.getPath();
                    const pts: LatLng[] = [];
                    for (let i = 0; i < path.getLength(); i++) {
                      const p = path.getAt(i);
                      pts.push({ lat: p.lat(), lng: p.lng() });
                    }
                    setDrivewayPolygonPoints(pts);
                    // Remove the drawn overlay; we render our own synced overlay.
                    poly.setMap(null);
                  }}
                  onPolylineComplete={(line) => {
                    const path = line.getPath();
                    const pts: LatLng[] = [];
                    for (let i = 0; i < path.getLength(); i++) {
                      const p = path.getAt(i);
                      pts.push({ lat: p.lat(), lng: p.lng() });
                    }
                    setWalkwayLinePoints(pts);
                    line.setMap(null);
                  }}
                />
              </GoogleMap>
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center gap-2 p-4 text-center">
                {!mapsKey ? (
                  <>
                    <MapPin className="w-6 h-6 text-slate-400" />
                    <p className="text-sm text-slate-600">
                      Map is unavailable in this environment. You can still continue—measurements can be set via the test hook or restored from a saved job.
                    </p>
                  </>
                ) : (
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                )}
              </div>
            )}
          </div>

          {/* Driveway SF */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Driveway</p>
              <p className="text-lg font-semibold" data-testid="driveway-sf">
                {formatNumber(round1(drivewaySF), 1)} SF
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Walkway</p>
              <p className="text-lg font-semibold" data-testid="walkway-sf">
                {formatNumber(round1(walkwaySF), 1)} SF
              </p>
            </div>
          </div>

          {/* Walkway width */}
          {includeWalkway && (
            <div className="space-y-2">
              <Label className="text-sm">Walkway width</Label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 4, 5].map((w) => (
                  <Button
                    key={w}
                    type="button"
                    variant={walkwayWidthPreset === w ? "default" : "outline"}
                    className="h-10"
                    onClick={() => setWalkwayWidthPreset(w as 3 | 4 | 5)}
                    data-testid={`walkway-width-${w}`}
                  >
                    {w}ft
                  </Button>
                ))}
                <Button
                  type="button"
                  variant={walkwayWidthPreset === "custom" ? "default" : "outline"}
                  className="h-10"
                  onClick={() => setWalkwayWidthPreset("custom")}
                  data-testid="walkway-width-custom"
                >
                  Custom
                </Button>
              </div>
              {walkwayWidthPreset === "custom" && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    step={0.5}
                    value={walkwayWidthCustom}
                    onChange={(e) => setWalkwayWidthCustom(Number(e.target.value))}
                    className="h-10"
                    data-testid="walkway-width-custom-input"
                  />
                  <span className="text-sm text-slate-600">ft</span>
                </div>
              )}
            </div>
          )}

          {/* Totals + derived */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-lg font-semibold" data-testid="total-sf">
                {formatNumber(round1(totalSF), 1)} SF
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Yardage</p>
              <p className="text-lg font-semibold" data-testid="concrete-cy">
                {formatNumber(concreteCY, 1)} CY
              </p>
            </div>
          </div>

          {/* Thickness */}
          <div className="space-y-2">
            <Label className="text-sm">Thickness</Label>
            <div className="grid grid-cols-3 gap-2">
              {[4, 5, 6].map((t) => (
                <Button
                  key={t}
                  type="button"
                  variant={thicknessIn === t ? "default" : "outline"}
                  className="h-10"
                  onClick={() => setThicknessIn(t as 4 | 5 | 6)}
                  data-testid={`thickness-${t}`}
                >
                  {t}&quot;
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Forms perimeter (driveway)</p>
            <p className="text-sm font-medium" data-testid="driveway-perimeter">
              {formatNumber(round1(drivewayPerimeterLF), 1)} LF
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Fast toggles */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quick toggles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Removal</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                ["none", "None"],
                ["asphalt", "Asphalt"],
                ["concrete", "Existing slab"],
              ] as const).map(([val, label]) => (
                <Button
                  key={val}
                  type="button"
                  variant={removalType === val ? "default" : "outline"}
                  className="h-10"
                  onClick={() => setRemovalType(val)}
                  data-testid={`toggle-removal-${val}`}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Base condition</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                ["good", "Good"],
                ["unknown", "Unknown"],
                ["poor", "Poor"],
              ] as const).map(([val, label]) => (
                <Button
                  key={val}
                  type="button"
                  variant={baseCondition === val ? "default" : "outline"}
                  className="h-10"
                  onClick={() => setBaseCondition(val)}
                  data-testid={`toggle-base-${val}`}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Access</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                ["easy", "Easy"],
                ["tight", "Tight"],
                ["no-truck-access", "No truck"],
              ] as const).map(([val, label]) => (
                <Button
                  key={val}
                  type="button"
                  variant={accessType === val ? "default" : "outline"}
                  className="h-10"
                  onClick={() => setAccessType(val)}
                  data-testid={`toggle-access-${val}`}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Finish</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                ["broom", "Broom"],
                ["exposed", "Exposed"],
                ["stamped", "Stamped"],
              ] as const).map(([val, label]) => (
                <Button
                  key={val}
                  type="button"
                  variant={finishType === val ? "default" : "outline"}
                  className="h-10"
                  onClick={() => setFinishType(val)}
                  data-testid={`toggle-finish-${val}`}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add-ons */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Add-ons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label className="text-sm">Reinforcement</Label>
          <div className="grid grid-cols-2 gap-2">
            {([
              ["none", "None"],
              ["fiber", "Fiber"],
              ["wire-mesh", "Wire mesh"],
              ["#3-rebar", "#3 rebar"],
              ["#4-rebar", "#4 rebar"],
            ] as const).map(([val, label]) => (
              <Button
                key={val}
                type="button"
                variant={reinforcement === val ? "default" : "outline"}
                className="h-10"
                onClick={() => setReinforcement(val)}
                data-testid={`reinforcement-${val}`}
              >
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Packages */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Packages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2" data-testid="driveway-packages">
            {([
              ["good", "Good"],
              ["better", "Better"],
              ["best", "Best"],
            ] as const).map(([val, label]) => {
              const isSelected = selectedPackage === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    // Selecting a package should snap key choices.
                    if (val === "good") {
                      setFinishType("broom");
                      setThicknessIn(4);
                      setReinforcement("none");
                    } else if (val === "better") {
                      setFinishType("broom");
                      setThicknessIn(5);
                      setReinforcement("wire-mesh");
                    } else {
                      setFinishType((prev) => (prev === "broom" ? "stamped" : prev));
                      setThicknessIn(6);
                      setReinforcement("#4-rebar");
                    }
                    setSelectedPackage(val);
                  }}
                  className={cn(
                    "rounded-lg border-2 p-3 text-center transition-colors",
                    isSelected ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300"
                  )}
                  data-testid={`package-${val}`}
                >
                  <div className="text-sm font-semibold">{label}</div>
                </button>
              );
            })}
          </div>

          <div className="rounded-lg border border-slate-200 p-3" data-testid="driveway-package-summary">
            <p className="text-xs text-slate-500">Selected</p>
            <p className="text-sm font-medium" data-testid="selected-package">
              {selectedPackage.toUpperCase()}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {selectedPackage === "good" && "Broom finish • standard thickness • standard base"}
              {selectedPackage === "better" && "5\" option • wire mesh • better base allowance"}
              {selectedPackage === "best" && "Stamped/exposed options • sealing • drainage add-on suggestions"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Drainage considerations (always present) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Drainage considerations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3" data-testid="drainage-section">
          <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
            <li>Verify slope away from structures.</li>
            <li>Confirm existing drainage paths and discharge points.</li>
            <li>Recommend control joints to reduce cracking and improve drainage performance.</li>
            <li>Verify downspout discharge is directed away from slab edges.</li>
          </ul>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-900">Suggested add-ons</p>
            <div className="grid grid-cols-2 gap-2 text-sm text-slate-700">
              {["Channel drain", "Catch basin", "Regrade", "Downspout tie-in / extensions"].map((x) => (
                <div key={x} className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded border border-slate-300 bg-white" aria-hidden />
                  <span>{x}</span>
                </div>
              ))}
            </div>
          </div>

          {drainageNotes.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-medium">Notes</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                {drainageNotes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save + generate */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 safe-area-inset-bottom">
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-12"
            onClick={saveToJob}
            disabled={saving || generating}
            data-testid="button-save-driveway"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              "Save"
            )}
          </Button>
          <Button
            type="button"
            className="h-12 gap-2"
            onClick={handleGenerateProposal}
            disabled={generating || saving}
            data-testid="button-generate-driveway"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate proposal
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

