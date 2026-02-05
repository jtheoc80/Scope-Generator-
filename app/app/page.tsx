'use client';
// Force dynamic rendering to prevent static generation errors
// This page uses useAuth() which requires QueryClientProvider
export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LayoutWrapper from "@/components/layout-wrapper";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { templates, JobType, getLocalizedJobType, getLocalizedJobTypes } from "@/lib/proposal-data";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Loader2, ChevronRight, Wand2, Download, FileText, Sparkles, Plus, Trash2, GripVertical, Save, Mail, Lock, Unlock } from "lucide-react";
import JobAddressField from "@/components/job-address-field";
import EmailProposalModal from "@/components/email-proposal-modal";
import PaywallModal from "@/components/paywall-modal";
import ProposalPreview from "@/components/proposal-preview";
import { CostInsights } from "@/components/cost-insights";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getRegionalMultiplier } from "@/lib/regional-pricing";
import { cn } from "@/lib/utils";


// Service item interface for multi-trade support
interface ServiceItem {
  id: string;
  tradeId: string;
  jobTypeId: string;
  jobSize: number;
  homeArea: string;
  footage: number | null; // Square feet or linear feet depending on trade
  options: Record<string, boolean | string>;
}

// Area-based price multipliers - different areas cost more/less
const areaMultipliers: Record<string, number> = {
  // Bathroom areas
  "master-bathroom": 1.25,
  "bathroom": 1.0,
  "guest-bathroom": 0.95,
  "half-bath": 0.7,

  // Kitchen areas
  "kitchen": 1.0,
  "kitchenette": 0.6,
  "outdoor-kitchen": 1.4,

  // Interior rooms - based on typical size/complexity
  "living-room": 1.0,
  "dining-room": 0.85,
  "bedroom": 0.9,
  "master-bedroom": 1.15,
  "hallway": 0.5,
  "home-office": 0.8,
  "closet": 0.4,
  "mudroom": 0.5,
  "basement": 1.5,
  "attic": 1.3,
  "whole-house": 3.5,

  // Exterior areas
  "front-yard": 1.0,
  "backyard": 1.1,
  "side-yard": 0.6,
  "patio": 0.8,
  "deck": 1.0,
  "driveway": 1.2,
  "walkway": 0.5,
  "garage": 0.9,
  "carport": 0.7,
  "exterior-full": 2.8,

  // Roofing areas
  "main-roof": 1.0,
  "garage-roof": 0.4,
  "porch-roof": 0.35,
  "addition-roof": 0.5,
  "full-roof": 1.0,
};

// Trades that use square footage for pricing
const squareFootageTrades = ["painting", "flooring", "drywall", "roofing", "concrete", "decks-patios", "landscape"];

// Trades that use linear footage for pricing  
const linearFootageTrades = ["fencing"];

// Price per unit by trade and job type (will use base if not found)
const pricePerUnit: Record<string, { sqft?: { low: number; high: number }; linear?: { low: number; high: number } }> = {
  "painting": { sqft: { low: 2.5, high: 4.5 } },
  "flooring": { sqft: { low: 6, high: 14 } },
  "drywall": { sqft: { low: 2, high: 4 } },
  "roofing": { sqft: { low: 4, high: 9 } },
  "concrete": { sqft: { low: 8, high: 16 } },
  "fencing": { linear: { low: 25, high: 55 } },
  "decks-patios": { sqft: { low: 25, high: 65 } },
  "landscape": { sqft: { low: 3, high: 12 } },
};

// Check if trade uses footage-based pricing
const usesFootagePricing = (tradeId: string): "sqft" | "linear" | null => {
  if (squareFootageTrades.includes(tradeId)) return "sqft";
  if (linearFootageTrades.includes(tradeId)) return "linear";
  return null;
};

// Get footage label for trade (now takes translations)
const getFootageLabel = (tradeId: string, t: any): string => {
  const type = usesFootagePricing(tradeId);
  if (type === "sqft") return t.generator.squareFootageLabel;
  if (type === "linear") return t.generator.linearFootageLabel;
  return "";
};

// Get footage placeholder for trade
const getFootagePlaceholder = (tradeId: string): string => {
  const type = usesFootagePricing(tradeId);
  if (type === "sqft") return "e.g., 400 sq ft";
  if (type === "linear") return "e.g., 150 linear ft";
  return "";
};

// Form Schema
const formSchema = z.object({
  clientName: z.string().min(2, "Client name is required"),
  address: z.string().min(5, "Address is required"),
});

// Trade-aware area options with translation keys
const areaLabelKeys: Record<string, string> = {
  "living-room": "livingRoom",
  "dining-room": "diningRoom",
  "bedroom": "bedroom",
  "master-bedroom": "masterBedroom",
  "hallway": "hallway",
  "home-office": "homeOffice",
  "closet": "closet",
  "mudroom": "mudroom",
  "basement": "basement",
  "attic": "attic",
  "whole-house": "wholeHouseInterior",
  "bathroom": "bathroom",
  "master-bathroom": "masterBathroom",
  "half-bath": "halfBath",
  "guest-bathroom": "guestBathroom",
  "kitchen": "kitchen",
  "kitchenette": "kitchenette",
  "outdoor-kitchen": "outdoorKitchen",
  "front-yard": "frontYard",
  "backyard": "backyard",
  "side-yard": "sideYard",
  "patio": "patio",
  "deck": "deck",
  "driveway": "driveway",
  "walkway": "walkway",
  "garage": "garage",
  "carport": "carport",
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
  return value.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const interiorRoomValues = [
  "living-room", "dining-room", "bedroom", "master-bedroom", "hallway",
  "home-office", "closet", "mudroom", "basement", "attic", "whole-house"
];

const bathroomAreaValues = ["bathroom", "master-bathroom", "half-bath", "guest-bathroom"];

const kitchenAreaValues = ["kitchen", "kitchenette", "outdoor-kitchen"];

const exteriorAreaValues = [
  "front-yard", "backyard", "side-yard", "patio", "deck",
  "driveway", "walkway", "garage", "carport", "exterior-full"
];

const roofingAreaValues = ["main-roof", "garage-roof", "porch-roof", "addition-roof", "full-roof"];

const getAreaOptionsForTrade = (tradeId: string, t: any): { value: string; label: string }[] => {
  const toOptions = (values: string[]) => values.map(v => ({ value: v, label: getLocalizedLabel(v, t) }));

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
      return toOptions(exteriorAreaValues);
    case "plumbing":
    case "electrical":
    case "handyman":
      return toOptions([...bathroomAreaValues, ...kitchenAreaValues, ...interiorRoomValues.filter(r => r !== "whole-house"), "whole-house"]);
    case "windows-doors":
      return toOptions([...interiorRoomValues.filter(r => !["whole-house", "closet"].includes(r)), ...exteriorAreaValues.filter(r => ["patio", "garage"].includes(r))]);
    default:
      return toOptions([...interiorRoomValues, ...exteriorAreaValues]);
  }
};


export default function Generator() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <GeneratorContent />
    </Suspense>
  );
}

function GeneratorContent() {
  const [_step, setStep] = useState<1 | 2>(1);
  // ... rest of the component ...
  const [services, setServices] = useState<ServiceItem[]>([
    { id: crypto.randomUUID(), tradeId: "", jobTypeId: "", jobSize: 2, homeArea: "", footage: null, options: {} }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [enhancedScopes, setEnhancedScopes] = useState<Record<string, string[]>>({});
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [savedProposalId, setSavedProposalId] = useState<number | null>(null);
  const [isProposalUnlocked, setIsProposalUnlocked] = useState<boolean>(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [isSavingForEmail, setIsSavingForEmail] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const searchParams = useSearchParams();
  const [isLoadingDraft, setIsLoadingDraft] = useState(!!searchParams.get("edit"));
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const { data: billingStatus } = useQuery<{ canAccessPremiumFeatures: boolean }>({
    queryKey: ["/api/billing/status"],
  });
  const { t, language } = useLanguage();
  const previewRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      address: "",
    },
  });

  const watchedValues = form.watch();

  // Track if we've already loaded the current editId
  const loadedEditIdRef = useRef<string | null>(null);

  useEffect(() => {
    const editId = searchParams.get("edit");

    // reset loaded state if editId changes (e.g. user navigates from one edit to another directly)
    if (editId !== loadedEditIdRef.current) {
      loadedEditIdRef.current = null;
    }

    if (editId && loadedEditIdRef.current !== editId) {
      setIsLoadingDraft(true);
      loadedEditIdRef.current = editId;

      // Add timestamp to prevent caching of the proposal data
      fetch(`/api/proposals/${editId}?t=${Date.now()}`, {
        credentials: "include",
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            setSavedProposalId(data.id);
            setIsProposalUnlocked(data.isUnlocked ?? false);
            form.reset({
              clientName: data.clientName || "",
              address: data.address || "",
            });

            // Reconstruct service from saved draft
            if (data.lineItems && data.lineItems.length > 0) {
              // Restore from lineItems (multi-service support)
              const restoredServices = data.lineItems.map((item: any) => ({
                id: item.id || crypto.randomUUID(),
                tradeId: item.tradeId,
                jobTypeId: item.jobTypeId,
                jobSize: item.jobSize || 2,
                homeArea: (item.options?.homeArea as string) || (item.homeArea as string) || "",
                footage: (item.options?.footage as number) || (item.footage as number) || null,
                options: item.options || {}
              }));
              setServices(restoredServices);

              // Restore specific scopes
              const newScopes: Record<string, string[]> = {};
              data.lineItems.forEach((item: any) => {
                if (item.scope && Array.isArray(item.scope)) {
                  // If ID was missing from item, map it by index (risky but fallback)
                  // Ideally item has ID. We generated IDs in restoredServices above.
                  // Let's assume restored match index order if IDs missing.
                  const serviceId = item.id || restoredServices.find((s: any) => s.tradeId === item.tradeId)?.id;
                  if (serviceId) {
                    newScopes[serviceId] = item.scope;
                  }
                }
              });
              setEnhancedScopes(newScopes);

            } else if (data.tradeId && data.jobTypeId) {
              // Legacy single-service restore
              const newServiceId = crypto.randomUUID();

              // Extract non-boolean options (homeArea, footage) if they were saved in options
              const homeArea = data.options?.homeArea || "";
              const footage = data.options?.footage || null;

              const restoredService: ServiceItem = {
                id: newServiceId,
                tradeId: data.tradeId,
                jobTypeId: data.jobTypeId,
                jobSize: data.jobSize || 2,
                homeArea: homeArea as string,
                footage: footage as number | null,
                options: data.options || {}
              };
              setServices([restoredService]);

              // Restore specific scope if it was customized/enhanced
              if (data.scope && Array.isArray(data.scope)) {
                setEnhancedScopes(prev => ({
                  ...prev,
                  [newServiceId]: data.scope
                }));
              }
            }
          }
        })
        .catch(console.error)
        .finally(() => setIsLoadingDraft(false));
    } else if (!editId) {
      setIsLoadingDraft(false);
    }
  }, [searchParams, form]);

  const userSelectedTrades = user?.selectedTrades || [];
  const availableTemplates = templates.filter(t =>
    userSelectedTrades.length === 0 ||
    userSelectedTrades.includes(t.id) ||
    services.some(s => s.tradeId === t.id)
  );



  const getJobTypeForService = (service: ServiceItem): JobType | null => {
    const trade = availableTemplates.find((t) => t.id === service.tradeId);
    const jobType = trade?.jobTypes.find((j) => j.id === service.jobTypeId) || null;
    if (!jobType || !trade) return null;
    return getLocalizedJobType(jobType, trade.id, language);
  };

  const updateService = (serviceId: string, updates: Partial<ServiceItem>) => {
    setServices(prev => prev.map(s =>
      s.id === serviceId ? { ...s, ...updates } : s
    ));
  };

  const addService = () => {
    setServices(prev => [...prev, {
      id: crypto.randomUUID(),
      tradeId: "",
      jobTypeId: "",
      jobSize: 2,
      homeArea: "",
      footage: null,
      options: {}
    }]);
  };

  const removeService = (serviceId: string) => {
    if (services.length > 1) {
      setServices(prev => prev.filter(s => s.id !== serviceId));
    }
  };

  const handleTradeChange = (serviceId: string, tradeId: string) => {
    updateService(serviceId, { tradeId, jobTypeId: "", homeArea: "", footage: null, options: {} });
  };

  const handleJobTypeChange = (serviceId: string, jobTypeId: string) => {
    updateService(serviceId, { jobTypeId, homeArea: "", footage: null, options: {} });
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

    jobType.options.forEach((opt) => {
      const value = opts[opt.id];
      if (value) {
        if (opt.type === 'select' && opt.choices && typeof value === 'string') {
          const selectedChoice = opt.choices.find(c => c.value === value);
          if (selectedChoice) {
            if (selectedChoice.scopeAddition) finalScope.push(selectedChoice.scopeAddition);
            if (selectedChoice.priceModifier) extraCost += selectedChoice.priceModifier;
          }
        } else if (opt.type === 'boolean' && value === true) {
          if (opt.scopeAddition) finalScope.push(opt.scopeAddition);
          if (opt.priceModifier) extraCost += opt.priceModifier;
        }
      }
    });

    // Get area-based multiplier (defaults to 1.0 if area not selected or not found)
    const areaMultiplier = service.homeArea ? (areaMultipliers[service.homeArea] || 1.0) : 1.0;

    // Check if this trade uses footage-based pricing
    const footageType = usesFootagePricing(service.tradeId);
    const tradeUnitPricing = pricePerUnit[service.tradeId];

    let baseLowPrice: number;
    let baseHighPrice: number;

    if (footageType && service.footage && service.footage > 0 && tradeUnitPricing) {
      // Calculate price based on footage - footage already accounts for size, so we use a
      // reduced complexity multiplier from area (only for very complex areas like basement/attic)
      const unitPricing = footageType === "sqft" ? tradeUnitPricing.sqft : tradeUnitPricing.linear;
      if (unitPricing) {
        // For footage-based pricing, only apply a complexity factor for difficult areas
        // (basement, attic, outdoor kitchen) - not the full area multiplier
        const complexityFactor = areaMultiplier > 1.2 ? 1 + (areaMultiplier - 1) * 0.3 : 1.0;
        baseLowPrice = (service.footage * unitPricing.low * priceModifier * complexityFactor) + extraCost;
        baseHighPrice = (service.footage * unitPricing.high * priceModifier * complexityFactor) + extraCost;
      } else {
        // Fallback to base price if unit pricing not defined
        baseLowPrice = (jobType.basePriceRange.low * priceModifier * areaMultiplier) + extraCost;
        baseHighPrice = (jobType.basePriceRange.high * priceModifier * areaMultiplier) + extraCost;
      }
    } else {
      // Use traditional base price with full area multiplier
      baseLowPrice = (jobType.basePriceRange.low * priceModifier * areaMultiplier) + extraCost;
      baseHighPrice = (jobType.basePriceRange.high * priceModifier * areaMultiplier) + extraCost;
    }

    const userMultiplier = (user?.priceMultiplier || 100) / 100;
    const tradeMultiplier = (user?.tradeMultipliers?.[service.tradeId] ?? 100) / 100;
    const { multiplier: regionalMultiplier, region } = getRegionalMultiplier(watchedValues.address);

    const lowPrice = baseLowPrice * userMultiplier * tradeMultiplier * regionalMultiplier;
    const highPrice = baseHighPrice * userMultiplier * tradeMultiplier * regionalMultiplier;

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

    const trade = availableTemplates.find((t) => t.id === service.tradeId);

    return {
      serviceId: service.id,
      id: service.id, // For backend compatibility
      tradeId: service.tradeId, // Added for persistence
      tradeName: trade?.trade || "",
      jobTypeId: service.jobTypeId, // Added for persistence
      jobTypeName: jobType.name,
      jobSize: service.jobSize, // For backend compatibility
      scope: enhancedScopes[service.id] || finalScope,
      priceRange: {
        low: Math.round(lowPrice / 100) * 100,
        high: Math.round(highPrice / 100) * 100,
      },
      priceLow: Math.round(lowPrice / 100) * 100, // For backend compatibility
      priceHigh: Math.round(highPrice / 100) * 100, // For backend compatibility
      estimatedDays: { low: timelineLow, high: timelineHigh },
      estimatedDaysLow: timelineLow, // For backend compatibility
      estimatedDaysHigh: timelineHigh, // For backend compatibility
      warranty: jobType.warranty,
      exclusions: jobType.exclusions,
      regionalInfo: region ? {
        state: region.state,
        abbrev: region.abbrev,
        region: region.region,
        multiplier: region.multiplier,
      } : null,
      footage: service.footage,
      homeArea: service.homeArea,
      options: opts, // Added for persistence
    };
  };

  const generateProposalData = () => {
    const validServices = services.filter(s => s.tradeId && s.jobTypeId);
    if (validServices.length === 0) return { lineItems: [] };

    const lineItems = validServices.map(generateServiceData).filter((item): item is NonNullable<typeof item> => item !== null);

    // Calculate totals
    const totalPriceLow = lineItems.reduce((sum, item) => sum + (item?.priceRange.low || 0), 0);
    const totalPriceHigh = lineItems.reduce((sum, item) => sum + (item?.priceRange.high || 0), 0);
    const totalDaysLow = lineItems.reduce((sum, item) => sum + (item?.estimatedDays.low || 0), 0);
    const totalDaysHigh = lineItems.reduce((sum, item) => sum + (item?.estimatedDays.high || 0), 0);

    // Combine all scopes
    const allScope = lineItems.flatMap(item => item?.scope || []);
    const allExclusions = Array.from(new Set(lineItems.flatMap(item => item?.exclusions || [])));
    const allWarranties = Array.from(new Set(lineItems.map(item => item?.warranty).filter((w): w is string => !!w)));

    // Get first regional info
    const firstRegionalInfo = lineItems.find(item => item?.regionalInfo)?.regionalInfo || null;

    return {
      clientName: watchedValues.clientName,
      address: watchedValues.address,
      lineItems,
      jobTypeName: lineItems.length === 1
        ? lineItems[0]?.jobTypeName
        : `Multi-Service Proposal (${lineItems.length} services)`,
      scope: allScope,
      priceRange: {
        low: Math.round(totalPriceLow / 100) * 100,
        high: Math.round(totalPriceHigh / 100) * 100,
      },
      estimatedDays: { low: totalDaysLow, high: totalDaysHigh },
      warranty: allWarranties.join(" "),
      exclusions: allExclusions,
      regionalInfo: firstRegionalInfo,
    };
  };

  const hasValidServices = services.some(s => s.tradeId && s.jobTypeId);

  const onSubmit = async () => {
    if (!hasValidServices) {
      toast({
        title: t.common.error,
        description: t.generator.pleaseAddService,
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: t.common.error,
        description: t.toast.loginRequired,
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Always save/create proposal via API - this will deduct credits for Pro users
      const success = await handleSaveDraft();

      if (!success) {
        // handleSaveDraft already shows error toast and paywall if needed
        setIsGenerating(false);
        return;
      }

      // Proposal saved successfully - Pro users had credit deducted, free users have locked proposal
      setIsGenerating(false);
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Error generating proposal:", error);
      setIsGenerating(false);
      toast({
        title: t.common.error,
        description: "Failed to generate proposal. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      // If we have a saved proposal ID, use the server-side PDF API
      if (savedProposalId) {
        const response = await fetch(`/api/proposals/${savedProposalId}/pdf`, {
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 402 && errorData.requiresUnlock) {
            toast({
              title: t.common.error,
              description: "Please unlock the proposal first to download the PDF.",
              variant: "destructive"
            });
            return;
          }
          throw new Error(errorData.message || "Failed to generate PDF");
        }

        // Get the filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get("Content-Disposition");
        let filename = `proposal-${watchedValues.clientName || 'draft'}.pdf`;
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="([^"]+)"/);
          if (match) {
            filename = match[1];
          }
        }

        // Download the PDF blob
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: t.common.success,
          description: t.toast.downloadSuccess
        });
      } else {
        // No saved proposal - show error prompting user to save first
        toast({
          title: t.common.error,
          description: "Please generate and save the proposal first before downloading.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("PDF Download Error:", error);
      toast({
        title: t.common.error,
        description: `${t.toast.downloadError} (${error instanceof Error ? error.message : String(error)})`,
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  }, [savedProposalId, watchedValues.clientName, t, toast]);



  // Auto-download handling for dashboard requests
  useEffect(() => {
    const shouldDownload = searchParams.get('autoDownload') === 'true';
    if (shouldDownload && !isLoadingDraft && previewRef.current) {
      // Small delay to ensure rendering is complete
      const timer = setTimeout(() => {
        handleDownload();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [searchParams, isLoadingDraft, previewRef, handleDownload]);


  // Handle authentication state
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: t.common.error,
        description: t.toast.loginRequired,
        variant: "destructive"
      });
    }
  }, [isLoading, user, toast, t]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleEnhanceScope = async () => {
    const validServices = services.filter(s => s.tradeId && s.jobTypeId);
    if (validServices.length === 0) {
      toast({
        title: t.common.error,
        description: t.generator.pleaseAddServiceFirst,
        variant: "destructive"
      });
      return;
    }

    setIsEnhancing(true);
    try {
      const newEnhancedScopes: Record<string, string[]> = {};

      for (const service of validServices) {
        const serviceData = generateServiceData(service);
        if (!serviceData) continue;

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
        }
      }

      setEnhancedScopes(prev => ({ ...prev, ...newEnhancedScopes }));
      toast({
        title: t.toast.scopeEnhanced,
        description: t.toast.scopeEnhancedDesc
      });
    } catch (error) {
      console.error("Error enhancing scope:", error);
      toast({
        title: t.common.error,
        description: t.toast.scopeEnhanceError,
        variant: "destructive"
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSaveDraft = async (): Promise<boolean> => {
    if (!user) {
      toast({
        title: t.common.error,
        description: t.toast.loginRequired,
        variant: "destructive"
      });
      return false;
    }

    const validServices = services.filter(s => s.tradeId && s.jobTypeId);
    if (validServices.length === 0) {
      toast({
        title: t.common.error,
        description: t.generator.pleaseAddServiceFirst,
        variant: "destructive"
      });
      return false;
    }

    if (!watchedValues.clientName || !watchedValues.address) {
      toast({
        title: t.common.error,
        description: t.generator.pleaseFillClientInfo,
        variant: "destructive"
      });
      return false;
    }

    setIsSavingDraft(true);
    try {
      const firstService = validServices[0];

      console.log("[DEBUG] handleSaveDraft - Full Services State:", JSON.stringify(services, null, 2));
      console.log("[DEBUG] handleSaveDraft - Valid Services:", JSON.stringify(validServices, null, 2));
      console.log("[DEBUG] handleSaveDraft - First Service homeArea:", `"${firstService.homeArea}"`);

      const serviceData = generateServiceData(firstService);
      if (!serviceData) throw new Error(t.generator.invalidServiceData);

      const cleanOptions: Record<string, boolean | string | number | null> = {};
      for (const [key, value] of Object.entries(firstService.options)) {
        if (typeof value === 'boolean' || typeof value === 'string' || typeof value === 'number') {
          cleanOptions[key] = value;
        }
      }

      // Persist homeArea and footage in options since they don't have own columns in top-level proposal
      if (firstService.homeArea) {
        cleanOptions['homeArea'] = firstService.homeArea;
      }
      if (firstService.footage) {
        cleanOptions['footage'] = firstService.footage;
      }

      // Generate full line items structure - use mapping that favors schema fields
      const lineItems = validServices.map(s => {
        const item = generateServiceData(s);
        if (!item) return null;
        // Ensure all required fields for ProposalLineItem are present
        return {
          ...item,
          id: item.serviceId, // required by schema
          jobSize: s.jobSize, // Ensure jobSize is correct
        };
      }).filter((item): item is NonNullable<typeof item> => item !== null);

      console.warn("[DEBUG] Saving draft with options:", cleanOptions);
      console.warn("[DEBUG] Service homeArea:", firstService.homeArea, "footage:", firstService.footage);

      const proposalData = {
        clientName: watchedValues.clientName,
        address: watchedValues.address,
        tradeId: firstService.tradeId,
        jobTypeId: firstService.jobTypeId,
        jobTypeName: serviceData.jobTypeName,
        jobSize: firstService.jobSize,
        scope: enhancedScopes[firstService.id] || serviceData.scope,
        options: cleanOptions,
        priceLow: serviceData.priceLow,
        priceHigh: serviceData.priceHigh,
        lineItems: lineItems, // Include full line items
        isMultiService: validServices.length > 1,
        status: "draft",
        // NOTE: Do NOT include isUnlocked here - it should only be set by the backend
        // on initial creation (based on trial/subscription status) and via the /unlock endpoint.
        // Including it here would reset unlocked proposals back to locked on every update.
        estimatedDaysLow: serviceData.estimatedDaysLow,
        estimatedDaysHigh: serviceData.estimatedDaysHigh,
      };

      console.warn("[DEBUG] Proposal Data Payload:", proposalData);

      let response;
      if (savedProposalId) {
        response = await fetch(`/api/proposals/${savedProposalId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(proposalData),
        });
      } else {
        response = await fetch('/api/proposals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(proposalData),
        });
      }

      if (!response.ok) {
        // Log error details if possible
        const errorData = await response.json().catch(() => ({}));
        console.error("Save Draft Error Response:", errorData);

        // Check for insufficient credits (Pro users need credits to create proposals)
        if (response.status === 402 && errorData.requiresPayment) {
          setShowPaywall(true);
          toast({
            title: "Insufficient Credits",
            description: errorData.message || "You need credits to create proposals. Please purchase more credits.",
            variant: "destructive",
          });
          return false;
        }

        // Check for trial limit error
        if (response.status === 403 && errorData.trialLimitReached) {
          setShowPaywall(true);
          toast({
            title: "Trial Limit Reached",
            description: `You've created ${errorData.proposalCount}/${errorData.limit} proposals. Upgrade to Pro for unlimited proposals.`,
            variant: "destructive",
          });
          return false;
        }

        throw new Error(t.generator.failedToSaveDraft);
      }

      const savedProposal = await response.json();
      setSavedProposalId(savedProposal.proposal?.id || savedProposal.id);
      setIsProposalUnlocked(savedProposal.proposal?.isUnlocked ?? savedProposal.isUnlocked ?? false);

      toast({
        title: t.common.success,
        description: savedProposalId ? "Proposal updated successfully" : t.generator.draftSaved,
      });

      return true;
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: t.common.error,
        description: t.generator.failedToSaveDraft,
        variant: "destructive"
      });
      return false;
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
        variant: "destructive"
      });
      return;
    }

    // If we already have a saved proposal ID, just open the modal
    if (savedProposalId) {
      setEmailModalOpen(true);
      return;
    }

    // Otherwise, save the proposal first using the shared handleSaveDraft logic
    setIsSavingForEmail(true);
    try {
      const success = await handleSaveDraft();
      if (success) {
        setEmailModalOpen(true);
      }
    } catch (error) {
      console.error("Error saving proposal for email:", error);
    } finally {
      setIsSavingForEmail(false);
    }
  };

  // Handle unlock proposal (deducts 1 credit for free users)
  const handleUnlockProposal = async () => {
    if (!savedProposalId) {
      toast({
        title: t.common.error,
        description: "Please save the proposal first",
        variant: "destructive"
      });
      return;
    }

    setIsUnlocking(true);
    try {
      const response = await fetch(`/api/proposals/${savedProposalId}/unlock`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.status === 402) {
        // No credits - show paywall
        setShowPaywall(true);
        toast({
          title: "Credits Required",
          description: data.message || "You need credits to unlock this proposal",
          variant: "destructive"
        });
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to unlock proposal");
      }

      setIsProposalUnlocked(true);
      toast({
        title: t.common.success,
        description: data.creditDeducted
          ? `Proposal unlocked! ${data.remainingCredits} credits remaining.`
          : "Proposal unlocked!",
      });
    } catch (error) {
      console.error("Error unlocking proposal:", error);
      toast({
        title: t.common.error,
        description: error instanceof Error ? error.message : "Failed to unlock proposal",
        variant: "destructive"
      });
    } finally {
      setIsUnlocking(false);
    }
  };

  const renderServiceCard = (service: ServiceItem, index: number) => {
    const jobType = getJobTypeForService(service);
    const trade = availableTemplates.find((t) => t.id === service.tradeId);
    const localizedJobTypes = trade ? getLocalizedJobTypes(trade, language) : [];

    return (
      <div
        key={service.id}
        className={cn(
          "border rounded-lg p-4 space-y-4 bg-white",
          services.length > 1 && "border-l-4 border-l-secondary"
        )}
        data-testid={`service-card-${index}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {services.length > 1 && (
              <GripVertical className="w-4 h-4 text-slate-400" />
            )}
            <span className="text-sm font-bold text-slate-600">
              Service {index + 1}
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
          <label className="text-sm font-medium mb-1.5 block">{t.generator.tradeCategory}</label>
          <Select
            onValueChange={(val) => handleTradeChange(service.id, val)}
            value={service.tradeId}
          >
            <SelectTrigger data-testid={`select-trade-${index}`}>
              <SelectValue placeholder={t.generator.selectTrade} />
            </SelectTrigger>
            <SelectContent>
              {availableTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>{template.trade}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Job Type Selection */}
        {service.tradeId && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <label className="text-sm font-medium mb-1.5 block">{t.generator.jobType}</label>
            <Select
              onValueChange={(val) => handleJobTypeChange(service.id, val)}
              value={service.jobTypeId}
            >
              <SelectTrigger data-testid={`select-jobtype-${index}`}>
                <SelectValue placeholder={t.generator.selectJobType} />
              </SelectTrigger>
              <SelectContent>
                {localizedJobTypes.map((j) => (
                  <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Area of Home Selection - Trade-Aware */}
        {service.jobTypeId && (() => {
          const areaOptions = getAreaOptionsForTrade(service.tradeId, t);
          return areaOptions.length > 0 ? (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-medium mb-1.5 block">Area of Home</label>
              <Select
                value={service.homeArea}
                onValueChange={(val) => updateService(service.id, { homeArea: val })}
              >
                <SelectTrigger data-testid={`select-home-area-${index}`}>
                  <SelectValue placeholder="Select area..." />
                </SelectTrigger>
                <SelectContent>
                  {areaOptions.map((area) => (
                    <SelectItem key={area.value} value={area.value}>
                      {area.label}
                      {areaMultipliers[area.value] && areaMultipliers[area.value] !== 1.0 && (
                        <span className={`ml-2 text-xs ${areaMultipliers[area.value] > 1 ? 'text-orange-600' : 'text-green-600'}`}>
                          {areaMultipliers[area.value] > 1 ? '+' : ''}{Math.round((areaMultipliers[area.value] - 1) * 100)}%
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null;
        })()}

        {/* Footage Input - for trades that use sq/linear ft pricing */}
        {service.jobTypeId && usesFootagePricing(service.tradeId) && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <label className="text-sm font-medium mb-1.5 block">
              {getFootageLabel(service.tradeId, t)}
              <span className="text-xs text-slate-500 ml-1">{t.generator.optionalForPricing}</span>
            </label>
            <Input
              type="number"
              min={0}
              placeholder={getFootagePlaceholder(service.tradeId)}
              value={service.footage || ""}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value, 10) : null;
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
                {pricePerUnit[service.tradeId] && (() => {
                  const pricing = usesFootagePricing(service.tradeId) === "sqft"
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
                <label className="text-sm font-medium">{t.generator.jobSize}</label>
                <span className="text-xs font-bold text-secondary uppercase">
                  {service.jobSize === 1 ? t.generator.small : service.jobSize === 2 ? t.generator.medium : t.generator.large}
                </span>
              </div>
              <Slider
                min={1}
                max={3}
                step={1}
                value={[service.jobSize]}
                onValueChange={(vals) => updateService(service.id, { jobSize: vals[0] })}
                className="py-2"
                data-testid={`slider-size-${index}`}
              />
            </div>

            {/* Options */}
            {jobType.options.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium">{t.generator.jobOptions}</span>
                <div className="grid grid-cols-1 gap-2">
                  {jobType.options.map((option) => (
                    option.type === 'select' && option.choices ? (
                      <div key={option.id} className="rounded-md border p-3 bg-slate-50">
                        <label className="text-sm font-medium block mb-1.5">{option.label}</label>
                        <Select
                          onValueChange={(val) => updateService(service.id, {
                            options: { ...service.options, [option.id]: val }
                          })}
                          value={service.options[option.id] as string || ''}
                        >
                          <SelectTrigger className="bg-white" data-testid={`select-option-${option.id}-${index}`}>
                            <SelectValue placeholder={t.common.selectOption} />
                          </SelectTrigger>
                          <SelectContent>
                            {option.choices.map((choice) => (
                              <SelectItem key={choice.value} value={choice.value}>
                                {choice.label}
                                {choice.priceModifier !== 0 && (
                                  <span className={`ml-2 text-xs ${choice.priceModifier > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                    {choice.priceModifier > 0 ? '+' : ''}{choice.priceModifier < 0 ? '-' : ''}${Math.abs(choice.priceModifier).toLocaleString()}
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
                          checked={service.options[option.id] as boolean || false}
                          onCheckedChange={(checked) => updateService(service.id, {
                            options: { ...service.options, [option.id]: checked }
                          })}
                          data-testid={`checkbox-option-${option.id}-${index}`}
                        />
                        <div className="space-y-1 leading-none flex-1">
                          <span className="cursor-pointer flex justify-between text-sm font-medium">
                            <span>{option.label}</span>
                            {option.priceModifier && option.priceModifier !== 0 && (
                              <span className={`text-xs ${option.priceModifier > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                {option.priceModifier > 0 ? '+' : ''}{option.priceModifier < 0 ? '-' : ''}${Math.abs(option.priceModifier).toLocaleString()}
                              </span>
                            )}
                          </span>
                        </div>
                      </label>
                    )
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    );
  };

  if (isLoadingDraft) {
    return (
      <LayoutWrapper>
        <div className="bg-slate-50 flex-1 min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <div className="grid lg:grid-cols-12 gap-8">
              {/* Left Column Skeleton */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="border-t-4 border-t-slate-200 shadow-md">
                  <CardContent className="p-6">
                    <div className="mb-6 space-y-2">
                      <div className="h-6 w-1/3 bg-slate-200 rounded animate-pulse" />
                      <div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse" />
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="h-4 w-1/4 bg-slate-200 rounded animate-pulse" />
                        <div className="h-10 w-full bg-slate-100 rounded animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-1/4 bg-slate-200 rounded animate-pulse" />
                        <div className="h-10 w-full bg-slate-100 rounded animate-pulse" />
                      </div>
                      <div className="h-px bg-slate-100" />
                      <div className="h-32 w-full bg-slate-100 rounded animate-pulse" />
                      <div className="h-12 w-full bg-slate-200 rounded animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column Skeleton */}
              <div className="lg:col-span-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[800px] p-8 space-y-8">
                  <div className="flex justify-between">
                    <div className="h-8 w-1/4 bg-slate-200 rounded animate-pulse" />
                    <div className="h-8 w-1/4 bg-slate-200 rounded animate-pulse" />
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                    <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
                  </div>
                  <div className="grid grid-cols-2 gap-8 mt-12">
                    <div className="h-32 bg-slate-50 rounded animate-pulse" />
                    <div className="h-32 bg-slate-50 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="bg-slate-50 flex-1">
        <div className="container mx-auto px-4 py-8">

          <div className="grid lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN: Form / Controls */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-t-4 border-t-primary shadow-md">
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-heading font-bold flex items-center gap-2">
                      <Wand2 className="w-5 h-5 text-secondary" />
                      {t.generator.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">{t.generator.subtitle}</p>
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                      {/* Client Info */}
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="clientName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.generator.clientName} <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder={t.generator.clientNamePlaceholder} {...field} data-testid="input-client-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.generator.jobAddress} <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <JobAddressField
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder={t.generator.jobAddressPlaceholder}
                                  data-testid="input-address"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="h-px bg-border" />

                      {/* Services Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                            Services
                          </h3>
                          {services.length > 0 && (
                            <span className="text-xs text-slate-500">
                              {services.filter(s => s.tradeId && s.jobTypeId).length} service(s) added
                            </span>
                          )}
                        </div>

                        <div className="space-y-4">
                          {services.map((service, index) => renderServiceCard(service, index))}
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-dashed border-2 hover:border-secondary hover:bg-secondary/5"
                          onClick={addService}
                          data-testid="button-add-service"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Another Service
                        </Button>
                      </div>

                      {/* Total Price Summary */}
                      {hasValidServices && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 animate-in fade-in">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-slate-700">Total Estimate</span>
                            <span className="text-lg font-bold text-primary">
                              ${previewData.priceRange?.low?.toLocaleString() || 0} - ${previewData.priceRange?.high?.toLocaleString() || 0}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-slate-500">
                            <span>Estimated Duration</span>
                            <span>
                              {previewData.estimatedDays?.low || 0} - {previewData.estimatedDays?.high || 0} days
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
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {savedProposalId ? "Updating..." : t.generator.generating}
                          </>
                        ) : (
                          <>
                            {savedProposalId ? "Update Proposal" : t.generator.generateProposal} <ChevronRight className="ml-2 h-4 w-4" />
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
                  <h3 className="text-lg font-medium text-slate-900">{t.generator.readyToStart}</h3>
                  <p className="max-w-xs mx-auto mt-2">{t.generator.readyToStartDesc}</p>
                </div>
              )}

              {hasValidServices && (
                <div className="relative animate-in fade-in duration-700">
                  {/* Toolbar */}
                  <div className="flex flex-wrap justify-between items-center mb-4 gap-y-2">
                    <h3 className="font-heading font-bold text-xl text-slate-700 mr-auto">{t.generator.livePreview}</h3>
                    <div className="flex flex-wrap gap-2">
                      {hasValidServices && user && (
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
                          <span className="hidden sm:inline">{isEnhancing ? t.generator.enhancing : t.generator.enhanceWithAI}</span>
                        </Button>
                      )}
                      {hasValidServices && user && (
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
                          <span className="hidden sm:inline">{savedProposalId ? (t.generator.updateProposal || "Update Proposal") : t.generator.saveDraft}</span>
                        </Button>
                      )}
                      {/* Unlock button - show when proposal is saved but not unlocked */}
                      {hasValidServices && savedProposalId && !isProposalUnlocked && (
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-2 bg-amber-600 hover:bg-amber-700 text-white font-medium"
                          onClick={handleUnlockProposal}
                          disabled={isUnlocking}
                          data-testid="button-unlock-proposal"
                        >
                          {isUnlocking ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                          <span className="hidden sm:inline">{isUnlocking ? 'Unlocking...' : 'Unlock Proposal'}</span>
                        </Button>
                      )}
                      {/* Download PDF - only show when proposal is unlocked */}
                      {hasValidServices && isProposalUnlocked && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={handleDownload}
                          disabled={isDownloading}
                          data-testid="button-download-pdf"
                        >
                          {isDownloading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          <span className="hidden sm:inline">{isDownloading ? t.generator.generatingPDF : t.generator.downloadPDF}</span>
                        </Button>
                      )}
                      {/* Email Proposal - only show when proposal is unlocked */}
                      {hasValidServices && user && isProposalUnlocked && (
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-2 bg-blue-600 hover:bg-blue-700"
                          onClick={handleEmailClick}
                          disabled={isSavingForEmail}
                          data-testid="button-email-proposal"
                        >
                          {isSavingForEmail ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Mail className="w-4 h-4" />
                          )}
                          <span className="hidden sm:inline">{isSavingForEmail ? 'Saving...' : (t.generator.emailProposal || 'Email Proposal')}</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* The Document */}
                  <ProposalPreview
                    ref={previewRef}
                    data={previewData}
                    companyInfo={user ? {
                      companyName: user.companyName,
                      companyAddress: user.companyAddress,
                      companyPhone: user.companyPhone,
                      companyLogo: user.companyLogo,
                    } : undefined}
                    blurred={savedProposalId !== null && !isProposalUnlocked}
                    onUnlock={handleUnlockProposal}
                    isPro={user?.isPro || user?.subscriptionPlan === 'crew' || user?.isInTrial}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {savedProposalId && (
        <EmailProposalModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          proposalId={savedProposalId}
          clientName={watchedValues.clientName || ''}
          onSuccess={() => {
            toast({
              title: t.common.success,
              description: t.generator.proposalSent || 'Proposal sent successfully!',
            });
          }}
          onRequiresPayment={() => setShowPaywall(true)}
        />
      )}

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </LayoutWrapper>
  );
}
