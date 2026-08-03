ALTER TABLE public.allowed_domains ADD COLUMN IF NOT EXISTS op text;
ALTER TABLE public.allowed_ips ADD COLUMN IF NOT EXISTS op text;
CREATE INDEX IF NOT EXISTS idx_allowed_domains_client_op ON public.allowed_domains(client_id, op);
CREATE INDEX IF NOT EXISTS idx_allowed_ips_client_op ON public.allowed_ips(client_id, op);