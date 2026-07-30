import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";


export { supabaseAdmin } from "@/integrations/supabase/client.server";

export type Aggregated = {
  total: number;
  success: number;
  failed: number;
  byDay: { date: string; success: number; failed: number }[];
  byEndpoint: { name: string; count: number }[];
  byCategory: { name: string; value: number }[];
  byStatus: { name: string; count: number }[];
  generatedAt: number;
};


// In-memory cache (per worker instance). Keyed by range+client.

export const CACHE_TTL_MS = 60_000;

export const SLOW_MS = 800;

export const cache = new Map<string, { data: Aggregated; expires: number }>();

export const metrics = {
  hits: 0,
  misses: 0,
  invalidations: 0,
  slowQueries: 0,
  lastQueryMs: 0,
  lastSlowAt: 0 as number | null,
};

