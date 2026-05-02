
-- 1. Wallet balance on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wallet_balance numeric NOT NULL DEFAULT 0;

-- 2. App settings (key/value)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone read settings" ON public.app_settings;
CREATE POLICY "Anyone read settings" ON public.app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage settings" ON public.app_settings;
CREATE POLICY "Admins manage settings" ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

INSERT INTO public.app_settings(key,value) VALUES
  ('coins_per_api_key', '1000'::jsonb),
  ('paise_per_1000_coins', '2000'::jsonb),
  ('signup_bonus_coins', '0'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 3. Coin transactions
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL,
  reason text,
  reference text,
  status text NOT NULL DEFAULT 'success',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coin_transactions_user_idx ON public.coin_transactions(user_id, created_at DESC);

ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own tx" ON public.coin_transactions;
CREATE POLICY "Users view own tx" ON public.coin_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage tx" ON public.coin_transactions;
CREATE POLICY "Admins manage tx" ON public.coin_transactions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

-- 4. Update handle_new_user to also create reseller role + wallet
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE bonus numeric;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, wallet_balance)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 0)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'reseller'::app_role)
  ON CONFLICT DO NOTHING;

  SELECT (value)::text::numeric INTO bonus FROM public.app_settings WHERE key='signup_bonus_coins';
  IF bonus IS NOT NULL AND bonus > 0 THEN
    UPDATE public.profiles SET wallet_balance = wallet_balance + bonus WHERE id = NEW.id;
    INSERT INTO public.coin_transactions(user_id, amount, type, reason)
    VALUES (NEW.id, bonus, 'signup_bonus', 'Welcome bonus');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Atomic wallet adjustment
CREATE OR REPLACE FUNCTION public.adjust_wallet(
  _user_id uuid, _delta numeric, _type text, _reason text, _reference text
) RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE new_bal numeric;
BEGIN
  UPDATE public.profiles SET wallet_balance = wallet_balance + _delta
  WHERE id = _user_id RETURNING wallet_balance INTO new_bal;
  IF new_bal IS NULL THEN RAISE EXCEPTION 'profile_not_found'; END IF;
  IF new_bal < 0 THEN RAISE EXCEPTION 'insufficient_balance'; END IF;
  INSERT INTO public.coin_transactions(user_id, amount, type, reason, reference)
  VALUES (_user_id, _delta, _type, _reason, _reference);
  RETURN new_bal;
END $$;

-- 6. Reseller-scoped RLS on api_clients / allowed_ips / allowed_domains / request_logs
DROP POLICY IF EXISTS "Resellers manage own clients" ON public.api_clients;
CREATE POLICY "Resellers manage own clients" ON public.api_clients FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "Resellers manage own ips" ON public.allowed_ips;
CREATE POLICY "Resellers manage own ips" ON public.allowed_ips FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'admin'::app_role) OR
    EXISTS (SELECT 1 FROM public.api_clients c WHERE c.id = allowed_ips.client_id AND c.user_id = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin'::app_role) OR
    EXISTS (SELECT 1 FROM public.api_clients c WHERE c.id = allowed_ips.client_id AND c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Resellers manage own domains" ON public.allowed_domains;
CREATE POLICY "Resellers manage own domains" ON public.allowed_domains FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'admin'::app_role) OR
    EXISTS (SELECT 1 FROM public.api_clients c WHERE c.id = allowed_domains.client_id AND c.user_id = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin'::app_role) OR
    EXISTS (SELECT 1 FROM public.api_clients c WHERE c.id = allowed_domains.client_id AND c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Resellers view own logs" ON public.request_logs;
CREATE POLICY "Resellers view own logs" ON public.request_logs FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin'::app_role) OR
    EXISTS (SELECT 1 FROM public.api_clients c WHERE c.id = request_logs.client_id AND c.user_id = auth.uid())
  );
