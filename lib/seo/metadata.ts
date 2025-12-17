/**
 * SEO Metadata Utilities
 * Helper functions to generate consistent metadata across all pages.
 */

import type { Metadata } from "next";
import { seoConfig, pagesSeoConfig } from "./config";

export interface GenerateMetadataOptions {
  title: string;
  description: string;
  keywords?: string[];
  path?: string;
  ogType?: "website" | "article" | "product";
  ogImage?: string;
  ogImageAlt?: string;
  noIndex?: boolean;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
}

/**
 * Generate complete metadata object for a page
 */
export function generateMetadata(options: GenerateMetadataOptions): Metadata {
  const {
    title,
    description,
    keywords = seoConfig.defaults.keywords,
    path = "/",
    ogType = "website",
    ogImage = seoConfig.site.defaultImage,
    ogImageAlt = seoConfig.openGraph.imageAlt,
    noIndex = false,
    article,
  } = options;

  const fullUrl = `${seoConfig.site.url}${path}`;
  const fullImageUrl = ogImage.startsWith("http")
    ? ogImage
    : `${seoConfig.site.url}${ogImage}`;

  const metadata: Metadata = {
    title,
    description,
    keywords,
    authors: [{ name: seoConfig.site.creator }],
    creator: seoConfig.site.creator,
    publisher: seoConfig.site.publisher,
    metadataBase: new URL(seoConfig.site.url),
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName: seoConfig.site.name,
      type: ogType,
      locale: seoConfig.site.locale,
      images: [
        {
          url: fullImageUrl,
          width: seoConfig.openGraph.imageWidth,
          height: seoConfig.openGraph.imageHeight,
          alt: ogImageAlt,
        },
      ],
    },
    twitter: {
      card: seoConfig.twitter.card,
      title,
      description,
      images: [fullImageUrl],
      site: seoConfig.twitter.site,
      creator: seoConfig.twitter.creator,
    },
  };

  // Handle robots/indexing
  if (noIndex) {
    metadata.robots = {
      index: false,
      follow: false,
    };
  } else {
    metadata.robots = seoConfig.robots;
  }

  // Add article-specific metadata if provided
  if (article && ogType === "article") {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: "article",
      ...(article.publishedTime && {
        publishedTime: article.publishedTime,
      }),
      ...(article.modifiedTime && { modifiedTime: article.modifiedTime }),
      ...(article.author && { authors: [article.author] }),
      ...(article.section && { section: article.section }),
      ...(article.tags && { tags: article.tags }),
    };
  }

  return metadata;
}

/**
 * Generate metadata for a page using the centralized config
 */
export function getPageMetadata(pagePath: string): Metadata {
  const pageConfig = pagesSeoConfig[pagePath];

  if (!pageConfig) {
    console.warn(`No SEO config found for page: ${pagePath}`);
    return generateMetadata({
      title: seoConfig.defaults.title,
      description: seoConfig.defaults.description,
      path: pagePath,
    });
  }

  return generateMetadata({
    title: pageConfig.title,
    description: pageConfig.description,
    keywords: pageConfig.keywords,
    path: pagePath,
    ogType: pageConfig.ogType,
  });
}

/**
 * Generate metadata for blog posts
 */
export function generateBlogPostMetadata(post: {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
}): Metadata {
  return generateMetadata({
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    keywords: [
      post.category.toLowerCase(),
      "contractor blog",
      "proposal tips",
      post.title.split(" ").slice(0, 3).join(" ").toLowerCase(),
    ],
    path: `/blog/${post.slug}`,
    ogType: "article",
    article: {
      publishedTime: new Date(post.date).toISOString(),
      author: post.author,
      section: post.category,
      tags: [post.category],
    },
  });
}

/**
 * Generate metadata for comparison pages
 */
export function generateComparisonMetadata(competitor: {
  name: string;
  slug: string;
  tagline?: string;
}): Metadata {
  const title = `ScopeGen vs ${competitor.name} - Contractor Proposal Software Comparison`;
  const description = `Compare ScopeGen vs ${competitor.name} for contractor proposals. See differences in pricing, features, ease of use, and find out which is right for your business.`;

  return generateMetadata({
    title,
    description,
    keywords: [
      `ScopeGen vs ${competitor.name}`,
      `${competitor.name} alternative`,
      "contractor proposal software comparison",
      "construction management software",
    ],
    path: `/vs/${competitor.slug}`,
    ogType: "article",
  });
}

/**
 * Validate metadata meets SEO best practices
 */
export function validateMetadata(metadata: {
  title: string;
  description: string;
  keywords?: string[];
}): {
  valid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Title validation
  if (!metadata.title) {
    errors.push("Title is required");
  } else {
    if (metadata.title.length < seoConfig.audit.titleMinLength) {
      warnings.push(
        `Title is too short (${metadata.title.length} chars). Recommended: ${seoConfig.audit.titleMinLength}-${seoConfig.audit.titleMaxLength} chars.`
      );
    }
    if (metadata.title.length > seoConfig.audit.titleMaxLength) {
      warnings.push(
        `Title may be truncated in search results (${metadata.title.length} chars). Recommended max: ${seoConfig.audit.titleMaxLength} chars.`
      );
    }
  }

  // Description validation
  if (!metadata.description) {
    errors.push("Description is required");
  } else {
    if (metadata.description.length < seoConfig.audit.descriptionMinLength) {
      warnings.push(
        `Description is too short (${metadata.description.length} chars). Recommended: ${seoConfig.audit.descriptionMinLength}-${seoConfig.audit.descriptionMaxLength} chars.`
      );
    }
    if (metadata.description.length > seoConfig.audit.descriptionMaxLength) {
      warnings.push(
        `Description may be truncated in search results (${metadata.description.length} chars). Recommended max: ${seoConfig.audit.descriptionMaxLength} chars.`
      );
    }
  }

  // Keywords validation
  if (metadata.keywords) {
    if (metadata.keywords.length < seoConfig.audit.minKeywords) {
      warnings.push(
        `Consider adding more keywords (${metadata.keywords.length} found). Recommended: ${seoConfig.audit.minKeywords}-${seoConfig.audit.maxKeywords}`
      );
    }
    if (metadata.keywords.length > seoConfig.audit.maxKeywords) {
      warnings.push(
        `Too many keywords may dilute focus (${metadata.keywords.length} found). Recommended max: ${seoConfig.audit.maxKeywords}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Check if a path should be indexed
 */
export function shouldIndex(path: string): boolean {
  return !seoConfig.noIndexPages.some(
    (noIndexPath) =>
      path.startsWith(noIndexPath) || path === noIndexPath.replace(/\/$/, "")
  );
}

/**
 * Get sitemap priority for a path
 */
export function getSitemapPriority(path: string): number {
  const pageConfig = pagesSeoConfig[path];
  if (pageConfig?.priority !== undefined) {
    return pageConfig.priority;
  }

  // Default priorities based on path patterns
  if (path === "/") return seoConfig.priorityPages.home;
  if (path.startsWith("/blog/")) return 0.7;
  if (path.startsWith("/vs/")) return seoConfig.priorityPages.comparison;
  if (path.startsWith("/blog")) return seoConfig.priorityPages.blog;

  return 0.5; // Default priority
}

/**
 * Get change frequency for a path
 */
export function getChangeFrequency(
  path: string
): "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never" {
  const pageConfig = pagesSeoConfig[path];
  if (pageConfig?.changeFrequency) {
    return pageConfig.changeFrequency;
  }

  // Default frequencies based on path patterns
  if (path === "/") return "weekly";
  if (path.startsWith("/blog/")) return "monthly";
  if (path.startsWith("/blog")) return "weekly";
  if (path.startsWith("/vs/")) return "monthly";
  if (path.includes("privacy") || path.includes("terms")) return "yearly";

  return "monthly";
}
