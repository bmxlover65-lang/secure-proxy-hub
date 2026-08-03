CREATE INDEX IF NOT EXISTS idx_request_logs_failed_created
  ON public.request_logs (created_at DESC)
  WHERE success = false;

CREATE INDEX IF NOT EXISTS idx_callback_logs_failed_created
  ON public.callback_logs (created_at DESC)
  WHERE success = false;

CREATE INDEX IF NOT EXISTS idx_request_logs_created_at
  ON public.request_logs (created_at DESC);