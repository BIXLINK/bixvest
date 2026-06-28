
-- 1. Extend tx_type enum
ALTER TYPE public.tx_type ADD VALUE IF NOT EXISTS 'vault_deposit';
ALTER TYPE public.tx_type ADD VALUE IF NOT EXISTS 'vault_withdraw';
ALTER TYPE public.tx_type ADD VALUE IF NOT EXISTS 'vault_interest';
ALTER TYPE public.tx_type ADD VALUE IF NOT EXISTS 'transfer_in';
ALTER TYPE public.tx_type ADD VALUE IF NOT EXISTS 'transfer_out';
ALTER TYPE public.tx_type ADD VALUE IF NOT EXISTS 'withdrawal';
ALTER TYPE public.tx_type ADD VALUE IF NOT EXISTS 'staking_reward';
ALTER TYPE public.tx_type ADD VALUE IF NOT EXISTS 'stake_v2_lock';
ALTER TYPE public.tx_type ADD VALUE IF NOT EXISTS 'stake_v2_unlock';
ALTER TYPE public.tx_type ADD VALUE IF NOT EXISTS 'stake_v2_penalty';
