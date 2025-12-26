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

  console.log("vision.photo.start", {
    photoId: photo.id,
    jobId: photo.jobId,
    publicUrl: photo.publicUrl.substring(0, 80) + "...",
    attempt: attempts,
  });

  try {
    // Step 1: Run Rekognition first (fast, ~1-2s)
    let rek: Awaited<ReturnType<typeof analyzeWithRekognition>> | null = null;
    let rekError: string | undefined;
    try {
      rek = await analyzeWithRekognition({ imageUrl: photo.publicUrl });
      console.log("vision.rekognition.success", {
        photoId: photo.id,
        labelsCount: rek.labels.length,
        topLabels: rek.labels.slice(0, 3).map(l => l.name),
      });
    } catch (e) {
      rekError = e instanceof Error ? e.message : String(e);
      console.warn("vision.rekognition.failed", { photoId: photo.id, error: rekError });
    }

    const labelNames = rek?.labels?.map((l) => l.name) ?? [];

    // Step 2: Run GPT Vision (slower, ~3-8s) - use Rekognition labels as hints
    let gpt: Awaited<ReturnType<typeof analyzeWithGptVision>> | null = null;
    let gptError: string | undefined;
    try {
      gpt = await analyzeWithGptVision({
        imageUrl: photo.publicUrl,
        kind: photo.kind,
        rekognitionLabels: labelNames,
      });
      console.log("vision.gpt.success", {
        photoId: photo.id,
        confidence: gpt.confidence,
        damageCount: gpt.damage?.length ?? 0,
        issuesCount: gpt.issues?.length ?? 0,
      });
    } catch (e) {
      gptError = e instanceof Error ? e.message : String(e);
      console.warn("vision.gpt.failed", { photoId: photo.id, error: gptError });
    }

    // We need at least one AI provider to succeed
    if (!rek && !gpt) {
      throw new Error(`VISION_FAILED: rekognition=${rekError || "unknown"} gpt=${gptError || "unknown"}`);
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
