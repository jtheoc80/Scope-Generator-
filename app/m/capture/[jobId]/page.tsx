"use client";

import { useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Camera,
  ImagePlus,
  Trash2,
  Loader2,
  Sparkles,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { mobileApiFetch, newIdempotencyKey, PresignResponse } from "../../lib/api";

type UploadedPhoto = {
  id: string;
  localUrl: string;
  remoteUrl?: string;
  status: "pending" | "uploading" | "uploaded" | "error";
  error?: string;
};

/**
 * Convert any image file to JPEG format.
 * This is critical because AWS Rekognition only supports JPEG/PNG.
 * iPhones often capture photos as HEIC/HEIF which will cause Rekognition to fail silently.
 */
async function convertToJpeg(file: File, quality = 0.85): Promise<File> {
  // Already a supported format - return as-is
  if (file.type === "image/jpeg" || file.type === "image/png") {
    return file;
  }

  try {
    // Create an image bitmap from the file
    const bmp = await createImageBitmap(file);
    
    // Create a canvas to draw the image
    const canvas = document.createElement("canvas");
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.warn("Canvas not supported, returning original file");
      return file;
    }
    
    // Draw the image onto the canvas
    ctx.drawImage(bmp, 0, 0);
    
    // Convert to JPEG blob
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        "image/jpeg",
        quality
      );
    });
    
    // Create a new File with .jpg extension
    const newFileName = file.name.replace(/\.\w+$/, ".jpg");
    const convertedFile = new File([blob], newFileName, { type: "image/jpeg" });
    
    console.log(`Converted ${file.name} (${file.type}) to JPEG: ${convertedFile.size} bytes`);
    return convertedFile;
  } catch (err) {
    console.error("Failed to convert image to JPEG:", err);
    // Return original file if conversion fails - let backend handle the error
    return file;
  }
}

export default function CapturePhotosPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => `photo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const uploadPhoto = async (photo: UploadedPhoto, file: File) => {
    try {
      // Update status to uploading
      setPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, status: "uploading" as const } : p))
      );

      // Get presigned URL
      const presign = await mobileApiFetch<PresignResponse>(
        `/api/mobile/jobs/${jobId}/photos/presign`,
        {
          method: "POST",
          headers: { "Idempotency-Key": newIdempotencyKey() },
          body: JSON.stringify({
            contentType: file.type || "image/jpeg",
            filename: file.name || "photo.jpg",
          }),
        }
      );

      // Upload to storage
      const putResponse = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "image/jpeg",
        },
        body: file,
      });

      if (!putResponse.ok) {
        throw new Error("Upload to storage failed");
      }

      // Register photo with the API
      await mobileApiFetch(`/api/mobile/jobs/${jobId}/photos`, {
        method: "POST",
        headers: { "Idempotency-Key": newIdempotencyKey() },
        body: JSON.stringify({ url: presign.publicUrl, kind: "site" }),
      });

      // Update status to uploaded
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photo.id
            ? { ...p, status: "uploaded" as const, remoteUrl: presign.publicUrl }
            : p
        )
      );
    } catch (e) {
      // Update status to error
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photo.id
            ? { ...p, status: "error" as const, error: e instanceof Error ? e.message : "Upload failed" }
            : p
        )
      );
    }
  };

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null); // Clear any previous error

    const newPhotos: UploadedPhoto[] = [];
    const filesToUpload: { photo: UploadedPhoto; file: File }[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;

      // CRITICAL: Convert HEIC/WEBP and other formats to JPEG before upload.
      // AWS Rekognition only supports JPEG/PNG. iPhones often capture as HEIC.
      const convertedFile = await convertToJpeg(file);

      const photo: UploadedPhoto = {
        id: generateId(),
        localUrl: URL.createObjectURL(convertedFile),
        status: "pending",
      };

      newPhotos.push(photo);
      filesToUpload.push({ photo, file: convertedFile });
    }

    setPhotos((prev) => [...prev, ...newPhotos]);

    // Start uploading all files
    for (const { photo, file } of filesToUpload) {
      uploadPhoto(photo, file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const removePhoto = (id: string) => {
    setError(null); // Clear any previous error
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo?.localUrl.startsWith("blob:")) {
        URL.revokeObjectURL(photo.localUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const retryPhoto = (id: string) => {
    // For retry, we'd need to keep the original file reference
    // For simplicity, just remove the errored photo and let user re-add
    setError(null); // Clear any previous error
    removePhoto(id);
  };

  const handleAnalyzePhotos = () => {
    setError(null); // Clear any previous error first

    if (photos.length === 0) {
      setError("Please add at least one photo");
      return;
    }

    const uploadingPhotos = photos.filter((p) => p.status === "uploading");
    if (uploadingPhotos.length > 0) {
      setError("Please wait for all photos to finish uploading");
      return;
    }

    const uploadedPhotos = photos.filter((p) => p.status === "uploaded");
    if (uploadedPhotos.length === 0) {
      setError("No photos were successfully uploaded. Please try again.");
      return;
    }

    // Navigate to issue selection page
    router.push(`/m/issues/${jobId}`);
  };

  const uploadedCount = photos.filter((p) => p.status === "uploaded").length;
  const uploadingCount = photos.filter((p) => p.status === "uploading").length;
  const errorCount = photos.filter((p) => p.status === "error").length;

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <span className="text-sm text-slate-500">Job #{jobId}</span>
      </div>

      {/* Title */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Capture Photos</h2>
        <p className="text-sm text-slate-600">
          Take or select photos of the job site for your proposal
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Photo capture buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-20 flex-col gap-2"
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera className="w-6 h-6" />
          <span className="text-sm">Take Photo</span>
        </Button>
        <Button
          variant="outline"
          className="h-20 flex-col gap-2"
          onClick={() => galleryInputRef.current?.click()}
        >
          <ImagePlus className="w-6 h-6" />
          <span className="text-sm">From Gallery</span>
        </Button>
      </div>

      {/* Photo count summary */}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {uploadedCount > 0 && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {uploadedCount} uploaded
            </span>
          )}
          {uploadingCount > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {uploadingCount} uploading
            </span>
          )}
          {errorCount > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errorCount} failed
            </span>
          )}
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo, index) => (
            <Card key={photo.id} className="overflow-hidden">
              <div className="relative aspect-square bg-slate-100">
                {/* Use native img for blob URLs - more reliable on mobile browsers */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.localUrl}
                  alt={`Photo ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Status overlay */}
                {photo.status === "uploading" && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}

                {photo.status === "uploaded" && (
                  <div className="absolute top-2 left-2">
                    <CheckCircle className="w-5 h-5 text-green-500 drop-shadow" />
                  </div>
                )}

                {photo.status === "error" && (
                  <div className="absolute inset-0 bg-red-500/80 flex flex-col items-center justify-center p-2 text-white text-center">
                    <AlertCircle className="w-6 h-6 mb-1" />
                    <p className="text-xs">{photo.error}</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-2 h-7 text-xs"
                      onClick={() => retryPhoto(photo.id)}
                    >
                      Remove
                    </Button>
                  </div>
                )}

                {/* Delete button */}
                {photo.status !== "uploading" && photo.status !== "error" && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => removePhoto(photo.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}

                {/* Photo number */}
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  #{index + 1}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 border-slate-300">
          <CardContent className="p-8 text-center">
            <Camera className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No photos yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Use the buttons above to capture or select photos
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      {photos.length === 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-900">📸 Photo Tips</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-blue-800 space-y-1">
            <p>• First photo becomes the proposal cover image</p>
            <p>• Include wide shots and close-ups of problem areas</p>
            <p>• Capture existing conditions for before/after documentation</p>
            <p>• More photos = more accurate AI-generated scope items</p>
          </CardContent>
        </Card>
      )}

      {/* Fixed bottom action button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 safe-area-inset-bottom">
        <Button
          className="w-full h-12 text-base gap-2"
          onClick={handleAnalyzePhotos}
          disabled={uploadedCount === 0 || uploadingCount > 0}
        >
          <Sparkles className="w-5 h-5" />
          Analyze & Select Issues
        </Button>
        {uploadingCount > 0 && (
          <p className="text-xs text-center text-slate-500 mt-2">
            Waiting for {uploadingCount} photo{uploadingCount > 1 ? "s" : ""} to upload...
          </p>
        )}
      </div>
    </div>
  );
}
