# BIXVEST Premium Redesign Plan

A scoped, **backward-compatible** redesign that turns BIXVEST into a fintech-style platform. **No data loss. No ledger replacement.** Every change extends the existing schema and reuses `post_ledger`, `wallet_transactions`, `profiles`, `stakes`, `stake_levels`, `invest_*`, `payments`, and `activation_codes`.

---

## Guiding rules

- Existing tables, RLS, GRANTs, roles, and server functions stay intact.
- All money movements continue to go through `post_ledger` (single source of truth).
- New tables are additive only — no destructive migrations.
- Existing routes keep working during the transition; new routes added alongside, old ones redirected when replaced.
- Theme + animation system already shipped — reused, not rebuilt.

---

## 1. Navigation & shell

Update `src/components/app-layout.tsx`:

- Top-level: **Dashboard · Wallet · Staking · Rewards · Referrals · Profile**
- Wallet becomes a **section** with sub-tabs: Overview · Deposit · Withdraw · Transfer · Smart Vault · Investments · History
- Staking sub-tabs: Overview · Pools · Active Stakes · Rewards · Analytics · History
- Mobile: bottom nav (Dashboard / Wallet / Stake / Rewards / Profile) + drawer
- Desktop: persistent sidebar with grouped sections

---

## 2. Wallet hub (`/wallet`)

Rebuild `src/routes/_authenticated/wallet.tsx` as a tabbed hub:

- **Overview** — animated balance cards:
  - Available, Locked, Vault, Investment, Total Staked, Pending W/D, Pending Deposits, Total Earnings, Today's Earnings
  - All values computed from `profiles` + aggregations on `wallet_transactions`, `stakes`, `invest_holdings`, new `vault_holdings`, `withdrawals` tables
  - Quick actions: Deposit · Withdraw · Transfer · Vault · Invest
  - Recent transactions (last 10) with rich rows (type, amount, status, date, time, network, ref id)
- **Deposit** (`/wallet/deposit`) — reuses activation/payment flow; shows pending payments
- **Withdraw** (`/wallet/withdraw`) — replaces standalone `/withdraw` route, real submission to new `withdrawals` table
- **Transfer** (`/wallet/transfer`) — peer-to-peer VST via `post_ledger` (debit sender, credit recipient atomically in a new `transfer_vst` server fn)
- **Smart Vault** (`/wallet/vault`) — moved under wallet
- **Investments** (`/wallet/invest`) — moved under wallet (reuses existing `invest_*` tables)
- **History** (`/wallet/history`) — full filterable ledger view (existing logic moved here)

Old `/vault`, `/invest`, `/withdraw` routes → redirect to new paths.

---

## 3. Smart Vault

Currently `/vault` exists but is thin. Extend with:

New tables (additive):
- `vault_holdings` (user_id, type: flexible|locked, principal, interest_accrued, apy, lock_until, goal_name, goal_target, auto_save_amount, auto_save_frequency)
- `vault_transactions` is **not** new — reuse `wallet_transactions` with `type='vault_deposit'|'vault_withdraw'|'vault_interest'` (add enum values).

Features:
- Deposit / Withdraw / Auto-Save toggle / Savings Goals / Lock period selection
- Daily interest accrual via scheduled server fn (`accrueVaultInterest`)
- Dashboard: Vault Balance, Interest Earned, Locked, Available, Projected Interest (line chart)

---

## 4. Investments

Existing `invest_products`, `invest_holdings`, `invest_transactions`, `invest_wallet` stay. Add:

- Portfolio header: Total Value, Active, Completed, Pending, Total Profit, Unrealized Profit
- Per-investment cards with progress bar to maturity, ROI %, status badges, actions: View · Reinvest · Withdraw Profit
- Detail drawer with full timeline

---

## 5. Withdrawals (new module)

New tables:
- `withdrawal_methods` (user_id, type: bank|crypto|internal, label, details jsonb, verified, created_at)
- `withdrawals` (user_id, source: main|vault|invest, amount, fee, net_amount, method_id, status: pending|approved|processing|completed|rejected, reference, admin_note, created_at, processed_at)

Flow: Source → Amount → Destination → Review → Submit → Pending → Admin approval → Completed. Locks VST via `post_ledger` (`stake_lock`-style) on submit, releases on rejection, debits permanently on completion. Admin queue under `/admin/withdrawals`.

---

## 6. Staking redesign

New tables (additive — keeps existing `stakes` & `stake_levels`):
- `staking_pools` (id, name, slug, apy, min_stake, max_stake, lock_days, reward_frequency: daily|weekly|monthly|on_maturity, capacity, capacity_used, status: active|paused|closed, risk_level, auto_compound_supported, vip_only)
- `user_stakes_v2` (pool_id, user_id, principal, rewards_accrued, rewards_claimed, auto_compound, started_at, unlock_at, last_reward_at, status: pending|active|rewarding|claimable|matured|completed|emergency_unstaked|cancelled)
- `staking_rewards` (stake_id, user_id, amount, period_start, period_end, posted_tx_id)
- `staking_audit` (stake_id, actor_id, action, payload jsonb)

Existing `stakes` table is **kept intact** and read-only for legacy display; new stakes go into `user_stakes_v2`. Migration seeds 6 default pools (Flexible, 30d, 90d, 180d, 365d, VIP).

Pages:
- `/staking` Overview — Total Staked, Est. APY (weighted), Rewards Earned, Pending Rewards, Next Reward Time, Active Pools, Portfolio Allocation donut
- `/staking/pools` — pool grid w/ capacity bars, APY, lock, status
- `/staking/active` — active stake cards w/ progress, claim/restake/emergency unstake
- `/staking/rewards` — claimable rewards list
- `/staking/analytics` — charts (Recharts): Reward Growth, Stake Growth, Portfolio Allocation, APY History, Monthly Earnings, Reward Timeline
- `/staking/history` — full history

Server fns:
- `stakeIntoPool({pool_id, amount, auto_compound})` — validates, locks via `post_ledger('stake', -amount)`, inserts `user_stakes_v2`
- `accrueStakingRewards()` — cron-friendly, posts rewards via `post_ledger('earn', +reward)` and writes `staking_rewards`
- `claimRewards({stake_id})`
- `restake({stake_id})`
- `emergencyUnstake({stake_id})` — applies penalty %, posts net via `post_ledger`
- Live reward simulator (pure client calc) on stake form

---

## 7. Admin extensions

Add admin pages:
- `/admin/withdrawals` — review queue, approve/reject
- `/admin/vault` — vault stats, interest rate config
- `/admin/pools` — manage `staking_pools` (APY, capacity, status, visibility)
- `/admin/staking-requests` — emergency unstake approvals
- Extend `/admin/economy` with pool defaults & vault APY config keys in `app_config`

All admin actions logged via existing `log_audit`.

---

## 8. UI/UX polish

- Reuse existing tokens in `src/styles.css`; add glassmorphism utility (`.glass-card`) and animated counters component (`<AnimatedNumber />`)
- Recharts for analytics
- Skeleton loaders (`Skeleton` from shadcn) on every async section
- Empty states with CTAs
- Toasts via existing sonner
- Light/dark already shipped — verify new components in both

---

## 9. Migration order (multiple steps, each backward compatible)

1. Add enum values (`vault_deposit`, `vault_withdraw`, `vault_interest`, `transfer_in`, `transfer_out`, `withdrawal`, `staking_reward_v2`)
2. Create `vault_holdings`, `withdrawal_methods`, `withdrawals`, `staking_pools`, `user_stakes_v2`, `staking_rewards`, `staking_audit` with GRANTs + RLS
3. Seed 6 default pools, vault APY config
4. Server fns: transfer, withdrawals, vault, staking pools
5. Frontend: new wallet hub + sub-routes
6. Frontend: new staking module + analytics
7. Admin: new queues
8. Redirect old routes (`/vault`, `/invest`, `/withdraw`) to new paths

---

## Out of scope (future)

Governance, launchpads, liquidity pools, lending, multi-asset — schema designed to extend (pools by `asset` column reserved), but not built now.

---

## Confirmations needed

1. **Big build** — estimate 8–12 migration + code passes across multiple turns. OK to proceed step-by-step, shipping each phase as it lands?
2. **Legacy `stakes` table** — keep read-only for old records, all new staking goes to `user_stakes_v2`. OK?
3. **Withdrawals** — approval is manual admin (no payout rails wired). OK?
4. **Transfers** — peer VST transfers by `@referral_code` lookup. OK or restrict?
