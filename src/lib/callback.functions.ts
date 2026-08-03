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
      mode: z.enum(["data", "callback"]).optional(),
      cb_getbalance: z.boolean().optional(),
      cb_placebet: z.boolean().optional(),
      cb_winloss: z.boolean().optional(),
      cb_token: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { client_id, ...rest } = data;
    const patch: Record<string, string | boolean | number | null> = {};
    for (const [k, v] of Object.entries(rest)) if (v !== undefined) patch[k] = v;
    // Turning on callback mode implies the key belongs to the callback system.
    if (rest.callback_enabled === true && rest.mode === undefined) patch.mode = "callback";
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await context.supabase
      .from("api_clients")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(patch as any)
      .eq("id", client_id);
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
      external_user_id: z.string().trim().max(64).optional(),
      status: z.enum(["all", "success", "failed"]).optional(),
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
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
    if (data.only_failed || data.status === "failed") q = q.eq("success", false);
    else if (data.status === "success") q = q.eq("success", true);
    if (data.external_user_id) q = q.ilike("external_user_id", `%${data.external_user_id}%`);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    const { data: logs, error } = await q;
    if (error) throw new Error(error.message);
    return { logs: logs ?? [] };
  });

export const listRecentTokens = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      limit: z.number().int().min(1).max(200).default(50),
      external_user_id: z.string().trim().max(64).optional(),
      state: z.enum(["all", "active", "used", "expired", "replayed"]).optional(),
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const nowIso = new Date().toISOString();
    let q = context.supabase
      .from("game_tokens")
      .select("id, created_at, client_id, token, external_user_id, expires_at, used_at, ip_address, domain, replay_count, expired_hits, last_attempt_at, used_ip, used_domain")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.external_user_id) q = q.ilike("external_user_id", `%${data.external_user_id}%`);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    if (data.state === "used") q = q.not("used_at", "is", null);
    if (data.state === "active") q = q.is("used_at", null).gt("expires_at", nowIso);
    if (data.state === "expired") q = q.is("used_at", null).lte("expires_at", nowIso);
    if (data.state === "replayed") q = q.gt("replay_count", 0);
    const { data: tokens, error } = await q;
    if (error) throw new Error(error.message);
    return { tokens: tokens ?? [] };
  });

export const getTokenStats = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("token_stats", {
      ...(data.from ? { _from: data.from } : {}),
      ...(data.to ? { _to: data.to } : {}),
    });
    if (error) throw new Error(error.message);
    const s = (rows ?? [])[0];
    return {
      stats: {
        total: Number(s?.total ?? 0),
        active: Number(s?.active ?? 0),
        used: Number(s?.used ?? 0),
        expired: Number(s?.expired ?? 0),
        replay_blocked: Number(s?.replay_blocked ?? 0),
        expired_hits: Number(s?.expired_hits ?? 0),
      },
    };
  });