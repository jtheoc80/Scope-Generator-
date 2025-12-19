import { MetadataRoute } from 'next';
import { seoConfig } from '@/lib/seo';

/**
 * Robots.txt Generation
 * Uses centralized SEO configuration for consistency.
 * 
 * Note: Pages blocked here should also have noindex metadata
 * for defense-in-depth SEO protection.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = seoConfig.site.url;
  
  // Get disallow paths from SEO config and ensure they end with patterns
  // that prevent indexing of the route and all sub-routes
  const disallowPaths = seoConfig.noIndexPages.flatMap(path => {
    // For paths ending with /, add both the path and wildcard
    if (path.endsWith('/')) {
      return [path, `${path}*`];
    }
    // For other paths, add the exact path and a wildcard version
    return [path, `${path}/`, `${path}/*`];
  });

  // Remove duplicates
  const uniqueDisallowPaths = [...new Set(disallowPaths)];
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: uniqueDisallowPaths,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: uniqueDisallowPaths,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: uniqueDisallowPaths,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
