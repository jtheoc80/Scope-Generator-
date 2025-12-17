/**
 * SEO Configuration - Central configuration for all SEO-related settings
 * This file serves as the single source of truth for SEO metadata across the site.
 */

export const seoConfig = {
  // Site Information
  site: {
    name: "ScopeGen",
    tagline: "Professional Contractor Proposal Software",
    url: "https://scopegenerator.com",
    logo: "/opengraph.jpg",
    defaultImage: "/opengraph.jpg",
    publisher: "Lead Ledger LLC",
    creator: "ScopeGen",
    locale: "en_US",
    language: "en",
  },

  // Contact & Organization
  organization: {
    name: "Lead Ledger Pro LLC",
    legalName: "Lead Ledger Pro LLC",
    email: "support@scopegenerator.com",
    address: {
      locality: "Houston",
      region: "TX",
      country: "US",
    },
    socialProfiles: [] as string[],
  },

  // Default Meta Tags
  defaults: {
    title: "ScopeGen - Professional Contractor Proposal Software",
    description:
      "Generate professional proposals and scopes of work in seconds. Built for bathroom remodelers, kitchen contractors, roofers, HVAC specialists, plumbers, electricians, and more. Free to try.",
    keywords: [
      "contractor proposal software",
      "scope of work generator",
      "construction proposal",
      "remodeling proposal",
      "contractor estimates",
      "roofing proposal",
      "HVAC proposal",
      "plumbing proposal",
      "electrical proposal",
    ],
  },

  // Open Graph Defaults
  openGraph: {
    type: "website" as const,
    imageWidth: 1200,
    imageHeight: 630,
    imageAlt: "ScopeGen - Contractor Proposal Software",
  },

  // Twitter Card Settings
  twitter: {
    card: "summary_large_image" as const,
    site: "@scopegen",
    creator: "@scopegen",
  },

  // Robots Settings
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
    },
  },

  // Verification Codes (replace with actual values)
  verification: {
    google: "your-google-verification-code",
    bing: "",
    yandex: "",
    pinterest: "",
  },

  // SEO Audit Thresholds
  audit: {
    titleMinLength: 30,
    titleMaxLength: 60,
    descriptionMinLength: 120,
    descriptionMaxLength: 160,
    minKeywords: 3,
    maxKeywords: 10,
  },

  // Pages that should NOT be indexed
  noIndexPages: [
    "/api/",
    "/dashboard",
    "/settings",
    "/crew",
    "/p/",
    "/invite/",
    "/sign-in",
    "/sign-up",
    "/sign-out",
  ],

  // High-priority pages for sitemap
  priorityPages: {
    home: 1.0,
    app: 0.9,
    calculator: 0.9,
    blog: 0.8,
    comparison: 0.8,
    about: 0.7,
    pricing: 0.7,
    legal: 0.3,
  },
};

// Page-specific SEO configurations for easy management
export const pagesSeoConfig: Record<
  string,
  {
    title: string;
    description: string;
    keywords: string[];
    ogType?: "website" | "article" | "product";
    priority?: number;
    changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  }
> = {
  "/": {
    title: "ScopeGen - Professional Contractor Proposal Software",
    description:
      "Generate professional proposals and scopes of work in seconds. Built for contractors, remodelers, roofers, and more. Free to try.",
    keywords: [
      "contractor proposal software",
      "scope of work generator",
      "construction proposal",
      "remodeling proposal",
      "contractor estimates",
    ],
    priority: 1.0,
    changeFrequency: "weekly",
  },
  "/app": {
    title: "Create Proposal - ScopeGen App",
    description:
      "Create professional contractor proposals in 60 seconds. Choose from 17+ trade templates including bathroom, kitchen, roofing, HVAC, plumbing, and electrical.",
    keywords: [
      "create proposal",
      "proposal generator",
      "contractor app",
      "scope of work template",
    ],
    priority: 0.9,
    changeFrequency: "weekly",
  },
  "/calculator": {
    title: "Free Remodeling Cost Calculator",
    description:
      "Get instant cost estimates for your remodeling project. Calculate bathroom, kitchen, roofing, and other contractor project costs with regional pricing data.",
    keywords: [
      "remodeling cost calculator",
      "bathroom remodel cost",
      "kitchen remodel cost",
      "construction cost estimator",
    ],
    priority: 0.9,
    changeFrequency: "monthly",
  },
  "/blog": {
    title: "Contractor Blog - Proposal Tips & Business Advice",
    description:
      "Free resources for contractors: proposal writing tips, pricing guides, scope of work templates, and business advice to help you win more jobs.",
    keywords: [
      "contractor blog",
      "proposal tips",
      "contractor business advice",
      "scope of work templates",
    ],
    priority: 0.8,
    changeFrequency: "weekly",
  },
  "/about": {
    title: "About Us - Lead Ledger Pro LLC",
    description:
      "Learn about Lead Ledger Pro LLC, the company behind ScopeGen. Based in Houston, Texas, we build professional proposal software for contractors.",
    keywords: [
      "ScopeGen",
      "Lead Ledger Pro",
      "contractor software company",
      "proposal software",
    ],
    priority: 0.7,
    changeFrequency: "monthly",
  },
  "/market-pricing": {
    title: "Market Pricing Data for Contractors",
    description:
      "Access regional market pricing data for contractor services. Compare labor rates, material costs, and project estimates across different markets.",
    keywords: [
      "contractor pricing data",
      "market rates",
      "labor costs",
      "material pricing",
    ],
    priority: 0.7,
    changeFrequency: "monthly",
  },
  "/pricing-insights": {
    title: "Pricing Insights for Contractors",
    description:
      "Get data-driven pricing insights to help you quote competitive prices. Learn what other contractors charge in your area.",
    keywords: [
      "pricing insights",
      "contractor rates",
      "competitive pricing",
      "market analysis",
    ],
    priority: 0.6,
    changeFrequency: "monthly",
  },
  "/privacy": {
    title: "Privacy Policy - ScopeGen Data Protection",
    description:
      "ScopeGen privacy policy explains how we collect, use, store, and protect your personal information. Your data security is our priority.",
    keywords: ["privacy policy", "data protection", "personal information"],
    priority: 0.3,
    changeFrequency: "yearly",
  },
  "/terms": {
    title: "Terms of Service - ScopeGen User Agreement",
    description:
      "Read the ScopeGen terms of service and user agreement. Understand your rights and responsibilities when using our contractor proposal software.",
    keywords: ["terms of service", "terms and conditions", "user agreement"],
    priority: 0.3,
    changeFrequency: "yearly",
  },
  // Competitor comparison pages
  "/vs/buildertrend": {
    title: "ScopeGen vs Buildertrend - Software Comparison",
    description:
      "Compare ScopeGen vs Buildertrend for contractor proposals. See differences in pricing, features, ease of use, and find out which is right for your business.",
    keywords: [
      "ScopeGen vs Buildertrend",
      "Buildertrend alternative",
      "contractor proposal software comparison",
    ],
    ogType: "article",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  "/vs/jobber": {
    title: "ScopeGen vs Jobber - Field Service Software Comparison",
    description:
      "Compare ScopeGen vs Jobber for contractor proposals and job management. See the key differences and find the right solution for your business.",
    keywords: [
      "ScopeGen vs Jobber",
      "Jobber alternative",
      "field service software comparison",
    ],
    ogType: "article",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  "/vs/houzz-pro": {
    title: "ScopeGen vs Houzz Pro - Contractor Software Comparison",
    description:
      "Compare ScopeGen vs Houzz Pro for contractor proposals. See pricing, features, and which software is better for your contracting business.",
    keywords: [
      "ScopeGen vs Houzz Pro",
      "Houzz Pro alternative",
      "contractor software comparison",
    ],
    ogType: "article",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  "/generator": {
    title: "Free Proposal Generator - Create Scopes in 60 Seconds",
    description:
      "Generate professional contractor proposals instantly with our free proposal generator. Perfect for bathroom remodelers, roofers, and contractors.",
    keywords: [
      "proposal generator",
      "free proposal tool",
      "contractor proposal creator",
      "scope generator",
    ],
    priority: 0.8,
    changeFrequency: "weekly",
  },
  "/pro": {
    title: "ScopeGen Pro - Advanced Contractor Proposal Software",
    description:
      "Upgrade to ScopeGen Pro for advanced features including unlimited proposals, custom templates, e-signatures, and priority support.",
    keywords: [
      "ScopeGen Pro",
      "professional proposal software",
      "contractor software upgrade",
      "premium features",
    ],
    priority: 0.7,
    changeFrequency: "monthly",
  },
};

export type SeoConfig = typeof seoConfig;
export type PageSeoConfig = typeof pagesSeoConfig;
