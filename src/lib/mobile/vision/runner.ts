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
    // Run Rekognition and GPT in parallel
    // We pass empty rekognition labels to GPT initially to avoid waiting
    // The findings combination logic later will still merge both results if available

    const rekPromise = analyzeWithRekognition({ imageUrl: photo.publicUrl })
      .then(res => ({ result: res, error: undefined }))
      .catch(e => ({ result: null, error: e instanceof Error ? e.message : String(e) }));

    const gptPromise = analyzeWithGptVision({
        imageUrl: photo.publicUrl,
        kind: photo.kind,
        rekognitionLabels: [], // Don't wait for Rekognition hints
      })
      .then(res => ({ result: res, error: undefined }))
      .catch(e => ({ result: null, error: e instanceof Error ? e.message : String(e) }));

    const [rekOutcome, gptOutcome] = await Promise.all([rekPromise, gptPromise]);

    const rek = rekOutcome.result;
    const rekError = rekOutcome.error;
    const gpt = gptOutcome.result;
    const gptError = gptOutcome.error;

    if (!rek && !gpt) {
      throw new Error(`VISION_FAILED: rekognition=${rekError || "unknown"} gpt=${gptError || "unknown"}`);
    }

    const labelNames = rek?.labels?.map((l) => l.name) ?? [];

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
