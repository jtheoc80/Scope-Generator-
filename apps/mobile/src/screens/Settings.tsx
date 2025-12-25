import { useEffect, useState } from "react";
import { Button, Text, TextInput, View, StyleSheet, Alert, TouchableOpacity } from "react-native";
import Constants from "expo-constants";
import {
  clearStoredMobileConfig,
  getStoredMobileConfig,
  saveStoredMobileConfig,
} from "../lib/config";
import { invalidateApiConfigCache } from "../lib/api";

function getDefaultBaseUrl() {
  const fromExtra = (Constants.expoConfig?.extra as any)?.defaultApiBaseUrl;
  return (process.env.EXPO_PUBLIC_API_BASE_URL || fromExtra || "http://localhost:3000") as string;
}

export default function Settings(props: { onDone: () => void; onSignOut?: () => void }) {
  const [baseUrl, setBaseUrl] = useState(getDefaultBaseUrl());
  const [apiKey, setApiKey] = useState("");
  const [userId, setUserId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await getStoredMobileConfig();
        if (stored) {
          setBaseUrl(stored.baseUrl);
          setApiKey(stored.apiKey || "");
          setUserId(stored.userId || "");
        }
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      if (!baseUrl.trim()) throw new Error("API Base URL is required");
      await saveStoredMobileConfig({
        baseUrl,
        apiKey: apiKey.trim() || undefined,
        userId: userId.trim() || undefined,
      });
      invalidateApiConfigCache();
      props.onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    setBusy(true);
    setError(null);
    try {
      await clearStoredMobileConfig();
      invalidateApiConfigCache();
      setBaseUrl(getDefaultBaseUrl());
      setApiKey("");
      setUserId("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to clear settings");
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out? You will need to sign in again to use the app.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              await clearStoredMobileConfig();
              invalidateApiConfigCache();
              props.onSignOut?.();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed to sign out");
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const looksLocal =
    baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1") || baseUrl.includes("0.0.0.0");

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {!loaded ? <Text style={styles.loadingText}>Loading…</Text> : null}

      {/* Current User Info */}
      {userId ? (
        <View style={styles.userInfo}>
          <Text style={styles.userInfoLabel}>Signed in as:</Text>
          <Text style={styles.userInfoValue}>{userId}</Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>API Configuration</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>API Base URL</Text>
        <TextInput
          value={baseUrl}
          onChangeText={setBaseUrl}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="https://yourdomain.com"
          style={styles.input}
        />
        {looksLocal ? (
          <Text style={styles.warningText}>
            This is set to a local URL. For production, set it to your public domain.
          </Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Mobile API Key (optional)</Text>
        <TextInput
          value={apiKey}
          onChangeText={setApiKey}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Paste key"
          secureTextEntry
          style={styles.input}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Mobile User ID</Text>
        <TextInput
          value={userId}
          onChangeText={setUserId}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="USER_ID"
          style={styles.input}
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, busy && styles.buttonDisabled]}
          onPress={save}
          disabled={busy}
        >
          <Text style={styles.primaryButtonText}>{busy ? "Saving…" : "Save"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, busy && styles.buttonDisabled]}
          onPress={props.onDone}
          disabled={busy}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out Section */}
      {props.onSignOut && (
        <View style={styles.signOutSection}>
          <TouchableOpacity
            style={[styles.signOutButton, busy && styles.buttonDisabled]}
            onPress={handleSignOut}
            disabled={busy}
          >
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  errorContainer: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
  },
  loadingText: {
    color: "#64748b",
    textAlign: "center",
  },
  userInfo: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  userInfoLabel: {
    fontSize: 12,
    color: "#15803d",
    marginBottom: 4,
  },
  userInfoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#166534",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 8,
    marginBottom: 4,
  },
  inputGroup: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  warningText: {
    color: "#d97706",
    fontSize: 12,
    marginTop: 6,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#f97316",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  secondaryButtonText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  signOutSection: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  signOutButton: {
    backgroundColor: "#fee2e2",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  signOutButtonText: {
    color: "#dc2626",
    fontWeight: "600",
    fontSize: 16,
  },
});

