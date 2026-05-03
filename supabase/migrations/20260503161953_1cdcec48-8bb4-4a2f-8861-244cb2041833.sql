CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON public.payment_orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON public.payment_orders (status);

CREATE OR REPLACE FUNCTION public.admin_list_payment_orders(_limit int DEFAULT 200)
RETURNS TABLE (
  id uuid, user_id uuid, email text, full_name text,
  merchant_order_no text, gateway_order_no text,
  amount_inr numeric, coins numeric, currency text,
  status text, signature_status text, callback_error text,
  payment_url text, raw_callback jsonb,
  callback_received_at timestamptz, credited_at timestamptz,
  created_at timestamptz, updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id, o.user_id, p.email, p.full_name,
    o.merchant_order_no, o.gateway_order_no,
    o.amount_inr, o.coins, o.currency,
    o.status, o.signature_status, o.callback_error,
    o.payment_url, o.raw_callback,
    o.callback_received_at, o.credited_at,
    o.created_at, o.updated_at
  FROM public.payment_orders o
  LEFT JOIN public.profiles p ON p.id = o.user_id
  ORDER BY o.created_at DESC
  LIMIT _limit;
$$;