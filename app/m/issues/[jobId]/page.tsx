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
  Lightbulb,
} from "lucide-react";
import { 
  mobileApiFetch, 
  newIdempotencyKey, 
  DraftStatus,
  DetectedIssue,
  AnalyzeResponse,
} from "../../lib/api";

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
  const [suggestedIssues, setSuggestedIssues] = useState<DetectedIssue[]>([]);
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [customIssue, setCustomIssue] = useState("");
  const [customIssues, setCustomIssues] = useState<DetectedIssue[]>([]);
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
      setSuggestedIssues(response.suggestedIssues || []);
      setSuggestedProblem(response.suggestedProblem);
      setNeedsMorePhotos(response.needsMorePhotos ?? []);
      setPhotosAnalyzed(response.photosAnalyzed);
      setPhotosTotal(response.photosTotal);

      // Auto-select from both detected issues AND suggested issues (only once)
      const allAvailableIssues = [...response.detectedIssues, ...(response.suggestedIssues || [])];
      if (allAvailableIssues.length > 0 && !hasAutoSelected.current) {
        hasAutoSelected.current = true;
        const autoSelect = new Set<string>();
        // Auto-select high confidence detected issues
        response.detectedIssues
          .filter(i => i.confidence > 0.6)
          .slice(0, 2)
          .forEach(i => autoSelect.add(i.id));
        // Also auto-select first suggested issue if no detected issues
        if (autoSelect.size === 0 && response.suggestedIssues?.length) {
          autoSelect.add(response.suggestedIssues[0].id);
        }
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

  // Initial load - trigger analysis and show instant results
  useEffect(() => {
    let pollTimeout: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const init = async () => {
      setLoading(true);
      setAnalyzing(true);
      
      // Trigger analysis - this now returns instant suggestions immediately
      const status = await fetchAnalysis(true);
      
      if (!isMounted) return;
      
      // Stop loading immediately - we have instant suggestions to show
      setLoading(false);
      
      // If still analyzing in background, poll for enhanced results
      if (status === "analyzing") {
        const poll = async () => {
          const newStatus = await fetchAnalysis(false);
          if (!isMounted) return;

          if (newStatus === "ready" || newStatus === "error" || newStatus === "no_photos") {
            setAnalyzing(false);
            return;
          }

          // Poll less frequently since user already has suggestions
          pollTimeout = setTimeout(poll, 3000);
        };

        // Start polling after a delay
        pollTimeout = setTimeout(poll, 3000);
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

  // Combine all issues: detected (from full analysis) + suggested (instant) + custom
  // Dedupe by label to avoid showing duplicates
  const seenLabels = new Set<string>();
  const allIssues = [...issues, ...suggestedIssues, ...customIssues].filter(issue => {
    const key = issue.label.toLowerCase();
    if (seenLabels.has(key)) return false;
    seenLabels.add(key);
    return true;
  });
  const selectedCount = selectedIssues.size;

  const shouldPromptForMorePhotos =
    photosTotal > 0 &&
    (photosTotal < 3 || (needsMorePhotos?.length ?? 0) > 0 || (!analyzing && allIssues.length === 0));

  const handleGenerateScope = async () => {
    const allSelectedIssues = [...issues, ...customIssues].filter(i => selectedIssues.has(i.id));
    
    if (allSelectedIssues.length === 0) {
      setError("Please select at least one issue to address");
      return;
    }

    setGeneratingDraft(true);
    setError(null);

    try {
      // Store selected issues for the draft generation
      const selectedIssueLabels = allSelectedIssues.map(i => i.label).join("; ");
      
      // Start draft generation with selected issues context
      await mobileApiFetch<{ status: string }>(`/api/mobile/jobs/${jobId}/draft`, {
        method: "POST",
        headers: { "Idempotency-Key": newIdempotencyKey() },
        body: JSON.stringify({ 
          selectedIssues: allSelectedIssues.map(i => ({
            id: i.id,
            label: i.label,
            category: i.category,
          })),
          problemStatement: selectedIssueLabels,
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
      <div className="p-4 flex flex-col items-center justify-center min-h-[300px] gap-3">
        <div className="relative">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <Lightbulb className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <p className="text-base font-medium text-slate-800">Detecting issues...</p>
        <p className="text-sm text-slate-500">This only takes a moment</p>
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

      {/* Detected & Suggested Issues */}
      {allIssues.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                {issues.length > 0 ? "Detected Issues" : "Suggested Issues"}
              </span>
              <span className="text-sm font-normal text-slate-500">
                {selectedCount} selected
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Show analyzing indicator if still processing */}
            {analyzing && (
              <div className="text-xs text-blue-600 flex items-center gap-1.5 mb-2 px-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Enhancing with AI analysis...
              </div>
            )}
            {allIssues.map((issue) => {
              const isSuggested = issue.id.startsWith("suggest:");
              return (
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
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {categoryLabels[issue.category]}
                        </span>
                        {isSuggested && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                            <Lightbulb className="w-3 h-3" />
                            Suggested
                          </span>
                        )}
                        {!isSuggested && issue.confidence >= 0.8 && (
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
              Generate Scope ({selectedCount} issue{selectedCount !== 1 ? "s" : ""})
            </>
          )}
        </Button>
        {selectedCount === 0 && (
          <p className="text-xs text-center text-slate-500 mt-2">
            Select at least one issue to continue
          </p>
        )}
      </div>
    </div>
  );
}
