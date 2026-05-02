import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { buildUpstreamUrl, fetchUpstream } from "./upstream";

async function assertAdmin(supabase: ReturnType<typeof supabaseAdmin.from> extends never ? never : any, userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Forbidden: admin only");
}

// Generate API key
function genKey() {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `RSL_${hex}`;
}

// --- Admin: test upstream live (no auth on upstream, but admin-only call) ---
export const adminTestUpstream = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      category: z.string().min(1).max(40),
      game: z.string().min(1).max(10),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const url = buildUpstreamUrl(data.category, data.game);
    if (!url) return { ok: false, status: 404, ms: 0, url: "", body: "Unknown category/game" };
    try {
      const { status, body, ms } = await fetchUpstream(url);
      return { ok: status === 200, status, ms, url, body };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "fetch error";
      return { ok: false, status: 0, ms: 0, url, body: msg };
    }
  });

// --- Admin: create reseller ---
export const adminCreateReseller = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      name: z.string().trim().min(1).max(120),
      rate_limit_per_minute: z.number().int().min(1).max(100000).default(60),
      allowed_ips: z.array(z.string().trim().min(1).max(64)).max(50).default([]),
      notes: z.string().max(500).optional(),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const api_key = genKey();
    const { data: reseller, error } = await supabaseAdmin
      .from("resellers")
      .insert({
        name: data.name,
        api_key,
        rate_limit_per_minute: data.rate_limit_per_minute,
        notes: data.notes ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (data.allowed_ips.length > 0) {
      await supabaseAdmin
        .from("allowed_ips")
        .insert(
          data.allowed_ips
            .map((ip) => ip.trim())
            .filter(Boolean)
            .map((ip) => ({ reseller_id: reseller.id, ip_address: ip }))
        );
    }
    return { reseller };
  });

// --- Admin: update reseller (status, rate, name, notes) ---
export const adminUpdateReseller = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      name: z.string().trim().min(1).max(120).optional(),
      status: z.enum(["active", "suspended"]).optional(),
      rate_limit_per_minute: z.number().int().min(1).max(100000).optional(),
      notes: z.string().max(500).nullable().optional(),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin.from("resellers").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Admin: regenerate API key ---
export const adminRegenerateKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const api_key = genKey();
    const { error } = await supabaseAdmin.from("resellers").update({ api_key }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { api_key };
  });

// --- Admin: delete reseller ---
export const adminDeleteReseller = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin.from("resellers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Admin: replace IPs ---
export const adminSetIps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      reseller_id: z.string().uuid(),
      ips: z.array(z.string().trim().min(1).max(64)).max(50),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    await supabaseAdmin.from("allowed_ips").delete().eq("reseller_id", data.reseller_id);
    const rows = data.ips.map((ip) => ip.trim()).filter(Boolean).map((ip) => ({ reseller_id: data.reseller_id, ip_address: ip }));
    if (rows.length > 0) {
      const { error } = await supabaseAdmin.from("allowed_ips").insert(rows);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// --- Admin: assign admin role to current user (bootstrap) ---
export const claimAdminIfNone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("role", "admin")
      .limit(1);
    if (existing && existing.length > 0) return { claimed: false };
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { claimed: true };
  });