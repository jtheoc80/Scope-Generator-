import { type ProposalPhoto } from './proposal-photos';

export interface CompanyInfo {
    companyName?: string | null;
    companyAddress?: string | null;
    companyPhone?: string | null;
    companyLogo?: string | null;
    licenseNumber?: string | null;
}

/**
 * A section within the scope of work (for grouped display)
 */
export interface ScopeSection {
    title: string;
    items: string[];
}

export interface LineItem {
    id?: string; // Optional backend id (items might not be saved yet)
    serviceId: string; // Internal frontend id
    tradeName: string;
    jobTypeName: string;
    scope: string[];
    /** Optional: Grouped scope sections with headings */
    scopeSections?: ScopeSection[];
    /** Optional: Items that are explicitly included */
    included?: string[];
    /** Optional: Assumptions made for this scope */
    assumptions?: string[];
    /** Optional: Add-on items */
    addons?: string[];
    priceRange: { low: number; high: number };
    /** Flattened price properties for easier access */
    priceLow?: number;
    priceHigh?: number;
    estimatedDays: { low: number; high: number };
    /** Flattened days properties for easier access */
    estimatedDaysLow?: number;
    estimatedDaysHigh?: number;
    warranty?: string;
    exclusions?: string[];
}

export interface ProposalPreviewData {
    clientName?: string;
    address?: string;
    jobTypeName?: string;
    scope?: string[];
    /** Optional: Grouped scope sections with headings (preferred over scope for display) */
    scopeSections?: ScopeSection[];
    /** Optional: Items that are explicitly included */
    included?: string[];
    /** Optional: Assumptions made for this scope */
    assumptions?: string[];
    /** Optional: Add-on items */
    addons?: string[];
    priceRange?: { low: number; high: number };
    estimatedDays?: { low: number; high: number };
    warranty?: string;
    exclusions?: string[];
    regionalInfo?: {
        state: string;
        abbrev: string;
        region: string;
        multiplier: number;
    } | null;
    lineItems?: LineItem[];
    photos?: ProposalPhoto[];
}
