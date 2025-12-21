import { useEffect, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
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

export default function Settings(props: { onDone: () => void }) {
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

  const looksLocal =
    baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1") || baseUrl.includes("0.0.0.0");

  return (
    <View style={{ padding: 16, gap: 10 }}>
      {error ? <Text style={{ color: "#b00020" }}>{error}</Text> : null}

      {!loaded ? <Text>Loading…</Text> : null}

      <Text style={{ fontWeight: "600" }}>API configuration</Text>

      <Text>API Base URL</Text>
      <TextInput
        value={baseUrl}
        onChangeText={setBaseUrl}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="https://yourdomain.com"
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />
      {looksLocal ? (
        <Text style={{ color: "#b00020" }}>
          This is set to a local URL. For a contractor-installed app, set it to your public domain
          (e.g. https://yourcompany.com).
        </Text>
      ) : null}

      <Text>Mobile API key (optional)</Text>
      <TextInput
        value={apiKey}
        onChangeText={setApiKey}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Paste key"
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />

      <Text>Mobile user id (optional)</Text>
      <TextInput
        value={userId}
        onChangeText={setUserId}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="USER_ID"
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Button title={busy ? "Saving…" : "Save"} onPress={save} disabled={busy} />
        <Button title="Clear" onPress={clear} disabled={busy} />
        <Button title="Back" onPress={props.onDone} disabled={busy} />
      </View>
    </View>
  );
}

