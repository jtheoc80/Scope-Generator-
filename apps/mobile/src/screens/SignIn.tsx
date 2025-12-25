import { useState } from "react";
import {
  Button,
  Text,
  TextInput,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  getStoredMobileConfig,
  saveStoredMobileConfig,
} from "../lib/config";
import { apiFetch, invalidateApiConfigCache } from "../lib/api";

type SignInProps = {
  onSignedIn: () => void;
  onSkip?: () => void;
};

export default function SignIn({ onSignedIn, onSkip }: SignInProps) {
  const [baseUrl, setBaseUrl] = useState("");
  const [userId, setUserId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSignIn = async () => {
    if (!userId.trim()) {
      setError("Please enter your User ID");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      // Save configuration
      await saveStoredMobileConfig({
        baseUrl: baseUrl.trim() || "https://scopegen.app",
        apiKey: apiKey.trim() || undefined,
        userId: userId.trim(),
      });

      // Invalidate any cached config
      invalidateApiConfigCache();

      // Test the connection by making a simple API call
      try {
        await apiFetch("/api/mobile/jobs", { method: "GET" });
      } catch (apiError) {
        // If it's a 401, the credentials might be wrong
        const errorMessage = apiError instanceof Error ? apiError.message : "Unknown error";
        if (errorMessage.includes("401") || errorMessage.toLowerCase().includes("unauthorized")) {
          throw new Error("Invalid credentials. Please check your User ID and API Key.");
        }
        // Other errors might be ok (e.g., empty response is fine)
      }

      onSignedIn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>📱</Text>
          </View>
          <Text style={styles.title}>ScopeGen Mobile</Text>
          <Text style={styles.subtitle}>
            Sign in to capture photos and generate professional proposals
          </Text>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>User ID *</Text>
            <TextInput
              style={styles.input}
              value={userId}
              onChangeText={setUserId}
              placeholder="Enter your User ID"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
            />
            <Text style={styles.hint}>
              Your User ID from ScopeGen dashboard
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>API Key (if required)</Text>
            <TextInput
              style={styles.input}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="Enter your API Key"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              editable={!busy}
            />
          </View>

          {/* Advanced Settings Toggle */}
          <TouchableOpacity
            style={styles.advancedToggle}
            onPress={() => setShowAdvanced(!showAdvanced)}
            disabled={busy}
          >
            <Text style={styles.advancedToggleText}>
              {showAdvanced ? "▼ Hide Advanced Settings" : "▶ Advanced Settings"}
            </Text>
          </TouchableOpacity>

          {showAdvanced && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>API Base URL</Text>
              <TextInput
                style={styles.input}
                value={baseUrl}
                onChangeText={setBaseUrl}
                placeholder="https://scopegen.app"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                editable={!busy}
              />
              <Text style={styles.hint}>
                Leave empty for default ScopeGen server
              </Text>
            </View>
          )}

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.signInButton, busy && styles.signInButtonDisabled]}
            onPress={handleSignIn}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.signInButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Skip option for dev/demo */}
          {onSkip && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={onSkip}
              disabled={busy}
            >
              <Text style={styles.skipButtonText}>
                Skip for now (Demo Mode)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need help signing in?</Text>
          <Text style={styles.helpText}>
            1. Open ScopeGen on your computer{"\n"}
            2. Go to Settings → Mobile App{"\n"}
            3. Copy your User ID and API Key
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Capture job site photos and generate AI-powered proposals instantly
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    textAlign: "center",
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#0f172a",
  },
  hint: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 6,
  },
  advancedToggle: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  advancedToggleText: {
    color: "#64748b",
    fontSize: 14,
  },
  signInButton: {
    backgroundColor: "#f97316",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginTop: 8,
  },
  signInButtonDisabled: {
    backgroundColor: "#fdba74",
  },
  signInButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  skipButton: {
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  skipButtonText: {
    color: "#64748b",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  helpSection: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e40af",
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: "#3b82f6",
    lineHeight: 20,
  },
  footer: {
    alignItems: "center",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
  },
});
