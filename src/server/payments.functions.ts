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

async function getPaisePer1000(): Promise<number> {
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

    const paisePer1000 = await getPaisePer1000();
    const inr = (data.coins / 1000) * (paisePer1000 / 100);
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

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error || !data) throw new Error("Forbidden: admin only");
}

export const adminListPaymentOrders = createServerFn({ method: "GET" })
  .middleware([sendSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin.rpc("admin_list_payment_orders", { _limit: 200 });
    if (error) throw new Error(error.message);
    return { orders: (data ?? []) as Array<{
      id: string; user_id: string; email: string | null; full_name: string | null;
      merchant_order_no: string; gateway_order_no: string | null;
      amount_inr: number; coins: number; currency: string;
      status: string; signature_status: string | null; callback_error: string | null;
      payment_url: string | null; raw_callback: unknown;
      callback_received_at: string | null; credited_at: string | null;
      created_at: string; updated_at: string;
    }> };
  });