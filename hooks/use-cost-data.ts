'use client';
import { useQuery } from "@tanstack/react-query";

interface CostSource {
  id: string;
  name: string;
  description?: string;
  unitCost: number;
  unit: string;
  laborRateUsdCents?: number;
  materialRateUsdCents?: number;
  dataLocation?: {
    state: string;
    county: string;
  };
  sourceType?: string;
}

interface CostSearchResult {
  sources: CostSource[];
  totalCount?: number;
}

interface MaterialCost {
  cost: number;
  unit: string;
  location: string;
}

interface LaborRate {
  hourlyRate: number;
  location: string;
}

interface TradePricing {
  materials: Array<{ name: string; cost: number; unit: string }>;
  labor: Array<{ name: string; hourlyRate: number }>;
}

interface CostServiceStatus {
  available: boolean;
  message: string;
}

interface CostUsage {
  used: number;
  remaining: number; // -1 means unlimited for Pro users
  limit: number;
  isPro: boolean;
  hasAccess: boolean;
}

export function useCostServiceStatus() {
  return useQuery<CostServiceStatus>({
    queryKey: ["cost-service-status"],
    queryFn: async () => {
      const response = await fetch("/api/costs/status");
      if (!response.ok) {
        throw new Error("Failed to check cost service status");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCostUsage() {
  return useQuery<CostUsage>({
    queryKey: ["cost-usage"],
    queryFn: async () => {
      const response = await fetch("/api/costs/usage", {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch usage");
      }
      return response.json();
    },
    staleTime: 30 * 1000, // Refresh every 30 seconds
  });
}

export function useCostSearch(term: string, zipcode: string, type?: string) {
  return useQuery<CostSearchResult>({
    queryKey: ["cost-search", term, zipcode, type],
    queryFn: async () => {
      const params = new URLSearchParams({ term, zipcode });
      if (type) params.append("type", type);
      
      const response = await fetch(`/api/costs/search?${params}`);
      if (!response.ok) {
        if (response.status === 503) {
          throw new Error("Cost data service not configured");
        }
        throw new Error("Failed to search costs");
      }
      return response.json();
    },
    enabled: !!term && !!zipcode && term.length >= 2,
    staleTime: 10 * 60 * 1000,
  });
}

export function useMaterialCost(name: string, zipcode: string) {
  return useQuery<MaterialCost>({
    queryKey: ["material-cost", name, zipcode],
    queryFn: async () => {
      const params = new URLSearchParams({ name, zipcode });
      const response = await fetch(`/api/costs/material?${params}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Material not found");
        }
        throw new Error("Failed to fetch material cost");
      }
      return response.json();
    },
    enabled: !!name && !!zipcode,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

export function useLaborRate(type: string, zipcode: string) {
  return useQuery<LaborRate>({
    queryKey: ["labor-rate", type, zipcode],
    queryFn: async () => {
      const params = new URLSearchParams({ type, zipcode });
      const response = await fetch(`/api/costs/labor?${params}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Labor rate not found");
        }
        throw new Error("Failed to fetch labor rate");
      }
      return response.json();
    },
    enabled: !!type && !!zipcode,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

export class LimitReachedError extends Error {
  limitReached = true;
  used: number;
  limit: number;
  
  constructor(used: number, limit: number) {
    super("Free lookup limit reached");
    this.used = used;
    this.limit = limit;
  }
}

export function useTradePricing(trade: string, zipcode: string) {
  return useQuery<TradePricing>({
    queryKey: ["trade-pricing", trade, zipcode],
    queryFn: async () => {
      const params = new URLSearchParams({ trade, zipcode });
      const response = await fetch(`/api/costs/trade?${params}`, {
        credentials: "include"
      });
      if (!response.ok) {
        if (response.status === 403) {
          const data = await response.json();
          if (data.limitReached) {
            throw new LimitReachedError(data.used, data.limit);
          }
        }
        throw new Error("Failed to fetch trade pricing");
      }
      return response.json();
    },
    enabled: !!trade && !!zipcode,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

export async function fetchTradePricing(trade: string, zipcode: string): Promise<TradePricing | null> {
  try {
    const params = new URLSearchParams({ trade, zipcode });
    const response = await fetch(`/api/costs/trade?${params}`);
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch {
    return null;
  }
}
