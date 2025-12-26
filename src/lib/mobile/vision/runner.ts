import { db } from "@/server/db";
import { mobileJobPhotos } from "@shared/schema";
import { eq } from "drizzle-orm";
import { analyzeWithRekognition } from "./rekognition";
import { analyzeWithGptVision, validateFindings } from "./gpt";

function backoffSeconds(attempts: number) {
  const table = [0, 1, 3, 8, 20, 45];
  return table[Math.min(attempts, table.length - 1)] ?? 60;
}

export async function runVisionForPhoto(photo: typeof mobileJobPhotos.$inferSelect) {
  const now = new Date();
  const attempts = photo.findingsAttempts ?? 1;
  const startTime = Date.now();

  // Extract filename/extension from URL for format debugging
  const urlParts = photo.publicUrl.split('/');
  const filename = urlParts[urlParts.length - 1]?.split('?')[0] || 'unknown';
  const extension = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() : 'none';

  console.log("vision.photo.start", {
    photoId: photo.id,
    jobId: photo.jobId,
    publicUrl: photo.publicUrl.substring(0, 80) + "...",
    filename,
    extension,
    attempt: attempts,
  });

  // Early warning for potentially problematic formats
  if (extension && !['jpg', 'jpeg', 'png'].includes(extension)) {
    console.warn("vision.photo.formatWarning", {
      photoId: photo.id,
      extension,
      message: `Image extension '${extension}' may not be supported by Rekognition (requires JPEG/PNG)`,
    });
  }

  try {
    // Run Rekognition and GPT Vision in parallel for speed.
    // IMPORTANT: Do not call Rekognition twice (it was previously called twice per photo).
    const rekPromise = analyzeWithRekognition({ imageUrl: photo.publicUrl });

    const gptPromise = (async () => {
      // Best-effort: use Rekognition labels as hints if they resolve quickly.
      // Never block GPT on Rekognition for long.
      let labelHints: string[] = [];
      try {
        const rekQuick = await Promise.race([
          rekPromise,
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("REKOGNITION_HINT_TIMEOUT")), 800)),
        ]);
        labelHints = rekQuick?.labels?.map((l) => l.name) ?? [];
      } catch {
        // Ignore - GPT can work without hints
      }

      return analyzeWithGptVision({
        imageUrl: photo.publicUrl,
        kind: photo.kind,
        rekognitionLabels: labelHints,
      });
    })();

    const [rekResult, gptResult] = await Promise.allSettled([rekPromise, gptPromise]);

    // Extract results
    let rek: Awaited<ReturnType<typeof analyzeWithRekognition>> | null = null;
    let rekError: string | undefined;
    if (rekResult.status === "fulfilled") {
      rek = rekResult.value;
    } else {
      rekError = rekResult.reason instanceof Error ? rekResult.reason.message : String(rekResult.reason);
      console.warn("vision.rekognition.failed", { photoId: photo.id, error: rekError });
    }

    let gpt: Awaited<ReturnType<typeof analyzeWithGptVision>> | null = null;
    let gptError: string | undefined;
    if (gptResult.status === "fulfilled") {
      gpt = gptResult.value;
    } else {
      gptError = gptResult.reason instanceof Error ? gptResult.reason.message : String(gptResult.reason);
      console.warn("vision.gpt.failed", { photoId: photo.id, error: gptError });
    }

    const labelNames = rek?.labels?.map((l) => l.name) ?? [];

    // We need at least one AI provider to succeed
    if (!rek && !gpt) {
      // Provide detailed error for debugging "no summary" issues
      const errorDetails = {
        rekognitionError: rekError || "unknown",
        gptError: gptError || "unknown",
        photoId: photo.id,
        imageUrl: photo.publicUrl.substring(0, 80),
      };
      console.error("vision.photo.allProvidersFailed", errorDetails);
      
      // Surface specific, actionable error messages
      let userMessage = "VISION_FAILED";
      if (rekError?.includes("FORMAT_ERROR")) {
        userMessage = "IMAGE_FORMAT_ERROR: Image must be JPEG or PNG (HEIC/WebP not supported by Rekognition)";
      } else if (gptError?.includes("API_KEY")) {
        userMessage = "CONFIG_ERROR: OpenAI API key not configured";
      } else if (rekError?.includes("credentials") || rekError?.includes("Access")) {
        userMessage = "CONFIG_ERROR: AWS credentials invalid or missing";
      }
      
      throw new Error(`${userMessage}: rekognition=${rekError || "unknown"} gpt=${gptError || "unknown"}`);
    }

    console.log("vision.photo.analyzed", {
      photoId: photo.id,
      hasRekognition: !!rek,
      hasGpt: !!gpt,
      rekLabels: labelNames.slice(0, 5),
      gptDamage: gpt?.damage?.slice(0, 3),
      gptIssues: gpt?.issues?.slice(0, 3),
      durationMs: Date.now() - startTime,
    });

    const findings = validateFindings({
      version: "v1",
      imageUrl: photo.publicUrl,
      kind: photo.kind,
      detector: rek
        ? { status: "ready", result: rek }
        : { status: "failed", error: rekError || "REKOGNITION_FAILED" },
      llm: gpt
        ? { status: "ready", result: { ...gpt, provider: "openai" } }
        : { status: "failed", error: gptError || "GPT_VISION_FAILED" },
      combined: {
        confidence: Math.max(0, Math.min(1, ((gpt?.confidence ?? 0.5) * 0.9) + 0.1)),
        summaryLabels: Array.from(new Set([...(gpt?.labels || []), ...labelNames.slice(0, 5)])).slice(0, 10),
        needsMorePhotos: gpt?.needsMorePhotos || [],
      },
    });

    await db
      .update(mobileJobPhotos)
      .set({
        findings,
        findingsStatus: "ready",
        findingsError: null,
        analyzedAt: now,
        findingsLockedBy: null,
        findingsLockedAt: null,
      })
      .where(eq(mobileJobPhotos.id, photo.id));

    return { success: true, photoId: photo.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const next = new Date(Date.now() + backoffSeconds(attempts) * 1000);

    await db
      .update(mobileJobPhotos)
      .set({
        findingsStatus: attempts >= 5 ? "failed" : "pending",
        findingsError: msg,
        findingsNextAttemptAt: attempts >= 5 ? null : next,
        findingsLockedBy: null,
        findingsLockedAt: null,
      })
      .where(eq(mobileJobPhotos.id, photo.id));

    return { success: false, photoId: photo.id, error: msg };
  }
}
