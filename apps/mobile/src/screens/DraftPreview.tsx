import { useState, useEffect } from "react";
import { 
  Button, 
  Linking, 
  ScrollView, 
  Text, 
  View, 
  ActivityIndicator, 
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native";
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
  
  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailName, setEmailName] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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

  // Initialize email message when proposal is submitted
  useEffect(() => {
    if (submitted) {
      const payload = draftPayload as any;
      const clientName = payload?.job?.clientName || "there";
      setEmailName(clientName);
      setEmailMessage(
        `Hi ${clientName},\n\nPlease find your proposal ready for review. Click the link below to view it.\n\nLet me know if you have any questions!\n\nBest regards`
      );
    }
  }, [submitted, draftPayload]);

  const sendEmail = async () => {
    if (!emailTo || !submitted) return;
    
    setSendingEmail(true);
    setError(null);
    try {
      const res = await apiFetch<{ success: boolean; error?: string }>(
        `/api/proposals/${submitted.proposalId}/email`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: emailTo,
            recipientName: emailName,
            message: emailMessage,
          }),
        }
      );
      
      if (res.success) {
        setEmailSent(true);
        setShowEmailModal(false);
      } else {
        throw new Error(res.error || "Failed to send email");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send email");
    } finally {
      setSendingEmail(false);
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
        <View style={styles.submittedContainer}>
          <View style={styles.successBanner}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>Proposal Created!</Text>
            <Text style={styles.successSubtitle}>#{submitted.proposalId}</Text>
          </View>
          
          {emailSent && (
            <View style={styles.emailSentBanner}>
              <Text style={styles.emailSentText}>📧 Email sent to {emailTo}</Text>
            </View>
          )}
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.primaryActionButton}
              onPress={() => setShowEmailModal(true)}
              disabled={busy}
            >
              <Text style={styles.primaryActionIcon}>📧</Text>
              <Text style={styles.primaryActionText}>Email to Client</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryActionButton}
              onPress={() => Linking.openURL(submitted.webReviewUrl)}
              disabled={busy}
            >
              <Text style={styles.secondaryActionIcon}>🔗</Text>
              <Text style={styles.secondaryActionText}>Open in Browser</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.reviewUrlLabel}>Share Link:</Text>
          <Text style={styles.reviewUrl} selectable>{submitted.webReviewUrl}</Text>
        </View>
      ) : (
        <Button title={busy ? "Submitting..." : "Submit to proposal"} onPress={submit} disabled={busy} />
      )}

      {/* Email Modal */}
      <Modal
        visible={showEmailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEmailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📧 Email Proposal</Text>
            <Text style={styles.modalSubtitle}>Send this proposal directly to your client</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Client Email *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="client@example.com"
                value={emailTo}
                onChangeText={setEmailTo}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Client Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="John Smith"
                value={emailName}
                onChangeText={setEmailName}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Personal Message</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Add a personal message..."
                value={emailMessage}
                onChangeText={setEmailMessage}
                multiline
                numberOfLines={4}
              />
            </View>
            
            {error && (
              <Text style={styles.modalError}>{error}</Text>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowEmailModal(false)}
                disabled={sendingEmail}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.sendButton, (!emailTo || sendingEmail) && styles.buttonDisabled]}
                onPress={sendEmail}
                disabled={!emailTo || sendingEmail}
              >
                {sendingEmail ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Text style={styles.sendButtonIcon}>📤</Text>
                    <Text style={styles.sendButtonText}>Send</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  // Submitted state styles
  submittedContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  successBanner: {
    alignItems: "center",
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#166534",
  },
  successSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  emailSentBanner: {
    backgroundColor: "#dbeafe",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  emailSentText: {
    fontSize: 14,
    color: "#1e40af",
    textAlign: "center",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: "#f97316",
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryActionIcon: {
    fontSize: 18,
  },
  primaryActionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  secondaryActionIcon: {
    fontSize: 18,
  },
  secondaryActionText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  reviewUrlLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  reviewUrl: {
    fontSize: 12,
    color: "#3b82f6",
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 6,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#f9fafb",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  modalError: {
    color: "#dc2626",
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },
  sendButton: {
    flex: 1,
    backgroundColor: "#10b981",
    padding: 14,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  sendButtonIcon: {
    fontSize: 16,
  },
  sendButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
