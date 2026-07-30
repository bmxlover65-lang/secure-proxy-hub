import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendSupabaseAuth } from "@/lib/server-function-auth";
import { buildUpstreamUrl, fetchUpstream, SUPPORTED_GAMES, type UpstreamType } from "@/server/upstream";


export { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Forbidden: admin only");
}


export function genKey() {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `HAPI_${hex}`;
}


// --- Admin: test single upstream live ---

// --- Admin: test all upstream endpoints ---

// --- API client CRUD ---

// --- Bootstrap: claim admin if none exists yet ---
