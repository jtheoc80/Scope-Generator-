#!/usr/bin/env npx tsx
/**
 * SEO Page Scanner
 * Scans the app directory for pages and checks if they have SEO configuration.
 * Useful for finding pages that need SEO metadata added.
 * 
 * Run with: npx tsx script/seo-page-scanner.ts
 */

import * as fs from "fs";
import * as path from "path";
import { pagesSeoConfig } from "../lib/seo/config";

interface PageInfo {
  path: string;
  hasLayout: boolean;
  hasMetadataExport: boolean;
  inSeoConfig: boolean;
  isIndexable: boolean;
}

const APP_DIR = path.join(process.cwd(), "app");

// Paths that should not be indexed
const NON_INDEXABLE_PATTERNS = [
  /^\/api\//,
  /^\/dashboard/,
  /^\/settings/,
  /^\/crew/,
  /^\/p\//,
  /^\/invite\//,
  /^\/sign-in/,
  /^\/sign-up/,
  /^\/sign-out/,
  /^\/search-console/,
  /^\/seo-dashboard/,
];

function shouldBeIndexable(pagePath: string): boolean {
  return !NON_INDEXABLE_PATTERNS.some((pattern) => pattern.test(pagePath));
}

function scanDirectory(dir: string, basePath = ""): PageInfo[] {
  const pages: PageInfo[] = [];
  
  if (!fs.existsSync(dir)) {
    return pages;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip special directories
      if (entry.name.startsWith("_") || entry.name === "api") {
        continue;
      }
      
      // Handle dynamic routes like [slug] or [[...slug]]
      let routePath = entry.name;
      if (routePath.startsWith("[") && routePath.endsWith("]")) {
        // Skip dynamic routes for now, they need special handling
        const subPages = scanDirectory(fullPath, `${basePath}/${routePath}`);
        pages.push(...subPages);
        continue;
      }
      
      const subPath = `${basePath}/${entry.name}`;
      const subPages = scanDirectory(fullPath, subPath);
      pages.push(...subPages);
      
      // Check if this directory has a page.tsx
      const pageFile = path.join(fullPath, "page.tsx");
      if (fs.existsSync(pageFile)) {
        const layoutFile = path.join(fullPath, "layout.tsx");
        const hasLayout = fs.existsSync(layoutFile);
        
        // Check if layout has metadata export
        let hasMetadataExport = false;
        if (hasLayout) {
          const layoutContent = fs.readFileSync(layoutFile, "utf-8");
          hasMetadataExport = layoutContent.includes("export const metadata") || 
                             layoutContent.includes("export async function generateMetadata");
        }
        
        // Also check page.tsx for metadata
        const pageContent = fs.readFileSync(pageFile, "utf-8");
        if (pageContent.includes("export const metadata") || 
            pageContent.includes("export async function generateMetadata")) {
          hasMetadataExport = true;
        }
        
        const normalizedPath = subPath || "/";
        
        pages.push({
          path: normalizedPath,
          hasLayout,
          hasMetadataExport,
          inSeoConfig: normalizedPath in pagesSeoConfig,
          isIndexable: shouldBeIndexable(normalizedPath),
        });
      }
    }
  }
  
  // Check root page
  if (basePath === "") {
    const rootPage = path.join(dir, "page.tsx");
    if (fs.existsSync(rootPage)) {
      const rootLayout = path.join(dir, "layout.tsx");
      const hasLayout = fs.existsSync(rootLayout);
      
      let hasMetadataExport = false;
      if (hasLayout) {
        const layoutContent = fs.readFileSync(rootLayout, "utf-8");
        hasMetadataExport = layoutContent.includes("export const metadata");
      }
      
      pages.unshift({
        path: "/",
        hasLayout,
        hasMetadataExport,
        inSeoConfig: "/" in pagesSeoConfig,
        isIndexable: true,
      });
    }
  }
  
  return pages;
}

function main() {
  console.log("🔍 Scanning app directory for pages...\n");
  
  const pages = scanDirectory(APP_DIR);
  
  // Filter to only indexable pages for main report
  const indexablePages = pages.filter((p) => p.isIndexable);
  const nonIndexablePages = pages.filter((p) => !p.isIndexable);
  
  console.log("═".repeat(70));
  console.log("  SEO PAGE SCAN REPORT");
  console.log("═".repeat(70));
  console.log(`  Total Pages Found: ${pages.length}`);
  console.log(`  Indexable Pages: ${indexablePages.length}`);
  console.log(`  Non-Indexable Pages: ${nonIndexablePages.length}`);
  console.log("");
  
  // Pages missing SEO config
  const missingConfig = indexablePages.filter((p) => !p.inSeoConfig);
  if (missingConfig.length > 0) {
    console.log("─".repeat(70));
    console.log("  🔴 PAGES MISSING SEO CONFIG (Add to lib/seo/config.ts)");
    console.log("─".repeat(70));
    for (const page of missingConfig) {
      console.log(`  ❌ ${page.path}`);
      console.log(`     Has Layout: ${page.hasLayout ? "✓" : "✗"} | Has Metadata: ${page.hasMetadataExport ? "✓" : "✗"}`);
    }
    console.log("");
  }
  
  // Pages missing metadata export
  const missingMetadata = indexablePages.filter((p) => !p.hasMetadataExport);
  if (missingMetadata.length > 0) {
    console.log("─".repeat(70));
    console.log("  🟡 PAGES WITHOUT METADATA EXPORT");
    console.log("─".repeat(70));
    for (const page of missingMetadata) {
      console.log(`  ⚠️  ${page.path}`);
    }
    console.log("");
  }
  
  // Well-configured pages
  const wellConfigured = indexablePages.filter(
    (p) => p.inSeoConfig && p.hasMetadataExport
  );
  if (wellConfigured.length > 0) {
    console.log("─".repeat(70));
    console.log("  🟢 WELL-CONFIGURED PAGES");
    console.log("─".repeat(70));
    for (const page of wellConfigured) {
      console.log(`  ✅ ${page.path}`);
    }
    console.log("");
  }
  
  // Non-indexable pages (info only)
  if (nonIndexablePages.length > 0) {
    console.log("─".repeat(70));
    console.log("  ℹ️  NON-INDEXABLE PAGES (No SEO needed)");
    console.log("─".repeat(70));
    for (const page of nonIndexablePages) {
      console.log(`  ➖ ${page.path}`);
    }
    console.log("");
  }
  
  // Generate suggested config for missing pages
  if (missingConfig.length > 0) {
    console.log("═".repeat(70));
    console.log("  SUGGESTED CONFIG FOR MISSING PAGES");
    console.log("═".repeat(70));
    console.log("  Add to lib/seo/config.ts pagesSeoConfig:\n");
    
    for (const page of missingConfig) {
      const pageName = page.path === "/" ? "Home" : 
        page.path.split("/").filter(Boolean).map(
          (s) => s.charAt(0).toUpperCase() + s.slice(1)
        ).join(" ");
      
      console.log(`  "${page.path}": {`);
      console.log(`    title: "${pageName} | ${process.env.SITE_NAME || 'ScopeGen'}",`);
      console.log(`    description: "Add description for ${page.path}",`);
      console.log(`    keywords: ["keyword1", "keyword2"],`);
      console.log(`    priority: 0.5,`);
      console.log(`    changeFrequency: "monthly",`);
      console.log(`  },`);
      console.log("");
    }
  }
  
  console.log("═".repeat(70));
  console.log("  END OF REPORT");
  console.log("═".repeat(70));
  
  // Exit with error if there are missing configurations
  if (missingConfig.length > 0 && process.argv.includes("--ci")) {
    console.log("\n❌ Scan failed: Found pages without SEO configuration");
    process.exit(1);
  }
}

main();
