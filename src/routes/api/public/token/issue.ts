import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  authorizeCallback, corsPreflight, genToken, getClientIp,
  getRequestHostname, jsonResponse, logCallback,
} from "@/server/callback";

export const Route = createFileRoute("/api/public/token/issue")({
  server: {
    handlers: {
      OPTIONS: async () => corsPreflight(),
      POST: async ({ request }) => {
        const started = Date.now();
        const rawBody = await request.text();
        let body: Record<string, unknown> = {};
        try { body = JSON.parse(rawBody || "{}") as Record<string, unknown>; } catch { /* ignore */ }

        const apiKey = String(body.api_key ?? request.headers.get("x-api-key") ?? "");
        const userId = String(body.user_id ?? "").trim();
        const ip = getClientIp(request);
        const host = getRequestHostname(request);

        const auth = await authorizeCallback({ request, apiKey, rawBody, op: "token" });
        if (!auth.ok) {
          await logCallback({
            client_id: auth.clientId, callback_type: "TokenIssue", external_user_id: userId || null,
            status_code: auth.status, success: false, signature_status: auth.signature,
            error_message: auth.msg, ip_address: ip, host, response_time_ms: Date.now() - started,
            request_payload: body,
          });
          return jsonResponse({ code: auth.status, msg: auth.msg }, auth.status);
        }

        if (!userId) {
          await logCallback({
            client_id: auth.client.id, callback_type: "TokenIssue", status_code: 400, success: false,
            signature_status: "valid", error_message: "Missing user_id", ip_address: ip, host,
            response_time_ms: Date.now() - started, request_payload: body,
          });
          return jsonResponse({ code: 400, msg: "Missing user_id" }, 400);
        }

        const ttl = Math.min(Math.max(Number(body.ttl ?? auth.client.token_ttl_seconds ?? 300) || 300, 30), 86400);
        const token = (typeof body.token === "string" && body.token.trim().length >= 12)
          ? body.token.trim()
          : genToken();
        const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

        const { error } = await supabaseAdmin.from("game_tokens").upsert({
          client_id: auth.client.id,
          token,
          external_user_id: userId,
          domain: host,
          ip_address: ip,
          expires_at: expiresAt,
          used_at: null,
        }, { onConflict: "client_id,token" });

        if (error) {
          await logCallback({
            client_id: auth.client.id, callback_type: "TokenIssue", external_user_id: userId, token,
            status_code: 500, success: false, signature_status: "valid", error_message: error.message,
            ip_address: ip, host, response_time_ms: Date.now() - started, request_payload: body,
          });
          return jsonResponse({ code: 500, msg: "Could not store token" }, 500);
        }

        const payload = { code: 0, msg: "ok", token, expires_at: expiresAt, ttl };
        await logCallback({
          client_id: auth.client.id, callback_type: "TokenIssue", external_user_id: userId, token,
          status_code: 200, success: true, signature_status: "valid", ip_address: ip, host,
          response_time_ms: Date.now() - started, request_payload: body, response_payload: payload,
        });
        return jsonResponse(payload, 200);
      },
    },
  },
});