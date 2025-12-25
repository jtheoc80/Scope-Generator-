'use client';
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Globe, 
  Search, 
  FileText, 
  TrendingUp, 
  MousePointerClick, 
  Eye, 
  BarChart3,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Link as LinkIcon
} from "lucide-react";

interface Site {
  siteUrl: string;
  permissionLevel: string;
}

interface AnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface Sitemap {
  path: string;
  lastSubmitted?: string;
  isPending?: boolean;
  isSitemapsIndex?: boolean;
  lastDownloaded?: string;
  warnings?: string;
  errors?: string;
}

export default function SearchConsolePage() {
  const { toast } = useToast();
  const _queryClient = useQueryClient();
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [inspectUrl, setInspectUrl] = useState("");
  const [newSitemapUrl, setNewSitemapUrl] = useState("");
  const [dateRange, setDateRange] = useState("7");

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: connectionTest, isLoading: testLoading } = useQuery({
    queryKey: ["/api/search-console/test"],
    queryFn: async () => {
      const res = await fetch("/api/search-console/test");
      if (!res.ok) throw new Error("Failed to test connection");
      return res.json();
    },
    enabled: user?.subscriptionPlan === 'crew',
    retry: false,
  });

  const { data: sites } = useQuery<Site[]>({
    queryKey: ["/api/search-console/sites"],
    queryFn: async () => {
      const res = await fetch("/api/search-console/sites");
      if (!res.ok) throw new Error("Failed to fetch sites");
      return res.json();
    },
    enabled: connectionTest?.success,
  });

  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(dateRange));
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery<{ rows: AnalyticsRow[] }>({
    queryKey: ["/api/search-console/analytics", selectedSite, dateRange],
    queryFn: async () => {
      const { startDate, endDate } = getDateRange();
      const params = new URLSearchParams({
        siteUrl: selectedSite,
        startDate,
        endDate,
        dimensions: 'query',
        rowLimit: '50',
      });
      const res = await fetch(`/api/search-console/analytics?${params}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    enabled: !!selectedSite,
  });

  const { data: sitemaps, isLoading: sitemapsLoading, refetch: refetchSitemaps } = useQuery<Sitemap[]>({
    queryKey: ["/api/search-console/sitemaps", selectedSite],
    queryFn: async () => {
      const params = new URLSearchParams({ siteUrl: selectedSite });
      const res = await fetch(`/api/search-console/sitemaps?${params}`);
      if (!res.ok) throw new Error("Failed to fetch sitemaps");
      return res.json();
    },
    enabled: !!selectedSite,
  });

  const inspectUrlMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch("/api/search-console/inspect-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteUrl: selectedSite, inspectionUrl: url }),
      });
      if (!res.ok) throw new Error("Failed to inspect URL");
      return res.json();
    },
    onSuccess: (data) => {
      const verdict = data.inspectionResult?.indexStatusResult?.verdict;
      toast({
        title: "URL Inspection Complete",
        description: `Verdict: ${verdict || 'Unknown'}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Inspection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const submitSitemapMutation = useMutation({
    mutationFn: async (feedpath: string) => {
      const res = await fetch("/api/search-console/sitemaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteUrl: selectedSite, feedpath }),
      });
      if (!res.ok) throw new Error("Failed to submit sitemap");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Sitemap submitted successfully" });
      setNewSitemapUrl("");
      refetchSitemaps();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit sitemap",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (userLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Please log in to access Search Console.</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (user.subscriptionPlan !== 'crew') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Crew Feature</CardTitle>
              <CardDescription>
                Search Console integration is available for Crew subscribers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Upgrade to Crew to access Google Search Console data, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Search analytics and keyword performance</li>
                <li>Sitemap management</li>
                <li>URL inspection tool</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const totalClicks = analytics?.rows?.reduce((sum, row) => sum + row.clicks, 0) || 0;
  const totalImpressions = analytics?.rows?.reduce((sum, row) => sum + row.impressions, 0) || 0;
  const avgCtr = analytics?.rows?.length 
    ? (analytics.rows.reduce((sum, row) => sum + row.ctr, 0) / analytics.rows.length * 100).toFixed(2)
    : "0.00";
  const avgPosition = analytics?.rows?.length
    ? (analytics.rows.reduce((sum, row) => sum + row.position, 0) / analytics.rows.length).toFixed(1)
    : "0.0";

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-primary mb-2">Search Console</h1>
          <p className="text-muted-foreground">Monitor your site&apos;s search performance and indexing status.</p>
        </div>

        {testLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Testing connection...</span>
              </div>
            </CardContent>
          </Card>
        ) : !connectionTest?.success ? (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="w-5 h-5" />
                Connection Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{connectionTest?.error || "Failed to connect to Search Console."}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Select value={selectedSite} onValueChange={setSelectedSite}>
                  <SelectTrigger data-testid="select-site">
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites?.map((site) => (
                      <SelectItem key={site.siteUrl} value={site.siteUrl}>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          {site.siteUrl}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]" data-testid="select-date-range">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="28">Last 28 days</SelectItem>
                  <SelectItem value="90">Last 3 months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedSite && (
              <Tabs defaultValue="analytics" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="analytics" data-testid="tab-analytics">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger value="sitemaps" data-testid="tab-sitemaps">
                    <FileText className="w-4 h-4 mr-2" />
                    Sitemaps
                  </TabsTrigger>
                  <TabsTrigger value="inspect" data-testid="tab-inspect">
                    <Search className="w-4 h-4 mr-2" />
                    URL Inspection
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="analytics" className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Clicks</p>
                            <p className="text-2xl font-bold" data-testid="text-total-clicks">{totalClicks.toLocaleString()}</p>
                          </div>
                          <MousePointerClick className="w-8 h-8 text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Impressions</p>
                            <p className="text-2xl font-bold" data-testid="text-impressions">{totalImpressions.toLocaleString()}</p>
                          </div>
                          <Eye className="w-8 h-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Avg CTR</p>
                            <p className="text-2xl font-bold" data-testid="text-avg-ctr">{avgCtr}%</p>
                          </div>
                          <TrendingUp className="w-8 h-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Avg Position</p>
                            <p className="text-2xl font-bold" data-testid="text-avg-position">{avgPosition}</p>
                          </div>
                          <BarChart3 className="w-8 h-8 text-orange-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Top Queries</CardTitle>
                        <CardDescription>Search terms driving traffic to your site</CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => refetchAnalytics()}
                        disabled={analyticsLoading}
                        data-testid="button-refresh-analytics"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${analyticsLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {analyticsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      ) : analytics?.rows?.length ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 px-2 font-medium">Query</th>
                                <th className="text-right py-3 px-2 font-medium">Clicks</th>
                                <th className="text-right py-3 px-2 font-medium">Impressions</th>
                                <th className="text-right py-3 px-2 font-medium">CTR</th>
                                <th className="text-right py-3 px-2 font-medium">Position</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analytics.rows.map((row, index) => (
                                <tr key={index} className="border-b last:border-0 hover:bg-muted/50" data-testid={`row-query-${index}`}>
                                  <td className="py-3 px-2 font-medium">{row.keys[0]}</td>
                                  <td className="text-right py-3 px-2">{row.clicks.toLocaleString()}</td>
                                  <td className="text-right py-3 px-2">{row.impressions.toLocaleString()}</td>
                                  <td className="text-right py-3 px-2">{(row.ctr * 100).toFixed(2)}%</td>
                                  <td className="text-right py-3 px-2">{row.position.toFixed(1)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No search data available for this period.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sitemaps" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Submit New Sitemap</CardTitle>
                      <CardDescription>Add a new sitemap to be indexed by Google</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (newSitemapUrl) submitSitemapMutation.mutate(newSitemapUrl);
                        }}
                        className="flex gap-2"
                      >
                        <Input
                          placeholder="https://example.com/sitemap.xml"
                          value={newSitemapUrl}
                          onChange={(e) => setNewSitemapUrl(e.target.value)}
                          className="flex-1"
                          data-testid="input-sitemap-url"
                        />
                        <Button 
                          type="submit" 
                          disabled={!newSitemapUrl || submitSitemapMutation.isPending}
                          data-testid="button-submit-sitemap"
                        >
                          {submitSitemapMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Submit"
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Submitted Sitemaps</CardTitle>
                        <CardDescription>Your site&apos;s sitemaps and their status</CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => refetchSitemaps()}
                        disabled={sitemapsLoading}
                        data-testid="button-refresh-sitemaps"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${sitemapsLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {sitemapsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      ) : sitemaps?.length ? (
                        <div className="space-y-3">
                          {sitemaps.map((sitemap, index) => (
                            <div 
                              key={sitemap.path} 
                              className="flex items-center justify-between p-3 border rounded-lg"
                              data-testid={`sitemap-item-${index}`}
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-sm">{sitemap.path}</p>
                                  {sitemap.lastSubmitted && (
                                    <p className="text-xs text-muted-foreground">
                                      Last submitted: {new Date(sitemap.lastSubmitted).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {sitemap.isPending && (
                                  <Badge variant="secondary">Pending</Badge>
                                )}
                                {sitemap.errors && parseInt(sitemap.errors) > 0 && (
                                  <Badge variant="destructive">{sitemap.errors} errors</Badge>
                                )}
                                {sitemap.warnings && parseInt(sitemap.warnings) > 0 && (
                                  <Badge variant="outline" className="text-yellow-600">{sitemap.warnings} warnings</Badge>
                                )}
                                {!sitemap.isPending && !sitemap.errors && (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No sitemaps submitted yet.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="inspect" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>URL Inspection</CardTitle>
                      <CardDescription>Check the indexing status of any URL on your site</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (inspectUrl) inspectUrlMutation.mutate(inspectUrl);
                        }}
                        className="flex gap-2"
                      >
                        <Input
                          placeholder="https://example.com/page"
                          value={inspectUrl}
                          onChange={(e) => setInspectUrl(e.target.value)}
                          className="flex-1"
                          data-testid="input-inspect-url"
                        />
                        <Button 
                          type="submit" 
                          disabled={!inspectUrl || inspectUrlMutation.isPending}
                          data-testid="button-inspect-url"
                        >
                          {inspectUrlMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Search className="w-4 h-4 mr-2" />
                              Inspect
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {inspectUrlMutation.data && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <LinkIcon className="w-5 h-5" />
                          Inspection Results
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {inspectUrlMutation.data.inspectionResult?.indexStatusResult && (
                          <div className="space-y-3">
                            <h4 className="font-semibold">Index Status</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 border rounded-lg">
                                <p className="text-sm text-muted-foreground">Verdict</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {inspectUrlMutation.data.inspectionResult.indexStatusResult.verdict === 'PASS' ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : inspectUrlMutation.data.inspectionResult.indexStatusResult.verdict === 'FAIL' ? (
                                    <XCircle className="w-4 h-4 text-destructive" />
                                  ) : (
                                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                  )}
                                  <span className="font-medium">
                                    {inspectUrlMutation.data.inspectionResult.indexStatusResult.verdict || 'Unknown'}
                                  </span>
                                </div>
                              </div>
                              <div className="p-3 border rounded-lg">
                                <p className="text-sm text-muted-foreground">Coverage</p>
                                <p className="font-medium mt-1">
                                  {inspectUrlMutation.data.inspectionResult.indexStatusResult.coverageState || 'Unknown'}
                                </p>
                              </div>
                              <div className="p-3 border rounded-lg">
                                <p className="text-sm text-muted-foreground">Last Crawl</p>
                                <p className="font-medium mt-1">
                                  {inspectUrlMutation.data.inspectionResult.indexStatusResult.lastCrawlTime
                                    ? new Date(inspectUrlMutation.data.inspectionResult.indexStatusResult.lastCrawlTime).toLocaleDateString()
                                    : 'Never'}
                                </p>
                              </div>
                              <div className="p-3 border rounded-lg">
                                <p className="text-sm text-muted-foreground">Crawled As</p>
                                <p className="font-medium mt-1">
                                  {inspectUrlMutation.data.inspectionResult.indexStatusResult.crawledAs || 'Unknown'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {inspectUrlMutation.data.inspectionResult?.mobileUsabilityResult && (
                          <div className="space-y-3">
                            <h4 className="font-semibold">Mobile Usability</h4>
                            <div className="flex items-center gap-2">
                              {inspectUrlMutation.data.inspectionResult.mobileUsabilityResult.verdict === 'PASS' ? (
                                <Badge className="bg-green-500">Mobile Friendly</Badge>
                              ) : (
                                <Badge variant="destructive">Issues Found</Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
