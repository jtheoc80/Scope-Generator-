import { MetadataRoute } from 'next';
import { blogPosts } from '@/lib/blog-data';
import { 
  seoConfig, 
  pagesSeoConfig, 
  getSitemapPriority, 
  getChangeFrequency,
  shouldIndex 
} from '@/lib/seo';
import { getTradeKeys, cityKeys, tradeSupportsCities } from '@/lib/trade-data';
import { getLandingPageSlugs } from '@/lib/landing-pages-data';
import { tradeDefinitions, type TradeKey } from '@/lib/trades/tradeDefinitions';

/**
 * Sitemap Generation
 * Automatically generates sitemap from SEO configuration.
 * Includes all public pages: core pages, blog posts, trade landing pages,
 * city-specific pages, and SEO landing pages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = seoConfig.site.url;
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Generate sitemap entries from pagesSeoConfig
  const configuredPages: MetadataRoute.Sitemap = Object.entries(pagesSeoConfig)
    .filter(([path]) => shouldIndex(path))
    .map(([path, config]) => ({
      url: `${baseUrl}${path}`,
      lastModified: currentDate,
      changeFrequency: config.changeFrequency || getChangeFrequency(path),
      priority: config.priority ?? getSitemapPriority(path),
    }));

  // Dynamic blog post pages
  const blogPostPages: MetadataRoute.Sitemap = Object.values(blogPosts).map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Trade-specific landing pages
  const tradePages: MetadataRoute.Sitemap = getTradeKeys().map((tradeSlug) => ({
    url: `${baseUrl}/for/${tradeSlug}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // City-specific trade landing pages
  const cityTradePages: MetadataRoute.Sitemap = [];
  for (const tradeSlug of getTradeKeys()) {
    if (tradeSupportsCities(tradeSlug)) {
      for (const citySlug of cityKeys) {
        cityTradePages.push({
          url: `${baseUrl}/for/${tradeSlug}/${citySlug}`,
          lastModified: currentDate,
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        });
      }
    }
  }

  // Trade-specific detail pages (/trades/[trade])
  const tradeDetailPages: MetadataRoute.Sitemap = (Object.keys(tradeDefinitions) as TradeKey[]).map((tradeKey) => ({
    url: `${baseUrl}/trades/${tradeKey}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }));

  // SEO Landing Pages (estimate templates, generators)
  const landingPages: MetadataRoute.Sitemap = getLandingPageSlugs().map((slug) => ({
    url: `${baseUrl}/${slug}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.85, // High priority for landing pages
  }));

  // Combine and deduplicate (prefer configured pages)
  const allPaths = new Set<string>();
  const result: MetadataRoute.Sitemap = [];
  
  // Add configured pages first (highest priority)
  for (const page of configuredPages) {
    allPaths.add(page.url);
    result.push(page);
  }
  
  // Add landing pages (high priority for SEO)
  for (const page of landingPages) {
    if (!allPaths.has(page.url)) {
      allPaths.add(page.url);
      result.push(page);
    }
  }
  
  // Add trade pages
  for (const page of tradePages) {
    if (!allPaths.has(page.url)) {
      allPaths.add(page.url);
      result.push(page);
    }
  }

  // Add trade detail pages (/trades/[trade])
  for (const page of tradeDetailPages) {
    if (!allPaths.has(page.url)) {
      allPaths.add(page.url);
      result.push(page);
    }
  }

  // Add blog posts (avoid duplicates)
  for (const page of blogPostPages) {
    if (!allPaths.has(page.url)) {
      allPaths.add(page.url);
      result.push(page);
    }
  }

  // Add city-specific trade pages
  for (const page of cityTradePages) {
    if (!allPaths.has(page.url)) {
      allPaths.add(page.url);
      result.push(page);
    }
  }

  // Sort by priority (highest first)
  return result.sort((a, b) => (b.priority ?? 0.5) - (a.priority ?? 0.5));
}
