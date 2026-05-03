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
        const currency = String(p.currency ?? p.cur ?? "INR").toUpperCase();

        // Map common gateway status values to our internal states
        const okStatuses = new Set(["success", "succeeded", "paid", "1", "completed", "ok"]);
        const failStatuses = new Set(["failed", "fail", "cancelled", "canceled", "0", "expired"]);
        const status = okStatuses.has(rawStatus) ? "success"
          : failStatuses.has(rawStatus) ? "failed"
          : "pending";

        if (!merchantOrder) {
          return new Response("missing merchantOrder", { status: 400 });
        }
        if (!amount) {
          return new Response("missing amount", { status: 400 });
        }

        const { data: order } = await supabaseAdmin
          .from("payment_orders")
          .select("id,user_id,coins,status,amount_inr,currency,credited_at")
          .eq("merchant_order_no", merchantOrder)
          .maybeSingle();

        if (!order) {
          return new Response("order not found", { status: 404 });
        }

        // Idempotency: if already success/credited, just ack — don't re-credit even on retry
        if (order.status === "success" || order.credited_at) {
          await supabaseAdmin.from("payment_orders")
            .update({
              callback_received_at: new Date().toISOString(),
              raw_callback: { ...p, _note: "duplicate_ack" } as unknown as Json,
            })
            .eq("id", order.id);
          return OK;
        }

        // Validate amount and currency match the stored pending order
        const expectedAmt = Number(order.amount_inr);
        const callbackAmt = Number(amount);
        if (!Number.isFinite(callbackAmt) || Math.abs(callbackAmt - expectedAmt) > 0.01) {
          await supabaseAdmin.from("payment_orders").update({
            signature_status: "amount_mismatch",
            callback_error: `Expected ₹${expectedAmt.toFixed(2)}, got ${amount}`,
            callback_received_at: new Date().toISOString(),
            raw_callback: payload,
          }).eq("id", order.id);
          return new Response("amount mismatch", { status: 400 });
        }
        const expectedCurrency = (order.currency || "INR").toUpperCase();
        if (currency !== expectedCurrency) {
          await supabaseAdmin.from("payment_orders").update({
            signature_status: "currency_mismatch",
            callback_error: `Expected ${expectedCurrency}, got ${currency}`,
            callback_received_at: new Date().toISOString(),
            raw_callback: payload,
          }).eq("id", order.id);
          return new Response("currency mismatch", { status: 400 });
        }

        // Optional signature verification (BondPay format: md5(merchant_id+amount+merchant_order_no+api_key))
        const merchantId = process.env.BONDPAY_MERCHANT_ID;
        const apiKey = process.env.BONDPAY_API_KEY;
        let sigStatus: "verified" | "missing" | "failed" | "skipped" = "skipped";
        if (sig && merchantId && apiKey) {
          const expected = md5(`${merchantId}${amount}${merchantOrder}${apiKey}`);
          if (sig.toLowerCase() !== expected.toLowerCase()) {
            await supabaseAdmin.from("payment_orders")
              .update({
                signature_status: "failed",
                callback_error: "Invalid signature",
                callback_received_at: new Date().toISOString(),
                raw_callback: { ...p, _expected: expected } as unknown as Json,
              })
              .eq("id", order.id);
            return new Response("invalid signature", { status: 401 });
          }
          sigStatus = "verified";
        } else if (!sig) {
          sigStatus = "missing";
        }

        if (status === "success") {
          // Credit wallet — use payment_orders.id as reference for unique-index idempotency
          const { error: rpcErr } = await supabaseAdmin.rpc("adjust_wallet", {
            _user_id: order.user_id,
            _delta: Number(order.coins),
            _type: "topup",
            _reason: `BondPay top-up ₹${order.amount_inr}`,
            _reference: order.id,
          });
          if (rpcErr) {
            // If unique-violation, treat as already credited (race / retry)
            if (/duplicate key|unique/i.test(rpcErr.message)) {
              await supabaseAdmin.from("payment_orders").update({
                status: "success",
                signature_status: sigStatus,
                callback_received_at: new Date().toISOString(),
                raw_callback: { ...p, _note: "already_credited" } as unknown as Json,
              }).eq("id", order.id);
              return OK;
            }
            await supabaseAdmin.from("payment_orders").update({
              callback_error: rpcErr.message,
              callback_received_at: new Date().toISOString(),
              raw_callback: payload,
            }).eq("id", order.id);
            // Don't ack — let the gateway retry
            return new Response(`error: ${rpcErr.message}`, { status: 500 });
          }
          await supabaseAdmin
            .from("payment_orders")
            .update({
              status: "success",
              gateway_order_no: gatewayOrder || null,
              raw_callback: payload,
              signature_status: sigStatus,
              callback_received_at: new Date().toISOString(),
              credited_at: new Date().toISOString(),
              callback_error: null,
            })
            .eq("id", order.id);
          return OK;
        }

        if (status === "failed") {
          await supabaseAdmin
            .from("payment_orders")
            .update({
              status: "failed",
              raw_callback: payload,
              signature_status: sigStatus,
              callback_received_at: new Date().toISOString(),
            })
            .eq("id", order.id);
          return OK;
        }

        // pending or unknown
        await supabaseAdmin
          .from("payment_orders")
          .update({
            status: "pending",
            raw_callback: payload,
            signature_status: sigStatus,
            callback_received_at: new Date().toISOString(),
          })
          .eq("id", order.id);
        return OK;
      },
      GET: async () => new Response("ok"),
    },
  },
});