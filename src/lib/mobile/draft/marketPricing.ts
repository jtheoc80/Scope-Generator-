import { db } from "@/server/db";
import { onebuildPriceCache } from "@shared/schema";
import { and, desc, eq, gt } from "drizzle-orm";
import { oneBuildService } from "@/lib/services/onebuild";

export function extractZip(address?: string | null) {
  if (!address) return null;
  const m = address.match(/\b(\d{5})(?:-\d{4})?\b/);
  return m ? m[1] : null;
}

export type OneBuildTradePricing = Awaited<ReturnType<typeof oneBuildService.getTradePricing>> & {
  _meta: {
    zipcode: string;
    location?: string;
    fetchedAt: string;
    source: "cache" | "live";
  };
};

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("ONEBUILD_TIMEOUT")), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

export async function getOneBuildTradePricingBestEffort(params: {
  tradeId: string;
  zipcode: string;
  ttlHours?: number;
  timeoutMs?: number;
}): Promise<OneBuildTradePricing | null> {
  const now = new Date();
  const ttlHours = params.ttlHours ?? 24 * 7;

  // Prefer unexpired cache
  const [cached] = await db
    .select()
    .from(onebuildPriceCache)
    .where(
      and(
        eq(onebuildPriceCache.tradeId, params.tradeId),
        eq(onebuildPriceCache.zipcode, params.zipcode),
        gt(onebuildPriceCache.expiresAt, now)
      )
    )
    .orderBy(desc(onebuildPriceCache.fetchedAt))
    .limit(1);

  if (cached) {
    return {
      ...(cached.payload as any),
      _meta: {
        zipcode: params.zipcode,
        location: cached.location ?? undefined,
        fetchedAt: cached.fetchedAt.toISOString(),
        source: "cache",
      },
    };
  }

  if (!oneBuildService.isConfigured()) return null;

  try {
    const timeoutMs = params.timeoutMs ?? 1500;
    const live = await withTimeout(oneBuildService.getTradePricing(params.tradeId, params.zipcode), timeoutMs);

    const payload = {
      materials: live.materials,
      labor: live.labor,
    };

    const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

    await db.insert(onebuildPriceCache).values({
      tradeId: params.tradeId,
      zipcode: params.zipcode,
      payload,
      location: params.zipcode,
      fetchedAt: now,
      expiresAt,
    } as typeof onebuildPriceCache.$inferInsert);

    return {
      ...payload,
      _meta: {
        zipcode: params.zipcode,
        location: params.zipcode,
        fetchedAt: now.toISOString(),
        source: "live",
      },
    };
  } catch {
    // Non-blocking: just skip
    return null;
  }
}

export function marketMultiplierFromOneBuild(tradeId: string, onebuild: OneBuildTradePricing | null) {
  if (!onebuild?.labor?.length) return { multiplier: 1, basis: "none" as const };

  const avg = onebuild.labor.reduce((s, l) => s + (l.hourlyRate || 0), 0) / onebuild.labor.length;

  // Conservative baselines (heuristic). Used only as a gentle nudge + confidence signal.
  const baselineByTrade: Record<string, number> = {
    bathroom: 85,
    kitchen: 90,
    roofing: 65,
    plumbing: 95,
    electrical: 105,
    hvac: 110,
    painting: 55,
    flooring: 70,
    drywall: 60,
  };

  const baseline = baselineByTrade[tradeId] ?? 85;
  const raw = baseline > 0 ? avg / baseline : 1;

  // Clamp to avoid surprising quotes.
  const multiplier = Math.max(0.9, Math.min(1.15, raw));
  return { multiplier, basis: "labor" as const };
}
