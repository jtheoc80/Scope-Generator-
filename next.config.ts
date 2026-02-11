import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Normalise URLs — prevents Google from seeing /page and /page/ as
  // separate pages (duplicate-content / "Duplicate without user-selected
  // canonical" issue in Search Console).
  trailingSlash: false,

  // Custom HTTP headers for SEO & security
  async headers() {
    return [
      {
        // Tell search engines not to index authenticated/internal routes
        // even if robots.txt or meta-robots are somehow missed.
        // /app is included here because middleware redirects unauthenticated
        // requests, and the X-Robots-Tag header is sent with the redirect
        // response, preventing "Page with redirect" in Search Console.
        source: "/(app|dashboard|settings|crew|pro|admin|pricing-insights|search-console)(.*)",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
      {
        // Prevent indexing of API routes
        source: "/api/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex",
          },
        ],
      },
      {
        // Security headers for the whole site (also a minor positive
        // signal — Google surfaces HTTPS and secure sites higher).
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
