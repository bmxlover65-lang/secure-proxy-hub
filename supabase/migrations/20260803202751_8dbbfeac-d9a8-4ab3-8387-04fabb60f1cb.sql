-- Callback / token integration mode
ALTER TABLE public.api_clients
  ADD COLUMN IF NOT EXISTS callback_url text,
  ADD COLUMN IF NOT EXISTS callback_secret text,
  ADD COLUMN IF NOT EXISTS callback_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS token_ttl_seconds integer NOT NULL DEFAULT 300;

CREATE TABLE IF NOT EXISTS public.game_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.api_clients(id) ON DELETE CASCADE,
  token text NOT NULL,
  external_user_id text NOT NULL,
  domain text,
  ip_address text,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS game_tokens_client_token_key ON public.game_tokens (client_id, token);
CREATE INDEX IF NOT EXISTS game_tokens_expires_idx ON public.game_tokens (expires_at);

GRANT SELECT ON public.game_tokens TO authenticated;
GRANT ALL ON public.game_tokens TO service_role;
ALTER TABLE public.game_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage tokens" ON public.game_tokens FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Resellers view own tokens" ON public.game_tokens FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.api_clients c WHERE c.id = game_tokens.client_id AND c.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.callback_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.api_clients(id) ON DELETE SET NULL,
  callback_type text NOT NULL,
  external_user_id text,
  token text,
  amount numeric,
  new_balance numeric,
  status_code integer,
  success boolean NOT NULL DEFAULT false,
  signature_status text,
  error_message text,
  ip_address text,
  host text,
  response_time_ms integer,
  request_payload jsonb,
  response_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS callback_logs_client_created_idx ON public.callback_logs (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS callback_logs_created_idx ON public.callback_logs (created_at DESC);

GRANT SELECT ON public.callback_logs TO authenticated;
GRANT ALL ON public.callback_logs TO service_role;
ALTER TABLE public.callback_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage callback logs" ON public.callback_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Resellers view own callback logs" ON public.callback_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.api_clients c WHERE c.id = callback_logs.client_id AND c.user_id = auth.uid()));