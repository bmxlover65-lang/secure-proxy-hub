CREATE TABLE public.integration_config (
  id text PRIMARY KEY DEFAULT 'default',
  hyper_base text NOT NULL DEFAULT 'https://sass.hyperapi.in',
  hyper_data_key text,
  hyper_cb_key text,
  hyper_cb_secret text,
  hyper_token_ttl integer NOT NULL DEFAULT 300,
  enforce_config boolean NOT NULL DEFAULT false,
  allowed_categories text[] NOT NULL DEFAULT ARRAY['wingo','k3','d5','motorace'],
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.integration_config TO authenticated;
GRANT ALL ON public.integration_config TO service_role;

ALTER TABLE public.integration_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage integration config"
ON public.integration_config FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER integration_config_updated
BEFORE UPDATE ON public.integration_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

INSERT INTO public.integration_config (id) VALUES ('default');