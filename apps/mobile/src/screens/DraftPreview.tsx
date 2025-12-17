import { useState } from "react";
import { Button, ScrollView, Text, View } from "react-native";
import { apiFetch, newIdempotencyKey } from "../lib/api";

type PackageKey = "GOOD" | "BETTER" | "BEST";

export default function DraftPreview(props: {
  jobId: number;
  draftId: number;
  payload: unknown;
  onDone: () => void;
  onBack: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ proposalId: number; webReviewUrl: string } | null>(null);
  const [pkg, setPkg] = useState<PackageKey>("BETTER");

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

  return (
    <View style={{ flex: 1, padding: 16, gap: 10 }}>
      {error ? <Text style={{ color: "#b00020" }}>{error}</Text> : null}

      <Text>Draft ID: {props.draftId}</Text>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button title="Good" onPress={() => setPkg("GOOD")} disabled={busy} />
        <Button title="Better" onPress={() => setPkg("BETTER")} disabled={busy} />
        <Button title="Best" onPress={() => setPkg("BEST")} disabled={busy} />
      </View>
      <Text>Selected: {pkg}</Text>

      <ScrollView style={{ flex: 1, borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 12 }}>
        <Text style={{ fontFamily: "Courier" }}>{JSON.stringify(props.payload, null, 2)}</Text>
      </ScrollView>

      {submitted ? (
        <View style={{ paddingVertical: 10 }}>
          <Text>Proposal created: {submitted.proposalId}</Text>
          <Text selectable>Review URL: {submitted.webReviewUrl}</Text>
        </View>
      ) : (
        <Button title={busy ? "Submitting..." : "Submit to proposal"} onPress={submit} disabled={busy} />
      )}

      <Button title="Back" onPress={props.onBack} disabled={busy} />
      <Button title="Done" onPress={props.onDone} disabled={busy} />
    </View>
  );
}
