
CREATE OR REPLACE FUNCTION public.client_usage_in_range(
  _client_ids uuid[],
  _from timestamptz,
  _to timestamptz
)
RETURNS TABLE (
  client_id uuid,
  total_requests bigint,
  success_count bigint,
  error_count bigint,
  last_request_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    l.client_id,
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE l.success = true)::bigint,
    COUNT(*) FILTER (WHERE l.success = false)::bigint,
    MAX(l.created_at)
  FROM public.request_logs l
  WHERE l.client_id = ANY(_client_ids)
    AND (_from IS NULL OR l.created_at >= _from)
    AND (_to   IS NULL OR l.created_at <= _to)
  GROUP BY l.client_id;
$$;

CREATE OR REPLACE FUNCTION public.user_usage_in_range(
  _from timestamptz,
  _to timestamptz
)
RETURNS TABLE (
  user_id uuid,
  total_requests bigint,
  success_count bigint,
  error_count bigint,
  last_request_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    c.user_id,
    COUNT(l.id)::bigint,
    COUNT(l.id) FILTER (WHERE l.success = true)::bigint,
    COUNT(l.id) FILTER (WHERE l.success = false)::bigint,
    MAX(l.created_at)
  FROM public.api_clients c
  JOIN public.request_logs l ON l.client_id = c.id
  WHERE c.user_id IS NOT NULL
    AND (_from IS NULL OR l.created_at >= _from)
    AND (_to   IS NULL OR l.created_at <= _to)
  GROUP BY c.user_id;
$$;
