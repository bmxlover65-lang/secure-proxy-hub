import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendSupabaseAuth } from "@/lib/server-function-auth";


export { supabaseAdmin } from "@/integrations/supabase/client.server";

export function genKey() {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `HAPI_${hex}`;
}


export async function getSetting(key: string, fallback: number): Promise<number> {
  const { data } = await supabaseAdmin.from("app_settings").select("value").eq("key", key).maybeSingle();
  if (!data) return fallback;
  const v = data.value;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}


// Per-API-key usage metrics for the signed-in reseller, with optional date range

// Admin: per-user usage metrics with optional date range

// --- Admin: list users + balances + activity ---

export async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error || !data) throw new Error("Forbidden: admin only");
}

