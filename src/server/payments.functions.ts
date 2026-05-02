import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendSupabaseAuth } from "@/lib/server-function-auth";
import { getRequestHost } from "@tanstack/react-start/server";

const BONDPAY_CREATE_URL = "https://api.bond-pays.com/v1/create";

function md5(s: string) {
  return createHash("md5").update(s).digest("hex");
}

async function getInrPer1000(): Promise<number> {
  const { data } = await supabaseAdmin.from("app_settings").select("value").eq("key", "paise_per_1000_coins").maybeSingle();
  const v = data?.value;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : 2000;
}

export const createTopupOrder = createServerFn({ method: "POST" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      coins: z.number().int().min(1000).max(10_000_000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const merchantId = process.env.BONDPAY_MERCHANT_ID;
    const apiKey = process.env.BONDPAY_API_KEY;
    if (!merchantId || !apiKey) throw new Error("Payment gateway not configured");

    const inrPer1000 = await getInrPer1000();
    const inr = (data.coins / 1000) * inrPer1000;
    const amountStr = inr.toFixed(2);

    const merchantOrderNo = `HSO_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    // Build callback URL from request host
    let host = "";
    try { host = getRequestHost(); } catch { /* ignore */ }
    const baseUrl = host ? `https://${host}` : "https://sass.hyperapi.in";
    const callbackUrl = `${baseUrl}/api/public/bondpay-callback`;

    const signature = md5(`${merchantId}${amountStr}${merchantOrderNo}${apiKey}${callbackUrl}`);

    const payload = {
      merchant_id: merchantId,
      api_key: apiKey,
      amount: amountStr,
      merchant_order_no: merchantOrderNo,
      callback_url: callbackUrl,
      extra: 0,
      signature,
    };

    const res = await fetch(BONDPAY_CREATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body?.success || !body?.payment_url) {
      throw new Error(body?.message || `Gateway error (${res.status})`);
    }

    await supabaseAdmin.from("payment_orders").insert({
      user_id: context.userId,
      merchant_order_no: merchantOrderNo,
      gateway_order_no: body.order_no ?? null,
      amount_inr: inr,
      coins: data.coins,
      status: "pending",
      payment_url: body.payment_url,
      currency: "INR",
    });

    return { payment_url: body.payment_url as string, merchant_order_no: merchantOrderNo, amount_inr: inr, coins: data.coins };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin
      .from("payment_orders")
      .select("id,merchant_order_no,gateway_order_no,amount_inr,coins,status,payment_url,created_at,updated_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return { orders: data ?? [] };
  });

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (!roleRow) throw new Error("Forbidden: admin only");

    const { data: orders } = await supabaseAdmin
      .from("payment_orders")
      .select("id,user_id,merchant_order_no,gateway_order_no,amount_inr,coins,currency,status,payment_url,signature_status,callback_error,callback_received_at,credited_at,raw_callback,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(200);

    const userIds = Array.from(new Set((orders ?? []).map((o) => o.user_id)));
    const { data: profiles } = userIds.length
      ? await supabaseAdmin.from("profiles").select("id,email,full_name").in("id", userIds)
      : { data: [] as Array<{ id: string; email: string | null; full_name: string | null }> };
    const map: Record<string, { email: string | null; full_name: string | null }> = {};
    (profiles ?? []).forEach((p) => { map[p.id] = { email: p.email, full_name: p.full_name }; });

    return {
      orders: (orders ?? []).map((o) => ({ ...o, user: map[o.user_id] ?? null })),
    };
  });