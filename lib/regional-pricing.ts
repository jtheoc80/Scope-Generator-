export interface RegionalMultiplier {
  state: string;
  abbrev: string;
  multiplier: number;
  region: string;
}

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

const stateAbbreviations: Record<string, string> = {
  "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR",
  "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE",
  "florida": "FL", "georgia": "GA", "hawaii": "HI", "idaho": "ID",
  "illinois": "IL", "indiana": "IN", "iowa": "IA", "kansas": "KS",
  "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
  "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS",
  "missouri": "MO", "montana": "MT", "nebraska": "NE", "nevada": "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", "ohio": "OH", "oklahoma": "OK",
  "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT",
  "vermont": "VT", "virginia": "VA", "washington": "WA", "west virginia": "WV",
  "wisconsin": "WI", "wyoming": "WY", "district of columbia": "DC", "d.c.": "DC",
};

export function detectStateFromAddress(address: string): RegionalMultiplier | null {
  if (!address) return null;
  
  const normalizedAddress = address.toLowerCase().trim();
  
  for (const region of regionalMultipliers) {
    const abbrevPattern = new RegExp(`\\b${region.abbrev.toLowerCase()}\\b`);
    if (abbrevPattern.test(normalizedAddress)) {
      return region;
    }
  }
  
  for (const [stateName, abbrev] of Object.entries(stateAbbreviations)) {
    if (normalizedAddress.includes(stateName)) {
      return regionalMultipliers.find(r => r.abbrev === abbrev) || null;
    }
  }
  
  return null;
}

export function getRegionalMultiplier(address: string): { multiplier: number; region: RegionalMultiplier | null } {
  const region = detectStateFromAddress(address);
  return {
    multiplier: region?.multiplier ?? 1.0,
    region
  };
}
