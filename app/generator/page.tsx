"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import Layout from "@/components/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  templates,
  JobType,
  getLocalizedJobType,
  getLocalizedJobTypes,
} from "@/lib/proposal-data";
import { useSearchParams } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Loader2,
  ChevronRight,
  Wand2,
  Download,
  FileText,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  GripVertical,
  Save,
  Camera,
  Mail,
  RotateCcw,
  Check,
} from "lucide-react";
import JobAddressField from "@/components/job-address-field";
import CustomerPicker from "@/components/customer-picker";
import EmailProposalModal from "@/components/email-proposal-modal";
import ProposalPreview from "@/components/proposal-preview";
import ProposalPreviewPane, {
  type ProposalPreviewPaneHandle,
} from "@/components/proposal-preview-pane";
import { CostInsights } from "@/components/cost-insights";
import ProposalPhotoUpload, {
  type UploadedPhoto,
} from "@/components/proposal-photo-upload";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useGeneratorDraftPersistence } from "./hooks/useGeneratorDraftPersistence";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { apiRequest } from "@/lib/queryClient";
import { getRegionalMultiplier } from "@/lib/regional-pricing";
import { cn } from "@/lib/utils";
import {
  WINDOW_SIZE_PRESETS,
  WINDOW_DEFAULTS,
  getEffectiveDimensions,
  getWindowSizeMultiplier,
  formatWindowSpec,
  formatWindowSpecShort,
  isValidWindowQuantity,
  isValidCustomDimension,
} from "@/lib/window-spec";
import {
  getCustomerById,
  getLastJobSetup,
  saveAddress,
  saveLastAddressForCustomer,
  syncAllData,
  type SavedCustomer,
} from "@/app/m/lib/job-memory";

// Service item interface for multi-trade support
interface ServiceItem {
  id: string;
  tradeId: string;
  jobTypeId: string;
  jobSize: number;
  homeArea: string;
  footage: number | null; // Square feet or linear feet depending on trade
  options: Record<string, boolean | string>;
  // Window-specific fields (for window-replacement job type)
  windowQuantity: number;
  windowSizePreset: string;
  windowWidthIn: number | null;
  windowHeightIn: number | null;
}

// Area-based price multipliers - different areas cost more/less
const areaMultipliers: Record<string, number> = {
  // Bathroom areas
  "master-bathroom": 1.25,
  bathroom: 1.0,
  "guest-bathroom": 0.95,
  "half-bath": 0.7,

  // Kitchen areas
  kitchen: 1.0,
  kitchenette: 0.6,
  "outdoor-kitchen": 1.4,

  // Interior rooms - based on typical size/complexity
  "living-room": 1.0,
  "dining-room": 0.85,
  bedroom: 0.9,
  "master-bedroom": 1.15,
  hallway: 0.5,
  "home-office": 0.8,
  closet: 0.4,
  mudroom: 0.5,
  "laundry-room": 0.7,
  basement: 1.5,
  attic: 1.3,
  "whole-house": 3.5,

  // Exterior areas
  "front-yard": 1.0,
  backyard: 1.1,
  "side-yard": 0.6,
  patio: 0.8,
  deck: 1.0,
  driveway: 1.2,
  walkway: 0.5,
  garage: 0.9,
  carport: 0.7,
  "exterior-full": 2.8,

  // Roofing areas
  "main-roof": 1.0,
  "garage-roof": 0.4,
  "porch-roof": 0.35,
  "addition-roof": 0.5,
  "full-roof": 1.0,
};

// Trades that use square footage for pricing
const squareFootageTrades = [
  "painting",
  "flooring",
  "drywall",
  "roofing",
  "concrete",
  "decks-patios",
  "landscape",
];

// Trades that use linear footage for pricing
const linearFootageTrades = ["fencing"];

// Price per unit by trade and job type (will use base if not found)
const pricePerUnit: Record<
  string,
  {
    sqft?: { low: number; high: number };
    linear?: { low: number; high: number };
  }
> = {
  painting: { sqft: { low: 2.5, high: 4.5 } },
  flooring: { sqft: { low: 6, high: 14 } },
  drywall: { sqft: { low: 2, high: 4 } },
  roofing: { sqft: { low: 4, high: 9 } },
  concrete: { sqft: { low: 8, high: 16 } },
  fencing: { linear: { low: 25, high: 55 } },
  "decks-patios": { sqft: { low: 25, high: 65 } },
  landscape: { sqft: { low: 3, high: 12 } },
};

// Check if trade uses footage-based pricing
const usesFootagePricing = (tradeId: string): "sqft" | "linear" | null => {
  if (squareFootageTrades.includes(tradeId)) return "sqft";
  if (linearFootageTrades.includes(tradeId)) return "linear";
  return null;
};

// Get footage placeholder for trade
const getFootagePlaceholder = (tradeId: string): string => {
  const type = usesFootagePricing(tradeId);
  if (type === "sqft") return "e.g., 400 sq ft";
  if (type === "linear") return "e.g., 150 linear ft";
  return "";
};

// Form Schema - clientName and address are optional for drafts
// They are only required when exporting/sending the proposal
const formSchema = z.object({
  clientName: z.string().optional(),
  address: z.string().optional(),
});

// Trade-aware area options with translation keys
const areaLabelKeys: Record<string, string> = {
  "living-room": "livingRoom",
  "dining-room": "diningRoom",
  bedroom: "bedroom",
  "master-bedroom": "masterBedroom",
  hallway: "hallway",
  "home-office": "homeOffice",
  closet: "closet",
  mudroom: "mudroom",
  "laundry-room": "laundryRoom",
  basement: "basement",
  attic: "attic",
  "whole-house": "wholeHouseInterior",
  bathroom: "bathroom",
  "master-bathroom": "masterBathroom",
  "half-bath": "halfBath",
  "guest-bathroom": "guestBathroom",
  kitchen: "kitchen",
  kitchenette: "kitchenette",
  "outdoor-kitchen": "outdoorKitchen",
  "front-yard": "frontYard",
  backyard: "backyard",
  "side-yard": "sideYard",
  patio: "patio",
  deck: "deck",
  driveway: "driveway",
  walkway: "walkway",
  garage: "garage",
  carport: "carport",
  "exterior-full": "exteriorFull",
  "main-roof": "mainRoof",
  "garage-roof": "garageRoof",
  "porch-roof": "porchRoof",
  "addition-roof": "additionRoof",
  "full-roof": "fullRoof",
};

const getLocalizedLabel = (value: string, t: any): string => {
  const key = areaLabelKeys[value];
  if (key && t.generator[key]) {
    return t.generator[key];
  }
  // Fallback: capitalize the value
  return value
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const interiorRoomValues = [
  "living-room",
  "dining-room",
  "bedroom",
  "master-bedroom",
  "hallway",
  "home-office",
  "closet",
  "mudroom",
  "laundry-room",
  "basement",
  "attic",
  "whole-house",
];

const bathroomAreaValues = [
  "bathroom",
  "master-bathroom",
  "half-bath",
  "guest-bathroom",
];

const kitchenAreaValues = ["kitchen", "kitchenette", "outdoor-kitchen"];

const exteriorAreaValues = [
  "front-yard",
  "backyard",
  "side-yard",
  "patio",
  "deck",
  "driveway",
  "walkway",
  "garage",
  "carport",
  "exterior-full",
];

const roofingAreaValues = [
  "main-roof",
  "garage-roof",
  "porch-roof",
  "addition-roof",
  "full-roof",
];

// Areas where plumbing work typically occurs
const plumbingAreaValues = [
  ...bathroomAreaValues, // All bathroom types
  ...kitchenAreaValues, // All kitchen types
  "laundry-room", // Washer/dryer hookups, utility sink
  "basement", // Water heater, sump pump, main lines
  "garage", // Water heater, utility sink
  "whole-house", // Re-piping, main line work
];

// Areas where electrical work typically occurs (broader than plumbing)
const electricalAreaValues = [
  ...bathroomAreaValues,
  ...kitchenAreaValues,
  "laundry-room",
  "basement",
  "garage",
  "attic", // Wiring runs, HVAC connections
  "living-room",
  "dining-room",
  "bedroom",
  "master-bedroom",
  "home-office",
  "whole-house",
];

const getAreaOptionsForTrade = (
  tradeId: string,
  t: any,
): { value: string; label: string }[] => {
  const toOptions = (values: string[]) =>
    values.map((v) => ({ value: v, label: getLocalizedLabel(v, t) }));

  switch (tradeId) {
    case "bathroom":
      return toOptions(bathroomAreaValues);
    case "kitchen":
      return toOptions(kitchenAreaValues);
    case "painting":
      return toOptions([...interiorRoomValues, ...exteriorAreaValues]);
    case "flooring":
    case "drywall":
      return toOptions(interiorRoomValues);
    case "roofing":
      return toOptions(roofingAreaValues);
    case "concrete":
    case "landscape":
    case "landscaping":
      return toOptions(exteriorAreaValues);
    case "plumbing":
      // Plumbing only in areas with water fixtures: bathrooms, kitchens, laundry, basement, garage
      return toOptions(plumbingAreaValues);
    case "electrical":
      // Electrical can be in more areas than plumbing, but not exterior
      return toOptions(electricalAreaValues);
    case "hvac":
      // HVAC has both interior components (air handlers, furnaces, ductwork) 
      // and exterior components (condensers, outdoor units)
      // Interior: rooms where ducts, vents, air handlers are located
      // Exterior: where outdoor units/condensers are typically placed
      return toOptions([
        // Interior areas - where HVAC equipment and ductwork are located
        "living-room",
        "dining-room",
        "bedroom",
        "master-bedroom",
        "home-office",
        "laundry-room",
        "basement",      // Common location for furnaces/air handlers
        "attic",         // Common for ductwork and air handlers
        "whole-house",   // Whole house HVAC systems
        // Exterior areas - where outdoor units/condensers are placed
        "backyard",      // Most common condenser location
        "side-yard",     // Very common condenser location
        "garage",        // Air handlers in warm climates, mini-splits
        "carport",       // Sometimes outdoor units near carport
      ]);
    case "handyman":
      // Handyman can work anywhere
      return toOptions([...interiorRoomValues, ...exteriorAreaValues]);
    case "windows-doors":
      return toOptions([
        ...interiorRoomValues.filter(
          (r) => !["whole-house", "closet", "laundry-room"].includes(r),
        ),
        ...exteriorAreaValues.filter((r) => ["patio", "garage"].includes(r)),
      ]);
    case "fencing":
      // Fencing is exterior only
      return toOptions(
        exteriorAreaValues.filter((r) =>
          ["front-yard", "backyard", "side-yard"].includes(r),
        ),
      );
    case "decks-patios":
      // Decks/patios are exterior
      return toOptions(["deck", "patio", "backyard", "front-yard"]);
    default:
      return toOptions([...interiorRoomValues, ...exteriorAreaValues]);
  }
};

// Component that handles search params with Suspense boundary support
function TradeParamHandler({
  onTradeParam,
  availableTemplates,
  draftRestored,
}: {
  onTradeParam: (tradeId: string | null) => void;
  availableTemplates: typeof templates;
  draftRestored: boolean;
}) {
  const searchParams = useSearchParams();
  const hasAppliedRef = useRef(false);

  useEffect(() => {
    if (hasAppliedRef.current) return;

    const tradeParam = searchParams.get("trade");

    // If a draft was restored, don't apply the trade param
    if (draftRestored) {
      hasAppliedRef.current = true;
      return;
    }

    // Validate the trade param against available templates
    if (tradeParam) {
      const allowedTrades = new Set(availableTemplates.map((t) => t.id));
      if (allowedTrades.has(tradeParam)) {
        onTradeParam(tradeParam);
      }
    }

    hasAppliedRef.current = true;
  }, [searchParams, availableTemplates, draftRestored, onTradeParam]);

  return null;
}

function GeneratorContent() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCustomer, setSelectedCustomer] = useState<SavedCustomer | null>(
    null,
  );
  const [services, setServices] = useState<ServiceItem[]>([
    {
      id: crypto.randomUUID(),
      tradeId: "",
      jobTypeId: "",
      jobSize: 2,
      homeArea: "",
      footage: null,
      options: {},
      // Window defaults
      windowQuantity: 1,
      windowSizePreset: "30x60",
      windowWidthIn: null,
      windowHeightIn: null,
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [enhancedScopes, setEnhancedScopes] = useState<
    Record<string, string[]>
  >({});
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [savedProposalId, setSavedProposalId] = useState<number | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [isSavingForEmail, setIsSavingForEmail] = useState(false);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  // Draft-first: Track validation errors for finalize fields (client name + address)
  // These are only shown when user tries to export/send
  const [finalizeErrors, setFinalizeErrors] = useState<{
    clientName?: string;
    address?: string;
  }>({});
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { t, language } = useLanguage();
  const previewRef = useRef<HTMLDivElement>(null);
  const previewPaneRef = useRef<ProposalPreviewPaneHandle>(null);
  const resolvedPlaceRef = useRef<{
    placeId: string;
    formattedAddress: string;
    lat: number;
    lng: number;
  } | null>(null);

  const userSelectedTrades = user?.selectedTrades || [];
  const userId = user?.id ?? null;
  const availableTemplates =
    userSelectedTrades.length > 0
      ? templates.filter((t) => userSelectedTrades.includes(t.id))
      : templates;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      address: "",
    },
  });

  const watchedValues = form.watch();

  // Sync customer/address memory and restore last customer (ScopeScan parity)
  useEffect(() => {
    if (isAuthLoading) return;
    if (!userId) return;

    let cancelled = false;
    (async () => {
      try {
        await syncAllData();
      } catch {
        // Ignore sync errors (local-first).
      }

      if (cancelled) return;

      const last = getLastJobSetup();
      if (last?.customerId) {
        const c = getCustomerById(last.customerId);
        if (c) {
          setSelectedCustomer(c);
          // Only prefill if user hasn't typed anything yet.
          const currentName = form.getValues("clientName") || "";
          if (!currentName.trim()) {
            form.setValue("clientName", c.name, { shouldDirty: true });
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, isAuthLoading, form]);

  const saveResolvedAddressForCustomer = async (
    customer: SavedCustomer,
    formatted: string,
  ) => {
    const place = resolvedPlaceRef.current;

    // Only save addresses selected via autocomplete (placeId + lat/lng).
    if (!place?.placeId || !place.formattedAddress) return;

    try {
      const saved = await saveAddress({
        formatted,
        placeId: place.placeId,
        lat: String(place.lat),
        lng: String(place.lng),
        customerId: customer.id,
      });
      saveLastAddressForCustomer(customer.id, saved);
    } catch {
      // Ignore (customer/address memory is best-effort).
    }
  };

  // Draft persistence hook - handles localStorage restore, autosave, and reset
  const {
    isAutoSaving,
    lastSavedRelative,
    hasUnsavedChanges,
    draftRestored,
    handleResetDraft,
  } = useGeneratorDraftPersistence({
    userId: user?.id ?? null,
    isAuthLoading,
    form,
    state: { services, photos, enhancedScopes, watchedValues, savedProposalId },
    setters: {
      setServices,
      setPhotos,
      setEnhancedScopes,
      setStep,
      setSavedProposalId,
      setFinalizeErrors,
    },
    onReset: () =>
      toast({
        title: "Draft cleared",
        description: "Your draft has been reset.",
      }),
  });

  const handleResetAll = () => {
    setSelectedCustomer(null);
    handleResetDraft();
  };

  // Callback to handle trade parameter from URL
  const handleTradeParam = (tradeId: string | null) => {
    if (!tradeId) return;

    setServices((prev) => {
      if (prev.length === 0) return prev;
      if (prev[0]?.tradeId) return prev; // don't override user/previous state

      const first: ServiceItem = {
        ...prev[0],
        tradeId: tradeId,
        jobTypeId: "",
        homeArea: "",
        footage: null,
        options: {},
        // Reset window fields
        windowQuantity: WINDOW_DEFAULTS.quantity,
        windowSizePreset: WINDOW_DEFAULTS.sizePreset,
        windowWidthIn: null,
        windowHeightIn: null,
      };
      return [first, ...prev.slice(1)];
    });
  };

  const getJobTypeForService = (service: ServiceItem): JobType | null => {
    const trade = availableTemplates.find((t) => t.id === service.tradeId);
    const jobType =
      trade?.jobTypes.find((j) => j.id === service.jobTypeId) || null;
    if (!jobType || !trade) return null;
    return getLocalizedJobType(jobType, trade.id, language);
  };

  const updateService = (serviceId: string, updates: Partial<ServiceItem>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, ...updates } : s)),
    );
  };

  const addService = () => {
    setServices((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        tradeId: "",
        jobTypeId: "",
        jobSize: 2,
        homeArea: "",
        footage: null,
        options: {},
        // Window defaults
        windowQuantity: WINDOW_DEFAULTS.quantity,
        windowSizePreset: WINDOW_DEFAULTS.sizePreset,
        windowWidthIn: null,
        windowHeightIn: null,
      },
    ]);
  };

  const removeService = (serviceId: string) => {
    if (services.length > 1) {
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
    }
  };

  const handleTradeChange = (serviceId: string, tradeId: string) => {
    updateService(serviceId, {
      tradeId,
      jobTypeId: "",
      homeArea: "",
      footage: null,
      options: {},
      // Reset window fields
      windowQuantity: WINDOW_DEFAULTS.quantity,
      windowSizePreset: WINDOW_DEFAULTS.sizePreset,
      windowWidthIn: null,
      windowHeightIn: null,
    });
  };

  const handleJobTypeChange = (serviceId: string, jobTypeId: string) => {
    updateService(serviceId, {
      jobTypeId,
      homeArea: "",
      footage: null,
      options: {},
      // Reset window fields when job type changes
      windowQuantity: WINDOW_DEFAULTS.quantity,
      windowSizePreset: WINDOW_DEFAULTS.sizePreset,
      windowWidthIn: null,
      windowHeightIn: null,
    });
  };

  const generateServiceData = (service: ServiceItem) => {
    const jobType = getJobTypeForService(service);
    if (!jobType) return null;

    const finalScope = [...jobType.baseScope];
    let priceModifier = 1;

    const size = service.jobSize || 2;
    if (size === 1) priceModifier = 0.8;
    if (size === 3) priceModifier = 1.3;

    const opts = service.options || {};
    let extraCost = 0;
    
    // Collect scopeAdditions separately for merging into scopeSections
    const optionScopeAdditions: string[] = [];

    jobType.options.forEach((opt) => {
      const value = opts[opt.id];
      if (value) {
        if (opt.type === "select" && opt.choices && typeof value === "string") {
          const selectedChoice = opt.choices.find((c) => c.value === value);
          if (selectedChoice) {
            if (selectedChoice.scopeAddition) {
              finalScope.push(selectedChoice.scopeAddition);
              optionScopeAdditions.push(selectedChoice.scopeAddition);
            }
            if (selectedChoice.priceModifier)
              extraCost += selectedChoice.priceModifier;
          }
        } else if (opt.type === "boolean" && value === true) {
          if (opt.scopeAddition) {
            finalScope.push(opt.scopeAddition);
            optionScopeAdditions.push(opt.scopeAddition);
          }
          if (opt.priceModifier) extraCost += opt.priceModifier;
        }
      }
    });

    // Get area-based multiplier (defaults to 1.0 if area not selected or not found)
    const areaMultiplier = service.homeArea
      ? areaMultipliers[service.homeArea] || 1.0
      : 1.0;

    // Check if this trade uses footage-based pricing
    const footageType = usesFootagePricing(service.tradeId);
    const tradeUnitPricing = pricePerUnit[service.tradeId];

    let baseLowPrice: number;
    let baseHighPrice: number;

    // Special handling for window-replacement job type
    const isWindowReplacement = service.tradeId === "windows-doors" && service.jobTypeId === "window-replacement";
    
    if (isWindowReplacement) {
      // Window Replacement: Price scales with quantity and size
      const windowQty = service.windowQuantity || WINDOW_DEFAULTS.quantity;
      const { width: windowW, height: windowH } = getEffectiveDimensions(
        service.windowSizePreset || WINDOW_DEFAULTS.sizePreset,
        service.windowWidthIn ?? undefined,
        service.windowHeightIn ?? undefined
      );
      const windowSizeMultiplier = getWindowSizeMultiplier(windowW, windowH);
      
      // Base price is per window, scale by quantity and size
      // extraCost (from options like triple-pane) also scales with quantity
      baseLowPrice =
        (jobType.basePriceRange.low * windowSizeMultiplier + extraCost) * windowQty * priceModifier;
      baseHighPrice =
        (jobType.basePriceRange.high * windowSizeMultiplier + extraCost) * windowQty * priceModifier;
    } else if (
      footageType &&
      service.footage &&
      service.footage > 0 &&
      tradeUnitPricing
    ) {
      // Calculate price based on footage - footage already accounts for size, so we use a
      // reduced complexity multiplier from area (only for very complex areas like basement/attic)
      const unitPricing =
        footageType === "sqft"
          ? tradeUnitPricing.sqft
          : tradeUnitPricing.linear;
      if (unitPricing) {
        // For footage-based pricing, only apply a complexity factor for difficult areas
        // (basement, attic, outdoor kitchen) - not the full area multiplier
        const complexityFactor =
          areaMultiplier > 1.2 ? 1 + (areaMultiplier - 1) * 0.3 : 1.0;
        baseLowPrice =
          service.footage * unitPricing.low * priceModifier * complexityFactor +
          extraCost;
        baseHighPrice =
          service.footage *
            unitPricing.high *
            priceModifier *
            complexityFactor +
          extraCost;
      } else {
        // Fallback to base price if unit pricing not defined
        baseLowPrice =
          jobType.basePriceRange.low * priceModifier * areaMultiplier +
          extraCost;
        baseHighPrice =
          jobType.basePriceRange.high * priceModifier * areaMultiplier +
          extraCost;
      }
    } else {
      // Use traditional base price with full area multiplier
      baseLowPrice =
        jobType.basePriceRange.low * priceModifier * areaMultiplier + extraCost;
      baseHighPrice =
        jobType.basePriceRange.high * priceModifier * areaMultiplier +
        extraCost;
    }

    const userMultiplier = (user?.priceMultiplier || 100) / 100;
    const tradeMultiplier =
      (user?.tradeMultipliers?.[service.tradeId] ?? 100) / 100;
    // Draft-first: address may be undefined, default to empty string for regional pricing
    const { multiplier: regionalMultiplier, region } = getRegionalMultiplier(
      watchedValues.address || "",
    );

    const lowPrice =
      baseLowPrice * userMultiplier * tradeMultiplier * regionalMultiplier;
    const highPrice =
      baseHighPrice * userMultiplier * tradeMultiplier * regionalMultiplier;

    let timelineLow = jobType.estimatedDays?.low || 1;
    let timelineHigh = jobType.estimatedDays?.high || 3;

    // Adjust timeline based on size
    if (size === 1) {
      timelineLow = Math.max(1, Math.floor(timelineLow * 0.8));
      timelineHigh = Math.max(1, Math.floor(timelineHigh * 0.8));
    }
    if (size === 3) {
      timelineLow = Math.ceil(timelineLow * 1.3);
      timelineHigh = Math.ceil(timelineHigh * 1.3);
    }

    // Also adjust timeline for area multiplier (larger areas = more time)
    if (areaMultiplier > 1.5) {
      timelineLow = Math.ceil(timelineLow * 1.2);
      timelineHigh = Math.ceil(timelineHigh * 1.3);
    } else if (areaMultiplier < 0.7) {
      timelineLow = Math.max(1, Math.floor(timelineLow * 0.8));
      timelineHigh = Math.max(1, Math.floor(timelineHigh * 0.9));
    }

    // Window replacement: scale timeline with quantity
    if (isWindowReplacement) {
      const windowQty = service.windowQuantity || WINDOW_DEFAULTS.quantity;
      // Each additional window adds about 0.5 days (with some efficiency for batch work)
      if (windowQty > 1) {
        const additionalDaysLow = Math.ceil((windowQty - 1) * 0.4);
        const additionalDaysHigh = Math.ceil((windowQty - 1) * 0.6);
        timelineLow = timelineLow + additionalDaysLow;
        timelineHigh = timelineHigh + additionalDaysHigh;
      }
    }

    const trade = availableTemplates.find((t) => t.id === service.tradeId);
    
    // Merge scopeAdditions into scopeSections if they exist
    // Add them to a "Selected Options" section or append to the last section
    let mergedScopeSections = jobType.scopeSections;
    if (jobType.scopeSections && optionScopeAdditions.length > 0) {
      // Create a copy of scopeSections and add options items to a new section
      mergedScopeSections = [
        ...jobType.scopeSections,
        {
          title: "Selected Options & Customizations",
          items: optionScopeAdditions
        }
      ];
    }

    // Window replacement: inject quantity and size into scope
    let windowEnhancedScope = finalScope;
    let windowEnhancedJobTypeName = jobType.name;
    if (isWindowReplacement) {
      const windowQty = service.windowQuantity || WINDOW_DEFAULTS.quantity;
      const preset = service.windowSizePreset || WINDOW_DEFAULTS.sizePreset;
      const customW = service.windowWidthIn ?? undefined;
      const customH = service.windowHeightIn ?? undefined;
      const windowSpec = formatWindowSpec(windowQty, preset, customW, customH);
      const windowSpecShort = formatWindowSpecShort(windowQty, preset, customW, customH);
      
      // Enhance scope items with quantity and size
      windowEnhancedScope = finalScope.map((item) => {
        // Replace generic window references with specific quantity/size
        if (item.toLowerCase().includes("existing window") || item.toLowerCase().includes("remove existing")) {
          return `Remove and dispose of existing ${windowSpec}.`;
        }
        if (item.toLowerCase().includes("install") && item.toLowerCase().includes("window")) {
          return `Install ${windowSpec}, set plumb/level, shim, and fasten.`;
        }
        return item;
      });
      
      // Enhance job type name for display
      windowEnhancedJobTypeName = `${jobType.name} — ${windowSpecShort}`;
    }

    return {
      serviceId: service.id,
      tradeName: trade?.trade || "",
      jobTypeName: isWindowReplacement ? windowEnhancedJobTypeName : jobType.name,
      scope: enhancedScopes[service.id] || (isWindowReplacement ? windowEnhancedScope : finalScope),
      // Pass through new section-based scope fields from template, merged with option selections
      scopeSections: mergedScopeSections,
      included: jobType.included,
      assumptions: jobType.assumptions,
      addons: jobType.addons,
      priceRange: {
        low: Math.round(lowPrice / 100) * 100,
        high: Math.round(highPrice / 100) * 100,
      },
      estimatedDays: { low: timelineLow, high: timelineHigh },
      warranty: jobType.warranty,
      exclusions: jobType.exclusions,
      regionalInfo: region
        ? {
            state: region.state,
            abbrev: region.abbrev,
            region: region.region,
            multiplier: region.multiplier,
          }
        : null,
      footage: service.footage,
      homeArea: service.homeArea,
      // Window-specific fields
      windowQuantity: isWindowReplacement ? (service.windowQuantity || WINDOW_DEFAULTS.quantity) : undefined,
      windowSizePreset: isWindowReplacement ? (service.windowSizePreset || WINDOW_DEFAULTS.sizePreset) : undefined,
      windowWidthIn: isWindowReplacement && service.windowSizePreset === "custom" ? service.windowWidthIn : undefined,
      windowHeightIn: isWindowReplacement && service.windowSizePreset === "custom" ? service.windowHeightIn : undefined,
    };
  };

  const generateProposalData = () => {
    const validServices = services.filter((s) => s.tradeId && s.jobTypeId);
    if (validServices.length === 0) return { lineItems: [] };

    const lineItems = validServices
      .map(generateServiceData)
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // Calculate totals
    const totalPriceLow = lineItems.reduce(
      (sum, item) => sum + (item?.priceRange.low || 0),
      0,
    );
    const totalPriceHigh = lineItems.reduce(
      (sum, item) => sum + (item?.priceRange.high || 0),
      0,
    );
    const totalDaysLow = lineItems.reduce(
      (sum, item) => sum + (item?.estimatedDays.low || 0),
      0,
    );
    const totalDaysHigh = lineItems.reduce(
      (sum, item) => sum + (item?.estimatedDays.high || 0),
      0,
    );

    // Combine all scopes
    const allScope = lineItems.flatMap((item) => item?.scope || []);
    const allExclusions = Array.from(
      new Set(lineItems.flatMap((item) => item?.exclusions || [])),
    );
    const allWarranties = Array.from(
      new Set(
        lineItems.map((item) => item?.warranty).filter((w): w is string => !!w),
      ),
    );

    // Get first regional info
    const firstRegionalInfo =
      lineItems.find((item) => item?.regionalInfo)?.regionalInfo || null;

    // Transform photos for preview
    const previewPhotos = photos.map((p) => ({
      id: p.id,
      url: p.mediumUrl || p.originalUrl || p.url,
      category: p.category,
      caption: p.caption,
      order: p.displayOrder,
    }));

    // For single-service proposals, use the service's section data directly
    // For multi-service, we don't aggregate sections (they're shown per-service)
    const firstService = lineItems[0];
    const isSingleService = lineItems.length === 1;

    return {
      clientName: watchedValues.clientName,
      address: watchedValues.address,
      lineItems,
      jobTypeName: isSingleService
        ? firstService?.jobTypeName
        : `Multi-Service Proposal (${lineItems.length} services)`,
      scope: allScope,
      // For single-service proposals, pass through the structured scope data
      scopeSections: isSingleService ? firstService?.scopeSections : undefined,
      included: isSingleService ? firstService?.included : undefined,
      assumptions: isSingleService ? firstService?.assumptions : undefined,
      addons: isSingleService ? firstService?.addons : undefined,
      priceRange: {
        low: Math.round(totalPriceLow / 100) * 100,
        high: Math.round(totalPriceHigh / 100) * 100,
      },
      estimatedDays: { low: totalDaysLow, high: totalDaysHigh },
      warranty: allWarranties.join(" "),
      exclusions: allExclusions,
      regionalInfo: firstRegionalInfo,
      photos: previewPhotos,
    };
  };

  const hasValidServices = services.some((s) => s.tradeId && s.jobTypeId);

  // Ensure we have a proposal ID before persisting photos.
  // This is the key to refresh-safe, server-canonical photo rendering.
  const ensureProposalIdForPhotos = async (): Promise<number> => {
    if (savedProposalId) return savedProposalId;

    const validServices = services.filter((s) => s.tradeId && s.jobTypeId);
    if (validServices.length === 0) {
      throw new Error("Please add a service first");
    }

    // Reuse draft-first behavior: allow placeholder client info for drafts.
    const clientName =
      watchedValues.clientName?.trim() || "Draft Proposal";
    const address = watchedValues.address?.trim() || "Address pending";

    const firstService = validServices[0];
    const firstServiceData = generateServiceData(firstService);
    if (!firstServiceData) {
      throw new Error("Invalid service data");
    }

    const isMultiService = validServices.length > 1;
    const lineItems = isMultiService
      ? validServices
          .map((service) => {
            const serviceData = generateServiceData(service);
            if (!serviceData) return null;
            const trade = availableTemplates.find((t) => t.id === service.tradeId);
            return {
              id: service.id,
              tradeId: service.tradeId,
              tradeName: trade?.trade || service.tradeId,
              jobTypeId: service.jobTypeId,
              jobTypeName: serviceData.jobTypeName,
              jobSize: service.jobSize,
              homeArea: service.homeArea,
              footage: service.footage || undefined,
              scope: enhancedScopes[service.id] || serviceData.scope,
              scopeSections: serviceData.scopeSections,
              options: service.options,
              priceLow: serviceData.priceRange.low,
              priceHigh: serviceData.priceRange.high,
              estimatedDaysLow: serviceData.estimatedDays.low,
              estimatedDaysHigh: serviceData.estimatedDays.high,
              warranty: serviceData.warranty,
              exclusions: serviceData.exclusions,
              windowQuantity: serviceData.windowQuantity,
              windowSizePreset: serviceData.windowSizePreset,
              windowWidthIn: serviceData.windowWidthIn,
              windowHeightIn: serviceData.windowHeightIn,
            };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null)
      : undefined;

    const allScope = isMultiService
      ? (lineItems || []).flatMap((item) => item.scope)
      : firstServiceData.scope;

    const totalPriceLow = isMultiService
      ? (lineItems || []).reduce((sum, item) => sum + item.priceLow, 0)
      : firstServiceData.priceRange.low;
    const totalPriceHigh = isMultiService
      ? (lineItems || []).reduce((sum, item) => sum + item.priceHigh, 0)
      : firstServiceData.priceRange.high;

    const totalDaysLow = isMultiService
      ? (lineItems || []).reduce((sum, item) => sum + (item.estimatedDaysLow || 0), 0)
      : firstServiceData.estimatedDays.low;
    const totalDaysHigh = isMultiService
      ? (lineItems || []).reduce((sum, item) => sum + (item.estimatedDaysHigh || 0), 0)
      : firstServiceData.estimatedDays.high;

    const proposalData = {
      clientName,
      address,
      tradeId: firstService.tradeId,
      jobTypeId: firstService.jobTypeId,
      jobTypeName: isMultiService
        ? `Multi-Service (${(lineItems || []).length} services)`
        : firstServiceData.jobTypeName,
      jobSize: firstService.jobSize,
      scope: allScope,
      scopeSections: isMultiService ? undefined : firstServiceData.scopeSections,
      options: firstService.options,
      priceLow: totalPriceLow,
      priceHigh: totalPriceHigh,
      lineItems: isMultiService ? lineItems : undefined,
      isMultiService,
      estimatedDaysLow: totalDaysLow,
      estimatedDaysHigh: totalDaysHigh,
      status: "draft",
      isUnlocked: true,
      photoCount: photos.length,
      isDraftWithoutClientInfo:
        clientName === "Draft Proposal" || address === "Address pending",
    };

    const response = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(proposalData),
    });
    if (!response.ok) {
      throw new Error("Failed to create draft for photos");
    }
    const savedProposal = await response.json();
    setSavedProposalId(savedProposal.id);
    return savedProposal.id as number;
  };

  // Draft-first: Check if finalize fields (client name + address) are valid
  // These are required only for export/send actions, not for generating drafts
  const validateFinalizeFields = (): boolean => {
    const errors: { clientName?: string; address?: string } = {};

    if (
      !watchedValues.clientName ||
      watchedValues.clientName.trim().length < 2
    ) {
      errors.clientName = "Client name is required to export/send";
    }
    if (!watchedValues.address || watchedValues.address.trim().length < 5) {
      errors.address = "Job address is required to export/send";
    }

    setFinalizeErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check if finalize fields are filled (for UI state)
  const hasClientName = Boolean(
    watchedValues.clientName &&
    watchedValues.clientName.trim().length >= 2,
  );
  const hasAddress = Boolean(
    watchedValues.address &&
    watchedValues.address.trim().length >= 5,
  );
  const hasFinalizeFields = hasClientName && hasAddress;

  // Generate tooltip message for export buttons when fields are missing
  const getExportTooltip = (): string | undefined => {
    if (hasFinalizeFields) return undefined;
    const missing: string[] = [];
    if (!hasClientName) missing.push("client name");
    if (!hasAddress) missing.push("job address");
    return `Add ${missing.join(" and ")} to export`;
  };

  // Clear finalize errors when fields change
  const clearFinalizeErrors = () => {
    if (Object.keys(finalizeErrors).length > 0) {
      setFinalizeErrors({});
    }
  };

  const onSubmit = async () => {
    if (!hasValidServices) {
      toast({
        title: t.common.error,
        description: t.generator.pleaseAddService,
        variant: "destructive",
      });
      return;
    }
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsGenerating(false);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;

    // Draft-first: Validate finalize fields before download
    if (!validateFinalizeFields()) {
      toast({
        title: t.common.error,
        description: "Please fill in client name and address to download",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    try {
      const element = previewRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`proposal-${watchedValues.clientName || "draft"}.pdf`);

      toast({
        title: t.common.success,
        description: t.toast.downloadSuccess,
      });
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast({
        title: t.common.error,
        description: t.toast.downloadError,
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEnhanceScope = async () => {
    if (!user) {
      toast({
        title: t.common.error,
        description: t.toast.loginRequired,
        variant: "destructive",
      });
      return;
    }

    const validServices = services.filter((s) => s.tradeId && s.jobTypeId);
    if (validServices.length === 0) {
      toast({
        title: t.common.error,
        description: t.generator.pleaseAddServiceFirst,
        variant: "destructive",
      });
      return;
    }

    setIsEnhancing(true);
    let hasErrors = false;
    let successCount = 0;

    try {
      const newEnhancedScopes: Record<string, string[]> = {};

      for (const service of validServices) {
        const serviceData = generateServiceData(service);
        if (!serviceData) continue;

        try {
          const response = await apiRequest("POST", "/api/ai/enhance-scope", {
            jobTypeName: serviceData.jobTypeName,
            baseScope: serviceData.scope,
            clientName: watchedValues.clientName,
            address: watchedValues.address,
            jobNotes: service.homeArea,
          });
          const data = await response.json();

          if (data.enhancedScope) {
            newEnhancedScopes[service.id] = data.enhancedScope;

            // Check if there was a partial success (AI returned original scope due to error)
            if (data.error) {
              hasErrors = true;
              console.warn(
                `AI enhancement partial error for service ${service.id}:`,
                data.error,
              );
            } else if (data.success) {
              successCount++;
            }
          }

          // Show specific error messages to user
          if (data.error && data.error.code !== "UNKNOWN_ERROR") {
            toast({
              title: "Enhancement Issue",
              description: data.error.message,
              variant: "default",
            });
          }
        } catch (serviceError) {
          hasErrors = true;
          console.error(
            `Error enhancing scope for service ${service.id}:`,
            serviceError,
          );
        }
      }

      setEnhancedScopes((prev) => ({ ...prev, ...newEnhancedScopes }));

      // Show appropriate success/warning message
      if (successCount > 0 && !hasErrors) {
        toast({
          title: t.toast.scopeEnhanced,
          description: t.toast.scopeEnhancedDesc,
        });
      } else if (successCount > 0 && hasErrors) {
        toast({
          title: "Partially Enhanced",
          description:
            "Some services were enhanced successfully. Others may need to be retried.",
          variant: "default",
        });
      } else if (hasErrors) {
        toast({
          title: t.common.error,
          description:
            "AI enhancement is temporarily unavailable. Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error enhancing scope:", error);
      toast({
        title: t.common.error,
        description: t.toast.scopeEnhanceError,
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!user) {
      toast({
        title: t.common.error,
        description: t.toast.loginRequired,
        variant: "destructive",
      });
      return;
    }

    const validServices = services.filter((s) => s.tradeId && s.jobTypeId);
    if (validServices.length === 0) {
      toast({
        title: t.common.error,
        description: t.generator.pleaseAddServiceFirst,
        variant: "destructive",
      });
      return;
    }

    // Draft-first: Client name and address are optional for drafts
    // Use placeholder values if not provided
    const clientName = watchedValues.clientName?.trim() || "Draft Proposal";
    const address = watchedValues.address?.trim() || "Address pending";

    setIsSavingDraft(true);
    try {
      const firstService = validServices[0];
      const firstServiceData = generateServiceData(firstService);
      if (!firstServiceData) throw new Error(t.generator.invalidServiceData);

      const isMultiService = validServices.length > 1;

      // Build line items for multi-service proposals
      const lineItems = validServices
        .map((service) => {
          const serviceData = generateServiceData(service);
          if (!serviceData) return null;

          const trade = availableTemplates.find(
            (t) => t.id === service.tradeId,
          );

          return {
            id: service.id,
            tradeId: service.tradeId,
            tradeName: trade?.trade || service.tradeId,
            jobTypeId: service.jobTypeId,
            jobTypeName: serviceData.jobTypeName,
            jobSize: service.jobSize,
            homeArea: service.homeArea,
            footage: service.footage || undefined,
            scope: enhancedScopes[service.id] || serviceData.scope,
            scopeSections: serviceData.scopeSections,
            options: service.options,
            priceLow: serviceData.priceRange.low,
            priceHigh: serviceData.priceRange.high,
            estimatedDaysLow: serviceData.estimatedDays.low,
            estimatedDaysHigh: serviceData.estimatedDays.high,
            warranty: serviceData.warranty,
            exclusions: serviceData.exclusions,
            // Window-specific fields
            windowQuantity: serviceData.windowQuantity,
            windowSizePreset: serviceData.windowSizePreset,
            windowWidthIn: serviceData.windowWidthIn,
            windowHeightIn: serviceData.windowHeightIn,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      // Calculate totals
      const totalPriceLow = lineItems.reduce(
        (sum, item) => sum + item.priceLow,
        0,
      );
      const totalPriceHigh = lineItems.reduce(
        (sum, item) => sum + item.priceHigh,
        0,
      );
      const totalDaysLow = lineItems.reduce(
        (sum, item) => sum + (item.estimatedDaysLow || 0),
        0,
      );
      const totalDaysHigh = lineItems.reduce(
        (sum, item) => sum + (item.estimatedDaysHigh || 0),
        0,
      );

      // Combine all scopes for the main scope field (backwards compatibility)
      const allScope = lineItems.flatMap((item) => item.scope);

      // Draft-first: Use local clientName/address (may be placeholders for drafts)
      const proposalData = {
        clientName,
        address,
        // Primary service info (backwards compatibility)
        tradeId: firstService.tradeId,
        jobTypeId: firstService.jobTypeId,
        jobTypeName: isMultiService
          ? `Multi-Service (${lineItems.length} services)`
          : firstServiceData.jobTypeName,
        jobSize: firstService.jobSize,
        scope: allScope,
        // Structured scope (single-service only; multi-service scopes live on each line item)
        scopeSections: isMultiService ? undefined : firstServiceData.scopeSections,
        options: firstService.options,
        // Pricing
        priceLow: totalPriceLow,
        priceHigh: totalPriceHigh,
        // Multi-service fields
        lineItems: isMultiService ? lineItems : undefined,
        isMultiService,
        estimatedDaysLow: totalDaysLow,
        estimatedDaysHigh: totalDaysHigh,
        // Status - mark as draft if client info is placeholder
        status: "draft",
        isUnlocked: true,
        // Photo count
        photoCount: photos.length,
        // Draft-first: Track if this is a draft without full client info
        isDraftWithoutClientInfo:
          clientName === "Draft Proposal" || address === "Address pending",
      };

      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(proposalData),
      });

      if (!response.ok) {
        throw new Error("Failed to save draft");
      }

      const savedProposal = await response.json();
      setSavedProposalId(savedProposal.id);

      // Draft-first: Show appropriate message based on whether client info was provided
      const isDraftOnly =
        clientName === "Draft Proposal" || address === "Address pending";
      toast({
        title: t.common.success,
        description: isDraftOnly
          ? "Draft saved! Add client name and address to export."
          : t.generator.draftSaved,
      });
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: t.common.error,
        description: t.generator.failedToSaveDraft,
        variant: "destructive",
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const previewData = generateProposalData();

  // Handle email button click - save draft first if needed, then open email modal
  const handleEmailClick = async () => {
    if (!user) {
      toast({
        title: t.common.error,
        description: t.toast.loginRequired,
        variant: "destructive",
      });
      return;
    }

    // Draft-first: Validate finalize fields before email
    if (!validateFinalizeFields()) {
      toast({
        title: t.common.error,
        description: "Please fill in client name and address to send",
        variant: "destructive",
      });
      return;
    }

    // If we already have a saved proposal ID, just open the modal
    if (savedProposalId) {
      setEmailModalOpen(true);
      return;
    }

    // Otherwise, save the proposal first
    const validServices = services.filter((s) => s.tradeId && s.jobTypeId);
    if (validServices.length === 0) {
      toast({
        title: t.common.error,
        description: t.generator.pleaseAddServiceFirst,
        variant: "destructive",
      });
      return;
    }

    // Draft-first: At this point, we've already validated finalize fields above

    setIsSavingForEmail(true);
    try {
      const firstService = validServices[0];
      const firstServiceData = generateServiceData(firstService);
      if (!firstServiceData) throw new Error(t.generator.invalidServiceData);

      const isMultiService = validServices.length > 1;

      // Build line items for multi-service proposals
      const lineItems = validServices
        .map((service) => {
          const serviceData = generateServiceData(service);
          if (!serviceData) return null;

          const trade = availableTemplates.find(
            (t) => t.id === service.tradeId,
          );

          return {
            id: service.id,
            tradeId: service.tradeId,
            tradeName: trade?.trade || service.tradeId,
            jobTypeId: service.jobTypeId,
            jobTypeName: serviceData.jobTypeName,
            jobSize: service.jobSize,
            homeArea: service.homeArea,
            footage: service.footage || undefined,
            scope: enhancedScopes[service.id] || serviceData.scope,
            scopeSections: serviceData.scopeSections,
            options: service.options,
            priceLow: serviceData.priceRange.low,
            priceHigh: serviceData.priceRange.high,
            estimatedDaysLow: serviceData.estimatedDays.low,
            estimatedDaysHigh: serviceData.estimatedDays.high,
            warranty: serviceData.warranty,
            exclusions: serviceData.exclusions,
            // Window-specific fields
            windowQuantity: serviceData.windowQuantity,
            windowSizePreset: serviceData.windowSizePreset,
            windowWidthIn: serviceData.windowWidthIn,
            windowHeightIn: serviceData.windowHeightIn,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      // Calculate totals
      const totalPriceLow = lineItems.reduce(
        (sum, item) => sum + item.priceLow,
        0,
      );
      const totalPriceHigh = lineItems.reduce(
        (sum, item) => sum + item.priceHigh,
        0,
      );
      const totalDaysLow = lineItems.reduce(
        (sum, item) => sum + (item.estimatedDaysLow || 0),
        0,
      );
      const totalDaysHigh = lineItems.reduce(
        (sum, item) => sum + (item.estimatedDaysHigh || 0),
        0,
      );

      // Combine all scopes for the main scope field (backwards compatibility)
      const allScope = lineItems.flatMap((item) => item.scope);

      const proposalData = {
        clientName: watchedValues.clientName,
        address: watchedValues.address,
        // Primary service info (backwards compatibility)
        tradeId: firstService.tradeId,
        jobTypeId: firstService.jobTypeId,
        jobTypeName: isMultiService
          ? `Multi-Service (${lineItems.length} services)`
          : firstServiceData.jobTypeName,
        jobSize: firstService.jobSize,
        scope: allScope,
        // Structured scope (single-service only; multi-service scopes live on each line item)
        scopeSections: isMultiService ? undefined : firstServiceData.scopeSections,
        options: firstService.options,
        // Pricing
        priceLow: totalPriceLow,
        priceHigh: totalPriceHigh,
        // Multi-service fields
        lineItems: isMultiService ? lineItems : undefined,
        isMultiService,
        estimatedDaysLow: totalDaysLow,
        estimatedDaysHigh: totalDaysHigh,
        // Status
        status: "draft",
        isUnlocked: true,
        // Photo count
        photoCount: photos.length,
      };

      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(proposalData),
      });

      if (!response.ok) {
        throw new Error("Failed to save proposal");
      }

      const savedProposal = await response.json();
      setSavedProposalId(savedProposal.id);

      // Now open the email modal
      setEmailModalOpen(true);
    } catch (error) {
      console.error("Error saving proposal for email:", error);
      toast({
        title: t.common.error,
        description: t.generator.failedToSaveDraft,
        variant: "destructive",
      });
    } finally {
      setIsSavingForEmail(false);
    }
  };

  const renderServiceCard = (service: ServiceItem, index: number) => {
    const jobType = getJobTypeForService(service);
    const trade = availableTemplates.find((t) => t.id === service.tradeId);
    const localizedJobTypes = trade
      ? getLocalizedJobTypes(trade, language)
      : [];

    return (
      <div
        key={service.id}
        className={cn(
          "border rounded-lg p-4 space-y-4 bg-white",
          services.length > 1 && "border-l-4 border-l-secondary",
        )}
        data-testid={`service-card-${index}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {services.length > 1 && (
              <GripVertical className="w-4 h-4 text-slate-400" />
            )}
            <span className="text-sm font-bold text-slate-600">
              {t.generator.service} {index + 1}
            </span>
          </div>
          {services.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeService(service.id)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              data-testid={`button-remove-service-${index}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Trade Selection */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            {t.generator.tradeCategory}
          </label>
          <Select
            onValueChange={(val) => handleTradeChange(service.id, val)}
            value={service.tradeId}
          >
            <SelectTrigger data-testid={`select-trade-${index}`}>
              <SelectValue placeholder={t.generator.selectTrade} />
            </SelectTrigger>
            <SelectContent>
              {availableTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.trade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Job Type Selection */}
        {service.tradeId && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <label className="text-sm font-medium mb-1.5 block">
              {t.generator.jobType}
            </label>
            <Select
              onValueChange={(val) => handleJobTypeChange(service.id, val)}
              value={service.jobTypeId}
            >
              <SelectTrigger data-testid={`select-jobtype-${index}`}>
                <SelectValue placeholder={t.generator.selectJobType} />
              </SelectTrigger>
              <SelectContent>
                {localizedJobTypes.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Area of Home Selection - Trade-Aware */}
        {service.jobTypeId &&
          (() => {
            const areaOptions = getAreaOptionsForTrade(service.tradeId, t);
            return areaOptions.length > 0 ? (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-medium mb-1.5 block">
                  {t.generator.areaOfHome}
                </label>
                <Select
                  value={service.homeArea}
                  onValueChange={(val) =>
                    updateService(service.id, { homeArea: val })
                  }
                >
                  <SelectTrigger data-testid={`select-home-area-${index}`}>
                    <SelectValue placeholder={t.generator.selectArea} />
                  </SelectTrigger>
                  <SelectContent>
                    {areaOptions.map((area) => (
                      <SelectItem key={area.value} value={area.value}>
                        {area.label}
                        {areaMultipliers[area.value] &&
                          areaMultipliers[area.value] !== 1.0 && (
                            <span
                              className={`ml-2 text-xs ${areaMultipliers[area.value] > 1 ? "text-orange-600" : "text-green-600"}`}
                            >
                              {areaMultipliers[area.value] > 1 ? "+" : ""}
                              {Math.round(
                                (areaMultipliers[area.value] - 1) * 100,
                              )}
                              %
                            </span>
                          )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null;
          })()}

        {/* Window Quantity + Size - for window-replacement job type */}
        {service.tradeId === "windows-doors" && service.jobTypeId === "window-replacement" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
                🪟
              </span>
              Window Details
            </h4>
            
            {/* Quantity with Stepper */}
            <div>
              <label className="text-sm font-medium mb-2 block text-slate-700">
                Number of Windows
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-lg bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      const newQty = Math.max(WINDOW_DEFAULTS.minQuantity, (service.windowQuantity || 1) - 1);
                      updateService(service.id, { windowQuantity: newQty });
                    }}
                    disabled={service.windowQuantity <= WINDOW_DEFAULTS.minQuantity}
                    className="px-3 py-2 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    data-testid={`button-window-qty-minus-${index}`}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={WINDOW_DEFAULTS.minQuantity}
                    max={WINDOW_DEFAULTS.maxQuantity}
                    value={service.windowQuantity || WINDOW_DEFAULTS.quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && isValidWindowQuantity(val)) {
                        updateService(service.id, { windowQuantity: val });
                      }
                    }}
                    className="w-16 text-center py-2 border-x focus:outline-none focus:ring-1 focus:ring-blue-500"
                    data-testid={`input-window-qty-${index}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newQty = Math.min(WINDOW_DEFAULTS.maxQuantity, (service.windowQuantity || 1) + 1);
                      updateService(service.id, { windowQuantity: newQty });
                    }}
                    disabled={service.windowQuantity >= WINDOW_DEFAULTS.maxQuantity}
                    className="px-3 py-2 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    data-testid={`button-window-qty-plus-${index}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-slate-500">
                  {service.windowQuantity === 1 ? "window" : "windows"}
                </span>
              </div>
            </div>

            {/* Size Preset Dropdown */}
            <div>
              <label className="text-sm font-medium mb-2 block text-slate-700">
                Window Size
              </label>
              <Select
                value={service.windowSizePreset || WINDOW_DEFAULTS.sizePreset}
                onValueChange={(val) =>
                  updateService(service.id, { 
                    windowSizePreset: val,
                    // Clear custom dimensions when switching to preset
                    windowWidthIn: val === "custom" ? service.windowWidthIn : null,
                    windowHeightIn: val === "custom" ? service.windowHeightIn : null,
                  })
                }
              >
                <SelectTrigger className="bg-white" data-testid={`select-window-size-${index}`}>
                  <SelectValue placeholder="Select window size" />
                </SelectTrigger>
                <SelectContent>
                  {WINDOW_SIZE_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                      {preset.value !== "custom" && (
                        <span className="ml-2 text-xs text-slate-500">
                          {(() => {
                            const dims = { width: preset.width, height: preset.height };
                            const mult = getWindowSizeMultiplier(dims.width, dims.height);
                            if (mult < 1) return "(smaller)";
                            if (mult > 1) return "(larger)";
                            return "";
                          })()}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Dimensions - only shown when "custom" selected */}
            {service.windowSizePreset === "custom" && (
              <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-slate-700">
                    Width (inches)
                  </label>
                  <Input
                    type="number"
                    min={WINDOW_DEFAULTS.minCustomDimension}
                    max={WINDOW_DEFAULTS.maxCustomDimension}
                    placeholder="e.g., 36"
                    value={service.windowWidthIn || ""}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value, 10) : null;
                      updateService(service.id, { windowWidthIn: val });
                    }}
                    className={cn(
                      "bg-white",
                      service.windowWidthIn && !isValidCustomDimension(service.windowWidthIn) && "border-red-500"
                    )}
                    data-testid={`input-window-width-${index}`}
                  />
                  {service.windowWidthIn && !isValidCustomDimension(service.windowWidthIn) && (
                    <p className="text-xs text-red-500 mt-1">
                      Must be {WINDOW_DEFAULTS.minCustomDimension}-{WINDOW_DEFAULTS.maxCustomDimension}&quot;
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block text-slate-700">
                    Height (inches)
                  </label>
                  <Input
                    type="number"
                    min={WINDOW_DEFAULTS.minCustomDimension}
                    max={WINDOW_DEFAULTS.maxCustomDimension}
                    placeholder="e.g., 48"
                    value={service.windowHeightIn || ""}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value, 10) : null;
                      updateService(service.id, { windowHeightIn: val });
                    }}
                    className={cn(
                      "bg-white",
                      service.windowHeightIn && !isValidCustomDimension(service.windowHeightIn) && "border-red-500"
                    )}
                    data-testid={`input-window-height-${index}`}
                  />
                  {service.windowHeightIn && !isValidCustomDimension(service.windowHeightIn) && (
                    <p className="text-xs text-red-500 mt-1">
                      Must be {WINDOW_DEFAULTS.minCustomDimension}-{WINDOW_DEFAULTS.maxCustomDimension}&quot;
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Price impact summary */}
            <div className="text-xs text-blue-700 bg-blue-100 rounded px-3 py-2">
              {(() => {
                const qty = service.windowQuantity || WINDOW_DEFAULTS.quantity;
                const preset = service.windowSizePreset || WINDOW_DEFAULTS.sizePreset;
                const dims = getEffectiveDimensions(preset, service.windowWidthIn ?? undefined, service.windowHeightIn ?? undefined);
                const sizeMultiplier = getWindowSizeMultiplier(dims.width, dims.height);
                return (
                  <span>
                    <strong>{qty}</strong> × {preset === "custom" && service.windowWidthIn && service.windowHeightIn 
                      ? `${service.windowWidthIn}"×${service.windowHeightIn}"`
                      : WINDOW_SIZE_PRESETS.find(p => p.value === preset)?.label || "standard"
                    }
                    {sizeMultiplier !== 1.0 && (
                      <span className={sizeMultiplier < 1 ? "text-green-700" : "text-orange-700"}>
                        {" "}({sizeMultiplier < 1 ? "-" : "+"}{Math.round(Math.abs(sizeMultiplier - 1) * 100)}% size adjustment)
                      </span>
                    )}
                  </span>
                );
              })()}
            </div>
          </div>
        )}

        {/* Footage Input - for trades that use sq/linear ft pricing */}
        {service.jobTypeId && usesFootagePricing(service.tradeId) && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <label className="text-sm font-medium mb-1.5 block">
              {usesFootagePricing(service.tradeId) === "sqft"
                ? t.generator.squareFootage
                : t.generator.linearFootage}
              <span className="text-xs text-slate-500 ml-1">
                {t.generator.optionalForPricing}
              </span>
            </label>
            <Input
              type="number"
              min={0}
              placeholder={getFootagePlaceholder(service.tradeId)}
              value={service.footage || ""}
              onChange={(e) => {
                const value = e.target.value
                  ? parseInt(e.target.value, 10)
                  : null;
                updateService(service.id, { footage: value });
              }}
              data-testid={`input-footage-${index}`}
              className="bg-white"
            />
            {service.footage && service.footage > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                {usesFootagePricing(service.tradeId) === "sqft"
                  ? `${service.footage.toLocaleString()} sq ft`
                  : `${service.footage.toLocaleString()} linear ft`}
                {pricePerUnit[service.tradeId] &&
                  (() => {
                    const pricing =
                      usesFootagePricing(service.tradeId) === "sqft"
                        ? pricePerUnit[service.tradeId].sqft
                        : pricePerUnit[service.tradeId].linear;
                    if (pricing) {
                      return ` @ $${pricing.low}-$${pricing.high}/ft`;
                    }
                    return "";
                  })()}
              </p>
            )}
          </div>
        )}

        {/* Job Size & Options */}
        {jobType && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 pt-2 border-t">
            {/* Job Size */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">
                  {t.generator.jobSize}
                </label>
                <span className="text-xs font-bold text-secondary uppercase">
                  {service.jobSize === 1
                    ? t.generator.small
                    : service.jobSize === 2
                      ? t.generator.medium
                      : t.generator.large}
                </span>
              </div>
              <Slider
                min={1}
                max={3}
                step={1}
                value={[service.jobSize]}
                onValueChange={(vals) =>
                  updateService(service.id, { jobSize: vals[0] })
                }
                className="py-2"
                data-testid={`slider-size-${index}`}
              />
            </div>

            {/* Options */}
            {jobType.options.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium">
                  {t.generator.jobOptions}
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {jobType.options.map((option) =>
                    option.type === "select" && option.choices ? (
                      <div
                        key={option.id}
                        className="rounded-md border p-3 bg-slate-50"
                      >
                        <label className="text-sm font-medium block mb-1.5">
                          {option.label}
                        </label>
                        <Select
                          onValueChange={(val) =>
                            updateService(service.id, {
                              options: { ...service.options, [option.id]: val },
                            })
                          }
                          value={(service.options[option.id] as string) || ""}
                        >
                          <SelectTrigger
                            className="bg-white"
                            data-testid={`select-option-${option.id}-${index}`}
                          >
                            <SelectValue placeholder={t.common.selectOption} />
                          </SelectTrigger>
                          <SelectContent>
                            {option.choices.map((choice) => (
                              <SelectItem
                                key={choice.value}
                                value={choice.value}
                              >
                                {choice.label}
                                {choice.priceModifier !== 0 && (
                                  <span
                                    className={`ml-2 text-xs ${choice.priceModifier > 0 ? "text-orange-600" : "text-green-600"}`}
                                  >
                                    {choice.priceModifier > 0 ? "+" : ""}
                                    {choice.priceModifier < 0 ? "-" : ""}$
                                    {Math.abs(
                                      choice.priceModifier,
                                    ).toLocaleString()}
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <label
                        key={option.id}
                        className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-slate-50 transition-colors cursor-pointer bg-white"
                        htmlFor={`checkbox-${option.id}-${index}`}
                      >
                        <Checkbox
                          id={`checkbox-${option.id}-${index}`}
                          checked={
                            (service.options[option.id] as boolean) || false
                          }
                          onCheckedChange={(checked) =>
                            updateService(service.id, {
                              options: {
                                ...service.options,
                                [option.id]: checked,
                              },
                            })
                          }
                          data-testid={`checkbox-option-${option.id}-${index}`}
                        />
                        <div className="space-y-1 leading-none flex-1">
                          <span className="cursor-pointer flex justify-between text-sm font-medium">
                            <span>{option.label}</span>
                            {option.priceModifier &&
                              option.priceModifier !== 0 && (
                                <span
                                  className={`text-xs ${option.priceModifier > 0 ? "text-orange-600" : "text-green-600"}`}
                                >
                                  {option.priceModifier > 0 ? "+" : ""}
                                  {option.priceModifier < 0 ? "-" : ""}$
                                  {Math.abs(
                                    option.priceModifier,
                                  ).toLocaleString()}
                                </span>
                              )}
                          </span>
                        </div>
                      </label>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      {/* Suspense boundary for search params handling */}
      <Suspense fallback={null}>
        <TradeParamHandler
          onTradeParam={handleTradeParam}
          availableTemplates={availableTemplates}
          draftRestored={draftRestored}
        />
      </Suspense>
      <div className="bg-slate-50 flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN: Form / Controls */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-t-4 border-t-primary shadow-md">
                <CardContent className="p-6">
                  <div className="mb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-heading font-bold flex items-center gap-2">
                          <Wand2 className="w-5 h-5 text-secondary" />
                          {t.generator.title}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {t.generator.subtitle}
                        </p>
                      </div>

                      {/* Draft saved indicator */}
                      {(lastSavedRelative ||
                        isAutoSaving ||
                        hasUnsavedChanges) && (
                        <div
                          className="flex items-center gap-1.5 text-xs text-muted-foreground"
                          data-testid="draft-save-indicator"
                        >
                          {isAutoSaving ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : hasUnsavedChanges ? (
                            <>
                              <span className="w-2 h-2 bg-amber-400 rounded-full" />
                              <span>Unsaved</span>
                            </>
                          ) : lastSavedRelative ? (
                            <>
                              <Check className="w-3 h-3 text-green-600" />
                              <span className="text-green-700">
                                Saved {lastSavedRelative}
                              </span>
                            </>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* Draft restored banner */}
                    {draftRestored && (
                      <div
                        className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-sm"
                        data-testid="draft-restored-banner"
                      >
                        <span className="text-blue-700">
                          ✓ Draft restored from previous session
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                          onClick={handleResetAll}
                          data-testid="button-reset-draft"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Reset
                        </Button>
                      </div>
                    )}
                  </div>

                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-6"
                      data-testid="proposal-form"
                    >
                      {/* Client Info - Draft-first: These are optional for generating drafts */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                            Optional for Draft
                          </span>
                          <span>Required to export/send</span>
                        </div>

                        {/* Customer (ScopeScan-style memory) */}
                        <div className="space-y-2" data-testid="customer-picker">
                          <label className="text-sm font-medium">Customer</label>
                          <CustomerPicker
                            value={selectedCustomer}
                            onChange={(customer) => {
                              setSelectedCustomer(customer);
                              if (customer) {
                                form.setValue("clientName", customer.name, {
                                  shouldDirty: true,
                                });
                                clearFinalizeErrors();
                              }
                            }}
                            disabled={isGenerating}
                            placeholder="Search customers or add new…"
                          />
                          <p className="text-xs text-muted-foreground">
                            Pick a saved customer (name + phone/email) like
                            ScopeScan.
                          </p>
                        </div>

                        <FormField
                          control={form.control}
                          name="clientName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.generator.clientName}</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={
                                    t.generator.clientNamePlaceholder
                                  }
                                  {...field}
                                  id="client-name"
                                  data-testid="input-client-name"
                                  data-test="client-name"
                                  className={cn(
                                    finalizeErrors.clientName &&
                                      "border-red-500 focus-visible:ring-red-500",
                                  )}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    clearFinalizeErrors();
                                    if (
                                      selectedCustomer &&
                                      e.target.value.trim() !==
                                        selectedCustomer.name.trim()
                                    ) {
                                      setSelectedCustomer(null);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                              {/* Draft-first: Show finalize validation error */}
                              {finalizeErrors.clientName && (
                                <p
                                  className="text-sm text-red-500 mt-1"
                                  data-testid="error-client-name"
                                >
                                  {finalizeErrors.clientName}
                                </p>
                              )}
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem data-test="job-address">
                              <FormLabel>{t.generator.jobAddress}</FormLabel>
                              <FormControl>
                                <JobAddressField
                                  value={field.value || ""}
                                  onChange={(value) => {
                                    field.onChange(value);
                                    clearFinalizeErrors();
                                  }}
                                  onResolvedPlace={(place) => {
                                    resolvedPlaceRef.current = place;
                                    // Best-effort: save resolved address to selected customer memory.
                                    if (selectedCustomer) {
                                      void saveResolvedAddressForCustomer(
                                        selectedCustomer,
                                        place.formattedAddress,
                                      );
                                    }
                                  }}
                                  placeholder={
                                    t.generator.jobAddressPlaceholder
                                  }
                                  data-testid="input-address"
                                  className={cn(
                                    finalizeErrors.address && "border-red-500",
                                  )}
                                />
                              </FormControl>
                              <FormMessage />
                              {/* Draft-first: Show finalize validation error */}
                              {finalizeErrors.address && (
                                <p
                                  className="text-sm text-red-500 mt-1"
                                  data-testid="error-address"
                                >
                                  {finalizeErrors.address}
                                </p>
                              )}
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="h-px bg-border" />

                      {/* Services Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                            {t.generator.services}
                          </h3>
                          {services.length > 0 && (
                            <span className="text-xs text-slate-500">
                              {
                                services.filter((s) => s.tradeId && s.jobTypeId)
                                  .length
                              }{" "}
                              {t.generator.servicesAdded}
                            </span>
                          )}
                        </div>

                        <div className="space-y-4">
                          {services.map((service, index) =>
                            renderServiceCard(service, index),
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-dashed border-2 hover:border-secondary hover:bg-secondary/5"
                          onClick={addService}
                          data-testid="button-add-service"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {t.generator.addAnotherService}
                        </Button>
                      </div>

                      {/* Photo Upload Section */}
                      {hasValidServices && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Camera className="w-4 h-4 text-secondary" />
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                              {t.generator.photos || "Job Site Photos"}
                            </h3>
                            <span className="text-xs text-slate-500 font-normal normal-case">
                              ({t.generator.photosOptional || "optional"})
                            </span>
                          </div>
                          <ProposalPhotoUpload
                            photos={photos}
                            onPhotosChange={setPhotos}
                            maxPhotos={10}
                            disabled={isGenerating}
                            proposalId={savedProposalId}
                            ensureProposalId={ensureProposalIdForPhotos}
                            learningContext={{
                              tradeId: services[0]?.tradeId,
                              jobTypeId: services[0]?.jobTypeId,
                            }}
                            enableLearning={true}
                          />
                        </div>
                      )}

                      {/* Total Price Summary */}
                      {hasValidServices && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 animate-in fade-in">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-slate-700">
                              {t.generator.totalEstimate}
                            </span>
                            <span className="text-lg font-bold text-primary">
                              $
                              {previewData.priceRange?.low?.toLocaleString() ||
                                0}{" "}
                              - $
                              {previewData.priceRange?.high?.toLocaleString() ||
                                0}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-slate-500">
                            <span>{t.generator.estimatedDuration}</span>
                            <span>
                              {previewData.estimatedDays?.low || 0} -{" "}
                              {previewData.estimatedDays?.high || 0}{" "}
                              {t.generator.days}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Market Pricing Insights */}
                      {services[0]?.tradeId && watchedValues.address && (
                        <CostInsights
                          tradeId={services[0].tradeId}
                          address={watchedValues.address}
                        />
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 text-lg"
                        disabled={isGenerating || !hasValidServices}
                        data-testid="button-generate-proposal"
                        data-test="generate-draft"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                            {t.generator.generating}
                          </>
                        ) : (
                          <>
                            {t.generator.generateProposal}{" "}
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN: Preview */}
            <div className="lg:col-span-8">
              {!hasValidServices && (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-8 text-center">
                  <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                    <FileText className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">
                    {t.generator.readyToStart}
                  </h3>
                  <p className="max-w-xs mx-auto mt-2">
                    {t.generator.readyToStartDesc}
                  </p>
                </div>
              )}

              {hasValidServices && (
                <div className="relative animate-in fade-in duration-700">
                  {/* Toolbar */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="font-heading font-bold text-xl text-slate-700">
                        {t.generator.livePreview}
                      </h3>
                      {/* Autosave status in toolbar */}
                      {lastSavedRelative && !hasUnsavedChanges && (
                        <span
                          className="text-xs text-green-600 flex items-center gap-1"
                          data-testid="toolbar-save-status"
                        >
                          <Check className="w-3 h-3" />
                          Saved {lastSavedRelative}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {/* Reset Draft button */}
                      {step === 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-slate-500 hover:text-red-600 hover:bg-red-50"
                          onClick={handleResetAll}
                          data-testid="button-reset-draft-toolbar"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Reset
                        </Button>
                      )}
                      {step === 2 && user && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={handleEnhanceScope}
                          disabled={isEnhancing}
                          data-testid="button-enhance-scope"
                        >
                          {isEnhancing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          {isEnhancing
                            ? t.generator.enhancing
                            : t.generator.enhanceWithAI}
                        </Button>
                      )}
                      {step === 2 && user && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={handleSaveDraft}
                          disabled={isSavingDraft}
                          data-testid="button-save-draft"
                        >
                          {isSavingDraft ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          {t.generator.saveDraft}
                        </Button>
                      )}
                      {/* Draft-first: Download requires client info */}
                      {step === 2 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "gap-2",
                            !hasFinalizeFields && "opacity-75",
                          )}
                          onClick={handleDownload}
                          disabled={isDownloading}
                          data-testid="button-download-pdf"
                          data-test="export-pdf"
                          title={getExportTooltip()}
                        >
                          {isDownloading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          {isDownloading
                            ? t.generator.generatingPDF
                            : t.generator.downloadPDF}
                        </Button>
                      )}
                      {/* Draft-first: Email requires client info */}
                      {step === 2 && user && (
                        <Button
                          variant="default"
                          size="sm"
                          className={cn(
                            "gap-2 bg-blue-600 hover:bg-blue-700",
                            !hasFinalizeFields && "opacity-75",
                          )}
                          onClick={handleEmailClick}
                          disabled={isSavingForEmail}
                          data-testid="button-email-proposal"
                          title={getExportTooltip()}
                        >
                          {isSavingForEmail ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Mail className="w-4 h-4" />
                          )}
                          {isSavingForEmail
                            ? "Saving..."
                            : t.generator.emailProposal || "Email Proposal"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Desktop Preview with Toolbar */}
              <div className="hidden lg:block">
                {!hasValidServices ? (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-8 text-center">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                      <FileText className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">
                      {t.generator.readyToStart}
                    </h3>
                    <p className="max-w-xs mx-auto mt-2">
                      {t.generator.readyToStartDesc}
                    </p>
                  </div>
                ) : (
                  <div className="relative animate-in fade-in duration-700">
                    {/* Toolbar */}
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-heading font-bold text-xl text-slate-700">
                        {t.generator.livePreview}
                      </h3>
                      <div className="flex gap-2 flex-wrap">
                        {step === 2 && user && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={handleEnhanceScope}
                            disabled={isEnhancing}
                            data-testid="button-enhance-scope"
                          >
                            {isEnhancing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                            {isEnhancing
                              ? t.generator.enhancing
                              : t.generator.enhanceWithAI}
                          </Button>
                        )}
                        {step === 2 && user && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={handleSaveDraft}
                            disabled={isSavingDraft}
                            data-testid="button-save-draft"
                          >
                            {isSavingDraft ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            {t.generator.saveDraft}
                          </Button>
                        )}
                        {/* Draft-first: Download requires client info */}
                        {step === 2 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "gap-2",
                              !hasFinalizeFields && "opacity-75",
                            )}
                            onClick={handleDownload}
                            disabled={isDownloading}
                            data-testid="button-download-pdf"
                            data-test="export-pdf"
                            title={
                              !hasFinalizeFields
                                ? "Add client name and address to download"
                                : undefined
                            }
                          >
                            {isDownloading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                            {isDownloading
                              ? t.generator.generatingPDF
                              : t.generator.downloadPDF}
                          </Button>
                        )}
                        {/* Draft-first: Email requires client info */}
                        {step === 2 && user && (
                          <Button
                            variant="default"
                            size="sm"
                            className={cn(
                              "gap-2 bg-blue-600 hover:bg-blue-700",
                              !hasFinalizeFields && "opacity-75",
                            )}
                            onClick={handleEmailClick}
                            disabled={isSavingForEmail}
                            data-testid="button-email-proposal"
                            title={
                              !hasFinalizeFields
                                ? "Add client name and address to send"
                                : undefined
                            }
                          >
                            {isSavingForEmail ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                            {isSavingForEmail
                              ? "Saving..."
                              : t.generator.emailProposal || "Email Proposal"}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Draft-first: Show info banner when client info is missing */}
                    {step === 2 && !hasFinalizeFields && (
                      <div
                        className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800"
                        data-testid="banner-finalize-required"
                      >
                        <strong>Draft Mode:</strong> Add client name and job
                        address to download PDF or send email.
                      </div>
                    )}

                    {/* The Document - Desktop */}
                    <div data-testid="proposal-preview-container" id="proposal-preview">
                      <ProposalPreview
                        ref={previewRef}
                        data={previewData}
                        companyInfo={
                          user
                            ? {
                                companyName: user.companyName,
                                companyAddress: user.companyAddress,
                                companyPhone: user.companyPhone,
                                companyLogo: user.companyLogo,
                              }
                            : undefined
                        }
                        photos={previewData.photos}
                        showPhotos={photos.length > 0}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Preview Drawer */}
              <ProposalPreviewPane
                ref={previewPaneRef}
                data={previewData}
                companyInfo={
                  user
                    ? {
                        companyName: user.companyName,
                        companyAddress: user.companyAddress,
                        companyPhone: user.companyPhone,
                        companyLogo: user.companyLogo,
                      }
                    : undefined
                }
                photos={previewData.photos}
                showPhotos={photos.length > 0}
                hasValidServices={hasValidServices}
                drawerLabel={t.generator.livePreview || "Preview"}
                emptyStateTitle={t.generator.readyToStart}
                emptyStateDescription={t.generator.readyToStartDesc}
                className="lg:hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {savedProposalId && (
        <EmailProposalModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          proposalId={savedProposalId}
          clientName={watchedValues.clientName || ""}
          onSuccess={() => {
            toast({
              title: t.common.success,
              description:
                t.generator.proposalSent || "Proposal sent successfully!",
            });
          }}
        />
      )}
    </Layout>
  );
}

export default function Generator() {
  return (
    <Suspense
      fallback={
        <Layout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </Layout>
      }
    >
      <GeneratorContent />
    </Suspense>
  );
}
