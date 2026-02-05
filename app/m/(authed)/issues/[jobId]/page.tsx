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
  Brain,
  ScanSearch,
} from "lucide-react";
import {
  mobileApiFetch,
  newIdempotencyKey,
  DraftStatus,
  DetectedIssue,
  AnalyzeResponse,
  hasRemedyOptions,
  RemedyType,
} from "@/app/m/lib/api";
import { deriveSuggestionsStatus, SuggestionsStatus } from "@/src/lib/mobile/suggestions-status";

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
  const [similarDisabled, setSimilarDisabled] = useState(false);
  const [similarDisabledReason, setSimilarDisabledReason] = useState<string | undefined>();
  const [similarHadError, setSimilarHadError] = useState(false);
  const [suggestedProblem, setSuggestedProblem] = useState<string | undefined>();
  const [needsMorePhotos, setNeedsMorePhotos] = useState<string[]>([]);
  const [photosAnalyzed, setPhotosAnalyzed] = useState(0);
  const [photosTotal, setPhotosTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generatingDraft, setGeneratingDraft] = useState(false);

  const hasAutoSelected = useRef(false);

  // Loading state tips
  const [loadingTipIndex, setLoadingTipIndex] = useState(0);
  const LOADING_TIPS = [
    "Identifying materials...",
    "Scanning for damages...",
    "Checking for upgrades...",
    "Drafting scope items...",
    "Analyzing repair needs...",
  ];

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  // Remedy selections: Map of issueId -> selected remedy type
  const [remedySelections, setRemedySelections] = useState<Map<string, RemedyType>>(new Map());

  // Initialize remedy selections from recommended values when issues load
  useEffect(() => {
    // Use functional update to avoid dependency on remedySelections
    setRemedySelections(prev => {
      const merged = new Map(prev);
      let hasChanges = false;

      for (const issue of issues) {
        if (issue.remedies && !merged.has(issue.id)) {
          merged.set(issue.id, issue.remedies.selectedRemedy ?? issue.remedies.recommended);
          hasChanges = true;
        }
      }

      return hasChanges ? merged : prev;
    });
  }, [issues]);

  // Handler to update remedy selection for an issue
  const setRemedyForIssue = (issueId: string, remedy: RemedyType) => {
    setRemedySelections(prev => {
      const newMap = new Map(prev);
      newMap.set(issueId, remedy);
      return newMap;
    });
  };

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

    const startedAt = Date.now();
    const maxMs = 60_000;
    const fetchSimilar = async (attempt = 0) => {
      try {
        if (!isMounted) return;

        // Hard timeout: never block the flow waiting for suggestions
        if (Date.now() - startedAt > maxMs) {
          setSimilarHadError(true);
          setSimilarDisabled(false);
          setSimilarDisabledReason(undefined);
          setSimilarStatus("ready");
          setSimilarSuggestions([]);
          return;
        }

        setSimilarStatus((prev) => (prev === "ready" ? "ready" : "loading"));
        const res = await mobileApiFetch<{
          ok: boolean;
          status?: "pending" | "ready";
          suggestions?: SimilarScopeSuggestion[];
          disabled?: boolean;
          reason?: string;
        }>(
          `/api/mobile/jobs/${jobId}/scope-suggestions?k=5`,
          { method: "GET" }
        );

        if (!isMounted) return;

        const suggestions = Array.isArray(res.suggestions) ? res.suggestions : [];
        // IMPORTANT:
        // "suggestions.length === 0" is NOT the same as "unavailable".
        // It can simply mean there are no matches yet (or the pipeline hasn't produced embeddings).
        // Treat availability as: disabled flag (gating/feature/config) OR error OR still processing.
        const disabled = res.disabled === true;

        setSimilarSuggestions(suggestions);
        setSimilarDisabled(disabled);
        setSimilarDisabledReason(res.reason);
        setSimilarHadError(false);
        setSimilarStatus(disabled ? "ready" : (res.status ?? "ready"));

        if (!disabled && res.status === "pending" && attempt < 30) {
          pollTimeout = setTimeout(() => fetchSimilar(attempt + 1), 2000);
        }
      } catch {
        if (!isMounted) return;
        // Never block: fail closed to "ready" and show a non-blocking banner.
        setSimilarHadError(true);
        setSimilarDisabled(false);
        setSimilarDisabledReason(undefined);
        setSimilarSuggestions([]);
        setSimilarStatus("ready");
      }
    };

    setSimilarStatus("loading");
    setSimilarDisabled(false);
    setSimilarDisabledReason(undefined);
    setSimilarHadError(false);
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

  const suggestionsStatus: SuggestionsStatus = deriveSuggestionsStatus({
    detectedIssuesCount: issues.length,
    photosCount: photosTotal,
    aiSuggestionsCount: similarSuggestions.length,
    hasAnyAiSuggestionContent: Boolean(suggestedProblem) || similarSuggestions.length > 0,
    isProcessing: analyzing || similarStatus === "loading" || similarStatus === "pending",
    // Backend TODO: return a stable enum for gating/config vs "temporarily unavailable".
    // Today `disabled` only signals embeddings feature/config state on the server.
    isGated: similarDisabled && similarDisabledReason !== "embeddings_not_configured",
    hasError: similarHadError || (similarDisabled && similarDisabledReason === "embeddings_not_configured"),
  });

  const shouldShowSuggestionsBanner =
    suggestionsStatus === "insufficient_photos" ||
    suggestionsStatus === "gated" ||
    suggestionsStatus === "queued" ||
    suggestionsStatus === "error";

  const suggestionsBannerCopy: Record<Exclude<SuggestionsStatus, "available" | "none">, string> = {
    insufficient_photos: "Add a wide shot + under-sink photo to unlock AI scope suggestions.",
    gated: "AI scope suggestions are a Pro feature. Continue without them or upgrade.",
    queued: "Generating AI scope suggestions… you can continue selecting issues.",
    error: "We couldn’t generate AI scope suggestions this time. Continue without them.",
  };

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

      // Build issues with remedy selections
      const issuesWithRemedies = allSelectedIssues.map((i) => {
        const selectedRemedy = remedySelections.get(i.id) ??
          (i.remedies?.selectedRemedy ?? i.remedies?.recommended ?? "repair");
        return {
          id: i.id,
          label: i.label,
          category: i.category,
          issueType: i.issueType,
          tags: i.tags,
          remedies: i.remedies,
          selectedRemedy,
        };
      });

      // Start draft generation with selected issues context and remedy selections
      await mobileApiFetch<{ status: string }>(`/api/mobile/jobs/${jobId}/draft`, {
        method: "POST",
        headers: { "Idempotency-Key": newIdempotencyKey() },
        body: JSON.stringify({
          selectedIssues: issuesWithRemedies,
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
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 bg-slate-50">
        <div className="max-w-md w-full space-y-8 text-center">

          {/* Main Visual */}
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-75" />
            <div className="relative bg-white p-4 rounded-full shadow-lg border border-primary/20">
              <Brain className="w-10 h-10 text-primary animate-pulse" />
              <Sparkles className="w-4 h-4 text-amber-500 absolute top-2 right-2 animate-bounce" />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">
              Analyzing your job
            </h2>

            {/* Dynamic Tip */}
            <div className="h-8">
              <p className="text-slate-600 font-medium animate-in fade-in slide-in-from-bottom-2 duration-500 key={loadingTipIndex}">
                {LOADING_TIPS[loadingTipIndex]}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden w-full max-w-xs mx-auto">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.max(5, (photosAnalyzed / Math.max(photosTotal, 1)) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">
                Processed {photosAnalyzed} of {photosTotal} photos
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 max-w-xs mx-auto text-left space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">Photos uploaded</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 relative">
                <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              </div>
              <span className="text-sm font-medium text-blue-700">AI analysis in progress</span>
            </div>
            <div className="flex items-center gap-3 opacity-50">
              <div className="w-6 h-6 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-medium text-slate-400">3</span>
              </div>
              <span className="text-sm font-medium text-slate-500">Review findings</span>
            </div>
          </div>

          <div className="pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-slate-400 hover:text-slate-600"
            >
              Cancel
            </Button>
          </div>

        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="-ml-2 text-slate-600 hover:text-slate-900"
              disabled={generatingDraft}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </div>
          <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-full text-slate-600">
            Job #{jobId}
          </span>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-6 space-y-6">

        {/* Title Section */}
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Review Findings</h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Select items you want to include in the scope of work.
          </p>
        </div>

        {/* Analysis Status */}
        {analyzing && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing photos... ({photosAnalyzed}/{photosTotal})
          </div>
        )}

        {/* Non-blocking banner for AI scope suggestions */}
        {shouldShowSuggestionsBanner && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {suggestionsBannerCopy[suggestionsStatus as Exclude<SuggestionsStatus, "available" | "none">]}
          </div>
        )}

        {/* Dev-only debug label */}
        {process.env.NODE_ENV === "development" && (
          <div className="text-[10px] text-slate-400">
            SuggestionsStatus: {suggestionsStatus} | photos: {photosTotal} | issues: {issues.length} | suggestions:{" "}
            {similarSuggestions.length}
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
                  {suggestionsStatus === "queued"
                    ? "Generating AI scope suggestions…"
                    : suggestionsStatus === "insufficient_photos"
                      ? "Add more photos to unlock AI scope suggestions."
                      : suggestionsStatus === "gated"
                        ? "AI scope suggestions are a Pro feature."
                        : suggestionsStatus === "error"
                          ? "We couldn’t generate AI scope suggestions this time."
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
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Detected Items
                </span>
                <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {selectedCount} selected
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {allIssues.map((issue) => {
                const hasRemedy = hasRemedyOptions(issue);
                const currentRemedy = remedySelections.get(issue.id) ??
                  (issue.remedies?.selectedRemedy ?? issue.remedies?.recommended ?? "repair");
                const isSelected = selectedIssues.has(issue.id);

                // Frontend Heuristic: Check for "good condition" to avoid flagging as damage
                const textContent = (issue.label + (issue.description || "")).toLowerCase();
                const appearsGood = textContent.includes("good condition") || textContent.includes("no damage") || textContent.includes("appears good") || textContent.includes("functional");

                // If appears good, override category visual to "inspection" (neutral) unless manually selected as damage
                const effectiveCategory = (appearsGood && issue.category === 'repair') ? 'inspection' : issue.category;

                return (
                  <div
                    key={issue.id}
                    className={`
                      w-full px-4 py-3 rounded-xl border transition-all text-left bg-white shadow-sm
                      ${isSelected
                        ? "border-primary ring-1 ring-primary shadow-md"
                        : "border-slate-200 hover:border-slate-300"}
                      ${generatingDraft ? "opacity-50" : ""}
                    `}
                  >
                    {/* Main issue row - clickable to toggle selection */}
                    <button
                      onClick={() => toggleIssue(issue.id)}
                      disabled={generatingDraft}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1 shrink-0">
                          <Checkbox
                            checked={isSelected}
                            className="pointer-events-none data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            {categoryIcons[effectiveCategory]}
                            <span className="font-semibold text-slate-900 text-base leading-tight">
                              {issue.label}
                            </span>
                          </div>
                          {issue.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {issue.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {/* Only show category badge if it's NOT 'good condition' or if strictly relevant */}
                            {!appearsGood && (
                              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${categoryLabels[effectiveCategory] === "Damage" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"
                                }`}>
                                {categoryLabels[effectiveCategory]}
                              </span>
                            )}

                            {appearsGood && (
                              <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 font-medium flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Good Condition
                              </span>
                            )}

                            {issue.confidence >= 0.8 && !appearsGood && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1 border border-emerald-100">
                                <Sparkles className="w-3 h-3" />
                                AI Match
                              </span>
                            )}

                            {issue.photoIds.length > 0 && (
                              <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                                {issue.photoIds.length} photo{issue.photoIds.length > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>

                        </div>
                      </div>
                    </button>

                    {/* Remedy toggle - only shown when issue is selected and has remedy options */}
                    {isSelected && hasRemedy && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-700">Action:</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRemedyForIssue(issue.id, "repair");
                              }}
                              disabled={generatingDraft || !issue.remedies?.repair?.available}
                              className={`
                              px-3 py-1.5 text-xs font-medium rounded-l-md border transition-colors
                              ${currentRemedy === "repair"
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"}
                              ${(!issue.remedies?.repair?.available || generatingDraft) ? "opacity-50 cursor-not-allowed" : ""}
                            `}
                            >
                              Repair
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRemedyForIssue(issue.id, "replace");
                              }}
                              disabled={generatingDraft || !issue.remedies?.replace?.available}
                              className={`
                              px-3 py-1.5 text-xs font-medium rounded-r-md border-y border-r transition-colors
                              ${currentRemedy === "replace"
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"}
                              ${(!issue.remedies?.replace?.available || generatingDraft) ? "opacity-50 cursor-not-allowed" : ""}
                            `}
                            >
                              Replace
                            </button>
                          </div>
                        </div>

                        {/* Show AI rationale if available */}
                        {issue.remedies?.rationale && issue.remedies.rationale.length > 0 && (
                          <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded p-2">
                            <span className="font-medium text-slate-600">AI recommendation: </span>
                            {issue.remedies.rationale[0]}
                            {currentRemedy !== issue.remedies.recommended && (
                              <span className="block mt-1 text-amber-600">
                                (You selected {currentRemedy} instead of AI-recommended {issue.remedies.recommended})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
        )
        }

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
        {/* Floating Action Button for Submit */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 pb-8 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="max-w-xl mx-auto flex gap-3">
            <div className="flex-1">
              <Button
                className="w-full h-12 text-base shadow-lg shadow-primary/20"
                disabled={generatingDraft || selectedCount === 0}
                onClick={handleGenerateScope}
              >
                {generatingDraft ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Drafting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Scope ({selectedCount})
                  </>
                )}
              </Button>
            </div>
          </div>
          {selectedCount === 0 && (
            <p className="text-xs text-center text-slate-500 mt-2">
              Select at least one issue above to generate a scope.
            </p>
          )}
        </div>
      </div >
    </div >
  );
}
