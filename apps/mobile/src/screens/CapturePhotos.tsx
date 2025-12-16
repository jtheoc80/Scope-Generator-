import { useState } from "react";
import { Button, Image, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { apiFetch } from "../lib/api";

export default function CapturePhotos(props: {
  jobId: number;
  onDraftReady: (draftId: number, payload: unknown) => void;
  onBack: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUri, setLastUri] = useState<string | null>(null);

  const pickAndUpload = async () => {
    setBusy(true);
    setError(null);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) throw new Error("Media library permission denied");

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      setLastUri(asset.uri);

      const presign = await apiFetch<{ key: string; uploadUrl: string; publicUrl: string }>(
        `/api/mobile/jobs/${props.jobId}/photos/presign`,
        {
          method: "POST",
          body: JSON.stringify({
            contentType: asset.mimeType || "image/jpeg",
            filename: asset.fileName || "photo.jpg",
          }),
        }
      );

      const blob = await (await fetch(asset.uri)).blob();

      const put = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": asset.mimeType || "image/jpeg",
        },
        body: blob,
      });

      if (!put.ok) throw new Error("Upload failed");

      await apiFetch(`/api/mobile/jobs/${props.jobId}/photos`, {
        method: "POST",
        body: JSON.stringify({ url: presign.publicUrl, kind: "site" }),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const generateDraft = async () => {
    setBusy(true);
    setError(null);
    try {
      await apiFetch<{ status: "DRAFTING" | "READY" | "FAILED" }>(`/api/mobile/jobs/${props.jobId}/draft`, {
        method: "POST",
      });

      // Poll until READY
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const draft = await apiFetch<{ status: "DRAFTING" | "READY" | "FAILED"; payload?: unknown }>(
          `/api/mobile/jobs/${props.jobId}/draft`,
          { method: "GET" }
        );
        if (draft.status === "READY" && draft.payload) {
          props.onDraftReady(0, draft.payload);
          return;
        }
        if (draft.status === "FAILED") {
          throw new Error("Draft failed");
        }
      }
      throw new Error("Draft timed out");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Draft generation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ padding: 16, gap: 10 }}>
      {error ? <Text style={{ color: "#b00020" }}>{error}</Text> : null}

      <Text>Job ID: {props.jobId}</Text>

      <Button title={busy ? "Working..." : "Pick & upload photo"} onPress={pickAndUpload} disabled={busy} />

      {lastUri ? (
        <Image source={{ uri: lastUri }} style={{ width: "100%", height: 220, borderRadius: 12 }} />
      ) : null}

      <Button title={busy ? "Working..." : "Generate draft"} onPress={generateDraft} disabled={busy} />
      <Button title="Back" onPress={props.onBack} disabled={busy} />
    </View>
  );
}
