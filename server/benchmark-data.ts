export interface BenchmarkJobType {
  id: string;
  name: string;
  basePriceRange: { low: number; high: number };
  estimatedDays?: { low: number; high: number };
}

export interface BenchmarkTrade {
  id: string;
  name: string;
  jobTypes: BenchmarkJobType[];
}

export interface RegionalMultiplier {
  state: string;
  abbrev: string;
  multiplier: number;
  region: string;
}

export const benchmarkTrades: BenchmarkTrade[] = [
  {
    id: "bathroom",
    name: "Bathroom Remodel",
    jobTypes: [
      { id: "tub-to-shower", name: "Tub-to-Shower Conversion", basePriceRange: { low: 8500, high: 12000 }, estimatedDays: { low: 5, high: 8 } },
      { id: "full-gut", name: "Full Bathroom Gut & Remodel", basePriceRange: { low: 18000, high: 28000 }, estimatedDays: { low: 10, high: 18 } },
      { id: "half-bath", name: "Half Bath / Powder Room Remodel", basePriceRange: { low: 6500, high: 9500 }, estimatedDays: { low: 4, high: 6 } },
      { id: "ada-accessibility", name: "ADA/Accessibility Bathroom Remodel", basePriceRange: { low: 12000, high: 22000 }, estimatedDays: { low: 7, high: 12 } },
      { id: "vanity-refresh", name: "Vanity & Faucet Replacement", basePriceRange: { low: 1800, high: 3500 }, estimatedDays: { low: 1, high: 2 } },
    ]
  },
  {
    id: "kitchen",
    name: "Kitchen Remodel",
    jobTypes: [
      { id: "cabinet-refresh", name: "Cabinet Refresh & Countertops", basePriceRange: { low: 8500, high: 15000 }, estimatedDays: { low: 5, high: 8 } },
      { id: "full-kitchen", name: "Full Kitchen Remodel", basePriceRange: { low: 35000, high: 65000 }, estimatedDays: { low: 20, high: 35 } },
      { id: "appliance-upgrade", name: "Appliance Package Install", basePriceRange: { low: 2500, high: 5000 }, estimatedDays: { low: 1, high: 2 } },
    ]
  },
  {
    id: "flooring",
    name: "Flooring",
    jobTypes: [
      { id: "hardwood", name: "Hardwood Floor Install", basePriceRange: { low: 6000, high: 12000 }, estimatedDays: { low: 3, high: 6 } },
      { id: "tile-floor", name: "Tile Floor Install", basePriceRange: { low: 4000, high: 8000 }, estimatedDays: { low: 2, high: 4 } },
      { id: "lvp", name: "LVP/Laminate Install", basePriceRange: { low: 3000, high: 6000 }, estimatedDays: { low: 2, high: 3 } },
      { id: "carpet", name: "Carpet Install", basePriceRange: { low: 2000, high: 4500 }, estimatedDays: { low: 1, high: 2 } },
    ]
  },
  {
    id: "roofing",
    name: "Roofing",
    jobTypes: [
      { id: "full-roof", name: "Full Roof Replacement", basePriceRange: { low: 12000, high: 25000 }, estimatedDays: { low: 3, high: 7 } },
      { id: "roof-repair", name: "Roof Repair", basePriceRange: { low: 500, high: 2500 }, estimatedDays: { low: 1, high: 2 } },
      { id: "gutter-install", name: "Gutter Install/Replace", basePriceRange: { low: 1200, high: 3000 }, estimatedDays: { low: 1, high: 2 } },
    ]
  },
  {
    id: "painting",
    name: "Painting",
    jobTypes: [
      { id: "interior-whole", name: "Whole House Interior", basePriceRange: { low: 4000, high: 8000 }, estimatedDays: { low: 4, high: 8 } },
      { id: "interior-room", name: "Single Room", basePriceRange: { low: 400, high: 900 }, estimatedDays: { low: 1, high: 2 } },
      { id: "exterior", name: "Exterior House", basePriceRange: { low: 5000, high: 12000 }, estimatedDays: { low: 4, high: 8 } },
      { id: "cabinet-painting", name: "Cabinet Painting", basePriceRange: { low: 3000, high: 6000 }, estimatedDays: { low: 3, high: 6 } },
    ]
  },
  {
    id: "plumbing",
    name: "Plumbing",
    jobTypes: [
      { id: "water-heater", name: "Water Heater Replace", basePriceRange: { low: 1500, high: 3500 }, estimatedDays: { low: 1, high: 1 } },
      { id: "repipe", name: "Whole House Repipe", basePriceRange: { low: 8000, high: 15000 }, estimatedDays: { low: 3, high: 6 } },
      { id: "drain-repair", name: "Drain Line Repair", basePriceRange: { low: 500, high: 2000 }, estimatedDays: { low: 1, high: 2 } },
    ]
  },
  {
    id: "electrical",
    name: "Electrical",
    jobTypes: [
      { id: "panel-upgrade", name: "Panel Upgrade", basePriceRange: { low: 2000, high: 4500 }, estimatedDays: { low: 1, high: 2 } },
      { id: "rewire", name: "Whole House Rewire", basePriceRange: { low: 10000, high: 20000 }, estimatedDays: { low: 4, high: 8 } },
      { id: "outlet-install", name: "Outlet/Switch Install", basePriceRange: { low: 150, high: 400 }, estimatedDays: { low: 1, high: 1 } },
    ]
  },
  {
    id: "hvac",
    name: "HVAC",
    jobTypes: [
      { id: "ac-install", name: "AC Unit Install", basePriceRange: { low: 5000, high: 12000 }, estimatedDays: { low: 1, high: 3 } },
      { id: "furnace", name: "Furnace Replace", basePriceRange: { low: 3500, high: 8000 }, estimatedDays: { low: 1, high: 2 } },
      { id: "ductwork", name: "Ductwork Install/Repair", basePriceRange: { low: 2000, high: 6000 }, estimatedDays: { low: 2, high: 4 } },
    ]
  },
  {
    id: "landscaping",
    name: "Landscaping",
    jobTypes: [
      { id: "sod-install", name: "Sod Installation", basePriceRange: { low: 2000, high: 5000 }, estimatedDays: { low: 1, high: 3 } },
      { id: "irrigation", name: "Irrigation System", basePriceRange: { low: 3000, high: 7000 }, estimatedDays: { low: 2, high: 4 } },
      { id: "hardscape", name: "Patio/Walkway", basePriceRange: { low: 4000, high: 10000 }, estimatedDays: { low: 3, high: 7 } },
    ]
  },
  {
    id: "fencing",
    name: "Fencing",
    jobTypes: [
      { id: "wood-fence", name: "Wood Fence Install", basePriceRange: { low: 3000, high: 8000 }, estimatedDays: { low: 2, high: 4 } },
      { id: "vinyl-fence", name: "Vinyl Fence Install", basePriceRange: { low: 4000, high: 10000 }, estimatedDays: { low: 2, high: 4 } },
      { id: "chain-link", name: "Chain Link Fence", basePriceRange: { low: 1500, high: 4000 }, estimatedDays: { low: 1, high: 3 } },
    ]
  },
];

export const regionalMultipliers: RegionalMultiplier[] = [
  { state: "Alabama", abbrev: "AL", multiplier: 0.85, region: "Southeast" },
  { state: "Alaska", abbrev: "AK", multiplier: 1.25, region: "Pacific" },
  { state: "Arizona", abbrev: "AZ", multiplier: 0.95, region: "Southwest" },
  { state: "Arkansas", abbrev: "AR", multiplier: 0.82, region: "South" },
  { state: "California", abbrev: "CA", multiplier: 1.35, region: "Pacific" },
  { state: "Colorado", abbrev: "CO", multiplier: 1.05, region: "Mountain" },
  { state: "Connecticut", abbrev: "CT", multiplier: 1.20, region: "Northeast" },
  { state: "Delaware", abbrev: "DE", multiplier: 1.02, region: "Mid-Atlantic" },
  { state: "Florida", abbrev: "FL", multiplier: 1.00, region: "Southeast" },
  { state: "Georgia", abbrev: "GA", multiplier: 0.92, region: "Southeast" },
  { state: "Hawaii", abbrev: "HI", multiplier: 1.45, region: "Pacific" },
  { state: "Idaho", abbrev: "ID", multiplier: 0.90, region: "Mountain" },
  { state: "Illinois", abbrev: "IL", multiplier: 1.00, region: "Midwest" },
  { state: "Indiana", abbrev: "IN", multiplier: 0.88, region: "Midwest" },
  { state: "Iowa", abbrev: "IA", multiplier: 0.85, region: "Midwest" },
  { state: "Kansas", abbrev: "KS", multiplier: 0.85, region: "Midwest" },
  { state: "Kentucky", abbrev: "KY", multiplier: 0.85, region: "South" },
  { state: "Louisiana", abbrev: "LA", multiplier: 0.88, region: "South" },
  { state: "Maine", abbrev: "ME", multiplier: 1.00, region: "Northeast" },
  { state: "Maryland", abbrev: "MD", multiplier: 1.15, region: "Mid-Atlantic" },
  { state: "Massachusetts", abbrev: "MA", multiplier: 1.30, region: "Northeast" },
  { state: "Michigan", abbrev: "MI", multiplier: 0.90, region: "Midwest" },
  { state: "Minnesota", abbrev: "MN", multiplier: 0.98, region: "Midwest" },
  { state: "Mississippi", abbrev: "MS", multiplier: 0.80, region: "South" },
  { state: "Missouri", abbrev: "MO", multiplier: 0.87, region: "Midwest" },
  { state: "Montana", abbrev: "MT", multiplier: 0.92, region: "Mountain" },
  { state: "Nebraska", abbrev: "NE", multiplier: 0.88, region: "Midwest" },
  { state: "Nevada", abbrev: "NV", multiplier: 1.02, region: "Mountain" },
  { state: "New Hampshire", abbrev: "NH", multiplier: 1.08, region: "Northeast" },
  { state: "New Jersey", abbrev: "NJ", multiplier: 1.22, region: "Mid-Atlantic" },
  { state: "New Mexico", abbrev: "NM", multiplier: 0.88, region: "Southwest" },
  { state: "New York", abbrev: "NY", multiplier: 1.30, region: "Northeast" },
  { state: "North Carolina", abbrev: "NC", multiplier: 0.92, region: "Southeast" },
  { state: "North Dakota", abbrev: "ND", multiplier: 0.90, region: "Midwest" },
  { state: "Ohio", abbrev: "OH", multiplier: 0.88, region: "Midwest" },
  { state: "Oklahoma", abbrev: "OK", multiplier: 0.85, region: "South" },
  { state: "Oregon", abbrev: "OR", multiplier: 1.08, region: "Pacific" },
  { state: "Pennsylvania", abbrev: "PA", multiplier: 0.98, region: "Mid-Atlantic" },
  { state: "Rhode Island", abbrev: "RI", multiplier: 1.10, region: "Northeast" },
  { state: "South Carolina", abbrev: "SC", multiplier: 0.88, region: "Southeast" },
  { state: "South Dakota", abbrev: "SD", multiplier: 0.85, region: "Midwest" },
  { state: "Tennessee", abbrev: "TN", multiplier: 0.88, region: "South" },
  { state: "Texas", abbrev: "TX", multiplier: 0.92, region: "South" },
  { state: "Utah", abbrev: "UT", multiplier: 0.95, region: "Mountain" },
  { state: "Vermont", abbrev: "VT", multiplier: 1.05, region: "Northeast" },
  { state: "Virginia", abbrev: "VA", multiplier: 1.02, region: "Mid-Atlantic" },
  { state: "Washington", abbrev: "WA", multiplier: 1.12, region: "Pacific" },
  { state: "West Virginia", abbrev: "WV", multiplier: 0.82, region: "South" },
  { state: "Wisconsin", abbrev: "WI", multiplier: 0.92, region: "Midwest" },
  { state: "Wyoming", abbrev: "WY", multiplier: 0.92, region: "Mountain" },
  { state: "District of Columbia", abbrev: "DC", multiplier: 1.40, region: "Mid-Atlantic" },
];
