import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";
import { createHash } from "crypto";

function md5(s: string) { return createHash("md5").update(s).digest("hex"); }

const OK = new Response("success", { status: 200, headers: { "Content-Type": "text/plain" } });

async function parseBody(request: Request): Promise<Record<string, unknown>> {
  const ct = request.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      const j = await request.json();
      return (j && typeof j === "object" && !Array.isArray(j)) ? j as Record<string, unknown> : {};
    }
    if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
      const fd = await request.formData();
      const out: Record<string, unknown> = {};
      fd.forEach((v, k) => { out[k] = typeof v === "string" ? v : ""; });
      return out;
    }
    const text = await request.text();
    if (!text) return {};
    try {
      const j = JSON.parse(text);
      return (j && typeof j === "object" && !Array.isArray(j)) ? j as Record<string, unknown> : {};
    } catch {
      const params = new URLSearchParams(text);
      const out: Record<string, unknown> = {};
      params.forEach((v, k) => { out[k] = v; });
      return out;
    }
  } catch { return {}; }
}

export const Route = createFileRoute("/api/public/bondpay-callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const p = await parseBody(request);
        const payload = p as unknown as Json;
        const merchantOrder = String(p.merchantOrder ?? p.merchant_order_no ?? p.order_id ?? "");
        const rawStatus = String(p.status ?? p.tradeStatus ?? p.trade_status ?? "").toLowerCase();
        const gatewayOrder = String(p.orderNo ?? p.order_no ?? p.tradeNo ?? p.trade_no ?? "");
        const amount = String(p.amount ?? "");
        const sig = String(p.signature ?? p.sign ?? "");

        // Map common gateway status values to our internal states
        const okStatuses = new Set(["success", "succeeded", "paid", "1", "completed", "ok"]);
        const failStatuses = new Set(["failed", "fail", "cancelled", "canceled", "0", "expired"]);
        const status = okStatuses.has(rawStatus) ? "success"
          : failStatuses.has(rawStatus) ? "failed"
          : "pending";

        if (!merchantOrder) {
          return new Response("missing merchantOrder", { status: 400 });
        }

        const { data: order } = await supabaseAdmin
          .from("payment_orders")
          .select("id,user_id,coins,status,amount_inr")
          .eq("merchant_order_no", merchantOrder)
          .maybeSingle();

        if (!order) {
          return new Response("order not found", { status: 404 });
        }

        // Idempotency: if already success, just ack
        if (order.status === "success") {
          return OK;
        }

        // Optional signature verification (BondPay format: md5(merchant_id+amount+merchant_order_no+api_key))
        const merchantId = process.env.BONDPAY_MERCHANT_ID;
        const apiKey = process.env.BONDPAY_API_KEY;
        if (sig && merchantId && apiKey) {
          const amt = amount || Number(order.amount_inr).toFixed(2);
          const expected = md5(`${merchantId}${amt}${merchantOrder}${apiKey}`);
          if (sig.toLowerCase() !== expected.toLowerCase()) {
            await supabaseAdmin.from("payment_orders")
              .update({ raw_callback: { ...p, _sig_check: "failed", _expected: expected } as unknown as Json })
              .eq("id", order.id);
            return new Response("invalid signature", { status: 401 });
          }
        }

        if (status === "success") {
          // Credit wallet
          const { error: rpcErr } = await supabaseAdmin.rpc("adjust_wallet", {
            _user_id: order.user_id,
            _delta: Number(order.coins),
            _type: "topup",
            _reason: `BondPay top-up ₹${order.amount_inr}`,
            _reference: gatewayOrder || merchantOrder,
          });
          if (rpcErr) {
            // Don't ack — let the gateway retry
            return new Response(`error: ${rpcErr.message}`, { status: 500 });
          }
          await supabaseAdmin
            .from("payment_orders")
            .update({ status: "success", gateway_order_no: gatewayOrder || null, raw_callback: payload })
            .eq("id", order.id);
          return OK;
        }

        if (status === "failed") {
          await supabaseAdmin
            .from("payment_orders")
            .update({ status: "failed", raw_callback: payload })
            .eq("id", order.id);
          return OK;
        }

        // pending or unknown
        await supabaseAdmin
          .from("payment_orders")
          .update({ status: "pending", raw_callback: payload })
          .eq("id", order.id);
        return OK;
      },
      GET: async () => new Response("ok"),
    },
  },
});