"use client";

// Job memory system - persists customers, addresses, and preferences
const STORAGE_KEYS = {
  CUSTOMERS: "scopegen-customers",
  ADDRESSES: "scopegen-addresses",
  LAST_JOB_SETUP: "scopegen-last-job-setup",
  RECENT_JOB_TYPES: "scopegen-recent-job-types",
} as const;

// Types
export type SavedCustomer = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  createdAt: number;
  lastUsedAt: number;
};

export type SavedAddress = {
  id: string;
  formatted: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  placeId?: string; // Google Places ID
  customerId?: string; // Link to customer
  createdAt: number;
  lastUsedAt: number;
};

export type LastJobSetup = {
  jobType: string;
  customerId?: string;
  addressId?: string;
  timestamp: number;
};

// Generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ============ CUSTOMERS ============

export function getCustomers(): SavedCustomer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!raw) return [];
    const customers = JSON.parse(raw) as SavedCustomer[];
    // Sort by lastUsedAt descending
    return customers.sort((a, b) => b.lastUsedAt - a.lastUsedAt);
  } catch {
    return [];
  }
}

export function getRecentCustomers(limit = 5): SavedCustomer[] {
  return getCustomers().slice(0, limit);
}

export function searchCustomers(query: string): SavedCustomer[] {
  if (!query.trim()) return getRecentCustomers();
  const q = query.toLowerCase();
  return getCustomers().filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q)
  );
}

export function saveCustomer(customer: Omit<SavedCustomer, "id" | "createdAt" | "lastUsedAt">): SavedCustomer {
  const customers = getCustomers();
  const newCustomer: SavedCustomer = {
    ...customer,
    id: generateId(),
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
  };
  customers.unshift(newCustomer);
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  return newCustomer;
}

export function updateCustomerUsage(customerId: string): void {
  const customers = getCustomers();
  const idx = customers.findIndex((c) => c.id === customerId);
  if (idx !== -1) {
    customers[idx].lastUsedAt = Date.now();
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }
}

export function getCustomerById(id: string): SavedCustomer | undefined {
  return getCustomers().find((c) => c.id === id);
}

// ============ ADDRESSES ============

export function getAddresses(): SavedAddress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADDRESSES);
    if (!raw) return [];
    const addresses = JSON.parse(raw) as SavedAddress[];
    return addresses.sort((a, b) => b.lastUsedAt - a.lastUsedAt);
  } catch {
    return [];
  }
}

export function getRecentAddresses(limit = 5): SavedAddress[] {
  return getAddresses().slice(0, limit);
}

export function getAddressesForCustomer(customerId: string): SavedAddress[] {
  return getAddresses().filter((a) => a.customerId === customerId);
}

export function searchAddresses(query: string): SavedAddress[] {
  if (!query.trim()) return getRecentAddresses();
  const q = query.toLowerCase();
  return getAddresses().filter((a) => a.formatted.toLowerCase().includes(q));
}

export function saveAddress(address: Omit<SavedAddress, "id" | "createdAt" | "lastUsedAt">): SavedAddress {
  const addresses = getAddresses();
  
  // Check if this exact address already exists
  const existing = addresses.find(
    (a) => a.formatted === address.formatted || (a.placeId && a.placeId === address.placeId)
  );
  
  if (existing) {
    existing.lastUsedAt = Date.now();
    if (address.customerId) existing.customerId = address.customerId;
    localStorage.setItem(STORAGE_KEYS.ADDRESSES, JSON.stringify(addresses));
    return existing;
  }
  
  const newAddress: SavedAddress = {
    ...address,
    id: generateId(),
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
  };
  addresses.unshift(newAddress);
  localStorage.setItem(STORAGE_KEYS.ADDRESSES, JSON.stringify(addresses));
  return newAddress;
}

export function updateAddressUsage(addressId: string): void {
  const addresses = getAddresses();
  const idx = addresses.findIndex((a) => a.id === addressId);
  if (idx !== -1) {
    addresses[idx].lastUsedAt = Date.now();
    localStorage.setItem(STORAGE_KEYS.ADDRESSES, JSON.stringify(addresses));
  }
}

export function getAddressById(id: string): SavedAddress | undefined {
  return getAddresses().find((a) => a.id === id);
}

// ============ JOB TYPE HISTORY ============

export function getRecentJobTypes(limit = 3): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT_JOB_TYPES);
    if (!raw) return [];
    const types = JSON.parse(raw) as string[];
    return types.slice(0, limit);
  } catch {
    return [];
  }
}

export function addRecentJobType(jobType: string): void {
  if (typeof window === "undefined") return;
  const types = getRecentJobTypes(10);
  // Remove if already exists
  const filtered = types.filter((t) => t !== jobType);
  // Add to front
  filtered.unshift(jobType);
  // Keep only last 10
  localStorage.setItem(STORAGE_KEYS.RECENT_JOB_TYPES, JSON.stringify(filtered.slice(0, 10)));
}

// ============ LAST JOB SETUP ============

export function getLastJobSetup(): LastJobSetup | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LAST_JOB_SETUP);
    if (!raw) return null;
    return JSON.parse(raw) as LastJobSetup;
  } catch {
    return null;
  }
}

export function saveLastJobSetup(setup: Omit<LastJobSetup, "timestamp">): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE_KEYS.LAST_JOB_SETUP,
    JSON.stringify({
      ...setup,
      timestamp: Date.now(),
    })
  );
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

export const PRIMARY_JOB_TYPES = JOB_TYPES.slice(0, 5); // Top 5 shown as chips

export function getJobTypeLabel(id: string): string {
  const found = JOB_TYPES.find((t) => t.id === id);
  return found?.label || id;
}

export function getJobTypeIcon(id: string): string {
  const found = JOB_TYPES.find((t) => t.id === id);
  return found?.icon || "📋";
}
