import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export const Route = createFileRoute("/api/public/bondpay-callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: Json = {};
        try { payload = (await request.json()) as Json; } catch { /* ignore */ }

        const p = (payload && typeof payload === "object" && !Array.isArray(payload)) ? payload as Record<string, unknown> : {};
        const merchantOrder = String(p.merchantOrder ?? p.merchant_order_no ?? "");
        const status = String(p.status ?? "").toLowerCase();
        const gatewayOrder = String(p.orderNo ?? p.order_no ?? "");
        const cbAmount = num(p.amount ?? p.payAmount);
        const cbCurrency = String(p.currency ?? "INR").toUpperCase();

        const now = new Date().toISOString();

        if (!merchantOrder) {
          return Response.json({ status: "error", message: "missing merchantOrder" }, { status: 400 });
        }

        const { data: order } = await supabaseAdmin
          .from("payment_orders")
          .select("id,user_id,coins,status,amount_inr,currency,credited_at,gateway_order_no")
          .eq("merchant_order_no", merchantOrder)
          .maybeSingle();

        if (!order) {
          return Response.json({ status: "error", message: "order not found" }, { status: 404 });
        }

        // Strong idempotency: if already credited (success + credited_at set), refuse to re-credit
        if (order.status === "success" && order.credited_at) {
          await supabaseAdmin.from("payment_orders").update({
            raw_callback: payload, callback_received_at: now, signature_status: "duplicate_ack",
          }).eq("id", order.id);
          return Response.json({ status: "ok", message: "already credited" });
        }

        // Validation: amount and currency must match the stored pending order
        const expectedAmount = Number(order.amount_inr);
        const amountMatches = cbAmount !== null && Math.abs(cbAmount - expectedAmount) < 0.01;
        const currencyMatches = (order.currency ?? "INR").toUpperCase() === cbCurrency;

        if (status === "success") {
          if (!amountMatches || !currencyMatches) {
            const err = !amountMatches
              ? `amount mismatch: expected ${expectedAmount} got ${cbAmount}`
              : `currency mismatch: expected ${order.currency} got ${cbCurrency}`;
            await supabaseAdmin.from("payment_orders").update({
              status: "failed", raw_callback: payload,
              callback_received_at: now, signature_status: "invalid",
              callback_error: err,
            }).eq("id", order.id);
            return Response.json({ status: "error", message: err }, { status: 400 });
          }

          // Atomic credit: only credit if not already credited
          const { data: locked, error: lockErr } = await supabaseAdmin
            .from("payment_orders")
            .update({
              status: "success",
              gateway_order_no: gatewayOrder || order.gateway_order_no,
              raw_callback: payload,
              callback_received_at: now,
              credited_at: now,
              signature_status: "valid",
              callback_error: null,
            })
            .eq("id", order.id)
            .is("credited_at", null)
            .select("id")
            .maybeSingle();
          if (lockErr) {
            return Response.json({ status: "error", message: lockErr.message }, { status: 500 });
          }
          if (!locked) {
            // Another concurrent callback won the race
            return Response.json({ status: "ok", message: "already credited" });
          }

          const { error: rpcErr } = await supabaseAdmin.rpc("adjust_wallet", {
            _user_id: order.user_id,
            _delta: Number(order.coins),
            _type: "topup",
            _reason: `BondPay top-up ₹${order.amount_inr}`,
            _reference: gatewayOrder || merchantOrder,
          });
          if (rpcErr) {
            // Rollback credited_at marker so a retry can succeed
            await supabaseAdmin.from("payment_orders").update({
              status: "failed", credited_at: null, callback_error: rpcErr.message,
            }).eq("id", order.id);
            return Response.json({ status: "error", message: rpcErr.message }, { status: 500 });
          }
          return Response.json({ status: "ok", message: "Callback received successfully" });
        }

        if (status === "failed" || status === "cancelled") {
          await supabaseAdmin
            .from("payment_orders")
            .update({
              status: "failed", raw_callback: payload,
              callback_received_at: now,
              signature_status: amountMatches && currencyMatches ? "valid" : "invalid",
              callback_error: status,
            })
            .eq("id", order.id);
          return Response.json({ status: "ok", message: "Callback received successfully" });
        }

        // pending or unknown
        await supabaseAdmin
          .from("payment_orders")
          .update({
            status: status || "pending", raw_callback: payload,
            callback_received_at: now,
          })
          .eq("id", order.id);
        return Response.json({ status: "ok", message: "Callback received successfully" });
      },
      GET: async () => Response.json({ status: "ok" }),
    },
  },
});