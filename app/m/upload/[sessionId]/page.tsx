"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Camera,
  ImagePlus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Upload,
  X,
} from "lucide-react";

interface SessionInfo {
  valid: boolean;
  error?: string;
  jobId?: number;
  jobInfo?: {
    clientName: string;
    address: string;
    tradeName: string | null;
    jobTypeName: string;
  };
  expiresAt?: string;
  remainingMinutes?: number;
}

interface UploadedPhoto {
  id: string;
  localUrl: string;
  status: "pending" | "uploading" | "uploaded" | "error";
  error?: string;
  remoteId?: number;
}

/**
 * Convert any image file to JPEG format.
 * This is critical because AWS Rekognition only supports JPEG/PNG.
 * iPhones often capture photos as HEIC/HEIF which will cause Rekognition to fail.
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

export default function MobileUploadPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const token = searchParams.get("token") || "";

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => `photo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  // Validate session on mount
  useEffect(() => {
    async function validateSession() {
      try {
        const response = await fetch(
          `/api/photo-sessions/${sessionId}?token=${encodeURIComponent(token)}`
        );
        const data: SessionInfo = await response.json();
        setSessionInfo(data);
      } catch {
        setSessionInfo({
          valid: false,
          error: "Failed to validate session. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    }

    if (sessionId && token) {
      validateSession();
    } else {
      setSessionInfo({
        valid: false,
        error: "Missing session ID or token. Please scan the QR code again.",
      });
      setLoading(false);
    }
  }, [sessionId, token]);

  // Upload a single photo
  const uploadPhoto = useCallback(
    async (photo: UploadedPhoto, file: File) => {
      try {
        // Update status to uploading
        setPhotos((prev) =>
          prev.map((p) => (p.id === photo.id ? { ...p, status: "uploading" as const } : p))
        );
        setUploadingCount((c) => c + 1);

        // Create form data
        const formData = new FormData();
        formData.append("token", token);
        formData.append("files", file, file.name);

        // Upload via API
        const response = await fetch(`/api/photo-sessions/${sessionId}/upload`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Upload failed");
        }

        // Update status to uploaded
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id
              ? {
                  ...p,
                  status: "uploaded" as const,
                  remoteId: data.uploadedPhotos?.[0]?.id,
                }
              : p
          )
        );
      } catch (e) {
        // Update status to error
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id
              ? {
                  ...p,
                  status: "error" as const,
                  error: e instanceof Error ? e.message : "Upload failed",
                }
              : p
          )
        );
      } finally {
        setUploadingCount((c) => Math.max(0, c - 1));
      }
    },
    [sessionId, token]
  );

  // Handle file selection
  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const newPhotos: UploadedPhoto[] = [];
      const filesToUpload: { photo: UploadedPhoto; file: File }[] = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;

        // Convert to JPEG for compatibility
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
    },
    [uploadPhoto]
  );

  // Remove a photo (only local - can't remove from server)
  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo?.localUrl.startsWith("blob:")) {
        URL.revokeObjectURL(photo.localUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-slate-600">Validating upload link...</p>
        </div>
      </div>
    );
  }

  // Invalid/expired session
  if (!sessionInfo?.valid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto" />
            <h1 className="text-xl font-semibold text-slate-900">
              {sessionInfo?.error?.includes("expired") ? "Link Expired" : "Invalid Link"}
            </h1>
            <p className="text-slate-600">
              {sessionInfo?.error || "This upload link is no longer valid."}
            </p>
            <div className="pt-4 text-sm text-slate-500">
              <p>Ask the desktop user to generate a new QR code.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const uploadedCount = photos.filter((p) => p.status === "uploaded").length;
  const errorCount = photos.filter((p) => p.status === "error").length;

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
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
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-semibold text-slate-900">Upload Photos</h1>
          {sessionInfo.jobInfo && (
            <p className="text-sm text-slate-600 truncate">
              {sessionInfo.jobInfo.jobTypeName} - {sessionInfo.jobInfo.clientName}
            </p>
          )}
          {sessionInfo.remainingMinutes !== undefined && (
            <p className="text-xs text-slate-500 mt-1">
              Link expires in {sessionInfo.remainingMinutes} minutes
            </p>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Upload buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="default"
            className="h-24 flex-col gap-2"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="w-8 h-8" />
            <span>Take Photo</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => galleryInputRef.current?.click()}
          >
            <ImagePlus className="w-8 h-8" />
            <span>Choose from Library</span>
          </Button>
        </div>

        {/* Upload status */}
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
                      <div className="bg-green-500 rounded-full p-1">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}

                  {photo.status === "error" && (
                    <div className="absolute inset-0 bg-red-500/80 flex flex-col items-center justify-center p-2 text-white text-center">
                      <AlertCircle className="w-6 h-6 mb-1" />
                      <p className="text-xs">{photo.error}</p>
                    </div>
                  )}

                  {/* Remove button - only for pending/error */}
                  {(photo.status === "pending" || photo.status === "error") && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => removePhoto(photo.id)}
                    >
                      <X className="w-4 h-4" />
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
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No photos yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Tap the buttons above to add photos
              </p>
            </CardContent>
          </Card>
        )}

        {/* Success message */}
        {uploadedCount > 0 && uploadingCount === 0 && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-medium">
                {uploadedCount} photo{uploadedCount !== 1 ? "s" : ""} uploaded successfully!
              </p>
              <p className="text-sm text-green-700 mt-1">
                Photos will appear on the desktop automatically.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-900">Tips</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-blue-800 space-y-1">
            <p>Use &quot;Take Photo&quot; for new photos from your camera.</p>
            <p>Use &quot;Choose from Library&quot; to upload existing photos.</p>
            <p>All photos will be synced to the job on your desktop.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
