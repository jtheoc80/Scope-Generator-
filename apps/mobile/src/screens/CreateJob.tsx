import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { apiFetch } from "../lib/api";

export default function CreateJob(props: { onCreated: (jobId: number) => void }) {
  const [clientName, setClientName] = useState("Jane Doe");
  const [address, setAddress] = useState("123 Main St");
  const [tradeId, setTradeId] = useState("bathroom");
  const [jobTypeId, setJobTypeId] = useState("demo");
  const [jobTypeName, setJobTypeName] = useState("Bathroom Remodel");
  const [jobNotes, setJobNotes] = useState("Existing tile is cracked; unknown subfloor.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{ jobId: number }>("/api/mobile/jobs", {
        method: "POST",
        body: JSON.stringify({
          clientName,
          address,
          tradeId,
          jobTypeId,
          jobTypeName,
          jobNotes,
          jobSize: 2,
        }),
      });
      props.onCreated(res.jobId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create job");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ padding: 16, gap: 10 }}>
      {error ? <Text style={{ color: "#b00020" }}>{error}</Text> : null}

      <Text>Client name</Text>
      <TextInput value={clientName} onChangeText={setClientName} style={{ borderWidth: 1, padding: 10, borderRadius: 8 }} />

      <Text>Address</Text>
      <TextInput value={address} onChangeText={setAddress} style={{ borderWidth: 1, padding: 10, borderRadius: 8 }} />

      <Text>Trade ID</Text>
      <TextInput value={tradeId} onChangeText={setTradeId} style={{ borderWidth: 1, padding: 10, borderRadius: 8 }} />

      <Text>Job type ID</Text>
      <TextInput value={jobTypeId} onChangeText={setJobTypeId} style={{ borderWidth: 1, padding: 10, borderRadius: 8 }} />

      <Text>Job type name</Text>
      <TextInput value={jobTypeName} onChangeText={setJobTypeName} style={{ borderWidth: 1, padding: 10, borderRadius: 8 }} />

      <Text>Notes</Text>
      <TextInput value={jobNotes} onChangeText={setJobNotes} multiline style={{ borderWidth: 1, padding: 10, borderRadius: 8, minHeight: 70 }} />

      <Button title={busy ? "Creating..." : "Create job"} onPress={submit} disabled={busy} />
    </View>
  );
}
