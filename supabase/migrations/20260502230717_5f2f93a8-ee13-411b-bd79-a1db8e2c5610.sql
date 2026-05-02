
-- Index for fast filtering by client_id + time range
CREATE INDEX IF NOT EXISTS idx_request_logs_client_created
  ON public.request_logs (client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_clients_user
  ON public.api_clients (user_id);

-- Per-API-key aggregated stats (all-time)
CREATE OR REPLACE VIEW public.client_usage_stats
WITH (security_invoker = true) AS
SELECT
  c.id              AS client_id,
  c.user_id         AS user_id,
  COUNT(l.id)::bigint                                            AS total_requests,
  COUNT(l.id) FILTER (WHERE l.success = true)::bigint            AS success_count,
  COUNT(l.id) FILTER (WHERE l.success = false)::bigint           AS error_count,
  MAX(l.created_at)                                              AS last_request_at
FROM public.api_clients c
LEFT JOIN public.request_logs l ON l.client_id = c.id
GROUP BY c.id, c.user_id;

-- Per-user aggregated stats (all-time) for admin dashboard
CREATE OR REPLACE VIEW public.user_usage_stats
WITH (security_invoker = true) AS
SELECT
  c.user_id                                                      AS user_id,
  COUNT(l.id)::bigint                                            AS total_requests,
  COUNT(l.id) FILTER (WHERE l.success = true)::bigint            AS success_count,
  COUNT(l.id) FILTER (WHERE l.success = false)::bigint           AS error_count,
  MAX(l.created_at)                                              AS last_request_at
FROM public.api_clients c
LEFT JOIN public.request_logs l ON l.client_id = c.id
WHERE c.user_id IS NOT NULL
GROUP BY c.user_id;
