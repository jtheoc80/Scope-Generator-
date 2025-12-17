"use client";

/**
 * SEO Dashboard - Internal tool for monitoring SEO health
 * Access at /seo-dashboard (should be protected in production)
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  FileText,
  Search,
  TrendingUp,
  ExternalLink
} from "lucide-react";

interface AuditResult {
  page: string;
  title?: string;
  description?: string;
  keywords?: string[];
  issues: Array<{
    page: string;
    severity: "error" | "warning" | "info";
    message: string;
    suggestion?: string;
  }>;
  score: number;
}

interface AuditReport {
  timestamp: string;
  totalPages: number;
  pagesWithIssues: number;
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  overallScore: number;
  results: AuditResult[];
  recommendations: string[];
  summary: {
    missingTitles: string[];
    missingDescriptions: string[];
    missingKeywords: string[];
    duplicateTitles: Record<string, string[]>;
    duplicateDescriptions: Record<string, string[]>;
    tooLongTitles: string[];
    tooShortDescriptions: string[];
  };
}

export default function SeoDashboard() {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/seo/audit");
      if (!response.ok) throw new Error("Failed to fetch SEO report");
      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return "bg-green-100";
    if (score >= 70) return "bg-yellow-100";
    return "bg-red-100";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Running SEO Audit...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchReport}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Search className="h-8 w-8 text-blue-600" />
              SEO Dashboard
            </h1>
            <p className="text-gray-500 mt-1">
              Last updated: {new Date(report.timestamp).toLocaleString()}
            </p>
          </div>
          <Button onClick={fetchReport} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className={getScoreBgColor(report.overallScore)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Overall Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold ${getScoreColor(report.overallScore)}`}>
                {report.overallScore}/100
              </div>
              <Progress value={report.overallScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Pages Audited
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gray-900">{report.totalPages}</div>
              <p className="text-sm text-gray-500 mt-1">
                {report.pagesWithIssues} with issues
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Errors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-600">{report.errorCount}</div>
              <p className="text-sm text-gray-500 mt-1">Critical issues</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Warnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-yellow-600">{report.warningCount}</div>
              <p className="text-sm text-gray-500 mt-1">Should be fixed</p>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        {report.recommendations.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Recommendations
              </CardTitle>
              <CardDescription>
                Actions to improve your SEO score
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {report.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Page Results */}
        <Card>
          <CardHeader>
            <CardTitle>Page Analysis</CardTitle>
            <CardDescription>
              Individual page SEO scores and issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.results
                .sort((a, b) => a.score - b.score)
                .map((result) => (
                  <div
                    key={result.page}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className={`text-lg font-semibold ${getScoreColor(result.score)}`}>
                            {result.score}
                          </span>
                          <h3 className="font-medium text-gray-900">{result.page}</h3>
                          {result.issues.length === 0 && (
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Optimized
                            </Badge>
                          )}
                        </div>
                        {result.title && (
                          <p className="text-sm text-gray-600 mt-1 truncate max-w-xl">
                            {result.title}
                          </p>
                        )}
                      </div>
                      <a
                        href={result.page}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>

                    {result.issues.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {result.issues.map((issue, index) => (
                          <div
                            key={index}
                            className={`text-sm p-2 rounded flex items-start gap-2 ${
                              issue.severity === "error"
                                ? "bg-red-50 text-red-700"
                                : issue.severity === "warning"
                                ? "bg-yellow-50 text-yellow-700"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {issue.severity === "error" ? (
                              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p>{issue.message}</p>
                              {issue.suggestion && (
                                <p className="text-xs mt-1 opacity-75">
                                  💡 {issue.suggestion}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            🤖 SEO Bot - Keeping your site optimized
          </p>
        </div>
      </div>
    </div>
  );
}
