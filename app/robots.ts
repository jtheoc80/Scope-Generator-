import { MetadataRoute } from 'next';
import { seoConfig } from '@/lib/seo';

/**
 * Robots.txt Generation
 * Uses centralized SEO configuration for consistency.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = seoConfig.site.url;
  
  // Get disallow paths from SEO config
  const disallowPaths = seoConfig.noIndexPages;
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowPaths,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: disallowPaths,
      },
      // Allow specific crawlers for better discovery
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: disallowPaths,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
