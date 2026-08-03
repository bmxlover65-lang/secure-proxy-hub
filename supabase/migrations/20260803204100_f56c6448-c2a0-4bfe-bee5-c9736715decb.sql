ALTER TABLE public.api_clients
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'data',
  ADD COLUMN IF NOT EXISTS cb_getbalance boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cb_placebet boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cb_winloss boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cb_token boolean NOT NULL DEFAULT true;

ALTER TABLE public.api_clients DROP CONSTRAINT IF EXISTS api_clients_mode_chk;
ALTER TABLE public.api_clients ADD CONSTRAINT api_clients_mode_chk CHECK (mode IN ('data','callback'));

UPDATE public.api_clients SET mode = 'callback' WHERE callback_enabled = true AND mode = 'data';

ALTER TABLE public.game_tokens
  ADD COLUMN IF NOT EXISTS replay_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expired_hits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS used_ip text,
  ADD COLUMN IF NOT EXISTS used_domain text;

CREATE INDEX IF NOT EXISTS idx_game_tokens_client_created ON public.game_tokens (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_callback_logs_client_created ON public.callback_logs (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_callback_logs_type ON public.callback_logs (callback_type, created_at DESC);

CREATE OR REPLACE FUNCTION public.token_stats(_from timestamptz DEFAULT NULL, _to timestamptz DEFAULT NULL)
RETURNS TABLE(total bigint, active bigint, used bigint, expired bigint, replay_blocked bigint, expired_hits bigint)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE used_at IS NULL AND expires_at > now())::bigint,
    COUNT(*) FILTER (WHERE used_at IS NOT NULL)::bigint,
    COUNT(*) FILTER (WHERE used_at IS NULL AND expires_at <= now())::bigint,
    COALESCE(SUM(replay_count), 0)::bigint,
    COALESCE(SUM(expired_hits), 0)::bigint
  FROM public.game_tokens
  WHERE (_from IS NULL OR created_at >= _from)
    AND (_to IS NULL OR created_at <= _to);
$$;

GRANT EXECUTE ON FUNCTION public.token_stats(timestamptz, timestamptz) TO authenticated;