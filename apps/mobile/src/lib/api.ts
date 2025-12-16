type ApiConfig = {
  baseUrl: string;
  apiKey?: string;
  userId?: string;
};

function getConfig(): ApiConfig {
  // Configure these in Expo env:
  // - EXPO_PUBLIC_API_BASE_URL (e.g. http://localhost:3000)
  // - EXPO_PUBLIC_MOBILE_API_KEY
  // - EXPO_PUBLIC_MOBILE_USER_ID
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";
  return {
    baseUrl,
    apiKey: process.env.EXPO_PUBLIC_MOBILE_API_KEY,
    userId: process.env.EXPO_PUBLIC_MOBILE_USER_ID,
  };
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cfg = getConfig();

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
    const msg = json?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return json as T;
}
