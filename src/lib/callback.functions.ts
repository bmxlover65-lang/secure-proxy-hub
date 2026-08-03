import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendSupabaseAuth } from "@/lib/server-function-auth";
import { genSecret, CALLBACK_SELECT } from "./callback.server";

export const listCallbackClients = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("api_clients")
      .select(CALLBACK_SELECT)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { clients: data ?? [] };
  });

export const updateCallbackSettings = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      client_id: z.string().uuid(),
      callback_url: z.string().trim().url().max(500).nullable().optional(),
      callback_enabled: z.boolean().optional(),
      token_ttl_seconds: z.number().int().min(30).max(86400).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch: { callback_url?: string | null; callback_enabled?: boolean; token_ttl_seconds?: number } = {};
    if (data.callback_url !== undefined) patch.callback_url = data.callback_url;
    if (data.callback_enabled !== undefined) patch.callback_enabled = data.callback_enabled;
    if (data.token_ttl_seconds !== undefined) patch.token_ttl_seconds = data.token_ttl_seconds;
    const { error } = await context.supabase.from("api_clients").update(patch).eq("id", data.client_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const regenerateCallbackSecret = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) => z.object({ client_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const callback_secret = genSecret();
    const { error } = await context.supabase
      .from("api_clients").update({ callback_secret }).eq("id", data.client_id);
    if (error) throw new Error(error.message);
    return { callback_secret };
  });

export const listCallbackLogs = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      limit: z.number().int().min(1).max(500).default(200),
      callback_type: z.string().max(40).optional(),
      client_id: z.string().uuid().optional(),
      only_failed: z.boolean().optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("callback_logs")
      .select("id, created_at, client_id, callback_type, external_user_id, token, amount, new_balance, status_code, success, signature_status, error_message, ip_address, host, response_time_ms")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.callback_type) q = q.eq("callback_type", data.callback_type);
    if (data.client_id) q = q.eq("client_id", data.client_id);
    if (data.only_failed) q = q.eq("success", false);
    const { data: logs, error } = await q;
    if (error) throw new Error(error.message);
    return { logs: logs ?? [] };
  });

export const listRecentTokens = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) => z.object({ limit: z.number().int().min(1).max(200).default(50) }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { data: tokens, error } = await context.supabase
      .from("game_tokens")
      .select("id, created_at, client_id, token, external_user_id, expires_at, used_at, ip_address, domain")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return { tokens: tokens ?? [] };
  });