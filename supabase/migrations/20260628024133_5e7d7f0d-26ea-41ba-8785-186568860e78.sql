
-- ===== VAULT =====
CREATE TABLE public.vault_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vault_type text NOT NULL DEFAULT 'flexible' CHECK (vault_type IN ('flexible','locked')),
  principal numeric NOT NULL DEFAULT 0 CHECK (principal >= 0),
  interest_accrued numeric NOT NULL DEFAULT 0,
  apy numeric NOT NULL DEFAULT 8,
  lock_until timestamptz,
  goal_name text,
  goal_target numeric,
  auto_save_amount numeric DEFAULT 0,
  auto_save_frequency text CHECK (auto_save_frequency IN ('daily','weekly','monthly') OR auto_save_frequency IS NULL),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_holdings TO authenticated;
GRANT ALL ON public.vault_holdings TO service_role;
ALTER TABLE public.vault_holdings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vh own select" ON public.vault_holdings FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "vh own write" ON public.vault_holdings FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER vault_holdings_touch BEFORE UPDATE ON public.vault_holdings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== WITHDRAWAL METHODS =====
CREATE TABLE public.withdrawal_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method_type text NOT NULL CHECK (method_type IN ('bank','crypto','internal')),
  label text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.withdrawal_methods TO authenticated;
GRANT ALL ON public.withdrawal_methods TO service_role;
ALTER TABLE public.withdrawal_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wm own" ON public.withdrawal_methods FOR ALL TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid())) WITH CHECK (user_id = auth.uid());

-- ===== WITHDRAWALS =====
CREATE TABLE public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'main' CHECK (source IN ('main','vault','invest')),
  amount numeric NOT NULL CHECK (amount > 0),
  fee numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL,
  method_id uuid REFERENCES public.withdrawal_methods(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','processing','completed','rejected')),
  reference text,
  admin_note text,
  lock_tx_id uuid,
  settle_tx_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wd own select" ON public.withdrawals FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "wd own insert" ON public.withdrawals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ===== STAKING POOLS =====
CREATE TABLE public.staking_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  apy numeric NOT NULL,
  min_stake numeric NOT NULL DEFAULT 0,
  max_stake numeric,
  lock_days int NOT NULL DEFAULT 0,
  reward_frequency text NOT NULL DEFAULT 'daily' CHECK (reward_frequency IN ('daily','weekly','monthly','on_maturity')),
  capacity numeric,
  capacity_used numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','closed')),
  risk_level text NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high')),
  auto_compound_supported boolean NOT NULL DEFAULT true,
  vip_only boolean NOT NULL DEFAULT false,
  emergency_penalty_pct numeric NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.staking_pools TO authenticated;
GRANT ALL ON public.staking_pools TO service_role;
ALTER TABLE public.staking_pools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sp read active" ON public.staking_pools FOR SELECT TO authenticated USING (status <> 'closed' OR public.is_admin(auth.uid()));
CREATE TRIGGER staking_pools_touch BEFORE UPDATE ON public.staking_pools FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== USER STAKES V2 =====
CREATE TABLE public.user_stakes_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pool_id uuid NOT NULL REFERENCES public.staking_pools(id),
  principal numeric NOT NULL CHECK (principal > 0),
  rewards_accrued numeric NOT NULL DEFAULT 0,
  rewards_claimed numeric NOT NULL DEFAULT 0,
  auto_compound boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  unlock_at timestamptz,
  last_reward_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','rewarding','claimable','matured','completed','emergency_unstaked','cancelled')),
  lock_tx_id uuid,
  unlock_tx_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX user_stakes_v2_user_idx ON public.user_stakes_v2(user_id);
CREATE INDEX user_stakes_v2_pool_idx ON public.user_stakes_v2(pool_id);
GRANT SELECT ON public.user_stakes_v2 TO authenticated;
GRANT ALL ON public.user_stakes_v2 TO service_role;
ALTER TABLE public.user_stakes_v2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "us2 own select" ON public.user_stakes_v2 FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE TRIGGER user_stakes_v2_touch BEFORE UPDATE ON public.user_stakes_v2 FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== STAKING REWARDS =====
CREATE TABLE public.staking_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stake_id uuid NOT NULL REFERENCES public.user_stakes_v2(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  posted_tx_id uuid,
  claimed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX staking_rewards_user_idx ON public.staking_rewards(user_id);
CREATE INDEX staking_rewards_stake_idx ON public.staking_rewards(stake_id);
GRANT SELECT ON public.staking_rewards TO authenticated;
GRANT ALL ON public.staking_rewards TO service_role;
ALTER TABLE public.staking_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sr own" ON public.staking_rewards FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- ===== STAKING AUDIT =====
CREATE TABLE public.staking_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stake_id uuid REFERENCES public.user_stakes_v2(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.staking_audit TO authenticated;
GRANT ALL ON public.staking_audit TO service_role;
ALTER TABLE public.staking_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sa admin" ON public.staking_audit FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- ===== SEED POOLS =====
INSERT INTO public.staking_pools (slug, name, description, apy, min_stake, lock_days, reward_frequency, risk_level, auto_compound_supported, emergency_penalty_pct) VALUES
  ('flexible', 'Flexible Pool', 'Stake and unstake anytime. Lower APY, full freedom.', 6, 50, 0, 'daily', 'low', false, 0),
  ('30d', '30-Day Pool', 'Lock for 30 days for steady returns.', 10, 100, 30, 'daily', 'low', true, 5),
  ('90d', '90-Day Pool', 'Mid-term commitment with stronger APY.', 14, 250, 90, 'daily', 'medium', true, 8),
  ('180d', '180-Day Pool', 'Half-year lock for premium yield.', 18, 500, 180, 'weekly', 'medium', true, 12),
  ('365d', '365-Day Pool', 'Full-year lock for maximum APY.', 24, 1000, 365, 'monthly', 'high', true, 20),
  ('vip', 'VIP Pool', 'Invite-only elite pool with the highest rewards.', 32, 5000, 180, 'weekly', 'high', true, 15)
ON CONFLICT (slug) DO NOTHING;

UPDATE public.staking_pools SET vip_only = true WHERE slug = 'vip';

-- ===== APP CONFIG defaults =====
INSERT INTO public.app_config(key, value) VALUES
  ('vault_default_apy', '{"flexible":8,"locked":14}'::jsonb),
  ('withdrawal_fee_pct', '{"main":1,"vault":1.5,"invest":2}'::jsonb)
ON CONFLICT (key) DO NOTHING;
