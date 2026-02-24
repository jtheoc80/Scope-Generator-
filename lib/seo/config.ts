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
    logo: "/scopegen-og-dark.png",
    defaultImage: "/scopegen-og-dark.png",
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
    // Add your social media profile URLs here for Google Knowledge Panel.
    // Example: ['https://www.linkedin.com/company/scopegen', 'https://twitter.com/scopegen']
    socialProfiles: [] as string[],
  },

  // Default Meta Tags
  defaults: {
    title: "ScopeGen - Professional Contractor Proposal Software",
    description:
      "Generate professional contractor proposals and scopes of work in 60 seconds. Built for remodelers, roofers, HVAC, plumbers, electricians, and more.",
    keywords: [
      "contractor proposal software",
      "scope of work generator",
      "construction proposal",
      "remodeling proposal",
      "contractor estimates",
      "kitchen proposal",
      "electrical proposal",
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

  // Verification Codes
  // IMPORTANT: Replace with your real Google Search Console verification code.
  // Without this, Google cannot verify site ownership — blocking sitemap
  // submission, crawl monitoring, and indexing insights.
  // Get your code at: https://search.google.com/search-console
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },

  // IndexNow - Instant search engine URL submission
  // Protocol: https://www.indexnow.org
  // Supported by: Bing, Yandex, Seznam, Naver
  indexNow: {
    apiKey: process.env.INDEXNOW_API_KEY || "",
    enabled: process.env.INDEXNOW_ENABLED !== "false",
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
  // Note: All protected routes that require authentication should be here
  // to prevent "Page with redirect" issues in Google Search Console
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
    "/seo-dashboard",
    "/search-console",
    "/pricing-insights",  // Protected route - redirects to login
    "/proposals/", // Individual proposal pages
    "/m/", // Mobile app routes
  ],

  // High-priority pages for sitemap
  priorityPages: {
    home: 1.0,
    app: 0.9,
    calculator: 0.9,
    landingPages: 0.85,
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
    ogType?: "website" | "article";
    priority?: number;
    changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  }
> = {
  "/": {
    title: "ScopeGen - Professional Contractor Proposal Software",
    description:
      "Generate professional contractor proposals and scopes of work in 60 seconds. Built for remodelers, roofers, HVAC, plumbers, electricians, and more.",
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
      "Create professional contractor proposals in 60 seconds. Choose from 17+ trade templates including kitchen, bathroom, electrical, HVAC, plumbing, and painting.",
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
    title: "Free Contractor Price Calculator 2025 - Instant Cost Estimates",
    description:
      "Get instant cost estimates for kitchen renovations, bathroom remodels, electrical, HVAC, plumbing, painting, and 15+ more trades. Free contractor price calculator with regional pricing.",
    keywords: [
      "contractor price calculator",
      "remodeling cost calculator",
      "construction cost estimator",
      "bathroom remodel cost",
      "kitchen remodel cost",
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
    title: "ScopeGen vs Buildertrend - Software Comparison 2025",
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
    title: "ScopeGen vs Jobber - Field Service Software Comparison 2025",
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
    title: "ScopeGen vs Houzz Pro - Contractor Software Comparison 2025",
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
  "/scopescan": {
    title: "ScopeScan - AI-Powered Photo Analysis for Contractors",
    description:
      "Turn job site photos into detailed proposals in minutes. ScopeScan uses AI to analyze photos and generate scope items, material lists, and pricing.",
    keywords: [
      "AI photo analysis contractor",
      "job site photo to proposal",
      "scope of work from photos",
      "contractor AI tool",
    ],
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
  // New SEO Landing Pages
  "/contractor-estimate-generator": {
    title: "Free Contractor Estimate Generator | Create Estimates in 60 Seconds",
    description:
      "Generate professional contractor estimates instantly. Free estimate generator for kitchen, bathroom, electrical, HVAC, plumbing, painting, and 15+ trades.",
    keywords: [
      "contractor estimate generator",
      "free estimate generator",
      "construction estimate tool",
      "proposal generator",
    ],
    priority: 0.85,
    changeFrequency: "monthly",
  },
  "/scope-of-work-generator": {
    title: "Free Scope of Work Generator | Professional SOW Templates",
    description:
      "Create detailed scopes of work instantly. Free scope generator for construction, remodeling, and contractor projects. Professional templates with e-signature.",
    keywords: [
      "scope of work generator",
      "SOW generator",
      "construction scope template",
      "contractor scope of work",
    ],
    priority: 0.85,
    changeFrequency: "monthly",
  },
  "/bathroom-remodel-estimate-template": {
    title: "Bathroom Remodel Estimate Template | Free Contractor Template 2025",
    description:
      "Free bathroom remodel estimate template for contractors. Professional templates for tub-to-shower conversions, full remodels, and bathroom renovations.",
    keywords: [
      "bathroom remodel estimate",
      "bathroom estimate template",
      "bathroom contractor estimate",
      "bathroom renovation cost",
    ],
    priority: 0.85,
    changeFrequency: "monthly",
  },
  "/kitchen-remodel-estimate-template": {
    title: "Kitchen Remodel Estimate Template | Free Contractor Template 2025",
    description:
      "Free kitchen remodel estimate template for contractors. Professional templates for cabinet installation, countertops, full renovations.",
    keywords: [
      "kitchen remodel estimate",
      "kitchen estimate template",
      "kitchen contractor estimate",
      "kitchen renovation cost",
    ],
    priority: 0.85,
    changeFrequency: "monthly",
  },
  "/roofing-estimate-template": {
    title: "Roofing Estimate Template | Free Contractor Template 2025",
    description:
      "Free roofing estimate template for contractors. Professional templates for shingle replacement, metal roofing, flat roofs, and repairs.",
    keywords: [
      "roofing estimate template",
      "roof estimate",
      "roofing contractor estimate",
      "roof replacement cost",
    ],
    priority: 0.85,
    changeFrequency: "monthly",
  },
  "/hvac-estimate-template": {
    title: "HVAC Estimate Template | Free Contractor Template 2025",
    description:
      "Free HVAC estimate template for contractors. Professional templates for AC installation, furnace replacement, ductwork, and mini-splits.",
    keywords: [
      "hvac estimate template",
      "hvac contractor estimate",
      "ac installation cost",
      "furnace replacement estimate",
    ],
    priority: 0.85,
    changeFrequency: "monthly",
  },
  "/plumbing-estimate-template": {
    title: "Plumbing Estimate Template | Free Contractor Template 2025",
    description:
      "Free plumbing estimate template for contractors. Professional templates for water heaters, repiping, fixture installation, and drain repairs.",
    keywords: [
      "plumbing estimate template",
      "plumbing contractor estimate",
      "water heater estimate",
      "repipe cost estimate",
    ],
    priority: 0.85,
    changeFrequency: "monthly",
  },
  "/electrical-estimate-template": {
    title: "Electrical Estimate Template | Free Contractor Template 2025",
    description:
      "Free electrical estimate template for contractors. Professional templates for panel upgrades, rewiring, lighting, and EV charger installation.",
    keywords: [
      "electrical estimate template",
      "electrician estimate",
      "panel upgrade cost",
      "ev charger installation cost",
    ],
    priority: 0.85,
    changeFrequency: "monthly",
  },
  "/flooring-estimate-template": {
    title: "Flooring Estimate Template | Free Contractor Template 2025",
    description:
      "Free flooring estimate template for contractors. Professional templates for hardwood, tile, LVP, and carpet installation.",
    keywords: [
      "flooring estimate template",
      "flooring contractor estimate",
      "hardwood installation cost",
      "tile flooring estimate",
    ],
    priority: 0.85,
    changeFrequency: "monthly",
  },
  "/painting-estimate-template": {
    title: "Painting Estimate Template | Free Contractor Template 2025",
    description:
      "Free painting estimate template for contractors. Professional templates for interior, exterior, and cabinet painting.",
    keywords: [
      "painting estimate template",
      "painter estimate",
      "interior painting cost",
      "exterior painting estimate",
    ],
    priority: 0.85,
    changeFrequency: "monthly",
  },
  "/drywall-estimate-template": {
    title: "Drywall Estimate Template | Free Contractor Template 2025",
    description:
      "Free drywall estimate template for contractors. Professional templates for new installation, repairs, and texturing.",
    keywords: [
      "drywall estimate template",
      "drywall contractor estimate",
      "drywall installation cost",
      "drywall repair estimate",
    ],
    priority: 0.85,
    changeFrequency: "monthly",
  },
};

export type SeoConfig = typeof seoConfig;
export type PageSeoConfig = typeof pagesSeoConfig;
