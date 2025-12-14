import fetch from "node-fetch";

const ONEBUILD_API_URL = "https://gateway-external.1build.com/";

interface OneBuildLocation {
  state: string;
  county: string;
}

interface OneBuildSource {
  id: string;
  name: string;
  description?: string;
  unitCost: number;
  unit: string;
  laborRateUsdCents?: number;
  materialRateUsdCents?: number;
  calculatedUnitRateUsdCents?: number;
  state?: string;
  county?: string;
  sourceType?: string;
}

interface OneBuildSearchResult {
  sources: OneBuildSource[];
  totalCount?: number;
}

interface OneBuildCategoryItem {
  id: string;
  name: string;
  hasChildren: boolean;
  children?: OneBuildCategoryItem[];
}

const ZIP_TO_LOCATION: Record<string, { state: string; county: string }> = {
  "77001": { state: "Texas", county: "Harris County" },
  "77002": { state: "Texas", county: "Harris County" },
  "90001": { state: "California", county: "Los Angeles County" },
  "90210": { state: "California", county: "Los Angeles County" },
  "10001": { state: "New York", county: "New York County" },
  "60601": { state: "Illinois", county: "Cook County" },
  "33101": { state: "Florida", county: "Miami-Dade County" },
  "85001": { state: "Arizona", county: "Maricopa County" },
  "98101": { state: "Washington", county: "King County" },
  "30301": { state: "Georgia", county: "Fulton County" },
  "02101": { state: "Massachusetts", county: "Suffolk County" },
  "80201": { state: "Colorado", county: "Denver County" },
};

function getLocationFromZip(zipcode: string): OneBuildLocation {
  const zip3 = zipcode.substring(0, 3);
  
  if (ZIP_TO_LOCATION[zipcode]) {
    return ZIP_TO_LOCATION[zipcode];
  }
  
  const stateByZip3: Record<string, { state: string; county: string }> = {
    "770": { state: "Texas", county: "Harris County" },
    "771": { state: "Texas", county: "Harris County" },
    "750": { state: "Texas", county: "Dallas County" },
    "751": { state: "Texas", county: "Dallas County" },
    "900": { state: "California", county: "Los Angeles County" },
    "901": { state: "California", county: "Los Angeles County" },
    "902": { state: "California", county: "Los Angeles County" },
    "941": { state: "California", county: "San Francisco County" },
    "100": { state: "New York", county: "New York County" },
    "101": { state: "New York", county: "New York County" },
    "606": { state: "Illinois", county: "Cook County" },
    "331": { state: "Florida", county: "Miami-Dade County" },
    "850": { state: "Arizona", county: "Maricopa County" },
    "981": { state: "Washington", county: "King County" },
    "303": { state: "Georgia", county: "Fulton County" },
    "021": { state: "Massachusetts", county: "Suffolk County" },
    "802": { state: "Colorado", county: "Denver County" },
  };
  
  if (stateByZip3[zip3]) {
    return stateByZip3[zip3];
  }
  
  return { state: "Texas", county: "Harris County" };
}

export class OneBuildService {
  private apiKey: string;

  constructor() {
    const key = process.env.ONEBUILD_EXTERNAL_KEY;
    if (!key) {
      console.warn("ONEBUILD_EXTERNAL_KEY not configured - 1build API will not be available");
    }
    this.apiKey = key || "";
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 10;
  }

  private async query<T>(queryString: string, variables?: Record<string, unknown>): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error("1build external API key not configured");
    }

    const response = await fetch(ONEBUILD_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "1build-api-key": this.apiKey,
      },
      body: JSON.stringify({
        query: queryString,
        variables,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("1build API error response:", errorText);
      throw new Error(`1build API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as { data?: T; errors?: { message: string }[] };
    
    if (result.errors && result.errors.length > 0) {
      throw new Error(`1build GraphQL error: ${result.errors[0].message}`);
    }

    return result.data as T;
  }

  async searchSources(
    searchTerm: string,
    zipcode: string,
    sourceType?: "MATERIAL" | "LABOR" | "EQUIPMENT" | "ASSEMBLY",
    limit: number = 20
  ): Promise<OneBuildSearchResult> {
    const location = getLocationFromZip(zipcode);
    
    const query = `
      query SearchSources($input: SourceSearchInput!) {
        sources(input: $input) {
          nodes {
            id
            name
            description
            calculatedUnitRateUsdCents
            laborRateUsdCents
            materialRateUsdCents
            uom
            state
            county
            sourceType
          }
          totalCount
        }
      }
    `;

    const input: Record<string, unknown> = {
      searchTerm,
      state: location.state,
      county: location.county,
      page: { limit },
    };

    if (sourceType) {
      input.sourceType = sourceType;
    }

    const result = await this.query<{
      sources: {
        nodes: Array<{
          id: string;
          name: string;
          description?: string;
          calculatedUnitRateUsdCents?: number;
          laborRateUsdCents?: number;
          materialRateUsdCents?: number;
          uom?: string;
          state?: string;
          county?: string;
          sourceType?: string;
        }>;
        totalCount: number;
      };
    }>(query, { input });

    return {
      sources: result.sources.nodes.map(node => ({
        id: node.id,
        name: node.name,
        description: node.description,
        unitCost: (node.calculatedUnitRateUsdCents || 0) / 100,
        unit: node.uom || "each",
        laborRateUsdCents: node.laborRateUsdCents,
        materialRateUsdCents: node.materialRateUsdCents,
        calculatedUnitRateUsdCents: node.calculatedUnitRateUsdCents,
        state: node.state,
        county: node.county,
        sourceType: node.sourceType,
      })),
      totalCount: result.sources.totalCount,
    };
  }

  async getMaterialCost(
    materialName: string,
    zipcode: string
  ): Promise<{ cost: number; unit: string; location: string } | null> {
    try {
      const result = await this.searchSources(materialName, zipcode, "MATERIAL", 1);
      
      if (result.sources.length > 0) {
        const source = result.sources[0];
        return {
          cost: source.unitCost,
          unit: source.unit,
          location: source.county && source.state
            ? `${source.county}, ${source.state}`
            : zipcode,
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching material cost:", error);
      return null;
    }
  }

  async getLaborRate(
    laborType: string,
    zipcode: string
  ): Promise<{ hourlyRate: number; location: string } | null> {
    try {
      const result = await this.searchSources(laborType, zipcode, "LABOR", 1);
      
      if (result.sources.length > 0) {
        const source = result.sources[0];
        return {
          hourlyRate: source.unitCost,
          location: source.county && source.state
            ? `${source.county}, ${source.state}`
            : zipcode,
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching labor rate:", error);
      return null;
    }
  }

  async getCategories(searchTerm?: string): Promise<OneBuildCategoryItem[]> {
    const query = `
      query GetCategories($searchTerm: String) {
        categoryTreeItems(searchTerm: $searchTerm) {
          id
          name
          hasChildren
          children {
            id
            name
            hasChildren
          }
        }
      }
    `;

    const result = await this.query<{
      categoryTreeItems: OneBuildCategoryItem[];
    }>(query, { searchTerm });

    return result.categoryTreeItems;
  }

  async getTradePricing(trade: string, zipcode: string): Promise<{
    materials: Array<{ name: string; cost: number; unit: string }>;
    labor: Array<{ name: string; hourlyRate: number }>;
  }> {
    const tradeSearchTerms: Record<string, { materials: string[]; labor: string[] }> = {
      bathroom: {
        materials: ["toilet", "vanity", "tile", "shower", "faucet", "mirror"],
        labor: ["plumber", "tile installer", "electrician"],
      },
      kitchen: {
        materials: ["cabinet", "countertop", "sink", "faucet", "backsplash tile"],
        labor: ["cabinet installer", "plumber", "electrician", "tile installer"],
      },
      roofing: {
        materials: ["asphalt shingles", "roofing felt", "flashing", "ridge cap", "nails"],
        labor: ["roofer"],
      },
      plumbing: {
        materials: ["pvc pipe", "copper pipe", "fittings", "water heater", "faucet"],
        labor: ["plumber", "plumber journeyman"],
      },
      electrical: {
        materials: ["wire", "outlet", "switch", "breaker", "junction box"],
        labor: ["electrician", "electrician journeyman"],
      },
      hvac: {
        materials: ["ductwork", "thermostat", "filter", "refrigerant"],
        labor: ["hvac technician"],
      },
      painting: {
        materials: ["paint gallon", "primer", "caulk", "tape"],
        labor: ["painter"],
      },
      flooring: {
        materials: ["hardwood flooring", "laminate", "vinyl plank", "underlayment"],
        labor: ["flooring installer"],
      },
      drywall: {
        materials: ["drywall sheet", "joint compound", "drywall tape", "corner bead"],
        labor: ["drywall installer", "drywall finisher"],
      },
    };

    const searchTerms = tradeSearchTerms[trade.toLowerCase()] || {
      materials: [trade],
      labor: [`${trade} labor`],
    };

    const materialPromises = searchTerms.materials.map(term =>
      this.getMaterialCost(term, zipcode)
    );

    const laborPromises = searchTerms.labor.map(term =>
      this.getLaborRate(term, zipcode)
    );

    const [materialResults, laborResults] = await Promise.all([
      Promise.all(materialPromises),
      Promise.all(laborPromises),
    ]);

    return {
      materials: searchTerms.materials
        .map((name, i) => {
          const result = materialResults[i];
          return result ? { name, cost: result.cost, unit: result.unit } : null;
        })
        .filter((m): m is { name: string; cost: number; unit: string } => m !== null),
      labor: searchTerms.labor
        .map((name, i) => {
          const result = laborResults[i];
          return result ? { name, hourlyRate: result.hourlyRate } : null;
        })
        .filter((l): l is { name: string; hourlyRate: number } => l !== null),
    };
  }
}

export const oneBuildService = new OneBuildService();
