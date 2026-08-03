import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { resolveAllowedGames } from "@/server/allowed-games";
import {
  corsPreflight, domainMatches, getClientIp,
  getRequestHostname, jsonResponse, logCallback,
} from "@/server/callback";

/**
 * Player entry point on OUR domain.
 *   https://sass.hyperapi.in/api/public/token/enter?Token=<gameToken>
 * The token itself is the credential (single-use + short TTL), so no api_key
 * or HMAC signature is required here — this URL is opened by the end user.
 */
async function handle(request: Request) {
  const started = Date.now();
  const url = new URL(request.url);
  let token = (url.searchParams.get("Token") || url.searchParams.get("token") || "").trim();
  let body: Record<string, unknown> = {};
  if (request.method === "POST") {
    const raw = await request.text();
    try { body = JSON.parse(raw || "{}") as Record<string, unknown>; } catch { /* ignore */ }
    if (!token) token = String(body.token ?? body.Token ?? "").trim();
  }

  const ip = getClientIp(request);
  const host = getRequestHostname(request);

  const fail = async (status: number, msg: string, clientId: string | null) => {
    await logCallback({
      client_id: clientId, callback_type: "TokenEnter", token: token || null,
      status_code: status, success: false, error_message: msg,
      ip_address: ip, host, response_time_ms: Date.now() - started,
      request_payload: { token: token || null, host, method: request.method },
    });
    return jsonResponse({ code: status, msg }, status);
  };

  if (!token) return fail(400, "Missing Token", null);

  const { data: row } = await supabaseAdmin
    .from("game_tokens")
    .select("id, client_id, external_user_id, expires_at, used_at, replay_count, expired_hits")
    .eq("token", token)
    .maybeSingle();

  if (!row) return fail(401, "Unknown token", null);

  const { data: client } = await supabaseAdmin
    .from("api_clients")
    .select("id, name, status, expires_at, category, mode, callback_enabled, cb_token, cb_getbalance, cb_placebet, cb_winloss")
    .eq("id", row.client_id)
    .maybeSingle();

  if (!client) return fail(401, "Unknown client", row.client_id);
  if (client.mode !== "callback" || !client.callback_enabled || client.cb_token === false) {
    return fail(403, "Token mode is disabled for this key", client.id);
  }
  if (client.status !== "active") return fail(403, "Account suspended", client.id);
  if (client.expires_at && new Date(client.expires_at).getTime() < Date.now()) {
    return fail(403, "API key expired", client.id);
  }

  // Domain whitelist (only enforced when the browser sent an origin/referer).
  if (host) {
    const { data: domRows } = await supabaseAdmin
      .from("allowed_domains").select("domain, op").eq("client_id", client.id);
    const domains = (domRows || [])
      .filter((r) => !r.op || r.op === "token")
      .map((r) => r.domain || "");
    if (domains.length === 0) return fail(403, "No domains configured for token", client.id);
    const wildcard = domains.some((d) => d.trim() === "*");
    if (!wildcard && !domains.some((d) => domainMatches(host, d))) {
      return fail(403, `Domain ${host} not whitelisted for token`, client.id);
    }
  }

  // Games this key is allowed to play: platform-supported ∩ admin-enabled ∩ key category.
  const { data: cfg } = await supabaseAdmin
    .from("integration_config")
    .select("hyper_base, hyper_cb_key, hyper_cb_secret, hyper_token_ttl, enforce_config, allowed_categories")
    .eq("id", "default")
    .maybeSingle();

  if (cfg?.enforce_config) {
    const missing = (["hyper_base", "hyper_cb_key", "hyper_cb_secret", "hyper_token_ttl"] as const)
      .filter((f) => {
        const v = cfg[f] as unknown;
        return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
      });
    if (missing.length > 0) {
      return fail(503, `Integration config incomplete: ${missing.join(", ")}`, client.id);
    }
  }

  const allowed = resolveAllowedGames(
    client.category,
    cfg?.allowed_categories ?? null,
    [
      ...(client.cb_getbalance === false ? [] : ["GetBalance"]),
      ...(client.cb_placebet === false ? [] : ["PlaceBet"]),
      ...(client.cb_winloss === false ? [] : ["WinLoss"]),
    ],
  );
  if (allowed.length === 0) {
    return fail(403, `Category '${client.category ?? "unset"}' is not enabled on this platform`, client.id);
  }

  if (row.used_at) {
    await supabaseAdmin.from("game_tokens").update({
      replay_count: (row.replay_count ?? 0) + 1,
      last_attempt_at: new Date().toISOString(),
    }).eq("id", row.id);
    return fail(409, "Token already used (replay blocked)", client.id);
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await supabaseAdmin.from("game_tokens").update({
      expired_hits: (row.expired_hits ?? 0) + 1,
      last_attempt_at: new Date().toISOString(),
    }).eq("id", row.id);
    return fail(410, "Token expired", client.id);
  }

  // Single-use consume — only the first request wins.
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
    return fail(409, "Token already used (replay blocked)", client.id);
  }

  const payload = {
    code: 0,
    msg: "ok",
    user_id: row.external_user_id,
    client: client.name,
    allowed_games: allowed,
    session_expires_at: row.expires_at,
  };

  await logCallback({
    client_id: client.id, callback_type: "TokenEnter", token,
    external_user_id: row.external_user_id, status_code: 200, success: true,
    ip_address: ip, host, response_time_ms: Date.now() - started,
    request_payload: { host, method: request.method }, response_payload: payload,
  });
  return jsonResponse(payload, 200);
}

export const Route = createFileRoute("/api/public/token/enter")({
  server: {
    handlers: {
      OPTIONS: async () => corsPreflight(),
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});
