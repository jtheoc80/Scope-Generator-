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

  // Some pages should be crawlable (to avoid "Blocked by robots.txt" and redirect issues),
  // but still non-indexable via page-level robots metadata (noindex).
  //
  // Example: auth pages are frequently the target of redirects from protected routes
  // and from subdomains (e.g., accounts.*). If we disallow them here, Search Console
  // can report the source URL as blocked by robots.txt.
  const crawlableNoIndexPrefixes = new Set([
    "/sign-in",
    "/sign-up",
    "/sign-out",
  ]);
  
  // Get disallow paths from SEO config and ensure they end with patterns
  // that prevent indexing of the route and all sub-routes
  const disallowPaths = seoConfig.noIndexPages
    .filter((path) => !crawlableNoIndexPrefixes.has(path.replace(/\/$/, "")))
    .flatMap(path => {
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
