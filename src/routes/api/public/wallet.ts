import { createFileRoute } from "@tanstack/react-router";
import {
  authorizeCallback, corsPreflight, getClientIp, getRequestHostname,
  hmacHex, jsonResponse, logCallback,
} from "@/server/callback";

const TYPES = ["GetBalance", "PlaceBet", "WinLoss"] as const;
type CbType = (typeof TYPES)[number];

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export const Route = createFileRoute("/api/public/wallet")({
  server: {
    handlers: {
      OPTIONS: async () => corsPreflight(),
      POST: async ({ request }) => {
        const started = Date.now();
        const rawBody = await request.text();
        let body: Record<string, unknown> = {};
        try { body = JSON.parse(rawBody || "{}") as Record<string, unknown>; } catch { /* ignore */ }

        const apiKey = String(body.api_key ?? request.headers.get("x-api-key") ?? "");
        const rawType = String(body.callback_type ?? body.type ?? "GetBalance");
        const callbackType = (TYPES.find((t) => t.toLowerCase() === rawType.toLowerCase()) ?? rawType) as CbType;
        const userId = String(body.user_id ?? "").trim();
        const amount = num(body.amount);
        const ip = getClientIp(request);
        const host = getRequestHostname(request);

        const auth = await authorizeCallback({ request, apiKey, rawBody });
        if (!auth.ok) {
          await logCallback({
            client_id: auth.clientId, callback_type: callbackType, external_user_id: userId || null,
            amount, status_code: auth.status, success: false, signature_status: auth.signature,
            error_message: auth.msg, ip_address: ip, host, response_time_ms: Date.now() - started,
            request_payload: body,
          });
          return jsonResponse({ code: auth.status, msg: auth.msg }, auth.status);
        }

        const fail = async (status: number, msg: string, resp?: unknown) => {
          await logCallback({
            client_id: auth.client.id, callback_type: callbackType, external_user_id: userId || null,
            amount, status_code: status, success: false, signature_status: "valid", error_message: msg,
            ip_address: ip, host, response_time_ms: Date.now() - started,
            request_payload: body, response_payload: resp,
          });
          return jsonResponse({ code: status, msg }, status);
        };

        if (!TYPES.includes(callbackType)) return fail(400, `Unknown callback_type '${rawType}'`);
        if (!userId) return fail(400, "Missing user_id");
        if (!auth.client.callback_url) return fail(400, "No callback URL configured for this key");
        if (callbackType !== "GetBalance" && amount === null) return fail(400, "Missing amount");

        const outbound = {
          callback_type: callbackType,
          user_id: userId,
          domain_name: host ?? null,
          amount,
          bet_details: body.bet_details ?? null,
          win_details: body.win_details ?? null,
          reference: body.reference ?? null,
          ts: Math.floor(Date.now() / 1000),
        };
        const outboundRaw = JSON.stringify(outbound);
        const signature = await hmacHex(auth.client.callback_secret ?? "", outboundRaw);

        let status = 502;
        let parsed: unknown = null;
        try {
          const res = await fetch(auth.client.callback_url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Signature": signature,
              "X-Hyper-Timestamp": String(outbound.ts),
            },
            body: outboundRaw,
          });
          status = res.status;
          const text = await res.text();
          try { parsed = JSON.parse(text); } catch { parsed = { raw: text.slice(0, 2000) }; }
        } catch (e) {
          const msg = e instanceof Error ? e.message : "callback fetch failed";
          return fail(502, `Callback unreachable: ${msg}`);
        }

        const p = (parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {});
        const newBalance = num(p.new_balance ?? p.balance);
        const ok = status === 200 && (p.status === "success" || p.code === 0 || newBalance !== null);

        await logCallback({
          client_id: auth.client.id, callback_type: callbackType, external_user_id: userId,
          amount, new_balance: newBalance, status_code: status, success: ok,
          signature_status: "valid", error_message: ok ? null : String(p.message ?? p.msg ?? `Upstream status ${status}`),
          ip_address: ip, host, response_time_ms: Date.now() - started,
          request_payload: body, response_payload: parsed,
        });

        return jsonResponse(
          { code: ok ? 0 : status, msg: ok ? "ok" : String(p.message ?? p.msg ?? "callback failed"), new_balance: newBalance, data: parsed },
          ok ? 200 : status,
        );
      },
    },
  },
});