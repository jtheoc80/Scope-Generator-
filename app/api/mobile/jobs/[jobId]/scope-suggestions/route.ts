import { NextRequest } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { storage } from "@/lib/services/storage";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";
import { getRequestId, jsonError, logEvent, withRequestId } from "@/src/lib/mobile/observability";

export const runtime = "nodejs";

type SuggestedLineItem = {
  itemCode: string;
  description: string;
  score: number;
  fromJobs: Array<{ jobId: number; similarity: number; status?: string | null }>;
};

type ScopeSuggestionsOk = {
  ok: true;
  suggestions: SuggestedLineItem[];
  disabled?: boolean;
  reason?: "embeddings_not_configured";
  // Kept for backwards-compat with existing clients/UI
  status?: "ready" | "pending";
};

type ScopeSuggestionsErr = {
  ok: false;
  error: "scope_suggestions_failed";
};

function warnEmbeddingsNotConfiguredOnce(data: { requestId: string; jobId: number; code?: string; message?: string }) {
  const g = globalThis as unknown as { __scopeSuggestionsEmbeddingsWarned?: boolean };
  if (g.__scopeSuggestionsEmbeddingsWarned) return;
  g.__scopeSuggestionsEmbeddingsWarned = true;
  // Single structured warning (avoid stack traces / spam)
  console.warn(
    JSON.stringify({
      level: "warn",
      event: "mobile.scopeSuggestions.embeddings_not_configured",
      ts: new Date().toISOString(),
      requestId: data.requestId,
      jobId: data.jobId,
      pgCode: data.code,
      message: data.message,
    })
  );
}

// GET /api/mobile/jobs/:jobId/scope-suggestions
export async function GET(request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const requestId = getRequestId(request.headers);
  const t0 = Date.now();
  let jobIdNum: number | null = null;
  try {
    // 1. Validate jobId param format FIRST (before auth)
    const { jobId } = await params;
    const id = parseInt(jobId);
    if (Number.isNaN(id)) return jsonError(requestId, 400, "INVALID_INPUT", "Invalid jobId");

    // 2. Check auth AFTER validating jobId format
    const authResult = await requireMobileAuth(request, requestId);
    if (!authResult.ok) return authResult.response;
    jobIdNum = id;

    const job = await storage.getMobileJob(id, authResult.userId);
    if (!job) return jsonError(requestId, 404, "NOT_FOUND", "Job not found");

    const k = Math.max(1, Math.min(10, Number(new URL(request.url).searchParams.get("k") || 5)));

    // 1) Load current job embedding
    // NOTE: Some environments may have an older `job_embeddings` schema without a `model` column.
    // We only need the embedding vector here, so avoid selecting `model` to stay backward-compatible.
    const je = await db.execute<{ embedding: string }>(
      sql`SELECT embedding::text as embedding FROM job_embeddings WHERE job_id = ${id} LIMIT 1`
    );
    const row = je.rows[0];
    if (!row?.embedding) {
      // Embedding isn't available yet (or similarity isn't configured). Treat as non-blocking.
      const body: ScopeSuggestionsOk = { ok: true, status: "ready", suggestions: [] };
      logEvent("mobile.scopeSuggestions.noEmbedding", {
        requestId,
        jobId: id,
        k,
        analysis_duration_ms: Date.now() - t0,
      });
      return withRequestId(requestId, body, 200);
    }

    // 2) Match similar jobs
    const matches = await db.execute<{ job_id: number; similarity: number }>(
      sql`SELECT job_id, similarity FROM match_jobs(${row.embedding}::vector, ${k})`
    );

    const similar = matches.rows.filter((m) => m.job_id !== id && m.similarity > 0);
    if (similar.length === 0) {
      const body: ScopeSuggestionsOk = { ok: true, status: "ready", suggestions: [] };
      logEvent("mobile.scopeSuggestions.noMatches", {
        requestId,
        jobId: id,
        k,
        analysis_duration_ms: Date.now() - t0,
      });
      return withRequestId(requestId, body, 200);
    }

    const similarJobIds = similar.map((m) => m.job_id);
    const idsSql = sql.join(similarJobIds.map((jid) => sql`${jid}`), sql`, `);

    // 3) Outcomes for weighting (won > accepted > sent > other)
    const outcomes = await db.execute<{ job_id: number; status: string | null }>(
      sql`SELECT job_id, status FROM job_outcomes WHERE job_id IN (${idsSql})`
    );
    const outcomeByJob = new Map<number, string>();
    for (const o of outcomes.rows) outcomeByJob.set(o.job_id, o.status || "");

    // 4) Pull final-ish scope line items for those jobs
    const items = await db.execute<{
      job_id: number;
      item_code: string;
      description: string;
      qty: string | null;
      unit: string | null;
      price: string | null;
      source: string;
    }>(
      sql`
        SELECT job_id, item_code, description, qty::text as qty, unit, price::text as price, source
        FROM scope_line_items
        WHERE job_id IN (${idsSql})
          AND source IN ('final', 'sent', 'user', 'ai')
      `
    );

    // 5) Rank + dedupe by item_code
    const scoreByCode = new Map<
      string,
      {
        itemCode: string;
        description: string;
        score: number;
        fromJobs: Array<{ jobId: number; similarity: number; status?: string | null }>;
      }
    >();

    const similarityByJob = new Map<number, number>(similar.map((s) => [s.job_id, s.similarity]));

    const outcomeMultiplier = (status?: string | null) => {
      const s = (status || "").toLowerCase();
      if (s === "won") return 1.5;
      if (s === "accepted") return 1.25;
      if (s === "sent") return 1.1;
      return 1.0;
    };

    for (const it of items.rows) {
      const sim = similarityByJob.get(it.job_id) ?? 0;
      if (sim <= 0) continue;

      const status = outcomeByJob.get(it.job_id) || null;
      const weight = sim * outcomeMultiplier(status);

      const existing = scoreByCode.get(it.item_code);
      if (!existing) {
        scoreByCode.set(it.item_code, {
          itemCode: it.item_code,
          description: it.description,
          score: weight,
          fromJobs: [{ jobId: it.job_id, similarity: sim, status }],
        });
      } else {
        existing.score += weight;
        // Keep the longest description for readability
        if (it.description.length > existing.description.length) existing.description = it.description;
        existing.fromJobs.push({ jobId: it.job_id, similarity: sim, status });
      }
    }

    const suggestions = Array.from(scoreByCode.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    logEvent("mobile.scopeSuggestions.similar.ok", {
      requestId,
      jobId: id,
      k,
      matches: similar.length,
      suggestions: suggestions.length,
      analysis_duration_ms: Date.now() - t0,
    });

    const body: ScopeSuggestionsOk = { ok: true, status: "ready", suggestions };
    return withRequestId(requestId, body, 200);
  } catch (e) {
    const err = e as { code?: string; message?: string };

    // Graceful disable when embeddings table isn't present (optional feature).
    // Postgres: 42P01 = undefined_table
    if (err?.code === "42P01") {
      warnEmbeddingsNotConfiguredOnce({
        requestId,
        jobId: jobIdNum ?? -1,
        code: err.code,
        message: err.message,
      });
      const body: ScopeSuggestionsOk = {
        ok: true,
        suggestions: [],
        disabled: true,
        reason: "embeddings_not_configured",
        status: "ready",
      };
      logEvent("mobile.scopeSuggestions.disabled", {
        requestId,
        jobId: jobIdNum ?? null,
        pgCode: err.code,
        analysis_duration_ms: Date.now() - t0,
      });
      return withRequestId(requestId, body, 200);
    }

    // Unexpected errors: proper 500 and stable error payload
    console.error("mobile.scopeSuggestions.failed", {
      requestId,
      jobId: jobIdNum ?? null,
      message: err?.message ?? String(e),
      code: err?.code,
    });
    const body: ScopeSuggestionsErr = { ok: false, error: "scope_suggestions_failed" };
    return withRequestId(requestId, body, 500);
  }
}

