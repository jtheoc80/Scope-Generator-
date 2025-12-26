import { useState } from "react";
import { Image, Text, View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { apiFetch, newIdempotencyKey } from "../lib/api";

type UploadedPhoto = {
  id: string;
  uri: string;
  status: "uploading" | "uploaded" | "error";
};

/**
 * Check if the mime type is supported by AWS Rekognition.
 * Rekognition only supports JPEG and PNG.
 */
function isSupportedImageFormat(mimeType?: string | null): boolean {
  if (!mimeType) return false;
  return mimeType === "image/jpeg" || mimeType === "image/png";
}

export default function CapturePhotos(props: {
  jobId: number;
  onPhotosReady?: () => void;
  onDraftReady: (draftId: number, payload: unknown) => void;
  onBack: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [generatingDraft, setGeneratingDraft] = useState(false);

  const uploadAsset = async (asset: ImagePicker.ImagePickerAsset): Promise<void> => {
    const photoId = `photo-${Date.now()}`;
    
    // Add photo to list as uploading
    setPhotos(prev => [...prev, { id: photoId, uri: asset.uri, status: "uploading" }]);

    try {
      const presign = await apiFetch<{ key: string; uploadUrl: string; publicUrl: string }>(
        `/api/mobile/jobs/${props.jobId}/photos/presign`,
        {
          method: "POST",
          headers: { "Idempotency-Key": newIdempotencyKey() },
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
        headers: { "Idempotency-Key": newIdempotencyKey() },
        body: JSON.stringify({ url: presign.publicUrl, kind: "site" }),
      });

      // Update status to uploaded
      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, status: "uploaded" } : p));
    } catch (e) {
      // Update status to error
      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, status: "error" } : p));
      throw e;
    }
  };

  const pickAndUpload = async () => {
    setBusy(true);
    setError(null);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) throw new Error("Media library permission denied");

      // CRITICAL: exif: false ensures we don't get HEIC format on iOS
      // quality: 0.85 ensures reasonable file size
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsMultipleSelection: true,
        exif: false, // Reduces file complexity
      });

      if (result.canceled) return;

      for (const asset of result.assets) {
        // Warn if format might not be supported (HEIC from iOS gallery)
        if (!isSupportedImageFormat(asset.mimeType)) {
          console.warn(`Image format ${asset.mimeType} may not be supported by Rekognition. Converting...`);
        }
        await uploadAsset(asset);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const takeAndUpload = async () => {
    setBusy(true);
    setError(null);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) throw new Error("Camera permission denied");

      // CRITICAL: exif: false helps ensure JPEG output instead of HEIC on iOS
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        exif: false,
      });

      if (result.canceled) return;
      
      const asset = result.assets[0];
      if (!isSupportedImageFormat(asset.mimeType)) {
        console.warn(`Camera captured ${asset.mimeType} format - may need server-side conversion`);
      }
      await uploadAsset(asset);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Capture failed");
    } finally {
      setBusy(false);
    }
  };

  const generateDraft = async () => {
    const uploadedPhotos = photos.filter(p => p.status === "uploaded");
    if (uploadedPhotos.length === 0) {
      setError("Please add at least one photo before generating the proposal");
      return;
    }

    setGeneratingDraft(true);
    setError(null);
    try {
      await apiFetch<{ status: "DRAFTING" | "READY" | "FAILED" }>(`/api/mobile/jobs/${props.jobId}/draft`, {
        method: "POST",
        headers: { "Idempotency-Key": newIdempotencyKey() },
      });

      // Poll until READY
      for (let i = 0; i < 60; i++) {
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

  const uploadedCount = photos.filter(p => p.status === "uploaded").length;
  const uploadingCount = photos.filter(p => p.status === "uploading").length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>📷</Text>
        </View>
        <Text style={styles.title}>Capture Photos</Text>
        <Text style={styles.subtitle}>
          Take photos of the job site. Our AI will analyze them to generate your proposal.
        </Text>
      </View>

      {/* Error message */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Photo capture buttons */}
      <View style={styles.captureButtons}>
        <TouchableOpacity
          style={[styles.captureButton, styles.primaryCaptureButton, busy && styles.buttonDisabled]}
          onPress={takeAndUpload}
          disabled={busy || generatingDraft}
        >
          <Text style={styles.captureButtonIcon}>📸</Text>
          <Text style={styles.primaryCaptureButtonText}>Take Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.captureButton, styles.secondaryCaptureButton, busy && styles.buttonDisabled]}
          onPress={pickAndUpload}
          disabled={busy || generatingDraft}
        >
          <Text style={styles.captureButtonIcon}>🖼️</Text>
          <Text style={styles.secondaryCaptureButtonText}>From Gallery</Text>
        </TouchableOpacity>
      </View>

      {/* Photo count */}
      {photos.length > 0 && (
        <View style={styles.photoCount}>
          <Text style={styles.photoCountText}>
            {uploadedCount} photo{uploadedCount !== 1 ? 's' : ''} uploaded
            {uploadingCount > 0 && ` (${uploadingCount} uploading...)`}
          </Text>
        </View>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <View style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <View key={photo.id} style={styles.photoContainer}>
              <Image source={{ uri: photo.uri }} style={styles.photo} />
              {photo.status === "uploading" && (
                <View style={styles.photoOverlay}>
                  <ActivityIndicator color="#ffffff" />
                </View>
              )}
              {photo.status === "uploaded" && (
                <View style={styles.photoCheckmark}>
                  <Text style={styles.photoCheckmarkText}>✓</Text>
                </View>
              )}
              {photo.status === "error" && (
                <View style={styles.photoError}>
                  <Text style={styles.photoErrorText}>!</Text>
                </View>
              )}
              <View style={styles.photoNumber}>
                <Text style={styles.photoNumberText}>#{index + 1}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Tips if no photos */}
      {photos.length === 0 && (
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>📸 Photo Tips</Text>
          <Text style={styles.tipsText}>• First photo becomes the proposal cover</Text>
          <Text style={styles.tipsText}>• Include wide shots and close-ups</Text>
          <Text style={styles.tipsText}>• Capture problem areas for accurate estimates</Text>
          <Text style={styles.tipsText}>• More photos = better AI analysis</Text>
        </View>
      )}

      {/* Review Findings button (gated flow) OR Generate Draft button (legacy flow) */}
      {props.onPhotosReady ? (
        <TouchableOpacity
          style={[
            styles.generateButton,
            styles.reviewButton,
            (uploadedCount === 0 || uploadingCount > 0) && styles.buttonDisabled
          ]}
          onPress={props.onPhotosReady}
          disabled={uploadedCount === 0 || uploadingCount > 0}
        >
          <Text style={styles.generateButtonIcon}>🔍</Text>
          <Text style={styles.generateButtonText}>Review Findings</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.generateButton,
            (generatingDraft || uploadedCount === 0 || uploadingCount > 0) && styles.buttonDisabled
          ]}
          onPress={generateDraft}
          disabled={generatingDraft || uploadedCount === 0 || uploadingCount > 0}
        >
          {generatingDraft ? (
            <>
              <ActivityIndicator color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.generateButtonText}>Generating Proposal...</Text>
            </>
          ) : (
            <>
              <Text style={styles.generateButtonIcon}>✨</Text>
              <Text style={styles.generateButtonText}>Generate Proposal</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {uploadingCount > 0 && (
        <Text style={styles.waitingText}>
          Waiting for {uploadingCount} photo{uploadingCount !== 1 ? 's' : ''} to upload...
        </Text>
      )}

      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={props.onBack}
        disabled={generatingDraft}
      >
        <Text style={styles.backButtonText}>← Back to Job Details</Text>
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
  header: {
    alignItems: "center",
    marginBottom: 24,
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
  captureButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  captureButton: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  primaryCaptureButton: {
    backgroundColor: "#f97316",
  },
  secondaryCaptureButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  captureButtonIcon: {
    fontSize: 28,
  },
  primaryCaptureButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryCaptureButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  photoCount: {
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  photoCountText: {
    color: "#166534",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  photoContainer: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoCheckmark: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
  },
  photoCheckmarkText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  photoError: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  photoErrorText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  photoNumber: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  photoNumberText: {
    color: "#ffffff",
    fontSize: 12,
  },
  tipsCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e40af",
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    color: "#3b82f6",
    lineHeight: 20,
  },
  generateButton: {
    backgroundColor: "#10b981",
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  reviewButton: {
    backgroundColor: "#f97316",
  },
  generateButtonIcon: {
    fontSize: 20,
  },
  generateButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  waitingText: {
    color: "#64748b",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 12,
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
