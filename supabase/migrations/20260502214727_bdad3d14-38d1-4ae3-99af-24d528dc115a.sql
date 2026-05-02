ALTER TABLE public.request_logs ADD COLUMN IF NOT EXISTS host text;
CREATE INDEX IF NOT EXISTS idx_request_logs_client_created ON public.request_logs(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_logs_created ON public.request_logs(created_at DESC);