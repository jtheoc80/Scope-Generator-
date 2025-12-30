"use client";

// Mobile web API configuration stored in localStorage
const STORAGE_KEY = "scopegen-mobile-web-config";

export type MobileWebConfig = {
  baseUrl: string;
  apiKey?: string;
  userId?: string;
};

export function newIdempotencyKey() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

function getDefaultBaseUrl(): string {
  // In browser, default to same origin for the API
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3000";
}

export function getStoredConfig(): MobileWebConfig | null {
  if (typeof window === "undefined") return null;
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MobileWebConfig>;
    if (!parsed.baseUrl || typeof parsed.baseUrl !== "string") return null;
    return {
      baseUrl: parsed.baseUrl.endsWith("/") ? parsed.baseUrl.slice(0, -1) : parsed.baseUrl,
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : undefined,
      userId: typeof parsed.userId === "string" ? parsed.userId : undefined,
    };
  } catch {
    return null;
  }
}

export function saveConfig(cfg: MobileWebConfig): void {
  if (typeof window === "undefined") return;
  
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      baseUrl: cfg.baseUrl.endsWith("/") ? cfg.baseUrl.slice(0, -1) : cfg.baseUrl,
      apiKey: cfg.apiKey?.trim() || undefined,
      userId: cfg.userId?.trim() || undefined,
    })
  );
}

export function clearConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getConfig(): MobileWebConfig {
  const stored = getStoredConfig();
  if (stored) return stored;
  
  return {
    baseUrl: getDefaultBaseUrl(),
  };
}

export async function mobileApiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const cfg = getConfig();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };

  if (cfg.apiKey) headers["x-mobile-api-key"] = cfg.apiKey;
  if (cfg.userId) headers["x-mobile-user-id"] = cfg.userId;

  const res = await fetch(`${cfg.baseUrl}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = json?.error?.message || json?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return json as T;
}

// Job types
export type MobileJob = {
  jobId: number;
  id?: number;
  clientName?: string;
  address?: string;
  tradeId?: string;
  tradeName?: string;
  jobTypeId?: string;
  jobTypeName?: string;
  jobSize?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type DraftStatus = {
  status: "DRAFTING" | "READY" | "FAILED";
  payload?: unknown;
};

export type PresignResponse = {
  key: string;
  uploadUrl: string;
  publicUrl: string;
};

export type SubmitResponse = {
  proposalId: number;
  webReviewUrl: string;
};

// Types for issue analysis
export type DetectedIssue = {
  id: string;
  label: string;
  description?: string;
  confidence: number;
  category: "damage" | "repair" | "maintenance" | "upgrade" | "inspection" | "other";
  photoIds: number[];
};

export type AnalyzeResponse = {
  status: "ready" | "analyzing" | "no_photos";
  detectedIssues: DetectedIssue[];
  photosAnalyzed: number;
  photosTotal: number;
  suggestedProblem?: string;
  needsMorePhotos?: string[];
};
