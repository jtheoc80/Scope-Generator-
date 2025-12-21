import Constants from "expo-constants";
import { getStoredMobileConfig } from "./config";

type ApiConfig = {
  baseUrl: string;
  apiKey?: string;
  userId?: string;
};

export function newIdempotencyKey() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

let cachedConfig: ApiConfig | null = null;

async function getConfig(): Promise<ApiConfig> {
  if (cachedConfig) return cachedConfig;

  const fromStore = await getStoredMobileConfig();
  if (fromStore) {
    cachedConfig = fromStore;
    return cachedConfig;
  }

  // Configure defaults in Expo env (build-time) or app.json `extra.defaultApiBaseUrl`.
  // - EXPO_PUBLIC_API_BASE_URL (e.g. https://api.yourdomain.com)
  // - EXPO_PUBLIC_MOBILE_API_KEY
  // - EXPO_PUBLIC_MOBILE_USER_ID
  const defaultBaseUrl =
    (Constants.expoConfig?.extra as any)?.defaultApiBaseUrl || "http://localhost:3000";
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || defaultBaseUrl;

  cachedConfig = {
    baseUrl: baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl,
    apiKey: process.env.EXPO_PUBLIC_MOBILE_API_KEY,
    userId: process.env.EXPO_PUBLIC_MOBILE_USER_ID,
  };

  return cachedConfig;
}

export function invalidateApiConfigCache() {
  cachedConfig = null;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cfg = await getConfig();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as any),
  };

  if (cfg.apiKey) headers["x-mobile-api-key"] = cfg.apiKey;
  if (cfg.userId) headers["x-mobile-user-id"] = cfg.userId;

  const res = await fetch(`${cfg.baseUrl}${path}`, {
    ...init,
    headers,
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = json?.error?.message || json?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return json as T;
}
