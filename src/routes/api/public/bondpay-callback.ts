import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/bondpay-callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: Record<string, unknown> = {};
        try { payload = await request.json(); } catch { /* ignore */ }

        const merchantOrder = String(payload.merchantOrder ?? payload.merchant_order_no ?? "");
        const status = String(payload.status ?? "").toLowerCase();
        const gatewayOrder = String(payload.orderNo ?? payload.order_no ?? "");

        if (!merchantOrder) {
          return Response.json({ status: "error", message: "missing merchantOrder" }, { status: 400 });
        }

        const { data: order } = await supabaseAdmin
          .from("payment_orders")
          .select("id,user_id,coins,status,amount_inr")
          .eq("merchant_order_no", merchantOrder)
          .maybeSingle();

        if (!order) {
          return Response.json({ status: "error", message: "order not found" }, { status: 404 });
        }

        // Idempotency: if already success, just ack
        if (order.status === "success") {
          return Response.json({ status: "ok", message: "already credited" });
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
            return Response.json({ status: "error", message: rpcErr.message }, { status: 500 });
          }
          await supabaseAdmin
            .from("payment_orders")
            .update({ status: "success", gateway_order_no: gatewayOrder || null, raw_callback: payload })
            .eq("id", order.id);
          return Response.json({ status: "ok", message: "Callback received successfully" });
        }

        if (status === "failed" || status === "cancelled") {
          await supabaseAdmin
            .from("payment_orders")
            .update({ status: "failed", raw_callback: payload })
            .eq("id", order.id);
          return Response.json({ status: "ok", message: "Callback received successfully" });
        }

        // pending or unknown
        await supabaseAdmin
          .from("payment_orders")
          .update({ status: status || "pending", raw_callback: payload })
          .eq("id", order.id);
        return Response.json({ status: "ok", message: "Callback received successfully" });
      },
      GET: async () => Response.json({ status: "ok" }),
    },
  },
});