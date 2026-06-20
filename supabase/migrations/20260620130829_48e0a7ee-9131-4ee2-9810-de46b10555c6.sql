
-- =========================================================
-- BIXVEST PHASE 2 — Ecosystem Schema
-- =========================================================

-- ---------- PROFILES extensions ----------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bix_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bix_level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_claim_date date,
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_normalized text;

UPDATE public.profiles SET email_normalized = lower(email) WHERE email_normalized IS NULL AND email IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_email_normalized_idx ON public.profiles(email_normalized);

-- ---------- WALLET_TRANSACTIONS ledger upgrade ----------
ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS destination text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'confirmed',
  ADD COLUMN IF NOT EXISTS tx_ref uuid NOT NULL DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS wallet_tx_user_created_idx ON public.wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS wallet_tx_type_idx ON public.wallet_transactions(type);

-- ---------- CAMPAIGNS extensions ----------
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS budget numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS min_bix_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS start_at timestamptz,
  ADD COLUMN IF NOT EXISTS end_at timestamptz;

-- =========================================================
-- APP CONFIG (key/value)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
GRANT SELECT ON public.app_config TO authenticated;
GRANT ALL ON public.app_config TO service_role;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "config readable by authenticated" ON public.app_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "config managed by admin" ON public.app_config FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.app_config(key, value) VALUES
  ('daily_login_reward', '50'::jsonb),
  ('daily_learning_reward', '100'::jsonb),
  ('daily_community_reward', '200'::jsonb),
  ('referral_reward', '500'::jsonb),
  ('mission_rewards', '{"complete_profile":100,"verify_email":200,"explore_dashboard":100,"first_campaign":500}'::jsonb),
  ('bix_score_weights', '{"task":5,"daily":2,"referral":20,"mission":3,"campaign":10}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- =========================================================
-- ONBOARDING MISSIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.onboarding_missions (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  reward integer NOT NULL DEFAULT 0,
  order_index integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.onboarding_missions TO authenticated;
GRANT ALL ON public.onboarding_missions TO service_role;
ALTER TABLE public.onboarding_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "missions readable by authenticated" ON public.onboarding_missions FOR SELECT TO authenticated USING (true);
CREATE POLICY "missions managed by admin" ON public.onboarding_missions FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.onboarding_missions(id, title, description, reward, order_index) VALUES
  ('complete_profile','Complete your profile','Fill in your full name to personalize your account.',100,1),
  ('verify_email','Verify your email','Confirm your email to secure your account.',200,2),
  ('explore_dashboard','Explore your dashboard','Visit your dashboard to see your VST balance and stats.',100,3),
  ('first_campaign','Complete your first campaign','Participate in any campaign to start your journey.',500,4)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id text NOT NULL REFERENCES public.onboarding_missions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending', -- pending | completed
  completed_at timestamptz,
  vst_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_id)
);
GRANT SELECT, INSERT, UPDATE ON public.user_missions TO authenticated;
GRANT ALL ON public.user_missions TO service_role;
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_missions own select" ON public.user_missions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "user_missions admin all" ON public.user_missions FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================
-- DAILY CLAIMS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.daily_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_type text NOT NULL, -- login | learning | community
  claim_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  amount integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, claim_type, claim_date)
);
GRANT SELECT, INSERT ON public.daily_claims TO authenticated;
GRANT ALL ON public.daily_claims TO service_role;
ALTER TABLE public.daily_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_claims own select" ON public.daily_claims FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- =========================================================
-- REFERRAL REWARDS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'paid',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);
GRANT SELECT ON public.referral_rewards TO authenticated;
GRANT ALL ON public.referral_rewards TO service_role;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referral_rewards own select" ON public.referral_rewards FOR SELECT TO authenticated USING (referrer_id = auth.uid() OR referred_id = auth.uid() OR public.is_admin(auth.uid()));

-- =========================================================
-- CAMPAIGN PARTICIPATIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.campaign_participations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  proof text DEFAULT '',
  vst_awarded integer NOT NULL DEFAULT 0,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);
GRANT SELECT, INSERT ON public.campaign_participations TO authenticated;
GRANT ALL ON public.campaign_participations TO service_role;
ALTER TABLE public.campaign_participations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cp own select" ON public.campaign_participations FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "cp own insert" ON public.campaign_participations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "cp admin all" ON public.campaign_participations FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================
-- AUDIT LOG
-- =========================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  target_type text,
  target_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit admin only" ON public.audit_log FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON public.audit_log(created_at DESC);

-- =========================================================
-- RATE LIMITS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rate_limits TO authenticated;
GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rate_limits admin select" ON public.rate_limits FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE INDEX IF NOT EXISTS rate_limits_user_action_idx ON public.rate_limits(user_id, action, created_at DESC);

-- =========================================================
-- INVEST MODULE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.invest_wallet (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric NOT NULL DEFAULT 0,
  locked numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.invest_wallet TO authenticated;
GRANT ALL ON public.invest_wallet TO service_role;
ALTER TABLE public.invest_wallet ENABLE ROW LEVEL SECURITY;
CREATE POLICY "iw own select" ON public.invest_wallet FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "iw admin all" ON public.invest_wallet FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.invest_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  min_amount numeric NOT NULL DEFAULT 0,
  apr numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft', -- draft | active | closed
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.invest_products TO authenticated;
GRANT ALL ON public.invest_products TO service_role;
ALTER TABLE public.invest_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ip select active or admin" ON public.invest_products FOR SELECT TO authenticated USING (status = 'active' OR public.is_admin(auth.uid()));
CREATE POLICY "ip admin all" ON public.invest_products FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.invest_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.invest_products(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);
GRANT SELECT ON public.invest_holdings TO authenticated;
GRANT ALL ON public.invest_holdings TO service_role;
ALTER TABLE public.invest_holdings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ih own select" ON public.invest_holdings FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "ih admin all" ON public.invest_holdings FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.invest_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL, -- deposit | withdraw | buy | sell | yield
  amount numeric NOT NULL,
  balance_after numeric NOT NULL DEFAULT 0,
  reference_id uuid,
  note text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.invest_transactions TO authenticated;
GRANT ALL ON public.invest_transactions TO service_role;
ALTER TABLE public.invest_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "it own select" ON public.invest_transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- =========================================================
-- FUNCTIONS
-- =========================================================

-- Atomic ledger post (returns new balance). Updates profile + inserts wallet_transaction.
CREATE OR REPLACE FUNCTION public.post_ledger(
  _user_id uuid,
  _type text,
  _amount numeric,
  _source text DEFAULT 'system',
  _destination text DEFAULT 'user',
  _note text DEFAULT '',
  _reference_table text DEFAULT NULL,
  _reference_id uuid DEFAULT NULL
) RETURNS TABLE(tx_id uuid, balance_after numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cur numeric;
  new_bal numeric;
  new_tx uuid;
BEGIN
  SELECT vst_balance INTO cur FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF cur IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  new_bal := cur + _amount;
  IF new_bal < 0 THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  UPDATE public.profiles SET vst_balance = new_bal WHERE id = _user_id;

  INSERT INTO public.wallet_transactions(user_id, type, amount, balance_after, note, reference_table, reference_id, source, destination, status)
  VALUES (_user_id, _type, _amount, new_bal, _note, _reference_table, _reference_id, _source, _destination, 'confirmed')
  RETURNING id INTO new_tx;

  RETURN QUERY SELECT new_tx, new_bal;
END;
$$;

-- Recompute BIX score from activity
CREATE OR REPLACE FUNCTION public.recompute_bix_score(_user_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  weights jsonb;
  task_count int := 0;
  daily_count int := 0;
  ref_count int := 0;
  mission_count int := 0;
  campaign_count int := 0;
  score int := 0;
  lvl int := 1;
BEGIN
  SELECT value INTO weights FROM public.app_config WHERE key='bix_score_weights';
  IF weights IS NULL THEN weights := '{"task":5,"daily":2,"referral":20,"mission":3,"campaign":10}'::jsonb; END IF;

  SELECT count(*) INTO task_count FROM public.task_submissions WHERE user_id=_user_id AND status='approved';
  SELECT count(*) INTO daily_count FROM public.daily_claims WHERE user_id=_user_id;
  SELECT count(*) INTO ref_count FROM public.referral_rewards WHERE referrer_id=_user_id;
  SELECT count(*) INTO mission_count FROM public.user_missions WHERE user_id=_user_id AND status='completed';
  SELECT count(*) INTO campaign_count FROM public.campaign_participations WHERE user_id=_user_id AND status='approved';

  score := task_count * COALESCE((weights->>'task')::int,5)
         + daily_count * COALESCE((weights->>'daily')::int,2)
         + ref_count * COALESCE((weights->>'referral')::int,20)
         + mission_count * COALESCE((weights->>'mission')::int,3)
         + campaign_count * COALESCE((weights->>'campaign')::int,10);

  lvl := 1 + floor(score / 100);

  UPDATE public.profiles SET bix_score = score, bix_level = lvl WHERE id = _user_id;
  RETURN score;
END;
$$;

-- Rate limit check
CREATE OR REPLACE FUNCTION public.check_rate_limit(_user_id uuid, _action text, _max int, _window_seconds int)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c int;
BEGIN
  SELECT count(*) INTO c FROM public.rate_limits
   WHERE user_id=_user_id AND action=_action AND created_at > now() - make_interval(secs => _window_seconds);
  IF c >= _max THEN RETURN false; END IF;
  INSERT INTO public.rate_limits(user_id, action) VALUES (_user_id, _action);
  RETURN true;
END;
$$;

-- Audit log helper
CREATE OR REPLACE FUNCTION public.log_audit(_actor uuid, _action text, _target_type text, _target_id text, _payload jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.audit_log(actor_id, action, target_type, target_id, payload)
  VALUES (_actor, _action, _target_type, _target_id, _payload);
$$;

-- Update generate_referral_code to BIX- format
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  candidate text;
  exists_count int;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
BEGIN
  LOOP
    candidate := 'BIX-';
    FOR i IN 1..5 LOOP
      candidate := candidate || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    SELECT count(*) INTO exists_count FROM public.profiles WHERE referral_code = candidate;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN candidate;
END;
$$;

-- Touch updated_at for invest_wallet
DROP TRIGGER IF EXISTS touch_invest_wallet ON public.invest_wallet;
CREATE TRIGGER touch_invest_wallet BEFORE UPDATE ON public.invest_wallet FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS touch_invest_products ON public.invest_products;
CREATE TRIGGER touch_invest_products BEFORE UPDATE ON public.invest_products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

