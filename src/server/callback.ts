import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type ClientRow = {
  id: string;
  status: string;
  expires_at: string | null;
  callback_url: string | null;
  callback_secret: string | null;
  callback_enabled: boolean;
  token_ttl_seconds: number;
  mode: string;
  cb_getbalance: boolean;
  cb_placebet: boolean;
  cb_winloss: boolean;
  cb_token: boolean;
};

/** Operations that can be individually enabled per callback key. */
export type CallbackOp = "token" | "GetBalance" | "PlaceBet" | "WinLoss";

function opEnabled(c: ClientRow, op: CallbackOp): boolean {
  switch (op) {
    case "token": return c.cb_token !== false;
    case "GetBalance": return c.cb_getbalance !== false;
    case "PlaceBet": return c.cb_placebet !== false;
    case "WinLoss": return c.cb_winloss !== false;
  }
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function getRequestHostname(request: Request): string | null {
  for (const h of ["origin", "referer"]) {
    const v = request.headers.get(h);
    if (v && v !== "null") {
      try { return new URL(v).hostname.toLowerCase(); } catch { /* ignore */ }
    }
  }
  const custom = request.headers.get("x-client-domain");
  if (custom) return custom.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
  return null;
}

export function domainMatches(host: string, pattern: string): boolean {
  const p = (pattern || "").toLowerCase().trim();
  if (!p) return false;
  if (p === "*") return true;
  const h = (host || "").toLowerCase();
  if (!h) return false;
  if (p.startsWith("*.")) {
    const base = p.slice(2);
    return h === base || h.endsWith("." + base);
  }
  return h === p;
}

export function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

export const corsPreflight = () =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });

export async function hmacHex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type SignatureStatus = "valid" | "invalid" | "missing" | "unconfigured";

export async function verifySignature(
  secret: string | null,
  rawBody: string,
  provided: string | null,
): Promise<SignatureStatus> {
  if (!secret) return "unconfigured";
  if (!provided) return "missing";
  const expected = await hmacHex(secret, rawBody);
  return timingSafeEqual(expected.toLowerCase(), provided.trim().toLowerCase()) ? "valid" : "invalid";
}

export function genToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function logCallback(row: {
  client_id: string | null;
  callback_type: string;
  external_user_id?: string | null;
  token?: string | null;
  amount?: number | null;
  new_balance?: number | null;
  status_code: number;
  success: boolean;
  signature_status?: SignatureStatus | null;
  error_message?: string | null;
  ip_address?: string | null;
  host?: string | null;
  response_time_ms?: number | null;
  request_payload?: unknown;
  response_payload?: unknown;
}) {
  try {
    await supabaseAdmin.from("callback_logs").insert({
      ...row,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      request_payload: (row.request_payload ?? null) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response_payload: (row.response_payload ?? null) as any,
    });
  } catch (e) {
    console.error("callback log insert failed", e);
  }
}

export type AuthOk = { ok: true; client: ClientRow; signature: SignatureStatus };
export type AuthFail = { ok: false; status: number; msg: string; clientId: string | null; signature: SignatureStatus };

/**
 * Shared gate for every callback/token endpoint:
 * api key -> status/expiry -> IP whitelist -> domain whitelist -> HMAC signature.
 */
export async function authorizeCallback(opts: {
  request: Request;
  apiKey: string;
  rawBody: string;
  op?: CallbackOp;
}): Promise<AuthOk | AuthFail> {
  const { request, apiKey, rawBody, op } = opts;
  const ip = getClientIp(request);
  const host = getRequestHostname(request);
  const providedSig =
    request.headers.get("x-signature") ||
    request.headers.get("x-hyper-signature") ||
    null;

  if (!apiKey) return { ok: false, status: 400, msg: "Missing api_key", clientId: null, signature: "missing" };

  const { data: client } = await supabaseAdmin
    .from("api_clients")
    .select("id, status, expires_at, callback_url, callback_secret, callback_enabled, token_ttl_seconds, mode, cb_getbalance, cb_placebet, cb_winloss, cb_token")
    .eq("api_key", apiKey)
    .maybeSingle();

  if (!client) return { ok: false, status: 401, msg: "Invalid API key", clientId: null, signature: "missing" };
  const c = client as ClientRow;

  // Callback system keys are a separate system from data/endpoint API keys.
  if (c.mode !== "callback") {
    return { ok: false, status: 403, msg: "This is a data API key. Use a callback-mode key for token/wallet endpoints.", clientId: c.id, signature: "unconfigured" };
  }
  if (!c.callback_enabled) {
    return { ok: false, status: 403, msg: "Callback integration mode is disabled for this key", clientId: c.id, signature: "unconfigured" };
  }
  if (op && !opEnabled(c, op)) {
    return { ok: false, status: 403, msg: `Operation '${op}' is disabled for this key`, clientId: c.id, signature: "unconfigured" };
  }
  if (c.status !== "active") {
    return { ok: false, status: 403, msg: "Account suspended", clientId: c.id, signature: "unconfigured" };
  }
  if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) {
    return { ok: false, status: 403, msg: "API key expired", clientId: c.id, signature: "unconfigured" };
  }

  const { data: ips } = await supabaseAdmin.from("allowed_ips").select("ip_address").eq("client_id", c.id);
  const allowedIps = (ips || []).map((r) => (r.ip_address || "").trim());
  const ipWildcard = allowedIps.includes("*");
  if (!ipWildcard && (allowedIps.length === 0 || !allowedIps.includes(ip))) {
    return { ok: false, status: 403, msg: `IP ${ip} not whitelisted`, clientId: c.id, signature: "unconfigured" };
  }

  const { data: doms } = await supabaseAdmin.from("allowed_domains").select("domain").eq("client_id", c.id);
  const domains = (doms || []).map((r) => r.domain || "");
  if (domains.length === 0) {
    return { ok: false, status: 403, msg: "No domains configured", clientId: c.id, signature: "unconfigured" };
  }
  const domainWildcard = domains.some((d) => d.trim() === "*");
  if (!domainWildcard && (!host || !domains.some((d) => domainMatches(host, d)))) {
    return { ok: false, status: 403, msg: `Domain ${host ?? "missing"} not whitelisted`, clientId: c.id, signature: "unconfigured" };
  }

  const signature = await verifySignature(c.callback_secret, rawBody, providedSig);
  if (signature !== "valid") {
    const msg =
      signature === "unconfigured" ? "No callback secret configured for this key"
      : signature === "missing" ? "Missing X-Signature header"
      : "Invalid signature";
    return { ok: false, status: 401, msg, clientId: c.id, signature };
  }

  return { ok: true, client: c, signature };
}