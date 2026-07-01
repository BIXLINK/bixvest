
-- =========================================================
-- 1) MULTI-TIER REFERRAL SUPPORT
-- =========================================================
ALTER TABLE public.referral_rewards
  ADD COLUMN IF NOT EXISTS tier smallint NOT NULL DEFAULT 1;

-- Replace the old unique constraint so we can have up to 3 rows per referrer/referred pair
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'referral_rewards_referrer_id_referred_id_key'
  ) THEN
    ALTER TABLE public.referral_rewards
      DROP CONSTRAINT referral_rewards_referrer_id_referred_id_key;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'referral_rewards_referrer_referred_tier_key'
  ) THEN
    ALTER TABLE public.referral_rewards
      ADD CONSTRAINT referral_rewards_referrer_referred_tier_key
      UNIQUE (referrer_id, referred_id, tier);
  END IF;
END $$;

-- Config defaults for tier payouts
INSERT INTO public.app_config(key, value) VALUES
  ('referral_reward_tier1', to_jsonb(500)),
  ('referral_reward_tier2', to_jsonb(100)),
  ('referral_reward_tier3', to_jsonb(50))
ON CONFLICT (key) DO NOTHING;

-- =========================================================
-- 2) SECURITY FIXES
-- =========================================================

-- 2a) Remove hardcoded admin email backdoor from signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  ref_code_input TEXT;
  ref_id UUID;
BEGIN
  ref_code_input := NEW.raw_user_meta_data->>'referral_code';
  IF ref_code_input IS NOT NULL AND length(ref_code_input) > 0 THEN
    SELECT id INTO ref_id FROM public.profiles WHERE referral_code = upper(ref_code_input);
  END IF;

  INSERT INTO public.profiles (id, full_name, email, referral_code, referred_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    public.generate_referral_code(),
    ref_id
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  IF ref_id IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_id) VALUES (ref_id, NEW.id) ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2b) Stakes: revoke direct user INSERT (all inserts must go through stakeVst)
DROP POLICY IF EXISTS "Users insert own stakes" ON public.stakes;
DROP POLICY IF EXISTS "stakes own insert" ON public.stakes;
REVOKE INSERT, UPDATE, DELETE ON public.stakes FROM authenticated;

-- 2c) Task submissions: force pending + 0 VST on user insert
DROP POLICY IF EXISTS "Users insert own submissions" ON public.task_submissions;
DROP POLICY IF EXISTS "ts own insert" ON public.task_submissions;
CREATE POLICY "ts own insert restricted" ON public.task_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND COALESCE(vst_awarded, 0) = 0
  );

-- 2d) Vault holdings: block direct user writes
DROP POLICY IF EXISTS "vh own write" ON public.vault_holdings;
DROP POLICY IF EXISTS "vault_holdings own write" ON public.vault_holdings;
REVOKE INSERT, UPDATE, DELETE ON public.vault_holdings FROM authenticated;

-- 2e) Withdrawals: block direct user insert
DROP POLICY IF EXISTS "wd own insert" ON public.withdrawals;
DROP POLICY IF EXISTS "withdrawals own insert" ON public.withdrawals;
REVOKE INSERT, UPDATE, DELETE ON public.withdrawals FROM authenticated;

-- 2f) Withdrawal methods: keep user-owned writes but never allow verified=true
DROP POLICY IF EXISTS "wm own" ON public.withdrawal_methods;
DROP POLICY IF EXISTS "withdrawal_methods own" ON public.withdrawal_methods;
CREATE POLICY "wm own read" ON public.withdrawal_methods
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "wm own insert" ON public.withdrawal_methods
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND COALESCE(verified, false) = false);
CREATE POLICY "wm own update" ON public.withdrawal_methods
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND COALESCE(verified, false) = false);
CREATE POLICY "wm own delete" ON public.withdrawal_methods
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 2g) app_config: only expose whitelisted client-safe keys
DROP POLICY IF EXISTS "config readable by authenticated" ON public.app_config;
CREATE POLICY "config readable whitelisted" ON public.app_config
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR key = ANY (ARRAY[
      'referral_reward',
      'referral_reward_tier1',
      'referral_reward_tier2',
      'referral_reward_tier3',
      'daily_login_reward',
      'daily_learning_reward',
      'daily_community_reward',
      'bix_score_weights'
    ])
  );

-- 2h) VIP flag on profiles for pool gating
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_vip boolean NOT NULL DEFAULT false;

-- =========================================================
-- 3) PERFORMANCE INDEXES
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by
  ON public.profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_created
  ON public.wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer
  ON public.referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_stakes_v2_user_status
  ON public.user_stakes_v2(user_id, status);
CREATE INDEX IF NOT EXISTS idx_task_submissions_user_status
  ON public.task_submissions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_missions_user_status
  ON public.user_missions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_daily_claims_user_date
  ON public.daily_claims(user_id, claim_date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);
