import { MetadataRoute } from 'next';
import { blogPosts } from '@/lib/blog-data';
import { 
  seoConfig, 
  pagesSeoConfig, 
  getSitemapPriority, 
  getChangeFrequency,
  shouldIndex 
} from '@/lib/seo';

/**
 * Sitemap Generation
 * Automatically generates sitemap from SEO configuration.
 * The SEO bot ensures all pages are properly configured.
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

  // Combine and deduplicate (prefer configured pages)
  const allPaths = new Set<string>();
  const result: MetadataRoute.Sitemap = [];
  
  // Add configured pages first
  for (const page of configuredPages) {
    allPaths.add(page.url);
    result.push(page);
  }
  
  // Add blog posts (avoid duplicates)
  for (const page of blogPostPages) {
    if (!allPaths.has(page.url)) {
      allPaths.add(page.url);
      result.push(page);
    }
  }

  // Sort by priority (highest first)
  return result.sort((a, b) => (b.priority ?? 0.5) - (a.priority ?? 0.5));
}
