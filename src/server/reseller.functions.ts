import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendSupabaseAuth } from "@/lib/server-function-auth";

function genKey() {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `HAPI_${hex}`;
}

async function getSetting(key: string, fallback: number): Promise<number> {
  const { data } = await supabaseAdmin.from("app_settings").select("value").eq("key", key).maybeSingle();
  if (!data) return fallback;
  const v = data.value;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const getMyOverview = createServerFn({ method: "GET" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const [profile, clients, txs, settings] = await Promise.all([
      supabaseAdmin.from("profiles").select("id,email,full_name,wallet_balance").eq("id", userId).maybeSingle(),
      supabaseAdmin.from("api_clients").select("id,name,api_key,status,category,expires_at,created_at").eq("user_id", userId).order("created_at", { ascending: false }),
      supabaseAdmin.from("coin_transactions").select("id,amount,type,reason,reference,status,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      supabaseAdmin.from("app_settings").select("key,value"),
    ]);
    const settingsMap: Record<string, number> = {};
    (settings.data ?? []).forEach((s) => {
      const n = typeof s.value === "number" ? s.value : Number(s.value);
      if (Number.isFinite(n)) settingsMap[s.key] = n;
    });
    return {
      profile: profile.data,
      clients: clients.data ?? [],
      transactions: txs.data ?? [],
      settings: settingsMap,
    };
  });

export const resellerCreateClient = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      name: z.string().trim().min(1).max(120),
      category: z.enum(["wingo", "k3", "d5", "motorace"]),
      duration_days: z.number().int().min(1).max(3650).default(30),
      allowed_ips: z.array(z.string().trim().min(1).max(64)).max(50).default([]),
      allowed_domains: z.array(z.string().trim().min(1).max(255)).max(50).default([]),
      notes: z.string().max(500).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const cost = await getSetting("coins_per_api_key", 1000);

    // Atomic-ish: rely on adjust_wallet to throw on insufficient_balance
    const { data: balRow, error: bErr } = await supabaseAdmin.rpc("adjust_wallet", {
      _user_id: userId,
      _delta: -cost,
      _type: "api_key_create",
      _reason: `API key creation: ${data.name}`,
      _reference: "",
    });
    if (bErr) {
      if (bErr.message?.includes("insufficient_balance")) throw new Error("Insufficient balance. Please top up your wallet.");
      throw new Error(bErr.message);
    }

    const api_key = genKey();
    const expires_at = new Date(Date.now() + data.duration_days * 86400_000).toISOString();
    const { data: client, error } = await supabaseAdmin
      .from("api_clients")
      .insert({
        name: data.name,
        api_key,
        category: data.category,
        duration_days: data.duration_days,
        expires_at,
        notes: data.notes ?? null,
        user_id: userId,
      })
      .select()
      .single();
    if (error) {
      // Refund on failure
      await supabaseAdmin.rpc("adjust_wallet", {
        _user_id: userId, _delta: cost, _type: "refund",
        _reason: "Refund: API key create failed", _reference: "",
      });
      throw new Error(error.message);
    }

    const ips = data.allowed_ips.map((s) => s.trim()).filter(Boolean);
    if (ips.length > 0) {
      await supabaseAdmin.from("allowed_ips").insert(ips.map((ip) => ({ client_id: client.id, ip_address: ip })));
    }
    const domains = data.allowed_domains.map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (domains.length > 0) {
      await supabaseAdmin.from("allowed_domains").insert(domains.map((dm) => ({ client_id: client.id, domain: dm })));
    }
    return { client, new_balance: balRow as unknown as number, charged: cost };
  });

export const resellerUpdateClient = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      name: z.string().trim().min(1).max(120).optional(),
      status: z.enum(["active", "suspended"]).optional(),
      notes: z.string().max(500).nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: existing } = await supabaseAdmin.from("api_clients").select("user_id").eq("id", data.id).maybeSingle();
    if (!existing || existing.user_id !== context.userId) throw new Error("Not allowed");
    const patch: { name?: string; status?: "active" | "suspended"; notes?: string | null } = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.status !== undefined) patch.status = data.status;
    if (data.notes !== undefined) patch.notes = data.notes;
    const { error } = await supabaseAdmin.from("api_clients").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resellerDeleteClient = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: existing } = await supabaseAdmin.from("api_clients").select("user_id").eq("id", data.id).maybeSingle();
    if (!existing || existing.user_id !== context.userId) throw new Error("Not allowed");
    await supabaseAdmin.from("allowed_ips").delete().eq("client_id", data.id);
    await supabaseAdmin.from("allowed_domains").delete().eq("client_id", data.id);
    const { error } = await supabaseAdmin.from("api_clients").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resellerSetIps = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      client_id: z.string().uuid(),
      ips: z.array(z.string().trim().min(1).max(64)).max(50),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: existing } = await supabaseAdmin.from("api_clients").select("user_id").eq("id", data.client_id).maybeSingle();
    if (!existing || existing.user_id !== context.userId) throw new Error("Not allowed");
    await supabaseAdmin.from("allowed_ips").delete().eq("client_id", data.client_id);
    const rows = data.ips.map((s) => s.trim()).filter(Boolean).map((ip) => ({ client_id: data.client_id, ip_address: ip }));
    if (rows.length > 0) {
      const { error } = await supabaseAdmin.from("allowed_ips").insert(rows);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const resellerSetDomains = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      client_id: z.string().uuid(),
      domains: z.array(z.string().trim().min(1).max(255)).max(50),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: existing } = await supabaseAdmin.from("api_clients").select("user_id").eq("id", data.client_id).maybeSingle();
    if (!existing || existing.user_id !== context.userId) throw new Error("Not allowed");
    await supabaseAdmin.from("allowed_domains").delete().eq("client_id", data.client_id);
    const rows = data.domains.map((s) => s.trim().toLowerCase()).filter(Boolean).map((dm) => ({ client_id: data.client_id, domain: dm }));
    if (rows.length > 0) {
      const { error } = await supabaseAdmin.from("allowed_domains").insert(rows);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const resellerListLogs = createServerFn({ method: "GET" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: clients } = await supabaseAdmin
      .from("api_clients").select("id").eq("user_id", context.userId);
    const ids = (clients ?? []).map((c) => c.id);
    if (ids.length === 0) return { logs: [] };
    const { data: logs } = await supabaseAdmin
      .from("request_logs")
      .select("id,client_id,category,game,status_code,success,error_message,response_time_ms,ip_address,host,created_at")
      .in("client_id", ids)
      .order("created_at", { ascending: false })
      .limit(200);
    return { logs: logs ?? [] };
  });

// --- Admin: list users + balances + activity ---
async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error || !data) throw new Error("Forbidden: admin only");
}

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data: users } = await supabaseAdmin
      .from("profiles")
      .select("id,email,full_name,wallet_balance,created_at")
      .order("created_at", { ascending: false });
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id,role");
    const { data: clientCounts } = await supabaseAdmin.from("api_clients").select("user_id");
    const counts: Record<string, number> = {};
    (clientCounts ?? []).forEach((c) => { if (c.user_id) counts[c.user_id] = (counts[c.user_id] ?? 0) + 1; });
    const roleMap: Record<string, string[]> = {};
    (roles ?? []).forEach((r) => { (roleMap[r.user_id] ??= []).push(r.role); });
    return {
      users: (users ?? []).map((u) => ({
        ...u,
        roles: roleMap[u.id] ?? ["reseller"],
        client_count: counts[u.id] ?? 0,
      })),
    };
  });

export const adminAdjustWallet = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      user_id: z.string().uuid(),
      amount: z.number().refine((n) => n !== 0, "Amount cannot be zero"),
      reason: z.string().max(255).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: bal, error } = await supabaseAdmin.rpc("adjust_wallet", {
      _user_id: data.user_id,
      _delta: data.amount,
      _type: data.amount > 0 ? "admin_credit" : "admin_debit",
      _reason: data.reason ?? "Admin adjustment",
      _reference: `admin:${context.userId}`,
    });
    if (error) throw new Error(error.message);
    return { new_balance: bal as unknown as number };
  });

export const adminListTransactions = createServerFn({ method: "GET" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data: txs } = await supabaseAdmin
      .from("coin_transactions")
      .select("id,user_id,amount,type,reason,reference,status,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id,email,full_name");
    const map: Record<string, { email: string | null; full_name: string | null }> = {};
    (profiles ?? []).forEach((p) => { map[p.id] = { email: p.email, full_name: p.full_name }; });
    return {
      transactions: (txs ?? []).map((t) => ({ ...t, user: map[t.user_id] ?? null })),
    };
  });

export const adminUpdateSettings = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      coins_per_api_key: z.number().int().min(0).max(1_000_000).optional(),
      paise_per_1000_coins: z.number().int().min(0).max(10_000_000).optional(),
      signup_bonus_coins: z.number().int().min(0).max(1_000_000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const upserts = Object.entries(data)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => ({ key: k, value: v as number, updated_at: new Date().toISOString() }));
    if (upserts.length === 0) return { ok: true };
    const { error } = await supabaseAdmin.from("app_settings").upsert(upserts, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getPublicSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin.from("app_settings").select("key,value");
  const out: Record<string, number> = {};
  (data ?? []).forEach((s) => {
    const n = typeof s.value === "number" ? s.value : Number(s.value);
    if (Number.isFinite(n)) out[s.key] = n;
  });
  return out;
});