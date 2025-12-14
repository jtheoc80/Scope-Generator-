'use client';
import { useState, useRef } from "react";
import Layout from "@/components/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { templates, JobType, JobOption, Template, getLocalizedJobType, getLocalizedJobTypes } from "@/lib/proposal-data";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Loader2, ChevronRight, Wand2, Download, FileText, Sparkles, Plus, Trash2, GripVertical, Lock, Save } from "lucide-react";
import ProposalPreview from "@/components/proposal-preview";
import PaywallModal from "@/components/paywall-modal";
import { CostInsights } from "@/components/cost-insights";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
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

// Get footage label for trade
const getFootageLabel = (tradeId: string): string => {
  const type = usesFootagePricing(tradeId);
  if (type === "sqft") return "Square Footage";
  if (type === "linear") return "Linear Footage";
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

// Trade-aware area options
const interiorRooms = [
  { value: "living-room", label: "Living Room" },
  { value: "dining-room", label: "Dining Room" },
  { value: "bedroom", label: "Bedroom" },
  { value: "master-bedroom", label: "Master Bedroom" },
  { value: "hallway", label: "Hallway" },
  { value: "home-office", label: "Home Office" },
  { value: "closet", label: "Closet" },
  { value: "mudroom", label: "Mudroom" },
  { value: "basement", label: "Basement" },
  { value: "attic", label: "Attic" },
  { value: "whole-house", label: "Whole House Interior" },
];

const bathroomAreas = [
  { value: "bathroom", label: "Bathroom" },
  { value: "master-bathroom", label: "Master Bathroom" },
  { value: "half-bath", label: "Half Bath / Powder Room" },
  { value: "guest-bathroom", label: "Guest Bathroom" },
];

const kitchenAreas = [
  { value: "kitchen", label: "Kitchen" },
  { value: "kitchenette", label: "Kitchenette" },
  { value: "outdoor-kitchen", label: "Outdoor Kitchen" },
];

const exteriorAreas = [
  { value: "front-yard", label: "Front Yard" },
  { value: "backyard", label: "Backyard" },
  { value: "side-yard", label: "Side Yard" },
  { value: "patio", label: "Patio" },
  { value: "deck", label: "Deck" },
  { value: "driveway", label: "Driveway" },
  { value: "walkway", label: "Walkway" },
  { value: "garage", label: "Garage" },
  { value: "carport", label: "Carport" },
  { value: "exterior-full", label: "Full Exterior" },
];

const roofingAreas = [
  { value: "main-roof", label: "Main Roof" },
  { value: "garage-roof", label: "Garage Roof" },
  { value: "porch-roof", label: "Porch Roof" },
  { value: "addition-roof", label: "Addition Roof" },
  { value: "full-roof", label: "Full Roof (Entire Home)" },
];

const getAreaOptionsForTrade = (tradeId: string): { value: string; label: string }[] => {
  switch (tradeId) {
    case "bathroom":
      return bathroomAreas;
    case "kitchen":
      return kitchenAreas;
    case "painting":
      return [...interiorRooms, ...exteriorAreas];
    case "flooring":
    case "drywall":
      return interiorRooms;
    case "roofing":
      return roofingAreas;
    case "concrete":
    case "landscape":
      return exteriorAreas;
    case "plumbing":
    case "electrical":
    case "handyman":
      return [...bathroomAreas, ...kitchenAreas, ...interiorRooms.filter(r => r.value !== "whole-house"), { value: "whole-house", label: "Whole House" }];
    case "windows-doors":
      return [...interiorRooms.filter(r => !["whole-house", "closet"].includes(r.value)), ...exteriorAreas.filter(r => ["front-yard", "backyard", "patio", "garage"].includes(r.value))];
    default:
      return [...interiorRooms, ...exteriorAreas];
  }
};

export default function Generator() {
  const [step, setStep] = useState<1 | 2>(1);
  const [services, setServices] = useState<ServiceItem[]>([
    { id: crypto.randomUUID(), tradeId: "", jobTypeId: "", jobSize: 2, homeArea: "", footage: null, options: {} }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [enhancedScopes, setEnhancedScopes] = useState<Record<string, string[]>>({});
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const previewRef = useRef<HTMLDivElement>(null);

  const userSelectedTrades = user?.selectedTrades || [];
  const availableTemplates = userSelectedTrades.length > 0
    ? templates.filter(t => userSelectedTrades.includes(t.id))
    : templates;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      address: "",
    },
  });

  const watchedValues = form.watch();

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

    let finalScope = [...jobType.baseScope];
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
      tradeName: trade?.trade || "",
      jobTypeName: jobType.name,
      scope: enhancedScopes[service.id] || finalScope,
      priceRange: {
        low: Math.round(lowPrice / 100) * 100,
        high: Math.round(highPrice / 100) * 100,
      },
      estimatedDays: { low: timelineLow, high: timelineHigh },
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

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!hasValidServices) {
      toast({
        title: t.common.error,
        description: "Please add at least one service",
        variant: "destructive"
      });
      return;
    }
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsGenerating(false);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;
    
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
        description: t.toast.downloadSuccess 
      });
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast({ 
        title: t.common.error, 
        description: t.toast.downloadError,
        variant: "destructive"
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
        variant: "destructive"
      });
      return;
    }
    
    const validServices = services.filter(s => s.tradeId && s.jobTypeId);
    if (validServices.length === 0) {
      toast({ 
        title: t.common.error, 
        description: "Please add at least one service first",
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

  const handleSaveDraft = async () => {
    if (!user) {
      toast({ 
        title: t.common.error, 
        description: t.toast.loginRequired,
        variant: "destructive"
      });
      return;
    }

    const validServices = services.filter(s => s.tradeId && s.jobTypeId);
    if (validServices.length === 0) {
      toast({ 
        title: t.common.error, 
        description: "Please add at least one service first",
        variant: "destructive"
      });
      return;
    }

    if (!watchedValues.clientName || !watchedValues.address) {
      toast({ 
        title: t.common.error, 
        description: "Please fill in client name and address",
        variant: "destructive"
      });
      return;
    }

    setIsSavingDraft(true);
    try {
      const firstService = validServices[0];
      const serviceData = generateServiceData(firstService);
      if (!serviceData) throw new Error("Invalid service data");

      const booleanOptions: Record<string, boolean> = {};
      for (const [key, value] of Object.entries(firstService.options)) {
        if (typeof value === 'boolean') {
          booleanOptions[key] = value;
        }
      }

      const proposalData = {
        clientName: watchedValues.clientName,
        address: watchedValues.address,
        tradeId: firstService.tradeId,
        jobTypeId: firstService.jobTypeId,
        jobTypeName: serviceData.jobTypeName,
        jobSize: firstService.jobSize,
        scope: enhancedScopes[firstService.id] || serviceData.scope,
        options: booleanOptions,
        priceLow: serviceData.priceRange.low,
        priceHigh: serviceData.priceRange.high,
        status: "draft",
        isUnlocked: false,
      };

      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(proposalData),
      });

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      toast({ 
        title: t.common.success, 
        description: t.generator.draftSaved,
      });
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({ 
        title: t.common.error, 
        description: "Failed to save draft",
        variant: "destructive"
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const previewData = generateProposalData();

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
          const areaOptions = getAreaOptionsForTrade(service.tradeId);
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
              {getFootageLabel(service.tradeId)}
              <span className="text-xs text-slate-500 ml-1">(optional - for accurate pricing)</span>
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

  return (
    <Layout>
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
                              <FormLabel>{t.generator.clientName}</FormLabel>
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
                              <FormLabel>{t.generator.jobAddress}</FormLabel>
                              <FormControl>
                                <Input placeholder={t.generator.jobAddressPlaceholder} {...field} data-testid="input-address" />
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
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t.generator.generating}
                          </>
                        ) : (
                          <>
                            {t.generator.generateProposal} <ChevronRight className="ml-2 h-4 w-4" />
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
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="font-heading font-bold text-xl text-slate-700">{t.generator.livePreview}</h3>
                      <div className="flex gap-2">
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
                            {isEnhancing ? t.generator.enhancing : t.generator.enhanceWithAI}
                          </Button>
                        )}
                        {step === 2 && user && !isUnlocked && (
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
                        {step === 2 && (
                          <Button 
                            variant={isUnlocked ? "outline" : "default"}
                            size="sm"
                            className={`gap-2 ${!isUnlocked ? "bg-primary hover:bg-primary/90" : ""}`}
                            onClick={() => {
                              if (!isUnlocked) {
                                setShowPaywall(true);
                              } else {
                                handleDownload();
                              }
                            }}
                            disabled={isDownloading}
                            data-testid="button-download-pdf"
                          >
                            {isDownloading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isUnlocked ? (
                              <Download className="w-4 h-4" />
                            ) : (
                              <Lock className="w-4 h-4" />
                            )}
                            {isDownloading ? t.generator.generatingPDF : isUnlocked ? t.generator.downloadPDF : t.generator.downloadPreview}
                          </Button>
                        )}
                      </div>
                   </div>

                   {/* The Document */}
                   <ProposalPreview 
                      ref={previewRef}
                      data={previewData} 
                      blurred={!isUnlocked} 
                      onUnlock={() => setShowPaywall(true)}
                      companyInfo={user ? {
                        companyName: user.companyName,
                        companyAddress: user.companyAddress,
                        companyPhone: user.companyPhone,
                        companyLogo: user.companyLogo,
                      } : undefined}
                   />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <PaywallModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)} 
        onUnlock={() => {
          setIsUnlocked(true);
          setShowPaywall(false);
          toast({
            title: "Success!",
            description: "Full proposal unlocked. You can now download and edit.",
            duration: 5000,
          });
        }}
      />
    </Layout>
  );
}
