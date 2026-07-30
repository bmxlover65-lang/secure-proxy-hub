import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendSupabaseAuth } from "@/lib/server-function-auth";

import {
  supabaseAdmin,
  assertAdmin,
  genKey,
  buildUpstreamUrl,
  fetchUpstream,
  SUPPORTED_GAMES,
  type UpstreamType,
} from "./admin.server";

export const adminTestUpstream = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      category: z.string().min(1).max(40),
      game: z.string().min(1).max(10),
      type: z.enum(["period", "history"]).default("period"),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const url = buildUpstreamUrl(data.category, data.game, data.type);
    if (!url) return { ok: false, status: 404, ms: 0, url: "", body: "Unknown category/game" };
    try {
      const { status, body, ms } = await fetchUpstream(url);
      return { ok: status === 200, status, ms, url, body };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "fetch error";
      return { ok: false, status: 0, ms: 0, url, body: msg };
    }
  });


export const adminTestAllUpstreams = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const targets: { category: string; game: string; type: UpstreamType; url: string }[] = [];
    for (const c of SUPPORTED_GAMES) {
      for (const g of c.games) {
        for (const type of ["period", "history"] as UpstreamType[]) {
          const url = buildUpstreamUrl(c.category, g, type);
          if (url) targets.push({ category: c.category, game: g, type, url });
        }
      }
    }
    const results = await Promise.all(
      targets.map(async (t) => {
        try {
          const { status, ms } = await fetchUpstream(t.url);
          return { category: t.category, game: t.game, type: t.type, url: t.url, ok: status === 200, status, ms };
        } catch (e) {
          const msg = e instanceof Error ? e.message : "fetch error";
          return { category: t.category, game: t.game, type: t.type, url: t.url, ok: false, status: 0, ms: 0, error: msg };
        }
      }),
    );
    return { results, checkedAt: new Date().toISOString() };
  });


export const adminCreateClient = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      name: z.string().trim().min(1).max(120),
      category: z.enum(["wingo", "k3", "d5", "motorace"]),
      duration_days: z.number().int().min(1).max(3650),
      allowed_ips: z.array(z.string().trim().min(1).max(64)).max(50).default([]),
      allowed_domains: z.array(z.string().trim().min(1).max(255)).max(50).default([]),
      notes: z.string().max(500).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
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
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const ips = data.allowed_ips.map((s) => s.trim()).filter(Boolean);
    if (ips.length > 0) {
      await supabaseAdmin.from("allowed_ips").insert(
        ips.map((ip) => ({ client_id: client.id, ip_address: ip })),
      );
    }
    const domains = data.allowed_domains.map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (domains.length > 0) {
      await supabaseAdmin.from("allowed_domains").insert(
        domains.map((d) => ({ client_id: client.id, domain: d })),
      );
    }
    return { client };
  });


export const adminUpdateClient = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      name: z.string().trim().min(1).max(120).optional(),
      status: z.enum(["active", "suspended"]).optional(),
      category: z.enum(["wingo", "k3", "d5", "motorace"]).optional(),
      extend_days: z.number().int().min(1).max(3650).optional(),
      notes: z.string().max(500).nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { id, extend_days, name, status, category, notes } = data;
    const patch: {
      name?: string; status?: "active" | "suspended"; category?: string;
      notes?: string | null; expires_at?: string; duration_days?: number;
    } = {};
    if (name !== undefined) patch.name = name;
    if (status !== undefined) patch.status = status;
    if (category !== undefined) patch.category = category;
    if (notes !== undefined) patch.notes = notes;
    if (extend_days) {
      const { data: cur } = await supabaseAdmin
        .from("api_clients").select("expires_at, duration_days").eq("id", id).maybeSingle();
      const base = cur?.expires_at && new Date(cur.expires_at).getTime() > Date.now()
        ? new Date(cur.expires_at).getTime() : Date.now();
      patch.expires_at = new Date(base + extend_days * 86400_000).toISOString();
      patch.duration_days = (cur?.duration_days ?? 0) + extend_days;
    }
    const { error } = await supabaseAdmin.from("api_clients").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export const adminRegenerateKey = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const api_key = genKey();
    const { error } = await supabaseAdmin.from("api_clients").update({ api_key }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { api_key };
  });


export const adminDeleteClient = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    await supabaseAdmin.from("allowed_ips").delete().eq("client_id", data.id);
    await supabaseAdmin.from("allowed_domains").delete().eq("client_id", data.id);
    const { error } = await supabaseAdmin.from("api_clients").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export const adminSetIps = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      client_id: z.string().uuid(),
      ips: z.array(z.string().trim().min(1).max(64)).max(50),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    await supabaseAdmin.from("allowed_ips").delete().eq("client_id", data.client_id);
    const rows = data.ips.map((s) => s.trim()).filter(Boolean).map((ip) => ({ client_id: data.client_id, ip_address: ip }));
    if (rows.length > 0) {
      const { error } = await supabaseAdmin.from("allowed_ips").insert(rows);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });


export const adminSetDomains = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      client_id: z.string().uuid(),
      domains: z.array(z.string().trim().min(1).max(255)).max(50),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    await supabaseAdmin.from("allowed_domains").delete().eq("client_id", data.client_id);
    const rows = data.domains
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .map((domain) => ({ client_id: data.client_id, domain }));
    if (rows.length > 0) {
      const { error } = await supabaseAdmin.from("allowed_domains").insert(rows);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });


export const claimAdminIfNone = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
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

