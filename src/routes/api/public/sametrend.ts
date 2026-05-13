import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { buildUpstreamUrl, fetchUpstream } from "@/server/upstream";

function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function getRequestHostname(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (origin && origin !== "null") {
    try { return new URL(origin).hostname.toLowerCase(); } catch { /* ignore */ }
  }
  const referer = request.headers.get("referer");
  if (referer) {
    try { return new URL(referer).hostname.toLowerCase(); } catch { /* ignore */ }
  }
  return null;
}

function domainMatches(host: string, pattern: string): boolean {
  const p = pattern.toLowerCase().trim();
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

function plainResponse(text: string, status: number) {
  return new Response(text, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

export const Route = createFileRoute("/api/public/sametrend")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
          },
        }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const apiKey = url.searchParams.get("api_key") || "";
        const category = (url.searchParams.get("category") || "").toLowerCase();
        const game = url.searchParams.get("game") || "";
        const ip = getClientIp(request);
        const host = getRequestHostname(request);

        const log = async (
          clientId: string | null,
          status: number,
          success: boolean,
          error: string | null,
          ms: number
        ) => {
          try {
            await supabaseAdmin.from("request_logs").insert({
              client_id: clientId,
              api_key: apiKey || null,
              ip_address: ip,
              host: host,
              category: category || null,
              game: game || null,
              type: "sametrend",
              endpoint: `${category}/${game}`,
              status_code: status,
              success,
              error_message: error,
              response_time_ms: ms,
            });
          } catch (e) {
            console.error("log insert failed", e);
          }
        };

        if (!apiKey) {
          await log(null, 400, false, "Missing api_key", 0);
          return plainResponse("Missing api_key", 400);
        }
        if (!category || !game) {
          await log(null, 400, false, "Missing category or game", 0);
          return plainResponse("Missing category or game", 400);
        }

        const { data: client, error: rErr } = await supabaseAdmin
          .from("api_clients")
          .select("id, status, category, expires_at")
          .eq("api_key", apiKey)
          .maybeSingle();

        if (rErr || !client) {
          await log(null, 401, false, "Invalid API key", 0);
          return plainResponse("Invalid API key", 401);
        }
        if (client.status !== "active") {
          await log(client.id, 403, false, "Account suspended", 0);
          return plainResponse("Account suspended", 403);
        }
        if (client.expires_at && new Date(client.expires_at).getTime() < Date.now()) {
          await log(client.id, 403, false, "Key expired", 0);
          return plainResponse("API key expired", 403);
        }
        if ((client.category || "").toLowerCase() !== category) {
          await log(client.id, 403, false, `Key not allowed for category ${category}`, 0);
          return plainResponse(`This API key is only valid for category '${client.category}'`, 403);
        }

        const { data: ips } = await supabaseAdmin
          .from("allowed_ips")
          .select("ip_address")
          .eq("client_id", client.id);
        const allowed = (ips || []).map((r) => r.ip_address);
        const ipWildcard = allowed.some((a) => (a || "").trim() === "*");
        if (!ipWildcard && (allowed.length === 0 || !allowed.includes(ip))) {
          await log(client.id, 403, false, `IP ${ip} not whitelisted`, 0);
          return plainResponse("IP not allowed", 403);
        }

        const { data: domainsRows } = await supabaseAdmin
          .from("allowed_domains")
          .select("domain")
          .eq("client_id", client.id);
        const domains = (domainsRows || []).map((r) => r.domain);
        const hasWildcard = domains.some((d) => (d || "").trim() === "*");
        if (domains.length === 0) {
          await log(client.id, 403, false, "No domains configured", 0);
          return plainResponse("Domain not allowed", 403);
        }
        if (!hasWildcard && (!host || !domains.some((d) => domainMatches(host, d)))) {
          await log(client.id, 403, false, `Domain ${host ?? "missing"} not whitelisted`, 0);
          return plainResponse("Domain not allowed", 403);
        }

        const upstream = buildUpstreamUrl(category, game, "history");
        if (!upstream) {
          await log(client.id, 404, false, "Unknown category/game", 0);
          return plainResponse("Unknown category/game combination", 404);
        }

        try {
          const { status, body, ms } = await fetchUpstream(upstream);
          await log(client.id, status, status === 200, null, ms);

          // Extract just the latest "number" from upstream history payload
          let num = "";
          try {
            const parsed = JSON.parse(body);
            const list = parsed?.data?.list ?? parsed?.list ?? [];
            if (Array.isArray(list) && list.length > 0) {
              num = String(list[0]?.number ?? "");
            }
          } catch {
            return plainResponse("Upstream parse error", 502);
          }

          if (num === "") return plainResponse("No data", 404);
          return plainResponse(num, 200);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Upstream fetch error";
          await log(client.id, 502, false, msg, 0);
          return plainResponse("Upstream error", 502);
        }
      },
    },
  },
});