"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Plus,
  Search,
  Wrench,
  AlertTriangle,
  Eye,
  HelpCircle,
} from "lucide-react";
import { 
  mobileApiFetch, 
  newIdempotencyKey, 
  DraftStatus,
  DetectedIssue,
  AnalyzeResponse,
} from "../../lib/api";

type SimilarScopeSuggestion = {
  itemCode: string;
  description: string;
  score: number;
  fromJobs: Array<{ jobId: number; similarity: number; status?: string | null }>;
};

const categoryIcons: Record<string, React.ReactNode> = {
  damage: <AlertTriangle className="w-4 h-4 text-red-500" />,
  repair: <Wrench className="w-4 h-4 text-orange-500" />,
  maintenance: <Wrench className="w-4 h-4 text-blue-500" />,
  upgrade: <Sparkles className="w-4 h-4 text-purple-500" />,
  inspection: <Eye className="w-4 h-4 text-slate-500" />,
  other: <HelpCircle className="w-4 h-4 text-slate-400" />,
};

const categoryLabels: Record<string, string> = {
  damage: "Damage",
  repair: "Repair Needed",
  maintenance: "Maintenance",
  upgrade: "Upgrade",
  inspection: "Inspection Finding",
  other: "Other",
};

export default function SelectIssuesPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [issues, setIssues] = useState<DetectedIssue[]>([]);
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [customIssue, setCustomIssue] = useState("");
  const [customIssues, setCustomIssues] = useState<DetectedIssue[]>([]);
  const [similarStatus, setSimilarStatus] = useState<"idle" | "loading" | "pending" | "ready" | "error">("idle");
  const [similarSuggestions, setSimilarSuggestions] = useState<SimilarScopeSuggestion[]>([]);
  const [suggestedProblem, setSuggestedProblem] = useState<string | undefined>();
  const [needsMorePhotos, setNeedsMorePhotos] = useState<string[]>([]);
  const [photosAnalyzed, setPhotosAnalyzed] = useState(0);
  const [photosTotal, setPhotosTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const hasAutoSelected = useRef(false);

  // Fetch analysis results
  const fetchAnalysis = useCallback(async (trigger = false): Promise<string> => {
    try {
      const endpoint = `/api/mobile/jobs/${jobId}/photos/analyze`;
      const response = await mobileApiFetch<AnalyzeResponse>(
        endpoint,
        trigger ? { method: "POST" } : { method: "GET" }
      );

      setIssues(response.detectedIssues);
      setSuggestedProblem(response.suggestedProblem);
      setNeedsMorePhotos(response.needsMorePhotos ?? []);
      setPhotosAnalyzed(response.photosAnalyzed);
      setPhotosTotal(response.photosTotal);

      // Auto-select high confidence issues (only once)
      if (response.detectedIssues.length > 0 && !hasAutoSelected.current) {
        hasAutoSelected.current = true;
        const autoSelect = new Set<string>();
        response.detectedIssues
          .filter(i => i.confidence > 0.6)
          .slice(0, 3)
          .forEach(i => autoSelect.add(i.id));
        if (autoSelect.size > 0) {
          setSelectedIssues(autoSelect);
        }
      }

      return response.status;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to analyze photos");
      return "error";
    }
  }, [jobId]);

  // Initial load - trigger analysis
  useEffect(() => {
    let pollTimeout: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const init = async () => {
      setLoading(true);
      setAnalyzing(true);
      
      // Trigger analysis
      const status = await fetchAnalysis(true);
      
      if (!isMounted) return;
      setLoading(false);
      
      // If still analyzing, poll for results
      if (status === "analyzing") {
        const poll = async () => {
          const newStatus = await fetchAnalysis(false);
          if (!isMounted) return;

          if (newStatus === "ready" || newStatus === "error" || newStatus === "no_photos") {
            setAnalyzing(false);
            return;
          }

          // Schedule next poll only after the previous request finishes
          pollTimeout = setTimeout(poll, 2000);
        };

        pollTimeout = setTimeout(poll, 2000);
      } else {
        setAnalyzing(false);
      }
    };

    init();

    // Cleanup
    return () => {
      isMounted = false;
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [fetchAnalysis]);

  // Fetch similarity-based scope suggestions (async, non-blocking)
  useEffect(() => {
    let pollTimeout: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const fetchSimilar = async (attempt = 0) => {
      try {
        if (!isMounted) return;
        setSimilarStatus((prev) => (prev === "ready" ? "ready" : "loading"));
        const res = await mobileApiFetch<{ status: "pending" | "ready"; suggestions: SimilarScopeSuggestion[] }>(
          `/api/mobile/jobs/${jobId}/scope-suggestions?k=5`,
          { method: "GET" }
        );

        if (!isMounted) return;
        setSimilarSuggestions(res.suggestions || []);
        setSimilarStatus(res.status);

        if (res.status === "pending" && attempt < 12) {
          pollTimeout = setTimeout(() => fetchSimilar(attempt + 1), 2000);
        }
      } catch (e) {
        if (!isMounted) return;
        setSimilarStatus("error");
      }
    };

    setSimilarStatus("loading");
    fetchSimilar(0);

    return () => {
      isMounted = false;
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [jobId]);

  const toggleIssue = (issueId: string) => {
    setError(null); // Clear any previous error
    setSelectedIssues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(issueId)) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
      }
      return newSet;
    });
  };

  const addCustomIssue = (opts?: { label?: string; category?: DetectedIssue["category"] }) => {
    const label = (opts?.label ?? customIssue).trim();
    if (!label) return;

    setError(null); // Clear any previous error

    // Avoid duplicates (by label) when adding from suggestions.
    const normalized = label.toLowerCase();
    const existing = [...issues, ...customIssues].some((i) => i.label.trim().toLowerCase() === normalized);
    if (existing) return;

    const newIssue: DetectedIssue = {
      id: `custom-${Date.now()}`,
      label,
      confidence: 1,
      category: opts?.category ?? "other",
      photoIds: [],
    };

    setCustomIssues(prev => [...prev, newIssue]);
    setSelectedIssues(prev => new Set(prev).add(newIssue.id));
    setCustomIssue("");
  };

  const addSuggestedUpgrade = (label: string) => addCustomIssue({ label, category: "upgrade" });

  const allIssues = [...issues, ...customIssues];
  const selectedCount = selectedIssues.size;

  const shouldPromptForMorePhotos =
    photosTotal > 0 &&
    (photosTotal < 3 || (needsMorePhotos?.length ?? 0) > 0 || (!analyzing && allIssues.length === 0));

  const handleGenerateScope = async () => {
    const allSelectedIssues = [...issues, ...customIssues].filter(i => selectedIssues.has(i.id));

    // Require at least one issue to be selected
    if (allSelectedIssues.length === 0) {
      setError("Please select at least one issue to generate a scope.");
      return;
    }

    setGeneratingDraft(true);
    setError(null);

    try {
      const selectedIssueLabels = allSelectedIssues.map((i) => i.label).join("; ");
      const problemStatement = selectedIssueLabels || suggestedProblem || "";
      
      // Start draft generation with selected issues context
      await mobileApiFetch<{ status: string }>(`/api/mobile/jobs/${jobId}/draft`, {
        method: "POST",
        headers: { "Idempotency-Key": newIdempotencyKey() },
        body: JSON.stringify({ 
          selectedIssues: allSelectedIssues.map((i) => ({
            id: i.id,
            label: i.label,
            category: i.category,
          })),
          problemStatement,
        }),
      });

      // Poll until READY
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 1000));

        const draft = await mobileApiFetch<DraftStatus>(
          `/api/mobile/jobs/${jobId}/draft`,
          { method: "GET" }
        );

        if (draft.status === "READY" && draft.payload) {
          const encodedPayload = encodeURIComponent(JSON.stringify(draft.payload));
          router.push(`/m/preview/${jobId}?payload=${encodedPayload}`);
          return;
        }

        if (draft.status === "FAILED") {
          throw new Error("Scope generation failed. Please try again.");
        }
      }

      throw new Error("Scope generation timed out. Please try again.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate scope");
    } finally {
      setGeneratingDraft(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[400px] gap-4">
        {/* Progress indicator */}
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <Sparkles className="w-5 h-5 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
        </div>
        
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-slate-800">Analyzing Photos</p>
          
          {/* Progress bar */}
          {photosTotal > 0 && (
            <div className="w-48 mx-auto">
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(10, (photosAnalyzed / photosTotal) * 100)}%` }}
                />
              </div>
              <p className="text-sm text-slate-600 mt-2">
                {photosAnalyzed} of {photosTotal} photos processed
              </p>
            </div>
          )}
          
          {photosTotal === 0 && (
            <p className="text-sm text-slate-500">Starting analysis...</p>
          )}
        </div>
        
        {/* Steps indicator */}
        <div className="mt-4 text-xs text-slate-500 space-y-1 text-center">
          <p className="flex items-center gap-2 justify-center">
            <CheckCircle className="w-3 h-3 text-green-500" />
            Photos uploaded
          </p>
          <p className="flex items-center gap-2 justify-center">
            <Loader2 className="w-3 h-3 animate-spin text-primary" />
            AI detecting issues...
          </p>
          <p className="flex items-center gap-2 justify-center text-slate-400">
            <span className="w-3 h-3 rounded-full border border-slate-300" />
            Select issues
          </p>
        </div>

        {/* Back button */}
        <div className="mt-4 w-full max-w-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="w-full text-slate-500"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 -ml-2"
          disabled={generatingDraft}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <span className="text-sm text-slate-500">Job #{jobId}</span>
      </div>

      {/* Title */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Select Issues</h2>
        <p className="text-sm text-slate-600">
          Choose which problems to address in your proposal
        </p>
      </div>

      {/* Analysis Status */}
      {analyzing && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Analyzing photos... ({photosAnalyzed}/{photosTotal})
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Suggested Problem */}
      {suggestedProblem && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">AI Suggestion</p>
                <p className="text-sm text-amber-800 mt-1">{suggestedProblem}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggested from similar jobs (Phase 1) */}
      {(similarStatus === "loading" || similarStatus === "pending" || similarSuggestions.length > 0) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Suggested from similar jobs
              </span>
              {similarStatus !== "ready" && (
                <span className="text-xs text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Generating…
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {similarSuggestions.length === 0 ? (
              <p className="text-sm text-slate-600">
                {similarStatus === "error"
                  ? "Suggestions unavailable right now."
                  : "No similar-job suggestions yet. (We’ll improve as you complete more jobs.)"}
              </p>
            ) : (
              <div className="space-y-2">
                {similarSuggestions.slice(0, 6).map((s) => (
                  <div key={s.itemCode} className="p-3 rounded-lg bg-white border border-slate-200 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">{s.description}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Based on {s.fromJobs?.length ?? 1} similar job{s.fromJobs?.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="h-8"
                      disabled={generatingDraft}
                      onClick={async () => {
                        addCustomIssue({ label: s.description, category: "upgrade" });
                        try {
                          await mobileApiFetch(`/api/mobile/jobs/${jobId}/scope-edits`, {
                            method: "POST",
                            headers: { "Idempotency-Key": newIdempotencyKey() },
                            body: JSON.stringify({
                              action: "add",
                              itemCode: s.itemCode,
                              before: null,
                              after: s,
                            }),
                          });
                        } catch {
                          // Non-blocking: ignore logging failures
                        }
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ask for more photos when helpful */}
      {shouldPromptForMorePhotos && (
        <Card className="border-slate-200">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-medium text-slate-900">Add more photos for better results</p>
                <p className="text-sm text-slate-600 mt-1">
                  Wide shot + close-up + a “context” angle helps the AI find issues and write a cleaner scope.
                </p>
              </div>
            </div>

            {needsMorePhotos.length > 0 && (
              <div className="text-sm text-slate-700">
                <p className="font-medium text-slate-900 mb-1">Suggested shots:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {needsMorePhotos.slice(0, 4).map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/m/capture/${jobId}`)}
              disabled={generatingDraft}
            >
              Add more photos
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Detected Issues */}
      {allIssues.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Detected Issues
              </span>
              <span className="text-sm font-normal text-slate-500">
                {selectedCount} selected
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {allIssues.map((issue) => (
              <button
                key={issue.id}
                onClick={() => toggleIssue(issue.id)}
                disabled={generatingDraft}
                className={`
                  w-full p-3 rounded-lg border-2 transition-all text-left
                  ${selectedIssues.has(issue.id)
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 hover:border-slate-300"}
                  ${generatingDraft ? "opacity-50" : ""}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Checkbox
                      checked={selectedIssues.has(issue.id)}
                      className="pointer-events-none"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {categoryIcons[issue.category]}
                      <span className="font-medium text-sm">{issue.label}</span>
                    </div>
                    {issue.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {issue.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {categoryLabels[issue.category]}
                      </span>
                      {issue.confidence >= 0.8 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          High confidence
                        </span>
                      )}
                      {issue.photoIds.length > 0 && (
                        <span className="text-xs text-slate-500">
                          {issue.photoIds.length} photo{issue.photoIds.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2 border-slate-300">
          <CardContent className="p-6 text-center">
            <Search className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-800 font-medium">No obvious issues found</p>
            <p className="text-sm text-slate-600 mt-1">
              If this is more of a refresh, pick a common upgrade below or add your own.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => addSuggestedUpgrade("Change paint color (walls/ceiling/trim)")}
                disabled={generatingDraft}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                New paint color
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => addSuggestedUpgrade("Replace or refresh trim / baseboards")}
                disabled={generatingDraft}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                New trim
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => addSuggestedUpgrade("Upgrade hardware (handles, hinges, knobs)")}
                disabled={generatingDraft}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Hardware refresh
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => addSuggestedUpgrade("Replace fixtures (lighting/faucets)")}
                disabled={generatingDraft}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                New fixtures
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Custom Issue */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Custom Issue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Describe another issue..."
              value={customIssue}
              onChange={(e) => setCustomIssue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomIssue()}
              disabled={generatingDraft}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => addCustomIssue()}
              disabled={!customIssue.trim() || generatingDraft}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Describe any additional issues not detected by AI
          </p>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 text-xs text-blue-800 space-y-1">
          <p className="font-medium text-blue-900">Tips:</p>
          <p>• Select all issues you want addressed in the proposal</p>
          <p>• Add custom issues if AI missed something</p>
          <p>• More specific issues = more accurate scope</p>
        </CardContent>
      </Card>

      {/* Fixed bottom action button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 safe-area-inset-bottom">
        <Button
          className="w-full h-12 text-base gap-2"
          onClick={handleGenerateScope}
          disabled={generatingDraft || selectedCount === 0}
        >
          {generatingDraft ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Scope...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              {selectedCount > 0
                ? `Generate Scope (${selectedCount} issue${selectedCount !== 1 ? "s" : ""})`
                : "Select issues to generate scope"}
            </>
          )}
        </Button>
        {selectedCount === 0 && (
          <p className="text-xs text-center text-slate-500 mt-2">
            Select at least one issue above to generate a scope.
          </p>
        )}
      </div>
    </div>
  );
}
