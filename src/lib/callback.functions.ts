import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendSupabaseAuth } from "@/lib/server-function-auth";
import { genSecret, CALLBACK_SELECT } from "./callback.server";

const OP_ENUM = z.enum(["token", "GetBalance", "PlaceBet", "WinLoss"]);
const TEST_OPS = ["GetBalance", "PlaceBet", "WinLoss"] as const;

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
/* ============================ Whitelist (ACL) ============================ */

/** Domains + IPs whitelisted for one callback key, including per-operation scope. */
export const listCallbackAcl = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) => z.object({ client_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [doms, ips] = await Promise.all([
      context.supabase
        .from("allowed_domains")
        .select("id, domain, label, op, created_at")
        .eq("client_id", data.client_id)
        .order("created_at", { ascending: true }),
      context.supabase
        .from("allowed_ips")
        .select("id, ip_address, label, op, created_at")
        .eq("client_id", data.client_id)
        .order("created_at", { ascending: true }),
    ]);
    if (doms.error) throw new Error(doms.error.message);
    if (ips.error) throw new Error(ips.error.message);
    return { domains: doms.data ?? [], ips: ips.data ?? [] };
  });

export const addCallbackAclEntry = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      client_id: z.string().uuid(),
      kind: z.enum(["domain", "ip"]),
      value: z.string().trim().min(1).max(255),
      op: OP_ENUM.nullable().optional(),
      label: z.string().trim().max(80).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const op = data.op ?? null;
    const label = data.label?.trim() ? data.label.trim() : null;
    const table = data.kind === "domain" ? "allowed_domains" : "allowed_ips";
    const row =
      data.kind === "domain"
        ? { client_id: data.client_id, domain: data.value.toLowerCase().replace(/^https?:\/\//, "").split("/")[0], label, op }
        : { client_id: data.client_id, ip_address: data.value, label, op };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await context.supabase.from(table).insert(row as any);
    if (error) {
      // 23505 = unique violation: this domain/IP is already whitelisted for the key.
      if (error.code === "23505") {
        const { error: updErr } = data.kind === "domain"
          ? await context.supabase
              .from("allowed_domains")
              .update({ label, op })
              .eq("client_id", data.client_id)
              .eq("domain", (row as { domain: string }).domain)
          : await context.supabase
              .from("allowed_ips")
              .update({ label, op })
              .eq("client_id", data.client_id)
              .eq("ip_address", data.value);
        if (updErr) throw new Error(updErr.message);
        return { ok: true, duplicate: true };
      }
      throw new Error(error.message);
    }
    return { ok: true, duplicate: false };
  });

export const removeCallbackAclEntry = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), kind: z.enum(["domain", "ip"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const table = data.kind === "domain" ? "allowed_domains" : "allowed_ips";
    const { error } = await context.supabase.from(table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ========================= Integration dry-run test ===================== */

/**
 * Sends a signed dry-run GetBalance / PlaceBet / WinLoss call to the key's
 * callback URL. Amounts are 0 and `dry_run: true` is set, so nothing is
 * credited or debited. The attempt is written to callback_logs as `Test:<op>`.
 */
export const runIntegrationTest = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      client_id: z.string().uuid(),
      callback_type: z.enum(TEST_OPS),
      user_id: z.string().trim().min(1).max(64).default("test-user"),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: client, error } = await context.supabase
      .from("api_clients")
      .select("id, name, mode, status, callback_url, callback_secret, callback_enabled, cb_getbalance, cb_placebet, cb_winloss")
      .eq("id", data.client_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!client) throw new Error("API key not found or not yours");

    const { hmacHex, logCallback } = await import("@/server/callback");
    const started = Date.now();

    const finish = async (status: number, ok: boolean, msg: string | null, resp?: unknown) => {
      await logCallback({
        client_id: client.id,
        callback_type: `Test:${data.callback_type}`,
        external_user_id: data.user_id,
        amount: 0,
        status_code: status,
        success: ok,
        signature_status: client.callback_secret ? "valid" : "unconfigured",
        error_message: msg,
        host: "admin-panel",
        ip_address: "internal",
        response_time_ms: Date.now() - started,
        response_payload: resp ?? null,
      });
      return { ok, status, message: msg ?? "ok", response: resp ?? null, at: new Date().toISOString() };
    };

    if (client.mode !== "callback" || !client.callback_enabled) {
      return finish(403, false, "Callback mode is disabled for this key");
    }
    if (client.status !== "active") return finish(403, false, "Key is not active");
    if (!client.callback_url) return finish(400, false, "No callback URL configured");
    if (!client.callback_secret) return finish(400, false, "No HMAC secret generated");
    const opFlag =
      data.callback_type === "GetBalance" ? client.cb_getbalance
      : data.callback_type === "PlaceBet" ? client.cb_placebet
      : client.cb_winloss;
    if (opFlag === false) return finish(403, false, `${data.callback_type} is disabled for this key`);

    const payload = {
      callback_type: data.callback_type,
      user_id: data.user_id,
      amount: 0,
      dry_run: true,
      bet_details: data.callback_type === "PlaceBet" ? { dry_run: true } : null,
      win_details: data.callback_type === "WinLoss" ? { dry_run: true } : null,
      ts: Math.floor(Date.now() / 1000),
    };
    const raw = JSON.stringify(payload);
    const signature = await hmacHex(client.callback_secret, raw);

    try {
      const res = await fetch(client.callback_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Signature": signature,
          "X-Hyper-Timestamp": String(payload.ts),
          "X-Hyper-Dry-Run": "1",
        },
        body: raw,
      });
      const text = await res.text();
      let parsed: unknown;
      try { parsed = JSON.parse(text); } catch { parsed = { raw: text.slice(0, 1500) }; }
      const p = (parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {});
      const balance = p.new_balance ?? p.balance ?? null;
      const ok = res.status === 200 && (p.status === "success" || p.code === 0 || balance !== null);
      return finish(
        res.status,
        ok,
        ok ? null : String(p.message ?? p.msg ?? `Upstream status ${res.status}`),
        parsed,
      );
    } catch (e) {
      return finish(502, false, `Callback unreachable: ${e instanceof Error ? e.message : "fetch failed"}`);
    }
  });

/** Latest dry-run result per key + operation, taken from callback_logs. */
export const listIntegrationTests = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("callback_logs")
      .select("id, created_at, client_id, callback_type, success, status_code, error_message, response_time_ms")
      .like("callback_type", "Test:%")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const latest: Record<string, NonNullable<typeof data>[number]> = {};
    for (const row of data ?? []) {
      const key = `${row.client_id}|${row.callback_type}`;
      if (!latest[key]) latest[key] = row;
    }
    return { tests: Object.values(latest) };
  });

/* ===================== Token flow logs (issue / enter / validate) ======== */

const TOKEN_FLOW_TYPES = ["TokenIssue", "TokenEnter", "TokenValidate"] as const;

/** Short non-reversible fingerprint so tokens are traceable but never displayed raw. */
async function tokenHash(token: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

export const listTokenFlowLogs = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      limit: z.number().int().min(1).max(500).default(150),
      flow: z.enum(["all", "TokenIssue", "TokenEnter", "TokenValidate"]).default("all"),
      status: z.enum(["all", "allowed", "blocked"]).default("all"),
      external_user_id: z.string().trim().max(64).optional(),
      client_id: z.string().uuid().optional(),
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("callback_logs")
      .select("id, created_at, client_id, callback_type, external_user_id, token, status_code, success, signature_status, error_message, ip_address, host, response_time_ms")
      .in("callback_type", data.flow === "all" ? [...TOKEN_FLOW_TYPES] : [data.flow])
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.status === "allowed") q = q.eq("success", true);
    if (data.status === "blocked") q = q.eq("success", false);
    if (data.client_id) q = q.eq("client_id", data.client_id);
    if (data.external_user_id) q = q.ilike("external_user_id", `%${data.external_user_id}%`);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const logs = await Promise.all(
      (rows ?? []).map(async (r) => ({
        id: r.id,
        created_at: r.created_at,
        client_id: r.client_id,
        flow: r.callback_type,
        external_user_id: r.external_user_id,
        token_hash: r.token ? await tokenHash(r.token) : null,
        status_code: r.status_code,
        allowed: r.success,
        reason: r.success ? "allowed" : (r.error_message || `blocked (${r.status_code})`),
        signature_status: r.signature_status,
        ip_address: r.ip_address,
        host: r.host,
        response_time_ms: r.response_time_ms,
      })),
    );
    return { logs };
  });
