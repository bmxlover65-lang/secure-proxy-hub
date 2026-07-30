import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendSupabaseAuth } from "@/lib/server-function-auth";
import { getRequestHost } from "@tanstack/react-start/server";
import type { Json } from "@/integrations/supabase/types";


export { supabaseAdmin } from "@/integrations/supabase/client.server";

export const BONDPAY_CREATE_URL = "https://api.bond-pays.com/v1/create";


export function md5(s: string) {
  return createHash("md5").update(s).digest("hex");
}


export async function getPaisePer1000(): Promise<number> {
  const { data } = await supabaseAdmin.from("app_settings").select("value").eq("key", "paise_per_1000_coins").maybeSingle();
  const v = data?.value;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : 2000;
}


export async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error || !data) throw new Error("Forbidden: admin only");
}

