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

  try {
    // Run Rekognition
    let rek: Awaited<ReturnType<typeof analyzeWithRekognition>> | null = null;
    let rekError: string | undefined;
    try {
      rek = await analyzeWithRekognition({ imageUrl: photo.publicUrl });
    } catch (e) {
      rekError = e instanceof Error ? e.message : String(e);
    }

    const labelNames = rek?.labels?.map((l) => l.name) ?? [];

    // Run GPT Vision
    // Note: We use Rekognition labels as hints for GPT, so we run them sequentially.
    // However, if we wanted to speed this up further, we could run them in parallel
    // and drop the hint dependency, or optimistically start GPT.
    // For now, we keep the hint but we will parallelize the *processing of multiple photos*
    // at the API level.
    let gpt: Awaited<ReturnType<typeof analyzeWithGptVision>> | null = null;
    let gptError: string | undefined;
    try {
      gpt = await analyzeWithGptVision({
        imageUrl: photo.publicUrl,
        kind: photo.kind,
        rekognitionLabels: labelNames,
      });
    } catch (e) {
      gptError = e instanceof Error ? e.message : String(e);
    }

    if (!rek && !gpt) {
      throw new Error(`VISION_FAILED: rekognition=${rekError || "unknown"} gpt=${gptError || "unknown"}`);
    }

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
