import { useState, useEffect } from "react";
import { Button, Linking, ScrollView, Text, View, ActivityIndicator, StyleSheet } from "react-native";
import { apiFetch, newIdempotencyKey } from "../lib/api";

type PackageKey = "GOOD" | "BETTER" | "BEST";

// Scope selection from FindingsSummary screen
type ScopeSelection = {
  selectedTierId?: string;
  answers: Record<string, string | number | boolean | string[]>;
  measurements?: {
    squareFeet?: number;
    linearFeet?: number;
    roomCount?: number;
    wallCount?: number;
    ceilingHeight?: number;
  };
  problemStatement?: string;
};

export default function DraftPreview(props: {
  jobId: number;
  draftId: number;
  payload: unknown;
  scopeSelection?: ScopeSelection;
  onDone: () => void;
  onBack: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ proposalId: number; webReviewUrl: string } | null>(null);
  const [pkg, setPkg] = useState<PackageKey>("BETTER");
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [draftPayload, setDraftPayload] = useState<unknown>(props.payload);

  // Auto-generate draft when coming from findings flow
  useEffect(() => {
    if (props.scopeSelection && !props.payload) {
      generateDraftWithScope();
    }
  }, []);

  const generateDraftWithScope = async () => {
    setGeneratingDraft(true);
    setError(null);
    try {
      // Start draft generation with scope selection
      await apiFetch<{ status: "DRAFTING" | "READY" | "FAILED" }>(`/api/mobile/jobs/${props.jobId}/draft`, {
        method: "POST",
        headers: { "Idempotency-Key": newIdempotencyKey() },
        body: JSON.stringify({
          scopeSelection: props.scopeSelection,
          problemStatement: props.scopeSelection?.problemStatement,
          selectedTierId: props.scopeSelection?.selectedTierId,
        }),
      });

      // Poll until READY
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const draft = await apiFetch<{ status: "DRAFTING" | "READY" | "FAILED"; payload?: unknown }>(
          `/api/mobile/jobs/${props.jobId}/draft`,
          { method: "GET" }
        );
        if (draft.status === "READY" && draft.payload) {
          setDraftPayload(draft.payload);
          setGeneratingDraft(false);
          return;
        }
        if (draft.status === "FAILED") {
          throw new Error("Draft generation failed. Please try again.");
        }
      }
      throw new Error("Draft generation timed out. Please try again.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Draft generation failed");
    } finally {
      setGeneratingDraft(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{ proposalId: number; webReviewUrl: string }>(
        `/api/mobile/jobs/${props.jobId}/submit`,
        {
          method: "POST",
          headers: { "Idempotency-Key": newIdempotencyKey() },
          body: JSON.stringify({ package: pkg }),
        }
      );
      setSubmitted(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  };

  // Show loading state while generating draft
  if (generatingDraft) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Generating proposal based on your scope selection...</Text>
        {props.scopeSelection?.selectedTierId && (
          <Text style={styles.loadingSubtext}>
            Using scope: {props.scopeSelection.selectedTierId}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 10 }}>
      {error ? <Text style={{ color: "#b00020" }}>{error}</Text> : null}

      {props.scopeSelection && (
        <View style={styles.scopeInfo}>
          <Text style={styles.scopeInfoTitle}>✅ Scope Confirmed</Text>
          {props.scopeSelection.selectedTierId && (
            <Text style={styles.scopeInfoText}>Tier: {props.scopeSelection.selectedTierId}</Text>
          )}
          {props.scopeSelection.measurements?.squareFeet && (
            <Text style={styles.scopeInfoText}>Area: {props.scopeSelection.measurements.squareFeet} sq ft</Text>
          )}
        </View>
      )}

      <Text>Draft ID: {props.draftId || "Generating..."}</Text>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button title="Good" onPress={() => setPkg("GOOD")} disabled={busy} />
        <Button title="Better" onPress={() => setPkg("BETTER")} disabled={busy} />
        <Button title="Best" onPress={() => setPkg("BEST")} disabled={busy} />
      </View>
      <Text>Selected: {pkg}</Text>

      <ScrollView style={{ flex: 1, borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 12 }}>
        <Text style={{ fontFamily: "Courier" }}>{JSON.stringify(draftPayload, null, 2)}</Text>
      </ScrollView>

      {submitted ? (
        <View style={{ paddingVertical: 10 }}>
          <Text>Proposal created: {submitted.proposalId}</Text>
          <Text selectable>Review URL: {submitted.webReviewUrl}</Text>
          <Button
            title="Open review"
            onPress={() => Linking.openURL(submitted.webReviewUrl)}
            disabled={busy}
          />
        </View>
      ) : (
        <Button title={busy ? "Submitting..." : "Submit to proposal"} onPress={submit} disabled={busy} />
      )}

      <Button title="Back" onPress={props.onBack} disabled={busy} />
      <Button title="Done" onPress={props.onDone} disabled={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#374151",
    textAlign: "center",
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
  },
  scopeInfo: {
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  scopeInfoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#166534",
    marginBottom: 4,
  },
  scopeInfoText: {
    fontSize: 12,
    color: "#15803d",
  },
});
