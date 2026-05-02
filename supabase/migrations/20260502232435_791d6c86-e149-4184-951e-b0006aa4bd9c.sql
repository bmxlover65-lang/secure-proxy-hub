
-- Add columns to payment_orders for callback diagnostics
ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS signature_status text,
  ADD COLUMN IF NOT EXISTS callback_error text,
  ADD COLUMN IF NOT EXISTS callback_received_at timestamptz,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS credited_at timestamptz;

-- Idempotency: prevent double-credit. Reference will be the payment_orders.id for topups.
CREATE UNIQUE INDEX IF NOT EXISTS coin_tx_topup_reference_uniq
  ON public.coin_transactions (reference)
  WHERE type = 'topup' AND reference IS NOT NULL;
