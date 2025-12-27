"use client";

import { mobileApiFetch } from "./api";

// Job memory system - localStorage for instant access + API sync for cross-device persistence
const STORAGE_KEYS = {
  CUSTOMERS: "scopegen-customers",
  ADDRESSES: "scopegen-addresses",
  LAST_JOB_SETUP: "scopegen-last-job-setup",
  RECENT_JOB_TYPES: "scopegen-recent-job-types",
  SYNC_TIMESTAMP: "scopegen-sync-timestamp",
} as const;

// Types - matching the database schema
export type SavedCustomer = {
  id: number;
  userId?: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  createdAt?: string;
  lastUsedAt?: string;
  // Local-only fields
  _localId?: string; // For items not yet synced
  _pendingSync?: boolean;
};

export type SavedAddress = {
  id: number;
  userId?: string;
  customerId?: number | null;
  formatted: string;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  placeId?: string | null;
  lat?: string | null;
  lng?: string | null;
  createdAt?: string;
  lastUsedAt?: string;
  // Local-only fields
  _localId?: string;
  _pendingSync?: boolean;
};

export type LastJobSetup = {
  jobType: string;
  customerId?: number;
  addressId?: number;
  timestamp: number;
};

export type JobSetupPreferences = {
  lastJobType?: string | null;
  lastCustomerId?: number | null;
  lastAddressId?: number | null;
  recentJobTypes?: string[];
};

// Generate unique local IDs
export function generateLocalId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ============ LOCAL STORAGE HELPERS ============

function getFromStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("localStorage error:", e);
  }
}

// ============ CUSTOMERS ============

export function getCustomersLocal(): SavedCustomer[] {
  const customers = getFromStorage<SavedCustomer[]>(STORAGE_KEYS.CUSTOMERS);
  if (!customers) return [];
  return customers.sort(
    (a, b) =>
      new Date(b.lastUsedAt || 0).getTime() -
      new Date(a.lastUsedAt || 0).getTime()
  );
}

export function getRecentCustomersLocal(limit = 5): SavedCustomer[] {
  return getCustomersLocal().slice(0, limit);
}

export function searchCustomersLocal(query: string): SavedCustomer[] {
  if (!query.trim()) return getRecentCustomersLocal();
  const q = query.toLowerCase();
  return getCustomersLocal().filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q)
  );
}

export function saveCustomerLocal(
  customer: Omit<SavedCustomer, "id" | "createdAt" | "lastUsedAt">
): SavedCustomer {
  const customers = getCustomersLocal();
  const now = new Date().toISOString();
  const newCustomer: SavedCustomer = {
    ...customer,
    id: -Date.now(), // Negative ID indicates local-only
    _localId: generateLocalId(),
    _pendingSync: true,
    createdAt: now,
    lastUsedAt: now,
  };
  customers.unshift(newCustomer);
  setToStorage(STORAGE_KEYS.CUSTOMERS, customers);
  return newCustomer;
}

export function updateCustomerLocalUsage(customerId: number): void {
  const customers = getCustomersLocal();
  const idx = customers.findIndex((c) => c.id === customerId);
  if (idx !== -1) {
    customers[idx].lastUsedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.CUSTOMERS, customers);
  }
}

export function getCustomerByIdLocal(id: number): SavedCustomer | undefined {
  return getCustomersLocal().find((c) => c.id === id);
}

export function mergeCustomers(
  local: SavedCustomer[],
  remote: SavedCustomer[]
): SavedCustomer[] {
  const merged = new Map<number | string, SavedCustomer>();

  // Add remote first (authoritative)
  for (const c of remote) {
    merged.set(c.id, c);
  }

  // Add local items that aren't synced yet
  for (const c of local) {
    if (c._pendingSync && c._localId) {
      merged.set(c._localId, c);
    }
  }

  return Array.from(merged.values()).sort(
    (a, b) =>
      new Date(b.lastUsedAt || 0).getTime() -
      new Date(a.lastUsedAt || 0).getTime()
  );
}

// ============ ADDRESSES ============

export function getAddressesLocal(): SavedAddress[] {
  const addresses = getFromStorage<SavedAddress[]>(STORAGE_KEYS.ADDRESSES);
  if (!addresses) return [];
  return addresses.sort(
    (a, b) =>
      new Date(b.lastUsedAt || 0).getTime() -
      new Date(a.lastUsedAt || 0).getTime()
  );
}

export function getRecentAddressesLocal(limit = 5): SavedAddress[] {
  return getAddressesLocal().slice(0, limit);
}

export function getAddressesForCustomerLocal(customerId: number): SavedAddress[] {
  return getAddressesLocal().filter((a) => a.customerId === customerId);
}

export function searchAddressesLocal(query: string): SavedAddress[] {
  if (!query.trim()) return getRecentAddressesLocal();
  const q = query.toLowerCase();
  return getAddressesLocal().filter((a) =>
    a.formatted.toLowerCase().includes(q)
  );
}

export function saveAddressLocal(
  address: Omit<SavedAddress, "id" | "createdAt" | "lastUsedAt">
): SavedAddress {
  const addresses = getAddressesLocal();

  // Check if exact address already exists
  const existing = addresses.find(
    (a) =>
      a.formatted === address.formatted ||
      (a.placeId && a.placeId === address.placeId)
  );

  if (existing) {
    existing.lastUsedAt = new Date().toISOString();
    if (address.customerId) existing.customerId = address.customerId;
    setToStorage(STORAGE_KEYS.ADDRESSES, addresses);
    return existing;
  }

  const now = new Date().toISOString();
  const newAddress: SavedAddress = {
    ...address,
    id: -Date.now(),
    _localId: generateLocalId(),
    _pendingSync: true,
    createdAt: now,
    lastUsedAt: now,
  };
  addresses.unshift(newAddress);
  setToStorage(STORAGE_KEYS.ADDRESSES, addresses);
  return newAddress;
}

export function updateAddressLocalUsage(addressId: number): void {
  const addresses = getAddressesLocal();
  const idx = addresses.findIndex((a) => a.id === addressId);
  if (idx !== -1) {
    addresses[idx].lastUsedAt = new Date().toISOString();
    setToStorage(STORAGE_KEYS.ADDRESSES, addresses);
  }
}

export function getAddressByIdLocal(id: number): SavedAddress | undefined {
  return getAddressesLocal().find((a) => a.id === id);
}

export function mergeAddresses(
  local: SavedAddress[],
  remote: SavedAddress[]
): SavedAddress[] {
  const merged = new Map<number | string, SavedAddress>();

  for (const a of remote) {
    merged.set(a.id, a);
  }

  for (const a of local) {
    if (a._pendingSync && a._localId) {
      merged.set(a._localId, a);
    }
  }

  return Array.from(merged.values()).sort(
    (a, b) =>
      new Date(b.lastUsedAt || 0).getTime() -
      new Date(a.lastUsedAt || 0).getTime()
  );
}

// ============ JOB TYPE HISTORY ============

export function getRecentJobTypesLocal(limit = 3): string[] {
  const types = getFromStorage<string[]>(STORAGE_KEYS.RECENT_JOB_TYPES);
  if (!types) return [];
  return types.slice(0, limit);
}

export function addRecentJobTypeLocal(jobType: string): void {
  let types = getFromStorage<string[]>(STORAGE_KEYS.RECENT_JOB_TYPES) || [];
  types = types.filter((t) => t !== jobType);
  types.unshift(jobType);
  setToStorage(STORAGE_KEYS.RECENT_JOB_TYPES, types.slice(0, 10));
}

// ============ LAST JOB SETUP ============

export function getLastJobSetupLocal(): LastJobSetup | null {
  return getFromStorage<LastJobSetup>(STORAGE_KEYS.LAST_JOB_SETUP);
}

export function saveLastJobSetupLocal(
  setup: Omit<LastJobSetup, "timestamp">
): void {
  setToStorage(STORAGE_KEYS.LAST_JOB_SETUP, {
    ...setup,
    timestamp: Date.now(),
  });
}

// ============ API SYNC FUNCTIONS ============

export async function syncCustomersFromAPI(): Promise<SavedCustomer[]> {
  try {
    const res = await mobileApiFetch<{ customers: SavedCustomer[] }>(
      "/api/mobile/customers?limit=50"
    );
    const local = getCustomersLocal();
    const merged = mergeCustomers(local, res.customers);
    setToStorage(STORAGE_KEYS.CUSTOMERS, merged);
    return merged;
  } catch (e) {
    console.error("Failed to sync customers:", e);
    return getCustomersLocal();
  }
}

export async function saveCustomerToAPI(
  customer: Omit<SavedCustomer, "id" | "createdAt" | "lastUsedAt">
): Promise<SavedCustomer> {
  try {
    const res = await mobileApiFetch<{ customer: SavedCustomer }>(
      "/api/mobile/customers",
      {
        method: "POST",
        body: JSON.stringify(customer),
      }
    );

    // Update local storage with the server response
    const customers = getCustomersLocal().filter(
      (c) => !(c._pendingSync && c.name === customer.name)
    );
    customers.unshift(res.customer);
    setToStorage(STORAGE_KEYS.CUSTOMERS, customers);

    return res.customer;
  } catch (e) {
    console.error("Failed to save customer to API:", e);
    // Fall back to local save
    return saveCustomerLocal(customer);
  }
}

export async function updateCustomerUsageAPI(customerId: number): Promise<void> {
  updateCustomerLocalUsage(customerId);
  try {
    await mobileApiFetch("/api/mobile/customers", {
      method: "PUT",
      body: JSON.stringify({ id: customerId }),
    });
  } catch (e) {
    console.error("Failed to update customer usage:", e);
  }
}

export async function syncAddressesFromAPI(): Promise<SavedAddress[]> {
  try {
    const res = await mobileApiFetch<{ addresses: SavedAddress[] }>(
      "/api/mobile/addresses?limit=50"
    );
    const local = getAddressesLocal();
    const merged = mergeAddresses(local, res.addresses);
    setToStorage(STORAGE_KEYS.ADDRESSES, merged);
    return merged;
  } catch (e) {
    console.error("Failed to sync addresses:", e);
    return getAddressesLocal();
  }
}

export async function saveAddressToAPI(
  address: Omit<SavedAddress, "id" | "createdAt" | "lastUsedAt">
): Promise<SavedAddress> {
  try {
    const res = await mobileApiFetch<{
      address: SavedAddress;
      existed: boolean;
    }>("/api/mobile/addresses", {
      method: "POST",
      body: JSON.stringify(address),
    });

    // Update local storage
    const addresses = getAddressesLocal().filter(
      (a) =>
        !(a._pendingSync && a.formatted === address.formatted) &&
        a.id !== res.address.id
    );
    addresses.unshift(res.address);
    setToStorage(STORAGE_KEYS.ADDRESSES, addresses);

    return res.address;
  } catch (e) {
    console.error("Failed to save address to API:", e);
    return saveAddressLocal(address);
  }
}

export async function updateAddressUsageAPI(addressId: number): Promise<void> {
  updateAddressLocalUsage(addressId);
  try {
    await mobileApiFetch("/api/mobile/addresses", {
      method: "PUT",
      body: JSON.stringify({ id: addressId }),
    });
  } catch (e) {
    console.error("Failed to update address usage:", e);
  }
}

export async function syncJobSetupFromAPI(): Promise<{
  preferences: JobSetupPreferences | null;
  lastCustomer: SavedCustomer | null;
  lastAddress: SavedAddress | null;
}> {
  try {
    const res = await mobileApiFetch<{
      preferences: JobSetupPreferences | null;
      lastCustomer: SavedCustomer | null;
      lastAddress: SavedAddress | null;
    }>("/api/mobile/job-setup");

    // Update local storage with remote data
    if (res.preferences?.recentJobTypes) {
      setToStorage(STORAGE_KEYS.RECENT_JOB_TYPES, res.preferences.recentJobTypes);
    }

    if (res.preferences?.lastJobType) {
      const local = getLastJobSetupLocal();
      if (!local || res.preferences.lastJobType !== local.jobType) {
        saveLastJobSetupLocal({
          jobType: res.preferences.lastJobType,
          customerId: res.preferences.lastCustomerId || undefined,
          addressId: res.preferences.lastAddressId || undefined,
        });
      }
    }

    return res;
  } catch (e) {
    console.error("Failed to sync job setup:", e);
    return {
      preferences: null,
      lastCustomer: null,
      lastAddress: null,
    };
  }
}

export async function saveJobSetupToAPI(setup: {
  jobType: string;
  customerId?: number;
  addressId?: number;
}): Promise<void> {
  // Save locally first
  saveLastJobSetupLocal(setup);
  addRecentJobTypeLocal(setup.jobType);

  // Then sync to API
  try {
    await mobileApiFetch("/api/mobile/job-setup", {
      method: "POST",
      body: JSON.stringify({ jobType: setup.jobType }),
    });

    if (setup.customerId || setup.addressId) {
      await mobileApiFetch("/api/mobile/job-setup", {
        method: "PUT",
        body: JSON.stringify({
          lastJobType: setup.jobType,
          lastCustomerId: setup.customerId || null,
          lastAddressId: setup.addressId || null,
        }),
      });
    }
  } catch (e) {
    console.error("Failed to save job setup to API:", e);
  }
}

// ============ JOB TYPE DEFINITIONS ============

export const JOB_TYPES = [
  { id: "bathroom-remodel", label: "Bathroom", icon: "🛁", category: "interior" },
  { id: "kitchen-remodel", label: "Kitchen", icon: "🍳", category: "interior" },
  { id: "roofing", label: "Roofing", icon: "🏠", category: "exterior" },
  { id: "hvac", label: "HVAC", icon: "❄️", category: "systems" },
  { id: "plumbing", label: "Plumbing", icon: "🔧", category: "systems" },
  { id: "flooring", label: "Flooring", icon: "🪵", category: "interior" },
  { id: "painting", label: "Painting", icon: "🎨", category: "interior" },
  { id: "electrical", label: "Electrical", icon: "⚡", category: "systems" },
  { id: "windows", label: "Windows", icon: "🪟", category: "exterior" },
  { id: "siding", label: "Siding", icon: "🧱", category: "exterior" },
] as const;

export const PRIMARY_JOB_TYPES = JOB_TYPES.slice(0, 5);

export function getJobTypeLabel(id: string): string {
  const found = JOB_TYPES.find((t) => t.id === id);
  return found?.label || id;
}

export function getJobTypeIcon(id: string): string {
  const found = JOB_TYPES.find((t) => t.id === id);
  return found?.icon || "📋";
}

// ============ COMBINED GETTERS (LOCAL + REMOTE) ============

// These functions use local data first, then background sync
export function getCustomers(): SavedCustomer[] {
  return getCustomersLocal();
}

export function getRecentCustomers(limit = 5): SavedCustomer[] {
  return getRecentCustomersLocal(limit);
}

export function searchCustomers(query: string): SavedCustomer[] {
  return searchCustomersLocal(query);
}

export function getCustomerById(id: number): SavedCustomer | undefined {
  return getCustomerByIdLocal(id);
}

export function getAddresses(): SavedAddress[] {
  return getAddressesLocal();
}

export function getRecentAddresses(limit = 5): SavedAddress[] {
  return getRecentAddressesLocal(limit);
}

export function searchAddresses(query: string): SavedAddress[] {
  return searchAddressesLocal(query);
}

export function getAddressById(id: number): SavedAddress | undefined {
  return getAddressByIdLocal(id);
}

export function getRecentJobTypes(limit = 3): string[] {
  return getRecentJobTypesLocal(limit);
}

export function getLastJobSetup(): LastJobSetup | null {
  return getLastJobSetupLocal();
}

// Wrapper functions that save locally AND to API
export async function saveCustomer(
  customer: Omit<SavedCustomer, "id" | "createdAt" | "lastUsedAt">
): Promise<SavedCustomer> {
  return saveCustomerToAPI(customer);
}

export async function updateCustomerUsage(customerId: number): Promise<void> {
  return updateCustomerUsageAPI(customerId);
}

export async function saveAddress(
  address: Omit<SavedAddress, "id" | "createdAt" | "lastUsedAt">
): Promise<SavedAddress> {
  return saveAddressToAPI(address);
}

export async function updateAddressUsage(addressId: number): Promise<void> {
  return updateAddressUsageAPI(addressId);
}

export function addRecentJobType(jobType: string): void {
  addRecentJobTypeLocal(jobType);
  // Fire and forget API sync
  mobileApiFetch("/api/mobile/job-setup", {
    method: "POST",
    body: JSON.stringify({ jobType }),
  }).catch(console.error);
}

export function saveLastJobSetup(
  setup: Omit<LastJobSetup, "timestamp">
): void {
  saveLastJobSetupLocal(setup);
  // Fire and forget API sync
  saveJobSetupToAPI({
    jobType: setup.jobType,
    customerId: setup.customerId,
    addressId: setup.addressId,
  }).catch(console.error);
}

// Background sync function - call on page load
export async function syncAllData(): Promise<void> {
  await Promise.all([
    syncCustomersFromAPI(),
    syncAddressesFromAPI(),
    syncJobSetupFromAPI(),
  ]);
}
