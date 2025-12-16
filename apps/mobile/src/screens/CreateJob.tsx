import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { apiFetch } from "../lib/api";

export default function CreateJob(props: { onCreated: (jobId: number) => void }) {
  // jobType is either a numeric template ID or a jobTypeId string.
  const [jobType, setJobType] = useState("demo");
  const [customer, setCustomer] = useState("Jane Doe");
  const [address, setAddress] = useState("123 Main St");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{ jobId: number }>("/api/mobile/jobs", {
        method: "POST",
        body: JSON.stringify({
          jobType: /^\d+$/.test(jobType) ? Number(jobType) : jobType,
          customer,
          address,
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

      <Text>Job type (template id or jobTypeId)</Text>
      <TextInput value={jobType} onChangeText={setJobType} style={{ borderWidth: 1, padding: 10, borderRadius: 8 }} />

      <Text>Customer</Text>
      <TextInput value={customer} onChangeText={setCustomer} style={{ borderWidth: 1, padding: 10, borderRadius: 8 }} />

      <Text>Address</Text>
      <TextInput value={address} onChangeText={setAddress} style={{ borderWidth: 1, padding: 10, borderRadius: 8 }} />

      <Button title={busy ? "Creating..." : "Create job"} onPress={submit} disabled={busy} />
    </View>
  );
}
