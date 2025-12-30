'use client';
import { useState, useEffect, useMemo } from "react";
import Layout from "@/components/layout";
import { Link } from "wouter";
import { 
  Calculator, Loader2, Sparkles, Bath, ChefHat, Home as HomeIcon, 
  Paintbrush, Plug, Wrench, Thermometer, TreePine, ArrowRight, 
  Share2, Copy, Check, Twitter, Facebook, Linkedin, Code, 
  DollarSign, Clock, Hammer, Building2, Layers, Grid3X3, 
  Fence, CircleDot, Palette, MapPin
} from "lucide-react";
import { regionalMultipliers } from "@/lib/regional-pricing";
import { buildEstimateParams } from "@/app/m/lib/estimate-params";

const calculatorTrades = [
  {
    id: "bathroom",
    name: "Bathroom Remodel",
    icon: Bath,
    materialsRatio: 0.45,
    laborRatio: 0.55,
    jobTypes: [
      { id: "tub-to-shower", name: "Tub-to-Shower Conversion", low: 8500, high: 12000, days: [5, 8] },
      { id: "full-gut", name: "Full Bathroom Remodel", low: 18000, high: 28000, days: [10, 21] },
      { id: "half-bath", name: "Half Bath / Powder Room", low: 6500, high: 9500, days: [4, 7] },
      { id: "vanity-refresh", name: "Vanity & Faucet Replacement", low: 1800, high: 3500, days: [1, 2] },
      { id: "ada-accessible", name: "ADA Accessibility Upgrade", low: 12000, high: 22000, days: [7, 14] },
      { id: "tile-only", name: "Tile Replacement", low: 3500, high: 7000, days: [3, 5] },
    ]
  },
  {
    id: "kitchen",
    name: "Kitchen Remodel",
    icon: ChefHat,
    materialsRatio: 0.50,
    laborRatio: 0.50,
    jobTypes: [
      { id: "full-kitchen", name: "Full Kitchen Remodel", low: 45000, high: 85000, days: [30, 60] },
      { id: "cabinet-refresh", name: "Cabinet & Countertop Refresh", low: 8500, high: 15000, days: [7, 14] },
      { id: "appliance-upgrade", name: "Appliance Package Install", low: 2500, high: 5000, days: [1, 2] },
      { id: "backsplash", name: "Backsplash Installation", low: 1500, high: 4000, days: [2, 4] },
      { id: "cabinet-refacing", name: "Cabinet Refacing", low: 5000, high: 12000, days: [5, 10] },
      { id: "island-addition", name: "Kitchen Island Addition", low: 8000, high: 20000, days: [5, 10] },
    ]
  },
  {
    id: "roofing",
    name: "Roofing",
    icon: HomeIcon,
    materialsRatio: 0.40,
    laborRatio: 0.60,
    jobTypes: [
      { id: "full-roof", name: "Full Roof Replacement", low: 12000, high: 25000, days: [3, 7] },
      { id: "roof-repair", name: "Roof Repair", low: 500, high: 2500, days: [1, 2] },
      { id: "gutter-install", name: "Gutter Install/Replace", low: 1200, high: 3000, days: [1, 2] },
      { id: "metal-roof", name: "Metal Roof Installation", low: 18000, high: 45000, days: [5, 10] },
      { id: "flat-roof", name: "Flat Roof / TPO / EPDM", low: 8000, high: 18000, days: [3, 5] },
      { id: "skylight", name: "Skylight Installation", low: 1500, high: 4000, days: [1, 2] },
    ]
  },
  {
    id: "painting",
    name: "Painting",
    icon: Paintbrush,
    materialsRatio: 0.25,
    laborRatio: 0.75,
    jobTypes: [
      { id: "single-room", name: "Single Room (Interior)", low: 450, high: 850, days: [1, 2] },
      { id: "whole-house", name: "Whole House Interior", low: 3500, high: 8000, days: [5, 10] },
      { id: "exterior", name: "Exterior House Painting", low: 4000, high: 12000, days: [5, 10] },
      { id: "cabinet-painting", name: "Cabinet Painting", low: 2500, high: 6000, days: [5, 10] },
      { id: "deck-staining", name: "Deck Staining", low: 800, high: 2500, days: [2, 3] },
      { id: "trim-only", name: "Trim & Door Painting", low: 1000, high: 3000, days: [2, 4] },
    ]
  },
  {
    id: "electrical",
    name: "Electrical",
    icon: Plug,
    materialsRatio: 0.35,
    laborRatio: 0.65,
    jobTypes: [
      { id: "panel-upgrade", name: "Panel Upgrade", low: 2500, high: 4500, days: [1, 2] },
      { id: "ev-charger", name: "EV Charger Installation", low: 800, high: 2000, days: [1, 1] },
      { id: "rewiring", name: "Whole House Rewiring", low: 8000, high: 15000, days: [5, 10] },
      { id: "outlet-install", name: "Outlet Installation", low: 150, high: 400, days: [1, 1] },
      { id: "lighting-upgrade", name: "Recessed Lighting Package", low: 1200, high: 3500, days: [1, 2] },
      { id: "ceiling-fan", name: "Ceiling Fan Installation", low: 200, high: 500, days: [1, 1] },
    ]
  },
  {
    id: "plumbing",
    name: "Plumbing",
    icon: Wrench,
    materialsRatio: 0.30,
    laborRatio: 0.70,
    jobTypes: [
      { id: "water-heater", name: "Water Heater Replacement", low: 1800, high: 3500, days: [1, 1] },
      { id: "repipe", name: "Whole House Repipe", low: 8000, high: 15000, days: [3, 5] },
      { id: "drain-cleaning", name: "Drain Cleaning", low: 150, high: 500, days: [1, 1] },
      { id: "sewer-line", name: "Sewer Line Repair/Replace", low: 3000, high: 8000, days: [2, 4] },
      { id: "fixture-install", name: "Fixture Installation", low: 200, high: 600, days: [1, 1] },
      { id: "tankless", name: "Tankless Water Heater", low: 3000, high: 5500, days: [1, 2] },
    ]
  },
  {
    id: "hvac",
    name: "HVAC",
    icon: Thermometer,
    materialsRatio: 0.55,
    laborRatio: 0.45,
    jobTypes: [
      { id: "ac-install", name: "AC Unit Installation", low: 4500, high: 12000, days: [1, 3] },
      { id: "furnace", name: "Furnace Replacement", low: 3500, high: 8000, days: [1, 2] },
      { id: "maintenance", name: "Maintenance / Tune-Up", low: 99, high: 299, days: [1, 1] },
      { id: "ductwork", name: "Ductwork Replacement", low: 3000, high: 8000, days: [2, 4] },
      { id: "mini-split", name: "Mini-Split Installation", low: 3000, high: 7000, days: [1, 2] },
      { id: "heat-pump", name: "Heat Pump Installation", low: 5000, high: 12000, days: [1, 3] },
    ]
  },
  {
    id: "landscaping",
    name: "Landscaping",
    icon: TreePine,
    materialsRatio: 0.45,
    laborRatio: 0.55,
    jobTypes: [
      { id: "lawn-install", name: "Lawn Installation", low: 2000, high: 6000, days: [2, 5] },
      { id: "patio", name: "Patio / Walkway", low: 4000, high: 15000, days: [3, 7] },
      { id: "tree-work", name: "Tree Removal / Trimming", low: 400, high: 3500, days: [1, 2] },
      { id: "irrigation", name: "Irrigation System", low: 2500, high: 6000, days: [2, 4] },
      { id: "retaining-wall", name: "Retaining Wall", low: 3000, high: 10000, days: [3, 7] },
      { id: "outdoor-lighting", name: "Outdoor Lighting", low: 1500, high: 5000, days: [1, 3] },
    ]
  },
  {
    id: "flooring",
    name: "Flooring",
    icon: Layers,
    materialsRatio: 0.50,
    laborRatio: 0.50,
    jobTypes: [
      { id: "hardwood", name: "Hardwood Installation", low: 4000, high: 12000, days: [3, 7] },
      { id: "lvp", name: "LVP / Vinyl Plank", low: 2500, high: 6000, days: [2, 4] },
      { id: "tile-floor", name: "Tile Flooring", low: 3500, high: 10000, days: [3, 7] },
      { id: "carpet", name: "Carpet Installation", low: 1500, high: 5000, days: [1, 3] },
      { id: "refinish", name: "Hardwood Refinishing", low: 2000, high: 5000, days: [3, 5] },
      { id: "subfloor", name: "Subfloor Repair", low: 1000, high: 4000, days: [2, 4] },
    ]
  },
  {
    id: "siding",
    name: "Siding",
    icon: Building2,
    materialsRatio: 0.45,
    laborRatio: 0.55,
    jobTypes: [
      { id: "vinyl-siding", name: "Vinyl Siding Installation", low: 8000, high: 18000, days: [5, 10] },
      { id: "fiber-cement", name: "Fiber Cement Siding", low: 15000, high: 35000, days: [7, 14] },
      { id: "siding-repair", name: "Siding Repair", low: 500, high: 2500, days: [1, 2] },
      { id: "wood-siding", name: "Wood Siding", low: 12000, high: 28000, days: [7, 14] },
      { id: "stone-veneer", name: "Stone Veneer", low: 8000, high: 20000, days: [5, 10] },
    ]
  },
  {
    id: "drywall",
    name: "Drywall",
    icon: Grid3X3,
    materialsRatio: 0.30,
    laborRatio: 0.70,
    jobTypes: [
      { id: "full-room", name: "Full Room Drywall", low: 1500, high: 4000, days: [3, 5] },
      { id: "patch-repair", name: "Patch & Repair", low: 200, high: 800, days: [1, 1] },
      { id: "basement-finish", name: "Basement Finishing", low: 5000, high: 15000, days: [7, 14] },
      { id: "ceiling-repair", name: "Ceiling Repair", low: 300, high: 1200, days: [1, 2] },
      { id: "texture", name: "Texture Application", low: 500, high: 2000, days: [1, 3] },
    ]
  },
  {
    id: "windows",
    name: "Window Installation",
    icon: Grid3X3,
    materialsRatio: 0.60,
    laborRatio: 0.40,
    jobTypes: [
      { id: "single-window", name: "Single Window Replacement", low: 400, high: 1200, days: [1, 1] },
      { id: "whole-house", name: "Whole House Windows", low: 8000, high: 25000, days: [3, 7] },
      { id: "bay-window", name: "Bay Window Installation", low: 2000, high: 5000, days: [1, 2] },
      { id: "sliding-door", name: "Sliding Door Install", low: 1500, high: 4000, days: [1, 2] },
      { id: "storm-windows", name: "Storm Windows", low: 200, high: 600, days: [1, 1] },
    ]
  },
  {
    id: "deck",
    name: "Deck Building",
    icon: Hammer,
    materialsRatio: 0.45,
    laborRatio: 0.55,
    jobTypes: [
      { id: "wood-deck", name: "Wood Deck Construction", low: 8000, high: 20000, days: [5, 10] },
      { id: "composite", name: "Composite Deck", low: 15000, high: 35000, days: [5, 12] },
      { id: "deck-repair", name: "Deck Repair", low: 500, high: 3000, days: [1, 3] },
      { id: "railing", name: "Railing Installation", low: 1000, high: 5000, days: [1, 3] },
      { id: "pergola", name: "Pergola / Cover", low: 3000, high: 10000, days: [3, 7] },
    ]
  },
  {
    id: "fence",
    name: "Fence Installation",
    icon: Fence,
    materialsRatio: 0.50,
    laborRatio: 0.50,
    jobTypes: [
      { id: "wood-fence", name: "Wood Privacy Fence", low: 2500, high: 8000, days: [2, 5] },
      { id: "chain-link", name: "Chain Link Fence", low: 1500, high: 4000, days: [1, 3] },
      { id: "vinyl-fence", name: "Vinyl Fence", low: 3500, high: 10000, days: [2, 5] },
      { id: "iron-fence", name: "Iron / Aluminum Fence", low: 4000, high: 12000, days: [2, 5] },
      { id: "fence-repair", name: "Fence Repair", low: 200, high: 1000, days: [1, 1] },
    ]
  },
  {
    id: "concrete",
    name: "Concrete",
    icon: CircleDot,
    materialsRatio: 0.40,
    laborRatio: 0.60,
    jobTypes: [
      { id: "driveway", name: "Driveway Replacement", low: 5000, high: 15000, days: [3, 7] },
      { id: "sidewalk", name: "Sidewalk / Path", low: 1500, high: 5000, days: [2, 4] },
      { id: "patio-slab", name: "Patio Slab", low: 2500, high: 8000, days: [2, 5] },
      { id: "foundation-repair", name: "Foundation Repair", low: 5000, high: 20000, days: [3, 10] },
      { id: "stamped", name: "Stamped Concrete", low: 4000, high: 12000, days: [3, 7] },
    ]
  },
  {
    id: "tile",
    name: "Tile Installation",
    icon: Grid3X3,
    materialsRatio: 0.45,
    laborRatio: 0.55,
    jobTypes: [
      { id: "floor-tile", name: "Floor Tile Installation", low: 2500, high: 8000, days: [3, 7] },
      { id: "shower-tile", name: "Shower Tile", low: 3000, high: 8000, days: [4, 8] },
      { id: "backsplash-tile", name: "Backsplash Tile", low: 1000, high: 3500, days: [1, 3] },
      { id: "fireplace-tile", name: "Fireplace Tile Surround", low: 800, high: 3000, days: [1, 3] },
      { id: "outdoor-tile", name: "Outdoor / Patio Tile", low: 3000, high: 10000, days: [3, 7] },
    ]
  },
  {
    id: "cabinets",
    name: "Cabinet Installation",
    icon: Palette,
    materialsRatio: 0.60,
    laborRatio: 0.40,
    jobTypes: [
      { id: "kitchen-cabinets", name: "Kitchen Cabinets (Stock)", low: 5000, high: 12000, days: [3, 5] },
      { id: "custom-cabinets", name: "Custom Cabinets", low: 15000, high: 40000, days: [7, 14] },
      { id: "bathroom-vanity", name: "Bathroom Vanity Install", low: 800, high: 2500, days: [1, 2] },
      { id: "garage-cabinets", name: "Garage Cabinets", low: 2000, high: 6000, days: [1, 3] },
      { id: "cabinet-hardware", name: "Cabinet Hardware Update", low: 200, high: 800, days: [1, 1] },
    ]
  },
];

const sizeMultipliers = {
  small: { label: "Small", multiplier: 0.75, description: "Basic/compact scope", sqftRange: "Under 100 sq ft" },
  medium: { label: "Medium", multiplier: 1.0, description: "Standard scope", sqftRange: "100-200 sq ft" },
  large: { label: "Large", multiplier: 1.4, description: "Premium/extensive scope", sqftRange: "200-400 sq ft" },
  custom: { label: "Custom", multiplier: 1.0, description: "Based on your input", sqftRange: "Custom sq ft" },
};

const faqs = [
  {
    question: "How accurate are these contractor price estimates?",
    answer: "Our estimates are based on national industry data and regional cost adjustments. They provide a solid ballpark range, but actual quotes from local contractors may vary based on specific project requirements, material choices, and labor rates in your area. Always get 2-3 professional quotes for your project."
  },
  {
    question: "What's included in the labor vs. materials breakdown?",
    answer: "Materials include all physical supplies needed for the job (fixtures, tiles, lumber, paint, etc.). Labor covers the cost of skilled tradespeople including installation, prep work, and cleanup. Some projects are more labor-intensive (like painting), while others have higher material costs (like window replacement)."
  },
  {
    question: "Why do prices vary so much by location?",
    answer: "Labor costs, material availability, permit requirements, and cost of living all vary significantly by region. For example, projects in California or New York typically cost 20-35% more than the national average, while states like Mississippi or Arkansas may be 15-20% lower."
  },
  {
    question: "How do I get an exact quote for my project?",
    answer: "Use our calculator for a ballpark estimate, then click 'Get a Professional Proposal' to create a detailed scope of work. You can share this with local contractors to get accurate, apples-to-apples quotes based on your specific requirements."
  },
  {
    question: "Can I embed this calculator on my website?",
    answer: "Yes! We encourage bloggers, home improvement sites, and contractor websites to embed this calculator. Use the embed code provided below the calculator. It's free to use and helps homeowners get quick estimates."
  },
];

const popularProjects = [
  { name: "Bathroom Remodeling", slug: "bathroom-remodeling-proposal", range: "$1,800 - $28,000" },
  { name: "Kitchen Remodeling", slug: "kitchen-remodeling-proposal", range: "$8,000 - $85,000" },
  { name: "Roofing", slug: "roofing-proposal", range: "$3,500 - $45,000" },
  { name: "Painting", slug: "painting-proposal", range: "$450 - $15,000" },
  { name: "HVAC", slug: "hvac-proposal", range: "$99 - $12,000" },
  { name: "Electrical", slug: "electrical-proposal", range: "$150 - $15,000" },
  { name: "Plumbing", slug: "plumbing-proposal", range: "$150 - $15,000" },
  { name: "Flooring", slug: "flooring-proposal", range: "$1,500 - $12,000" },
  { name: "Landscaping", slug: "landscaping-proposal", range: "$400 - $15,000" },
];

export default function CalculatorPage() {
  const [selectedTrade, setSelectedTrade] = useState<string>("");
  const [selectedJobType, setSelectedJobType] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [customSqFt, setCustomSqFt] = useState<string>("");
  const [zipCode, setZipCode] = useState<string>("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const [animatedLow, setAnimatedLow] = useState(0);
  const [animatedHigh, setAnimatedHigh] = useState(0);
  const [materialsLow, setMaterialsLow] = useState(0);
  const [materialsHigh, setMaterialsHigh] = useState(0);
  const [laborLow, setLaborLow] = useState(0);
  const [laborHigh, setLaborHigh] = useState(0);
  const [timeline, setTimeline] = useState<[number, number]>([0, 0]);
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [regionalMultiplier, setRegionalMultiplier] = useState(1.0);
  const [detectedRegion, setDetectedRegion] = useState<string | null>(null);

  const trade = calculatorTrades.find(t => t.id === selectedTrade);
  const jobType = trade?.jobTypes.find(j => j.id === selectedJobType);
  const size = sizeMultipliers[selectedSize as keyof typeof sizeMultipliers];

  const canCalculate = selectedTrade && selectedJobType && selectedSize && (selectedSize !== "custom" || customSqFt);

  useEffect(() => {
    if (zipCode.length >= 5) {
      const stateMatch = regionalMultipliers.find(r => {
        if (zipCode.startsWith("9")) return r.abbrev === "CA";
        if (zipCode.startsWith("100") || zipCode.startsWith("112")) return r.abbrev === "NY";
        if (zipCode.startsWith("77") || zipCode.startsWith("75")) return r.abbrev === "TX";
        if (zipCode.startsWith("33") || zipCode.startsWith("32")) return r.abbrev === "FL";
        if (zipCode.startsWith("60")) return r.abbrev === "IL";
        if (zipCode.startsWith("19") || zipCode.startsWith("18")) return r.abbrev === "PA";
        if (zipCode.startsWith("85") || zipCode.startsWith("86")) return r.abbrev === "AZ";
        if (zipCode.startsWith("30") || zipCode.startsWith("31")) return r.abbrev === "GA";
        if (zipCode.startsWith("98") || zipCode.startsWith("99")) return r.abbrev === "WA";
        if (zipCode.startsWith("02") || zipCode.startsWith("01")) return r.abbrev === "MA";
        if (zipCode.startsWith("80") || zipCode.startsWith("81")) return r.abbrev === "CO";
        if (zipCode.startsWith("27") || zipCode.startsWith("28")) return r.abbrev === "NC";
        return null;
      });
      if (stateMatch) {
        setRegionalMultiplier(stateMatch.multiplier);
        setDetectedRegion(stateMatch.state);
      } else {
        setRegionalMultiplier(1.0);
        setDetectedRegion(null);
      }
    } else {
      setRegionalMultiplier(1.0);
      setDetectedRegion(null);
    }
  }, [zipCode]);

  useEffect(() => {
    if (canCalculate && jobType && size && trade) {
      setIsCalculating(true);
      setShowPrice(false);

      let sizeMultiplier = size.multiplier;
      if (selectedSize === "custom" && customSqFt) {
        const sqft = parseInt(customSqFt);
        if (sqft < 100) sizeMultiplier = 0.75;
        else if (sqft <= 200) sizeMultiplier = 1.0;
        else if (sqft <= 400) sizeMultiplier = 1.4;
        else sizeMultiplier = 1.4 + ((sqft - 400) / 400) * 0.4;
      }

      const finalMultiplier = sizeMultiplier * regionalMultiplier;
      const targetLow = Math.round(jobType.low * finalMultiplier);
      const targetHigh = Math.round(jobType.high * finalMultiplier);
      const matLow = Math.round(targetLow * trade.materialsRatio);
      const matHigh = Math.round(targetHigh * trade.materialsRatio);
      const labLow = Math.round(targetLow * trade.laborRatio);
      const labHigh = Math.round(targetHigh * trade.laborRatio);

      setTimeout(() => {
        setIsCalculating(false);
        setShowPrice(true);
        setTimeline(jobType.days as [number, number]);

        let frame = 0;
        const totalFrames = 20;
        const interval = setInterval(() => {
          frame++;
          const progress = frame / totalFrames;
          const easeOut = 1 - Math.pow(1 - progress, 3);
          setAnimatedLow(Math.round(targetLow * easeOut));
          setAnimatedHigh(Math.round(targetHigh * easeOut));
          setMaterialsLow(Math.round(matLow * easeOut));
          setMaterialsHigh(Math.round(matHigh * easeOut));
          setLaborLow(Math.round(labLow * easeOut));
          setLaborHigh(Math.round(labHigh * easeOut));
          if (frame >= totalFrames) clearInterval(interval);
        }, 30);
      }, 600);
    } else {
      setShowPrice(false);
    }
  }, [selectedTrade, selectedJobType, selectedSize, customSqFt, regionalMultiplier]);

  const handleTradeChange = (value: string) => {
    setSelectedTrade(value);
    setSelectedJobType("");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/calculator?trade=${selectedTrade}&job=${selectedJobType}&size=${selectedSize}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyEmbedCode = () => {
    const code = `<iframe src="https://scopegenerator.com/calculator" width="100%" height="700" style="border:none;border-radius:12px;" title="Free Contractor Price Calculator"></iframe>`;
    navigator.clipboard.writeText(code);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  const shareOnTwitter = () => {
    const text = `Just got an estimate for my ${trade?.name} project: ${formatPrice(animatedLow)} - ${formatPrice(animatedHigh)}. Free calculator:`;
    const url = `${window.location.origin}/calculator`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnFacebook = () => {
    const url = `${window.location.origin}/calculator`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    const url = `${window.location.origin}/calculator`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };

  const TradeIcon = trade?.icon || Calculator;

  // Build proposal handoff URL with current estimate state
  const proposalUrl = useMemo(() => {
    const params = buildEstimateParams({
      trade: selectedTrade || undefined,
      jobType: selectedJobType || undefined,
      size: selectedSize || undefined,
      zip: zipCode || undefined,
      sqft: selectedSize === "custom" && customSqFt ? parseInt(customSqFt) : undefined,
    });
    const queryString = params.toString();
    return queryString ? `/m/create?${queryString}` : "/m/create";
  }, [selectedTrade, selectedJobType, selectedSize, zipCode, customSqFt]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <section className="bg-slate-900 text-white py-12 sm:py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center">
                <Calculator className="w-8 h-8 text-slate-900" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold mb-4" data-testid="heading-calculator-title">
              Free Contractor Price Calculator
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto" data-testid="text-calculator-subtitle">
              Get instant cost estimates for any remodeling or construction project. No signup required.
            </p>
          </div>
        </section>

        <section className="py-8 sm:py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-primary via-primary/90 to-primary p-4 sm:p-6 flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-xl">Instant Price Estimate</h2>
                  <p className="text-white/70 text-sm">Select your project details below</p>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">1. What type of project?</label>
                  <select
                    data-testid="select-trade"
                    value={selectedTrade}
                    onChange={(e) => handleTradeChange(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-base"
                  >
                    <option value="">Select a trade...</option>
                    {calculatorTrades.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">2. Job type</label>
                  <select
                    data-testid="select-job-type"
                    value={selectedJobType}
                    onChange={(e) => setSelectedJobType(e.target.value)}
                    disabled={!selectedTrade}
                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
                  >
                    <option value="">Select job type...</option>
                    {trade?.jobTypes.map((job) => (
                      <option key={job.id} value={job.id}>{job.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">3. Project size</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(sizeMultipliers).map(([key, value]) => (
                      <button
                        key={key}
                        data-testid={`button-size-${key}`}
                        onClick={() => setSelectedSize(key)}
                        disabled={!selectedJobType}
                        className={`py-3 px-4 rounded-xl border-2 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed ${
                          selectedSize === key
                            ? "border-primary bg-primary/10 text-slate-900 font-bold"
                            : "border-slate-200 hover:border-slate-300 text-slate-600"
                        }`}
                      >
                        <div className="font-semibold">{value.label}</div>
                        <div className="text-xs text-slate-500">{value.sqftRange}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedSize === "custom" && (
                  <div className="animate-in slide-in-from-top duration-300">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Custom square footage</label>
                    <div className="relative">
                      <input
                        type="number"
                        data-testid="input-custom-sqft"
                        value={customSqFt}
                        onChange={(e) => setCustomSqFt(e.target.value)}
                        placeholder="Enter square feet"
                        className="w-full h-12 px-4 pr-16 rounded-xl border-2 border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">sq ft</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Your ZIP code (optional - for regional pricing)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      data-testid="input-zip-code"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      placeholder="e.g., 90210"
                      maxLength={5}
                      className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                    {detectedRegion && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-green-600 font-medium">
                        {detectedRegion} ({regionalMultiplier > 1 ? '+' : ''}{Math.round((regionalMultiplier - 1) * 100)}%)
                      </span>
                    )}
                  </div>
                </div>

                <div className={`mt-6 p-6 rounded-2xl transition-all duration-500 ${
                  showPrice 
                    ? "bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200" 
                    : isCalculating
                      ? "bg-slate-50 border-2 border-slate-200"
                      : "bg-slate-50 border-2 border-dashed border-slate-300"
                }`}>
                  {isCalculating ? (
                    <div className="flex items-center justify-center gap-3 py-4">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      <span className="text-slate-600 font-medium text-lg">Calculating estimate...</span>
                    </div>
                  ) : showPrice ? (
                    <div className="animate-in fade-in zoom-in duration-500">
                      <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Sparkles className="w-5 h-5 text-secondary" />
                          <span className="text-sm font-semibold text-green-700 uppercase tracking-wide">Estimated Price Range</span>
                          <Sparkles className="w-5 h-5 text-secondary" />
                        </div>
                        <div className="text-4xl sm:text-5xl font-heading font-bold text-slate-900" data-testid="text-price-range">
                          {formatPrice(animatedLow)} – {formatPrice(animatedHigh)}
                        </div>
                        {detectedRegion && (
                          <p className="text-sm text-slate-500 mt-1">Adjusted for {detectedRegion} pricing</p>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-green-200">
                        <div className="text-center" data-testid="breakdown-materials">
                          <div className="flex items-center justify-center gap-1 text-slate-500 text-sm mb-1">
                            <DollarSign className="w-4 h-4" />
                            Materials
                          </div>
                          <div className="font-bold text-slate-900">
                            {formatPrice(materialsLow)} - {formatPrice(materialsHigh)}
                          </div>
                        </div>
                        <div className="text-center" data-testid="breakdown-labor">
                          <div className="flex items-center justify-center gap-1 text-slate-500 text-sm mb-1">
                            <Hammer className="w-4 h-4" />
                            Labor
                          </div>
                          <div className="font-bold text-slate-900">
                            {formatPrice(laborLow)} - {formatPrice(laborHigh)}
                          </div>
                        </div>
                        <div className="text-center" data-testid="breakdown-timeline">
                          <div className="flex items-center justify-center gap-1 text-slate-500 text-sm mb-1">
                            <Clock className="w-4 h-4" />
                            Timeline
                          </div>
                          <div className="font-bold text-slate-900">
                            {timeline[0]} - {timeline[1]} days
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 text-center mt-4 pt-4 border-t border-green-200" data-testid="estimate-disclaimer">
                        Estimates are directional; final bids depend on site conditions, local labor/material pricing, and scope.
                      </p>

                      <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        <Link
                          href={proposalUrl}
                          data-testid="button-get-proposal"
                          className="flex-1 flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
                        >
                          Turn into a Proposal
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={copyShareLink}
                          data-testid="button-share-estimate"
                          className="flex items-center justify-center gap-2 h-12 px-6 rounded-xl border-2 border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-all"
                        >
                          {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                          {copied ? "Link Copied!" : "Share This Estimate"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="flex items-center justify-center gap-3 text-slate-400">
                        <TradeIcon className="w-8 h-8" />
                        <span className="text-lg">Select options above to see your estimate</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {showPrice && (
              <div className="mt-8 bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8 animate-in slide-in-from-bottom duration-500">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  Share This Calculator
                </h3>
                
                <div className="flex flex-wrap gap-3 mb-6">
                  <button
                    onClick={shareOnTwitter}
                    data-testid="button-share-twitter"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1DA1F2] text-white font-medium hover:bg-[#1a8cd8] transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </button>
                  <button
                    onClick={shareOnFacebook}
                    data-testid="button-share-facebook"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4267B2] text-white font-medium hover:bg-[#375695] transition-colors"
                  >
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </button>
                  <button
                    onClick={shareOnLinkedIn}
                    data-testid="button-share-linkedin"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A66C2] text-white font-medium hover:bg-[#084d94] transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </button>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Embed This Calculator
                  </h4>
                  <p className="text-sm text-slate-600 mb-3">
                    Bloggers: Feel free to embed this calculator on your site!
                  </p>
                  <div className="relative">
                    <pre className="bg-slate-100 rounded-lg p-4 text-sm text-slate-700 overflow-x-auto">
                      {`<iframe src="https://scopegenerator.com/calculator" width="100%" height="700" style="border:none;border-radius:12px;" title="Free Contractor Price Calculator"></iframe>`}
                    </pre>
                    <button
                      onClick={copyEmbedCode}
                      data-testid="button-copy-embed"
                      className="absolute top-2 right-2 flex items-center gap-1 px-3 py-1.5 rounded-md bg-white border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      {embedCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      {embedCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="py-12 sm:py-16 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-6" data-testid="heading-methodology">
              How We Calculate Contractor Prices
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-600 text-lg leading-relaxed mb-4">
                Our contractor price calculator uses a combination of industry data, regional cost indices, and real-world project data to provide accurate estimates. Here's how it works:
              </p>
              <div className="grid sm:grid-cols-3 gap-6 my-8">
                <div className="bg-slate-50 rounded-xl p-5">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">National Baseline</h3>
                  <p className="text-slate-600 text-sm">We start with national average costs derived from industry cost databases, public market benchmarks, and internal adjustments.</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-5">
                  <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center mb-3">
                    <MapPin className="w-5 h-5 text-secondary" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">Regional Adjustments</h3>
                  <p className="text-slate-600 text-sm">We adjust prices based on local labor rates, material costs, and cost of living differences across all 50 states.</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-5">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <Hammer className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">Project Scope</h3>
                  <p className="text-slate-600 text-sm">We factor in project size, complexity, and typical material/labor splits for each trade type.</p>
                </div>
              </div>
              <p className="text-slate-500 text-sm">
                Note: These estimates are intended as a starting point for budgeting. Actual project costs can vary based on material selections, site conditions, permit requirements, and contractor availability. We always recommend getting 2-3 quotes from licensed local contractors.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 bg-slate-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-6" data-testid="heading-popular-projects">
              Popular Project Estimates
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {popularProjects.map((project) => (
                <Link
                  key={project.slug}
                  href={`/${project.slug}`}
                  data-testid={`link-project-${project.slug}`}
                  className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-primary/30 transition-all group"
                >
                  <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{project.name}</h3>
                  <p className="text-slate-500 text-sm mt-1">{project.range}</p>
                  <div className="flex items-center gap-1 text-primary text-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Learn more <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-8" data-testid="heading-faqs">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <details
                  key={index}
                  className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden group"
                  data-testid={`faq-${index}`}
                >
                  <summary className="px-6 py-4 cursor-pointer font-semibold text-slate-900 hover:bg-slate-100 transition-colors list-none flex items-center justify-between">
                    {faq.question}
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-6 pb-4 text-slate-600">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-4">
              Want to create professional proposals?
            </h2>
            <p className="text-white/80 text-lg mb-6 max-w-xl mx-auto">
              Turn this estimate into a detailed, client-ready proposal in minutes. Free to try, no credit card required.
            </p>
            <Link
              href={proposalUrl}
              data-testid="button-footer-cta"
              className="inline-flex items-center justify-center h-14 px-8 rounded-xl bg-white text-primary font-bold text-lg hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Turn into a Proposal
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}
