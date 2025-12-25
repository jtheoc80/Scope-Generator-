"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [suggestedProblem, setSuggestedProblem] = useState<string | undefined>();
  const [photosAnalyzed, setPhotosAnalyzed] = useState(0);
  const [photosTotal, setPhotosTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generatingDraft, setGeneratingDraft] = useState(false);

  // Fetch analysis results
  const fetchAnalysis = useCallback(async (trigger = false) => {
    try {
      const endpoint = `/api/mobile/jobs/${jobId}/photos/analyze`;
      const response = await mobileApiFetch<AnalyzeResponse>(
        endpoint,
        trigger ? { method: "POST" } : { method: "GET" }
      );

      setIssues(response.detectedIssues);
      setSuggestedProblem(response.suggestedProblem);
      setPhotosAnalyzed(response.photosAnalyzed);
      setPhotosTotal(response.photosTotal);

      // Auto-select high confidence issues
      if (response.detectedIssues.length > 0 && selectedIssues.size === 0) {
        const autoSelect = new Set<string>();
        response.detectedIssues
          .filter(i => i.confidence > 0.6)
          .slice(0, 3)
          .forEach(i => autoSelect.add(i.id));
        setSelectedIssues(autoSelect);
      }

      return response.status;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to analyze photos");
      return "error";
    }
  }, [jobId, selectedIssues.size]);

  // Initial load - trigger analysis
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setAnalyzing(true);
      
      // Trigger analysis
      const status = await fetchAnalysis(true);
      
      setLoading(false);
      
      // If still analyzing, poll for results
      if (status === "analyzing") {
        const pollInterval = setInterval(async () => {
          const newStatus = await fetchAnalysis(false);
          if (newStatus === "ready" || newStatus === "error" || newStatus === "no_photos") {
            clearInterval(pollInterval);
            setAnalyzing(false);
          }
        }, 2000);

        // Cleanup
        return () => clearInterval(pollInterval);
      } else {
        setAnalyzing(false);
      }
    };

    init();
  }, [fetchAnalysis]);

  const toggleIssue = (issueId: string) => {
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

  const addCustomIssue = () => {
    if (!customIssue.trim()) return;

    const newIssue: DetectedIssue = {
      id: `custom-${Date.now()}`,
      label: customIssue.trim(),
      confidence: 1,
      category: "other",
      photoIds: [],
    };

    setCustomIssues(prev => [...prev, newIssue]);
    setSelectedIssues(prev => new Set(prev).add(newIssue.id));
    setCustomIssue("");
  };

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

  const allIssues = [...issues, ...customIssues];
  const selectedCount = selectedIssues.size;

  if (loading) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-slate-600">Analyzing your photos...</p>
        <p className="text-sm text-slate-500">Using AI to detect issues</p>
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
            <p className="text-slate-600 font-medium">No issues detected</p>
            <p className="text-sm text-slate-500 mt-1">
              Add a custom issue below to describe the problem
            </p>
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
              onClick={addCustomIssue}
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
