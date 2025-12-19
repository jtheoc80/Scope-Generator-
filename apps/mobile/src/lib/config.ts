import * as SecureStore from "expo-secure-store";

export type StoredMobileConfig = {
  baseUrl: string;
  apiKey?: string;
  userId?: string;
};

const STORE_KEY = "instant-proposal-companion.mobile-config.v1";

function normalizeBaseUrl(input: string) {
  const trimmed = input.trim();
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

export async function getStoredMobileConfig(): Promise<StoredMobileConfig | null> {
  const raw = await SecureStore.getItemAsync(STORE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredMobileConfig>;
    if (!parsed.baseUrl || typeof parsed.baseUrl !== "string") return null;
    return {
      baseUrl: normalizeBaseUrl(parsed.baseUrl),
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : undefined,
      userId: typeof parsed.userId === "string" ? parsed.userId : undefined,
    };
  } catch {
    return null;
  }
}

export async function saveStoredMobileConfig(cfg: StoredMobileConfig): Promise<void> {
  await SecureStore.setItemAsync(
    STORE_KEY,
    JSON.stringify({
      baseUrl: normalizeBaseUrl(cfg.baseUrl),
      apiKey: cfg.apiKey?.trim() || undefined,
      userId: cfg.userId?.trim() || undefined,
    })
  );
}

export async function clearStoredMobileConfig(): Promise<void> {
  await SecureStore.deleteItemAsync(STORE_KEY);
}

