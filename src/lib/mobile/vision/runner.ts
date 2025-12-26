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
    // Run Rekognition and GPT Vision in parallel for speed
    const [rekResult, gptResult] = await Promise.allSettled([
      analyzeWithRekognition({ imageUrl: photo.publicUrl }),
      // Start GPT immediately - we'll pass empty labels if Rekognition fails
      (async () => {
        // Give Rekognition a small head start (500ms) to get labels as hints
        await new Promise(r => setTimeout(r, 500));
        // Try to get Rekognition result for hints (best-effort)
        let labelHints: string[] = [];
        try {
          const rekQuick = await analyzeWithRekognition({ imageUrl: photo.publicUrl });
          labelHints = rekQuick?.labels?.map(l => l.name) ?? [];
        } catch {
          // Ignore - GPT can work without hints
        }
        return analyzeWithGptVision({
          imageUrl: photo.publicUrl,
          kind: photo.kind,
          rekognitionLabels: labelHints,
        });
      })(),
    ]);

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
