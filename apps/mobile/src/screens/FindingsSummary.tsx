import { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { apiFetch } from "../lib/api";

// Types matching the API response
type Finding = {
  id: string;
  issue: string;
  description?: string;
  confidence: number;
  locationGuess?: string;
  category: string;
  photoIds: number[];
  severity?: "low" | "medium" | "high";
};

type Unknown = {
  id: string;
  description: string;
  impactsScope: boolean;
  impactsPricing: boolean;
};

type ScopeOption = {
  value: string;
  label: string;
  description?: string;
  priceMultiplier?: number;
  estimatedSqFt?: number;
  isDefault?: boolean;
};

type ClarifyingQuestion = {
  id: string;
  question: string;
  questionType: "single_select" | "multi_select" | "number" | "text" | "boolean";
  options?: ScopeOption[];
  unit?: string;
  minValue?: number;
  maxValue?: number;
  required: boolean;
  defaultValue?: string | number | boolean;
  helpText?: string;
  impactArea?: string;
};

type ScopeTier = {
  id: string;
  name: string;
  description: string;
  level: "minimum" | "recommended" | "premium";
  scopeItems: string[];
  estimatedDays: { low: number; high: number };
  priceRange?: { low: number; high: number };
  requiresConfirmation: boolean;
  warnings?: string[];
};

type FindingsSummary = {
  status: "ready" | "analyzing" | "no_photos";
  findings: Finding[];
  unknowns: Unknown[];
  needsClarification: boolean;
  clarifyingQuestions: ClarifyingQuestion[];
  suggestedTiers?: ScopeTier[];
  overallConfidence: number;
  photosAnalyzed: number;
  photosTotal: number;
  suggestedProblem?: string;
  needsMorePhotos?: string[];
  detectedTrade?: string;
  isPaintingJob: boolean;
};

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

interface FindingsSummaryProps {
  jobId: number;
  onScopeConfirmed: (selection: ScopeSelection) => void;
  onBack: () => void;
}

/**
 * FindingsSummary Screen - The "gate" between photo analysis and proposal generation.
 * 
 * Shows:
 * 1. What the AI detected (findings)
 * 2. Confidence levels
 * 3. Unknowns that need clarification
 * 4. Scope selection questions (especially for painting)
 * 
 * User must complete this step before generating a proposal.
 */
export default function FindingsSummary({
  jobId,
  onScopeConfirmed,
  onBack,
}: FindingsSummaryProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<FindingsSummary | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({});
  const [selectedTierId, setSelectedTierId] = useState<string | undefined>();
  const [pollingCount, setPollingCount] = useState(0);

  // Fetch findings summary
  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const fetchFindings = async () => {
      try {
        const data = await apiFetch<FindingsSummary>(
          `/api/mobile/jobs/${jobId}/findings`,
          { method: "GET" }
        );

        if (cancelled) return;

        setSummary(data);

        // If still analyzing, poll again
        if (data.status === "analyzing" && pollingCount < 60) {
          pollTimer = setTimeout(() => {
            setPollingCount((c) => c + 1);
          }, 1500);
        } else {
          setLoading(false);
        }

        // Set default answers from questions
        if (data.status === "ready" && data.clarifyingQuestions) {
          const defaults: Record<string, string | number | boolean> = {};
          for (const q of data.clarifyingQuestions) {
            if (q.defaultValue !== undefined) {
              defaults[q.id] = q.defaultValue;
            }
            // Set default option if one is marked
            if (q.options) {
              const defaultOption = q.options.find((o) => o.isDefault);
              if (defaultOption) {
                defaults[q.id] = defaultOption.value;
              }
            }
          }
          setAnswers(defaults);

          // Set default tier
          if (data.suggestedTiers) {
            const recommendedTier = data.suggestedTiers.find(
              (t) => t.level === "recommended"
            );
            if (recommendedTier) {
              setSelectedTierId(recommendedTier.id);
            }
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load findings");
          setLoading(false);
        }
      }
    };

    fetchFindings();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [jobId, pollingCount]);

  const handleAnswerChange = (questionId: string, value: string | number | boolean) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleContinue = () => {
    const selection: ScopeSelection = {
      selectedTierId,
      answers,
      problemStatement: summary?.suggestedProblem,
    };

    // Extract measurements from answers if present
    if (answers.room_size && typeof answers.room_size === "number") {
      selection.measurements = {
        squareFeet: answers.room_size as number,
      };
    }

    onScopeConfirmed(selection);
  };

  const canContinue = () => {
    if (!summary) return false;
    if (!summary.needsClarification) return true;

    // Check required questions are answered
    for (const q of summary.clarifyingQuestions) {
      if (q.required && answers[q.id] === undefined) {
        return false;
      }
    }
    return true;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "#22c55e"; // green
    if (confidence >= 0.6) return "#eab308"; // yellow
    return "#f97316"; // orange
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    return "Low";
  };

  // Loading state
  if (loading || summary?.status === "analyzing") {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>
          {summary?.status === "analyzing"
            ? `Analyzing photos... (${summary.photosAnalyzed}/${summary.photosTotal})`
            : "Loading findings..."}
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => setPollingCount(0)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No photos state
  if (summary?.status === "no_photos") {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>📷</Text>
        <Text style={styles.emptyTitle}>No photos yet</Text>
        <Text style={styles.emptyText}>
          Please take or upload photos first so we can analyze the job site.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back to Photos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🔍</Text>
        <Text style={styles.title}>Quick Findings</Text>
        <Text style={styles.subtitle}>
          Here's what we found. Please verify the scope before pricing.
        </Text>
      </View>

      {/* Overall confidence */}
      <View style={styles.confidenceCard}>
        <View style={styles.confidenceHeader}>
          <Text style={styles.confidenceLabel}>Analysis Confidence</Text>
          <View
            style={[
              styles.confidenceBadge,
              { backgroundColor: getConfidenceColor(summary?.overallConfidence ?? 0) },
            ]}
          >
            <Text style={styles.confidenceBadgeText}>
              {getConfidenceLabel(summary?.overallConfidence ?? 0)} (
              {Math.round((summary?.overallConfidence ?? 0) * 100)}%)
            </Text>
          </View>
        </View>
        <Text style={styles.confidenceSubtext}>
          Based on {summary?.photosAnalyzed} photo{summary?.photosAnalyzed !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* What We Found */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 What I See</Text>
        {summary?.findings && summary.findings.length > 0 ? (
          summary.findings.slice(0, 8).map((finding) => (
            <View key={finding.id} style={styles.findingCard}>
              <View style={styles.findingHeader}>
                <Text style={styles.findingIssue}>{finding.issue}</Text>
                <Text
                  style={[
                    styles.findingConfidence,
                    { color: getConfidenceColor(finding.confidence) },
                  ]}
                >
                  {Math.round(finding.confidence * 100)}%
                </Text>
              </View>
              {finding.locationGuess && (
                <Text style={styles.findingLocation}>📍 {finding.locationGuess}</Text>
              )}
              {finding.severity && (
                <Text
                  style={[
                    styles.findingSeverity,
                    finding.severity === "high" && styles.severityHigh,
                    finding.severity === "medium" && styles.severityMedium,
                    finding.severity === "low" && styles.severityLow,
                  ]}
                >
                  {finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1)} priority
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.noFindings}>No specific issues detected in photos</Text>
        )}
      </View>

      {/* Unknowns */}
      {summary?.unknowns && summary.unknowns.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❓ Unknowns</Text>
          <View style={styles.unknownsCard}>
            {summary.unknowns.map((unknown) => (
              <Text key={unknown.id} style={styles.unknownItem}>
                • {unknown.description}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Clarifying Questions */}
      {summary?.needsClarification && summary.clarifyingQuestions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Before I price it...</Text>
          {summary.clarifyingQuestions.map((question) => (
            <View key={question.id} style={styles.questionCard}>
              <Text style={styles.questionText}>
                {question.question}
                {question.required && <Text style={styles.required}> *</Text>}
              </Text>
              {question.helpText && (
                <Text style={styles.helpText}>{question.helpText}</Text>
              )}

              {/* Single select options */}
              {question.questionType === "single_select" && question.options && (
                <View style={styles.optionsContainer}>
                  {question.options.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        answers[question.id] === option.value && styles.optionSelected,
                      ]}
                      onPress={() => handleAnswerChange(question.id, option.value)}
                    >
                      <View style={styles.optionRadio}>
                        {answers[question.id] === option.value && (
                          <View style={styles.optionRadioInner} />
                        )}
                      </View>
                      <View style={styles.optionContent}>
                        <Text
                          style={[
                            styles.optionLabel,
                            answers[question.id] === option.value &&
                              styles.optionLabelSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                        {option.description && (
                          <Text style={styles.optionDescription}>{option.description}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Boolean options */}
              {question.questionType === "boolean" && (
                <View style={styles.booleanContainer}>
                  <TouchableOpacity
                    style={[
                      styles.booleanButton,
                      answers[question.id] === true && styles.booleanSelected,
                    ]}
                    onPress={() => handleAnswerChange(question.id, true)}
                  >
                    <Text
                      style={[
                        styles.booleanText,
                        answers[question.id] === true && styles.booleanTextSelected,
                      ]}
                    >
                      Yes
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.booleanButton,
                      answers[question.id] === false && styles.booleanSelected,
                    ]}
                    onPress={() => handleAnswerChange(question.id, false)}
                  >
                    <Text
                      style={[
                        styles.booleanText,
                        answers[question.id] === false && styles.booleanTextSelected,
                      ]}
                    >
                      No
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Scope Tiers */}
      {summary?.suggestedTiers && summary.suggestedTiers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Scope Options</Text>
          {summary.suggestedTiers.map((tier) => (
            <TouchableOpacity
              key={tier.id}
              style={[
                styles.tierCard,
                selectedTierId === tier.id && styles.tierSelected,
                tier.level === "recommended" && styles.tierRecommended,
              ]}
              onPress={() => setSelectedTierId(tier.id)}
            >
              <View style={styles.tierHeader}>
                <View style={styles.tierRadio}>
                  {selectedTierId === tier.id && <View style={styles.tierRadioInner} />}
                </View>
                <View style={styles.tierInfo}>
                  <View style={styles.tierTitleRow}>
                    <Text style={styles.tierName}>{tier.name}</Text>
                    {tier.level === "recommended" && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedText}>Recommended</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.tierDescription}>{tier.description}</Text>
                </View>
              </View>
              <View style={styles.tierMeta}>
                <Text style={styles.tierDays}>
                  ⏱ {tier.estimatedDays.low === tier.estimatedDays.high
                    ? `${tier.estimatedDays.low} day${tier.estimatedDays.low !== 1 ? "s" : ""}`
                    : `${tier.estimatedDays.low}-${tier.estimatedDays.high} days`}
                </Text>
                {tier.priceRange && (
                  <Text style={styles.tierPrice}>
                    💰 ${tier.priceRange.low.toLocaleString()} - $
                    {tier.priceRange.high.toLocaleString()}
                  </Text>
                )}
              </View>
              {tier.warnings && tier.warnings.length > 0 && (
                <View style={styles.tierWarnings}>
                  {tier.warnings.map((w, i) => (
                    <Text key={i} style={styles.tierWarning}>
                      ⚠️ {w}
                    </Text>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Continue Button */}
      <TouchableOpacity
        style={[styles.continueButton, !canContinue() && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!canContinue()}
      >
        <Text style={styles.continueButtonText}>
          {summary?.needsClarification ? "Continue to Proposal" : "Generate Proposal"} →
        </Text>
      </TouchableOpacity>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back to Photos</Text>
      </TouchableOpacity>
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#64748b",
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#dc2626",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#f97316",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  confidenceCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  confidenceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  confidenceSubtext: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 12,
  },
  findingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  findingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  findingIssue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
    marginRight: 8,
  },
  findingConfidence: {
    fontSize: 12,
    fontWeight: "600",
  },
  findingLocation: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  findingSeverity: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    overflow: "hidden",
  },
  severityHigh: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
  },
  severityMedium: {
    backgroundColor: "#fef3c7",
    color: "#d97706",
  },
  severityLow: {
    backgroundColor: "#dcfce7",
    color: "#16a34a",
  },
  noFindings: {
    fontSize: 14,
    color: "#64748b",
    fontStyle: "italic",
  },
  unknownsCard: {
    backgroundColor: "#fef3c7",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  unknownItem: {
    fontSize: 13,
    color: "#92400e",
    marginBottom: 4,
  },
  questionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  questionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  required: {
    color: "#dc2626",
  },
  helpText: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 12,
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 8,
    backgroundColor: "#f8fafc",
  },
  optionSelected: {
    borderColor: "#f97316",
    backgroundColor: "#fff7ed",
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#d1d5db",
    marginRight: 12,
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  optionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#f97316",
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  optionLabelSelected: {
    color: "#f97316",
  },
  optionDescription: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  booleanContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  booleanButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  booleanSelected: {
    borderColor: "#f97316",
    backgroundColor: "#fff7ed",
  },
  booleanText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  booleanTextSelected: {
    color: "#f97316",
  },
  tierCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  tierSelected: {
    borderColor: "#f97316",
    backgroundColor: "#fff7ed",
  },
  tierRecommended: {
    borderColor: "#10b981",
  },
  tierHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  tierRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#d1d5db",
    marginRight: 12,
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  tierRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#f97316",
  },
  tierInfo: {
    flex: 1,
  },
  tierTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  tierName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  recommendedBadge: {
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#ffffff",
  },
  tierDescription: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },
  tierMeta: {
    flexDirection: "row",
    marginTop: 12,
    gap: 16,
  },
  tierDays: {
    fontSize: 12,
    color: "#64748b",
  },
  tierPrice: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  tierWarnings: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#fef3c7",
    borderRadius: 6,
  },
  tierWarning: {
    fontSize: 11,
    color: "#92400e",
  },
  continueButton: {
    backgroundColor: "#10b981",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  backButton: {
    padding: 16,
    alignItems: "center",
  },
  backButtonText: {
    color: "#64748b",
    fontSize: 14,
  },
});
