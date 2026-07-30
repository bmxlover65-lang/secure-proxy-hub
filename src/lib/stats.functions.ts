import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "./stats.server";
import { CACHE_TTL_MS, SLOW_MS, cache, metrics } from "./stats.server";
import type { Aggregated } from "./stats.server";

export const getStats = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        days: z.number().int().min(1).max(90),
        clientId: z.string().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const days = data.days;
    const clientId = data.clientId ?? null;
    const key = `${days}:${clientId ?? "all"}`;
    const now = Date.now();
    const hit = cache.get(key);
    if (hit && hit.expires > now) {
      metrics.hits++;
      return hit.data;
    }
    metrics.misses++;

    const since = new Date(now - days * 86_400_000).toISOString();
    const t0 = Date.now();
    let q = supabaseAdmin
      .from("request_logs")
      .select("created_at, category, game, status_code, success, endpoint")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(10_000);
    if (clientId) q = q.eq("client_id", clientId);
    const { data: rows, error } = await q;
    const elapsed = Date.now() - t0;
    metrics.lastQueryMs = elapsed;
    if (elapsed > SLOW_MS) {
      metrics.slowQueries++;
      metrics.lastSlowAt = Date.now();
    }
    if (error) throw new Error(error.message);

    const dayMap = new Map<string, { date: string; success: number; failed: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * 86_400_000).toISOString().slice(0, 10);
      dayMap.set(d, { date: d.slice(5), success: 0, failed: 0 });
    }
    const epMap = new Map<string, number>();
    const catMap = new Map<string, number>();
    const stMap = new Map<string, number>();
    let total = 0, success = 0;

    for (const r of rows ?? []) {
      total++;
      if (r.success) success++;
      const k = (r.created_at as string).slice(0, 10);
      const dv = dayMap.get(k);
      if (dv) { if (r.success) dv.success++; else dv.failed++; }
      const ep = r.endpoint || `${r.category}/${r.game}`;
      epMap.set(ep, (epMap.get(ep) ?? 0) + 1);
      const cat = r.category || "unknown";
      catMap.set(cat, (catMap.get(cat) ?? 0) + 1);
      const sc = r.status_code ?? 0;
      const sk = sc === 0 ? "n/a" : `${Math.floor(sc / 100)}xx`;
      stMap.set(sk, (stMap.get(sk) ?? 0) + 1);
    }

    const result: Aggregated = {
      total,
      success,
      failed: total - success,
      byDay: Array.from(dayMap.values()),
      byEndpoint: Array.from(epMap, ([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count).slice(0, 10),
      byCategory: Array.from(catMap, ([name, value]) => ({ name, value })),
      byStatus: Array.from(stMap, ([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      generatedAt: now,
    };
    cache.set(key, { data: result, expires: now + CACHE_TTL_MS });
    return result;
  });


export const invalidateStatsCache = createServerFn({ method: "POST" }).handler(async () => {
  const size = cache.size;
  cache.clear();
  metrics.invalidations++;
  return { cleared: size };
});


export const getStatsCacheMetrics = createServerFn({ method: "GET" }).handler(async () => {
  const now = Date.now();
  const entries = Array.from(cache.entries()).map(([key, v]) => ({
    key,
    ttlMs: Math.max(0, v.expires - now),
    total: v.data.total,
  }));
  const total = metrics.hits + metrics.misses;
  return {
    ...metrics,
    hitRate: total ? Math.round((metrics.hits / total) * 100) : 0,
    entries,
    ttlMs: CACHE_TTL_MS,
    slowThresholdMs: SLOW_MS,
  };
});
