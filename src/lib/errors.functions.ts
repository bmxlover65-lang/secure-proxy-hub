import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendSupabaseAuth } from "@/lib/server-function-auth";

export type Payload = Record<string, unknown> | null;

export type ErrorEntry = {
  id: string;
  created_at: string;
  source: "callback" | "request";
  client_id: string | null;
  client_name: string | null;
  kind: string;
  status_code: number | null;
  message: string;
  signature_status: string | null;
  ip_address: string | null;
  host: string | null;
  external_user_id: string | null;
  response_time_ms: number | null;
  request_payload: Payload;
  response_payload: Payload;
};

/**
 * Unified error feed: every failed wallet/token callback and every failed
 * data-API request, newest first, with the raw payloads for debugging.
 */
export const listErrorLogs = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        limit: z.number().int().min(1).max(300).default(150),
        source: z.enum(["all", "callback", "request"]).default("all"),
        search: z.string().trim().max(120).optional(),
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const wantCb = data.source !== "request";
    const wantReq = data.source !== "callback";

    const cbQuery = async () => {
      if (!wantCb) return [];
      let q = sb
        .from("callback_logs")
        .select(
          "id, created_at, client_id, callback_type, external_user_id, status_code, signature_status, error_message, ip_address, host, response_time_ms, request_payload, response_payload",
        )
        .eq("success", false)
        .order("created_at", { ascending: false })
        .limit(data.limit);
      if (data.from) q = q.gte("created_at", data.from);
      if (data.to) q = q.lte("created_at", data.to);
      const { data: rows, error } = await q;
      if (error) throw new Error(error.message);
      return (rows ?? []).map<ErrorEntry>((r) => ({
        id: `cb:${r.id}`,
        created_at: r.created_at,
        source: "callback",
        client_id: r.client_id,
        client_name: null,
        kind: r.callback_type,
        status_code: r.status_code,
        message: r.error_message ?? "Callback failed",
        signature_status: r.signature_status,
        ip_address: r.ip_address,
        host: r.host,
        external_user_id: r.external_user_id,
        response_time_ms: r.response_time_ms,
        request_payload: (r.request_payload ?? null) as Payload,
        response_payload: (r.response_payload ?? null) as Payload,
      }));
    };

    const reqQuery = async () => {
      if (!wantReq) return [];
      let q = sb
        .from("request_logs")
        .select(
          "id, created_at, client_id, category, game, endpoint, type, status_code, error_message, ip_address, host, response_time_ms",
        )
        .eq("success", false)
        .order("created_at", { ascending: false })
        .limit(data.limit);
      if (data.from) q = q.gte("created_at", data.from);
      if (data.to) q = q.lte("created_at", data.to);
      const { data: rows, error } = await q;
      if (error) throw new Error(error.message);
      return (rows ?? []).map<ErrorEntry>((r) => ({
        id: `rq:${r.id}`,
        created_at: r.created_at,
        source: "request",
        client_id: r.client_id,
        client_name: null,
        kind: [r.category, r.game, r.type].filter(Boolean).join(" / ") || "request",
        status_code: r.status_code,
        message: r.error_message ?? "Request failed",
        signature_status: null,
        ip_address: r.ip_address,
        host: r.host,
        external_user_id: null,
        response_time_ms: r.response_time_ms,
        request_payload: { endpoint: r.endpoint, category: r.category, game: r.game, type: r.type },
        response_payload: null,
      }));
    };

    const [cb, rq] = await Promise.all([cbQuery(), reqQuery()]);
    let entries = [...cb, ...rq].sort((a, b) => b.created_at.localeCompare(a.created_at));

    const ids = Array.from(new Set(entries.map((e) => e.client_id).filter((v): v is string => !!v)));
    if (ids.length) {
      const { data: clients } = await sb.from("api_clients").select("id, name").in("id", ids);
      const byId = new Map((clients ?? []).map((c) => [c.id, c.name]));
      entries = entries.map((e) => ({ ...e, client_name: e.client_id ? byId.get(e.client_id) ?? null : null }));
    }

    const needle = data.search?.toLowerCase();
    if (needle) {
      entries = entries.filter((e) =>
        [e.message, e.kind, e.client_name, e.ip_address, e.host, e.external_user_id, String(e.status_code ?? "")]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(needle)),
      );
    }

    entries = entries.slice(0, data.limit);

    const counts = {
      total: entries.length,
      callback: entries.filter((e) => e.source === "callback").length,
      request: entries.filter((e) => e.source === "request").length,
      signature: entries.filter((e) => e.signature_status && e.signature_status !== "valid").length,
      whitelist: entries.filter((e) => /whitelist|domain|ip /i.test(e.message)).length,
    };

    return { entries, counts };
  });
