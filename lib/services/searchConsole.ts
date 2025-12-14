import { google } from 'googleapis';

function getAuth() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set');
  }
  
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  
  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [
      'https://www.googleapis.com/auth/webmasters',
      'https://www.googleapis.com/auth/webmasters.readonly'
    ]
  });
}

export interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchAnalyticsResponse {
  rows: SearchAnalyticsRow[];
  responseAggregationType?: string;
}

export interface SitemapInfo {
  path: string;
  lastSubmitted?: string;
  isPending?: boolean;
  isSitemapsIndex?: boolean;
  lastDownloaded?: string;
  warnings?: string;
  errors?: string;
  contents?: Array<{
    type: string;
    submitted?: string;
    indexed?: string;
  }>;
}

export interface UrlInspectionResult {
  inspectionResult?: {
    indexStatusResult?: {
      verdict?: string;
      coverageState?: string;
      robotsTxtState?: string;
      indexingState?: string;
      lastCrawlTime?: string;
      pageFetchState?: string;
      googleCanonical?: string;
      userCanonical?: string;
      sitemap?: string[];
      referringUrls?: string[];
      crawledAs?: string;
    };
    mobileUsabilityResult?: {
      verdict?: string;
      issues?: Array<{
        issueType?: string;
        severity?: string;
        message?: string;
      }>;
    };
    richResultsResult?: {
      verdict?: string;
      detectedItems?: Array<{
        richResultType?: string;
        items?: Array<{
          name?: string;
          issues?: Array<{
            issueMessage?: string;
            severity?: string;
          }>;
        }>;
      }>;
    };
  };
}

export const searchConsoleService = {
  async listSites(): Promise<Array<{ siteUrl: string; permissionLevel: string }>> {
    const auth = getAuth();
    const webmasters = google.webmasters({ version: 'v3', auth });
    
    const response = await webmasters.sites.list();
    
    return (response.data.siteEntry || []).map(site => ({
      siteUrl: site.siteUrl || '',
      permissionLevel: site.permissionLevel || 'unknown'
    }));
  },

  async getSearchAnalytics(
    siteUrl: string,
    startDate: string,
    endDate: string,
    dimensions: string[] = ['query'],
    rowLimit: number = 100
  ): Promise<SearchAnalyticsResponse> {
    const auth = getAuth();
    const searchconsole = google.searchconsole({ version: 'v1', auth });
    
    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions,
        rowLimit,
        dataState: 'final'
      }
    });
    
    return {
      rows: (response.data.rows || []).map(row => ({
        keys: row.keys || [],
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0
      })),
      responseAggregationType: response.data.responseAggregationType ?? undefined
    };
  },

  async listSitemaps(siteUrl: string): Promise<SitemapInfo[]> {
    const auth = getAuth();
    const webmasters = google.webmasters({ version: 'v3', auth });
    
    const response = await webmasters.sitemaps.list({ siteUrl });
    
    return (response.data.sitemap || []).map(sitemap => ({
      path: sitemap.path || '',
      lastSubmitted: sitemap.lastSubmitted ?? undefined,
      isPending: sitemap.isPending ?? undefined,
      isSitemapsIndex: sitemap.isSitemapsIndex ?? undefined,
      lastDownloaded: sitemap.lastDownloaded ?? undefined,
      warnings: sitemap.warnings?.toString(),
      errors: sitemap.errors?.toString(),
      contents: sitemap.contents?.map(content => ({
        type: content.type || '',
        submitted: content.submitted?.toString(),
        indexed: content.indexed?.toString()
      }))
    }));
  },

  async submitSitemap(siteUrl: string, feedpath: string): Promise<void> {
    const auth = getAuth();
    const webmasters = google.webmasters({ version: 'v3', auth });
    
    await webmasters.sitemaps.submit({
      siteUrl,
      feedpath
    });
  },

  async deleteSitemap(siteUrl: string, feedpath: string): Promise<void> {
    const auth = getAuth();
    const webmasters = google.webmasters({ version: 'v3', auth });
    
    await webmasters.sitemaps.delete({
      siteUrl,
      feedpath
    });
  },

  async inspectUrl(siteUrl: string, inspectionUrl: string): Promise<UrlInspectionResult> {
    const auth = getAuth();
    const searchconsole = google.searchconsole({ version: 'v1', auth });
    
    const response = await searchconsole.urlInspection.index.inspect({
      requestBody: {
        siteUrl,
        inspectionUrl,
        languageCode: 'en-US'
      }
    });
    
    const inspectionResult = response.data.inspectionResult;
    if (!inspectionResult) {
      return {};
    }

    return {
      inspectionResult: {
        indexStatusResult: inspectionResult.indexStatusResult ? {
          verdict: inspectionResult.indexStatusResult.verdict ?? undefined,
          coverageState: inspectionResult.indexStatusResult.coverageState ?? undefined,
          robotsTxtState: inspectionResult.indexStatusResult.robotsTxtState ?? undefined,
          indexingState: inspectionResult.indexStatusResult.indexingState ?? undefined,
          lastCrawlTime: inspectionResult.indexStatusResult.lastCrawlTime ?? undefined,
          pageFetchState: inspectionResult.indexStatusResult.pageFetchState ?? undefined,
          googleCanonical: inspectionResult.indexStatusResult.googleCanonical ?? undefined,
          userCanonical: inspectionResult.indexStatusResult.userCanonical ?? undefined,
          sitemap: inspectionResult.indexStatusResult.sitemap ?? undefined,
          referringUrls: inspectionResult.indexStatusResult.referringUrls ?? undefined,
          crawledAs: inspectionResult.indexStatusResult.crawledAs ?? undefined,
        } : undefined,
        mobileUsabilityResult: inspectionResult.mobileUsabilityResult ? {
          verdict: inspectionResult.mobileUsabilityResult.verdict ?? undefined,
          issues: inspectionResult.mobileUsabilityResult.issues?.map(issue => ({
            issueType: issue.issueType ?? undefined,
            severity: issue.severity ?? undefined,
            message: issue.message ?? undefined,
          })),
        } : undefined,
        richResultsResult: inspectionResult.richResultsResult ? {
          verdict: inspectionResult.richResultsResult.verdict ?? undefined,
          detectedItems: inspectionResult.richResultsResult.detectedItems?.map(item => ({
            richResultType: item.richResultType ?? undefined,
            items: item.items?.map(subItem => ({
              name: subItem.name ?? undefined,
              issues: subItem.issues?.map(issue => ({
                issueMessage: issue.issueMessage ?? undefined,
                severity: issue.severity ?? undefined,
              })),
            })),
          })),
        } : undefined,
      }
    };
  },

  async testConnection(): Promise<{ success: boolean; sites: number; error?: string }> {
    try {
      const sites = await this.listSites();
      return { success: true, sites: sites.length };
    } catch (error: any) {
      return { 
        success: false, 
        sites: 0, 
        error: error.message || 'Unknown error' 
      };
    }
  }
};
