import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  authorizeCallback, corsPreflight, getClientIp,
  getRequestHostname, jsonResponse, logCallback,
} from "@/server/callback";

export const Route = createFileRoute("/api/public/token/validate")({
  server: {
    handlers: {
      OPTIONS: async () => corsPreflight(),
      POST: async ({ request }) => {
        const started = Date.now();
        const rawBody = await request.text();
        let body: Record<string, unknown> = {};
        try { body = JSON.parse(rawBody || "{}") as Record<string, unknown>; } catch { /* ignore */ }

        const apiKey = String(body.api_key ?? request.headers.get("x-api-key") ?? "");
        const token = String(body.token ?? "").trim();
        const ip = getClientIp(request);
        const host = getRequestHostname(request);

        const auth = await authorizeCallback({ request, apiKey, rawBody, op: "token" });
        if (!auth.ok) {
          await logCallback({
            client_id: auth.clientId, callback_type: "TokenValidate", token: token || null,
            status_code: auth.status, success: false, signature_status: auth.signature,
            error_message: auth.msg, ip_address: ip, host, response_time_ms: Date.now() - started,
            request_payload: body,
          });
          return jsonResponse({ code: auth.status, msg: auth.msg }, auth.status);
        }

        const fail = async (status: number, msg: string) => {
          await logCallback({
            client_id: auth.client.id, callback_type: "TokenValidate", token: token || null,
            status_code: status, success: false, signature_status: "valid", error_message: msg,
            ip_address: ip, host, response_time_ms: Date.now() - started, request_payload: body,
          });
          return jsonResponse({ code: status, msg }, status);
        };

        if (!token) return fail(400, "Missing token");

        const { data: row } = await supabaseAdmin
          .from("game_tokens")
          .select("id, external_user_id, expires_at, used_at, replay_count, expired_hits")
          .eq("client_id", auth.client.id)
          .eq("token", token)
          .maybeSingle();

        if (!row) return fail(401, "Unknown token");
        if (row.used_at) {
          await supabaseAdmin.from("game_tokens").update({
            replay_count: (row.replay_count ?? 0) + 1,
            last_attempt_at: new Date().toISOString(),
          }).eq("id", row.id);
          return fail(409, "Token already used (replay blocked)");
        }
        if (new Date(row.expires_at).getTime() < Date.now()) {
          await supabaseAdmin.from("game_tokens").update({
            expired_hits: (row.expired_hits ?? 0) + 1,
            last_attempt_at: new Date().toISOString(),
          }).eq("id", row.id);
          return fail(410, "Token expired");
        }

        // Single-use consume: only the first concurrent request wins.
        const { data: consumed } = await supabaseAdmin
          .from("game_tokens")
          .update({
            used_at: new Date().toISOString(),
            last_attempt_at: new Date().toISOString(),
            used_ip: ip,
            used_domain: host,
          })
          .eq("id", row.id)
          .is("used_at", null)
          .select("id")
          .maybeSingle();

        if (!consumed) {
          await supabaseAdmin.from("game_tokens").update({
            replay_count: (row.replay_count ?? 0) + 1,
            last_attempt_at: new Date().toISOString(),
          }).eq("id", row.id);
          return fail(409, "Token already used (replay blocked)");
        }

        const payload = { code: 0, msg: "ok", user_id: row.external_user_id };
        await logCallback({
          client_id: auth.client.id, callback_type: "TokenValidate", token,
          external_user_id: row.external_user_id, status_code: 200, success: true,
          signature_status: "valid", ip_address: ip, host, response_time_ms: Date.now() - started,
          request_payload: body, response_payload: payload,
        });
        return jsonResponse(payload, 200);
      },
    },
  },
});