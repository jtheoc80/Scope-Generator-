import { useState } from "react";
import { Text, TextInput, View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { apiFetch, newIdempotencyKey } from "../lib/api";

export default function CreateJob(props: { onCreated: (jobId: number) => void }) {
  // jobType is either a numeric template ID or a jobTypeId string.
  const [jobType, setJobType] = useState("bathroom-remodel");
  const [customer, setCustomer] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{ jobId: number }>("/api/mobile/jobs", {
        method: "POST",
        headers: { "Idempotency-Key": newIdempotencyKey() },
        body: JSON.stringify({
          jobType: /^\d+$/.test(jobType) ? Number(jobType) : jobType,
          customer: customer.trim() || "Customer",
          address: address.trim() || "Address TBD",
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header with camera icon */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>📸</Text>
        </View>
        <Text style={styles.title}>Create New Job</Text>
        <Text style={styles.subtitle}>
          Fill in the details, then capture photos to generate your proposal
        </Text>
      </View>

      {/* Error message */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Form */}
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Job Type</Text>
          <TextInput
            value={jobType}
            onChangeText={setJobType}
            style={styles.input}
            placeholder="bathroom-remodel, kitchen-remodel, etc."
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>
            Common types: bathroom-remodel, kitchen-remodel, roofing, hvac, plumbing
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Customer Name</Text>
          <TextInput
            value={customer}
            onChangeText={setCustomer}
            style={styles.input}
            placeholder="Jane Doe"
            placeholderTextColor="#94a3b8"
            textContentType="name"
            autoComplete="name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Job Address</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            style={styles.input}
            placeholder="123 Main St, City, State"
            placeholderTextColor="#94a3b8"
            textContentType="fullStreetAddress"
            autoComplete="street-address"
          />
        </View>

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.submitButton, busy && styles.submitButtonDisabled]}
          onPress={submit}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Continue to Camera</Text>
              <Text style={styles.submitButtonIcon}>📷</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Info card about next steps */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>📸 Next: Capture Photos</Text>
        <Text style={styles.infoText}>
          After creating the job, you&apos;ll be able to take photos of the job site. 
          Our AI will analyze your photos and generate a detailed proposal with pricing.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    textAlign: "center",
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#0f172a",
  },
  hint: {
    fontSize: 12,
    color: "#94a3b8",
  },
  submitButton: {
    backgroundColor: "#f97316",
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#fdba74",
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  submitButtonIcon: {
    fontSize: 20,
  },
  infoCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e40af",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#3b82f6",
    lineHeight: 20,
  },
});
