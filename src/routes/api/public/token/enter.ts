import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { parseGameCode, resolveAllowedGames } from "@/server/allowed-games";
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
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

/** True when a real browser / webview opened the URL (not a server-to-server call). */
function wantsHtml(request: Request): boolean {
  const url = new URL(request.url);
  const fmt = (url.searchParams.get("format") || "").toLowerCase();
  if (fmt === "json") return false;
  if (fmt === "html") return true;
  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html");
}

function htmlResponse(html: string, status: number) {
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function page(title: string, lines: string[], accent: string, status: number) {
  return htmlResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${escapeHtml(title)} — Hyper Softs SaaS</title>
<style>
 :root{color-scheme:dark}
 body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
   background:#070707;color:#e8e8e8;font:14px/1.6 ui-monospace,"JetBrains Mono",Menlo,monospace}
 .card{max-width:420px;width:calc(100% - 32px);border:1px solid #222;background:#0d0d0d;padding:24px}
 h1{margin:0 0 12px;font-size:16px;letter-spacing:.08em;text-transform:uppercase;color:${accent}}
 p{margin:4px 0;color:#9c9c9c;word-break:break-word}
 .bar{height:2px;background:${accent};margin-bottom:18px;width:38px}
</style></head><body><div class="card"><div class="bar"></div>
<h1>${escapeHtml(title)}</h1>${lines.map((l) => `<p>${l}</p>`).join("")}
</div></body></html>`,
    status,
  );
}

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
    if (wantsHtml(request)) {
      return page("Session error", [escapeHtml(msg), `Status: ${status}`], "#ff5555", status);
    }
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

  // Optional gameCode from the partner app (WinGo_30S, K3_1M, D5_1M, MotoRace_1M...).
  const rawGameCode = (
    url.searchParams.get("gameCode") ||
    url.searchParams.get("game_code") ||
    String(body.gameCode ?? body.game_code ?? "")
  ).trim();
  let requested: { category: string; game: string } | null = null;
  if (rawGameCode) {
    requested = parseGameCode(rawGameCode);
    if (!requested) {
      return fail(400, `Unsupported gameCode '${rawGameCode}' (TRX / video games are not served)`, client.id);
    }
    const match = allowed.find((a) => a.category === requested!.category);
    if (!match || !match.games.includes(requested.game)) {
      return fail(403, `gameCode '${rawGameCode}' not allowed for this key`, client.id);
    }
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
    game: requested,
    session_expires_at: row.expires_at,
  };

  await logCallback({
    client_id: client.id, callback_type: "TokenEnter", token,
    external_user_id: row.external_user_id, status_code: 200, success: true,
    ip_address: ip, host, response_time_ms: Date.now() - started,
    request_payload: { host, method: request.method, gameCode: rawGameCode || null },
    response_payload: payload,
  });
  if (wantsHtml(request)) {
    return page(
      "Session active",
      [
        `Player: <b style="color:#e8e8e8">${escapeHtml(String(row.external_user_id))}</b>`,
        `Operator: ${escapeHtml(client.name ?? "-")}`,
        ...(requested ? [`Game: ${escapeHtml(`${requested.category}/${requested.game}`)}`] : []),
        `Games: ${escapeHtml(allowed.join(", "))}`,
        `Valid until: ${escapeHtml(new Date(row.expires_at).toISOString())}`,
      ],
      "#c4f000",
      200,
    );
  }
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
