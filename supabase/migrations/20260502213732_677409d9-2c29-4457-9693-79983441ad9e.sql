
ALTER TABLE public.api_clients
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'wingo',
  ADD COLUMN IF NOT EXISTS duration_days integer,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

ALTER TABLE public.api_clients
  DROP COLUMN IF EXISTS rate_limit_per_minute;

ALTER TABLE public.request_logs
  ADD COLUMN IF NOT EXISTS type text;
