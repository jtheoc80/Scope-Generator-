/**
 * JSON-LD Schema Generators
 * Helpers for generating structured data for search engines.
 */

import { seoConfig } from "./config";

export interface OrganizationSchema {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  alternateName?: string;
  url: string;
  logo?: string;
  description?: string;
  address?: {
    "@type": "PostalAddress";
    addressLocality?: string;
    addressRegion?: string;
    addressCountry?: string;
  };
  contactPoint?: {
    "@type": "ContactPoint";
    email?: string;
    contactType?: string;
  };
  sameAs?: string[];
}

export interface SoftwareApplicationSchema {
  "@context": "https://schema.org";
  "@type": "SoftwareApplication";
  name: string;
  applicationCategory: string;
  operatingSystem: string;
  description: string;
  url: string;
  offers?: {
    "@type": "Offer";
    price: string;
    priceCurrency: string;
    description?: string;
  };
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: string;
    ratingCount: string;
    bestRating: string;
    worstRating: string;
  };
  featureList?: string[];
}

export interface ArticleSchema {
  "@context": "https://schema.org";
  "@type": "Article" | "BlogPosting";
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  author: {
    "@type": "Person" | "Organization";
    name: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
    url: string;
    logo?: {
      "@type": "ImageObject";
      url: string;
    };
  };
  mainEntityOfPage?: {
    "@type": "WebPage";
    "@id": string;
  };
  image?: string;
}

export interface FAQSchema {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
}

export interface BreadcrumbSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}

export interface WebPageSchema {
  "@context": "https://schema.org";
  "@type": "WebPage";
  name: string;
  description: string;
  url: string;
  publisher?: {
    "@type": "Organization";
    name: string;
    url: string;
  };
}

export interface ProductComparisonSchema {
  "@context": "https://schema.org";
  "@type": "ItemList";
  name: string;
  description: string;
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    item: {
      "@type": "Product" | "SoftwareApplication";
      name: string;
      description: string;
      url?: string;
    };
  }>;
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(): OrganizationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: seoConfig.site.name,
    alternateName: seoConfig.organization.legalName,
    url: seoConfig.site.url,
    logo: `${seoConfig.site.url}${seoConfig.site.logo}`,
    description: seoConfig.defaults.description,
    address: {
      "@type": "PostalAddress",
      addressLocality: seoConfig.organization.address.locality,
      addressRegion: seoConfig.organization.address.region,
      addressCountry: seoConfig.organization.address.country,
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: seoConfig.organization.email,
      contactType: "customer service",
    },
    // TODO: Populate socialProfiles in seo/config.ts with real URLs
    // (LinkedIn, Twitter/X, Facebook, etc.) to enable Google Knowledge Panel.
    sameAs: seoConfig.organization.socialProfiles,
  };
}

/**
 * Generate SoftwareApplication schema
 */
export function generateSoftwareApplicationSchema(): SoftwareApplicationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: seoConfig.site.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: seoConfig.defaults.description,
    url: seoConfig.site.url,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free tier available",
    },
    // aggregateRating intentionally omitted — Google requires ratings to be
    // based on real, verified user reviews.  Adding fabricated data risks a
    // manual action (penalty) that can suppress the entire site from search.
    // Re-enable once a genuine review-collection system is in place.
    featureList: [
      "60-second proposal generation",
      "17+ trade templates",
      "E-signature support",
      "PDF download",
      "Regional pricing adjustments",
    ],
  };
}

/**
 * Generate Article schema for blog posts
 */
export function generateArticleSchema(options: {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  image?: string;
  type?: "Article" | "BlogPosting";
}): ArticleSchema {
  return {
    "@context": "https://schema.org",
    "@type": options.type || "Article",
    headline: options.headline,
    description: options.description,
    url: options.url,
    datePublished: options.datePublished,
    dateModified: options.dateModified || options.datePublished,
    author: {
      "@type": "Person",
      name: options.author,
    },
    publisher: {
      "@type": "Organization",
      name: seoConfig.site.name,
      url: seoConfig.site.url,
      logo: {
        "@type": "ImageObject",
        url: `${seoConfig.site.url}${seoConfig.site.logo}`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": options.url,
    },
    ...(options.image && { image: options.image }),
  };
}

/**
 * Generate FAQ schema
 */
export function generateFAQSchema(
  questions: Array<{ question: string; answer: string }>
): FAQSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}

/**
 * Generate Breadcrumb schema
 */
export function generateBreadcrumbSchema(
  breadcrumbs: Array<{ name: string; url: string }>
): BreadcrumbSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url.startsWith("http")
        ? crumb.url
        : `${seoConfig.site.url}${crumb.url}`,
    })),
  };
}

/**
 * Generate WebPage schema
 */
export function generateWebPageSchema(options: {
  name: string;
  description: string;
  url: string;
}): WebPageSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: options.name,
    description: options.description,
    url: options.url.startsWith("http")
      ? options.url
      : `${seoConfig.site.url}${options.url}`,
    publisher: {
      "@type": "Organization",
      name: seoConfig.site.name,
      url: seoConfig.site.url,
    },
  };
}

/**
 * Generate Product Comparison schema (for vs pages)
 */
export function generateComparisonSchema(options: {
  name: string;
  description: string;
  products: Array<{
    name: string;
    description: string;
    url?: string;
  }>;
}): ProductComparisonSchema {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: options.name,
    description: options.description,
    itemListElement: options.products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "SoftwareApplication",
        name: product.name,
        description: product.description,
        ...(product.url && { url: product.url }),
      },
    })),
  };
}

/**
 * Helper to serialize schema for script injection
 */
export function serializeSchema(schema: unknown): string {
  return JSON.stringify(schema);
}
