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

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

export const Route = createFileRoute("/api/public/proxy")({
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
        const category = url.searchParams.get("category") || "";
        const game = url.searchParams.get("game") || "";
        const typeParam = (url.searchParams.get("type") || "period").toLowerCase();
        const type: "period" | "history" = typeParam === "history" ? "history" : "period";
        const ip = getClientIp(request);

        const log = async (
          resellerId: string | null,
          status: number,
          success: boolean,
          error: string | null,
          ms: number
        ) => {
          try {
            await supabaseAdmin.from("request_logs").insert({
              reseller_id: resellerId,
              api_key: apiKey || null,
              ip_address: ip,
              category: category || null,
              game: game || null,
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
          return jsonResponse({ code: 400, msg: "Missing api_key" }, 400);
        }
        if (!category || !game) {
          await log(null, 400, false, "Missing category or game", 0);
          return jsonResponse({ code: 400, msg: "Missing category or game" }, 400);
        }

        // Lookup reseller
        const { data: reseller, error: rErr } = await supabaseAdmin
          .from("resellers")
          .select("id, status, rate_limit_per_minute")
          .eq("api_key", apiKey)
          .maybeSingle();

        if (rErr || !reseller) {
          await log(null, 401, false, "Invalid API key", 0);
          return jsonResponse({ code: 401, msg: "Invalid API key" }, 401);
        }
        if (reseller.status !== "active") {
          await log(reseller.id, 403, false, "Account suspended", 0);
          return jsonResponse({ code: 403, msg: "Account suspended" }, 403);
        }

        // IP whitelist check
        const { data: ips } = await supabaseAdmin
          .from("allowed_ips")
          .select("ip_address")
          .eq("reseller_id", reseller.id);
        const allowed = (ips || []).map((r) => r.ip_address);
        if (allowed.length > 0 && !allowed.includes(ip)) {
          await log(reseller.id, 403, false, `IP ${ip} not whitelisted`, 0);
          return jsonResponse(
            { code: 403, msg: "IP not allowed", your_ip: ip },
            403
          );
        }

        // Rate limit (best-effort, per minute)
        const since = new Date(Date.now() - 60_000).toISOString();
        const { count } = await supabaseAdmin
          .from("request_logs")
          .select("id", { count: "exact", head: true })
          .eq("reseller_id", reseller.id)
          .gte("created_at", since);
        if (count !== null && count >= reseller.rate_limit_per_minute) {
          await log(reseller.id, 429, false, "Rate limit exceeded", 0);
          return jsonResponse({ code: 429, msg: "Rate limit exceeded" }, 429);
        }

        // Build upstream URL
        const upstream = buildUpstreamUrl(category, game, type);
        if (!upstream) {
          await log(reseller.id, 404, false, "Unknown category/game", 0);
          return jsonResponse(
            { code: 404, msg: "Unknown category/game combination" },
            404
          );
        }

        // Forward
        try {
          const { status, body, ms } = await fetchUpstream(upstream);
          await log(reseller.id, status, status === 200, null, ms);
          return new Response(body, {
            status,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "Access-Control-Allow-Origin": "*",
            },
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Upstream fetch error";
          await log(reseller.id, 502, false, msg, 0);
          return jsonResponse({ code: 502, msg: "Upstream error", error: msg }, 502);
        }
      },
    },
  },
});