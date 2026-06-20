# BIXVEST Phase 2 — Ecosystem Update

Moves BIXVEST from "account + staking" to a full ledger-powered participation ecosystem. Phase 1 stays intact; this layers on top.

## 1. Ledger Engine (core)

Every VST movement becomes a ledger entry. No direct balance writes.

New DB:
- Extend `wallet_transactions` with: `source` (system/user/admin/campaign/referral/task/stake/invest), `destination`, `status` (pending/confirmed/reversed), `tx_ref` (uuid). Keep existing rows compatible.
- Add `recompute_balance(user_id)` SQL function — sum of confirmed ledger entries.
- Server helper `ledger.post({ user_id, type, source, destination, amount, note, ref })` used by ALL reward/stake/admin code paths. Replaces ad-hoc `profiles.update({ vst_balance })` calls in `bixvest.functions.ts`.

## 2. Onboarding Missions

New table `onboarding_missions` (seeded): complete_profile, verify_email, explore_dashboard, first_campaign. Each user gets `user_missions` rows on activation. Completion → ledger reward.

UI: "Welcome Journey" card on dashboard with progress checklist.

## 3. Daily Activity Hub

New tables:
- `daily_claims` (user_id, claim_date, type) — uniqueness prevents double-claim.
- `daily_streak` on profiles (current_streak, last_claim_date).

New route `/daily` ("Today's Opportunities") with: Login Bonus (+50), Learning (+100), Community (+200), Featured Campaigns. Server fn `claimDaily({ type })` enforces 1×/day per type via unique index.

## 4. BIX Score (reputation)

Add `bix_score`, `bix_level` to profiles. Score = weighted sum of: tasks completed, daily streak, account age, referrals activated. Recomputed by trigger after ledger inserts of type `earn` / `referral` / `daily`. Displayed on profile + dashboard.

## 5. Referral System Upgrade

- New referral code format: `BIX-XXXXX` (migrate generator).
- New table `referral_rewards` (referrer_id, referred_id, tier, amount, status).
- On `activateMembership`: post ledger entry `REFERRAL_REWARD` to referrer (+500 VST configurable).
- Referrals page shows: invited / activated / active counts + reward history.

## 6. Campaign Marketplace

Extend `campaigns`: `budget`, `spent`, `target_audience` (jsonb), `min_bix_score`, `start_at`, `end_at`, `created_by_business` (nullable uuid).
New table `campaign_participations` (campaign_id, user_id, status, proof, vst_awarded).
Admin can create; users browse `/rewards` → Campaigns tab with eligibility filter. Approval routes through ledger.

## 7. Vault Update

Vault page already shows 10 tiers — enhance with:
- Progress bar to next tier.
- Tier benefits list (premium campaigns, multipliers, exclusive access flags).
- Tier gating enforced in campaign eligibility query.

## 8. BIXVEST Invest (foundation)

New tables:
- `invest_wallet` (user_id, balance, locked) — SEPARATE from VST.
- `invest_products` (name, description, min_amount, apr, status) — admin managed.
- `invest_holdings` (user_id, product_id, amount, started_at, status).
- `invest_transactions` (own ledger).

New route `/invest` — placeholder UI with "Coming soon" + wallet display. Admin route `/admin/invest` to manage products. No real money flow yet.

## 9. Admin Command Center

Restructure `/admin` into:
- **Overview** (already exists, expand): + ledger volume 24h/7d/30d, top earners, campaign ROI.
- **Users**: existing + activity timeline, suspend, verify badge.
- **Ledger Explorer** (NEW `/admin/ledger`): filter by user/type/date/amount, CSV export.
- **Rewards** (NEW `/admin/rewards`): edit daily reward amounts, mission rewards, multipliers (stored in `app_config` key-value table).
- **Campaigns** (existing, expand): budget tracking, participation review.
- **Economy** (NEW `/admin/economy`): VST supply stats, staking level configs, rate limits.
- **Audit Log** (NEW `/admin/audit`): every admin action recorded.

## 10. Security

- New `audit_log` table — written by every admin server fn via wrapper.
- New `rate_limits` table + helper `enforceRateLimit(user_id, action, max, window)` used on daily claims, task submits, code activation.
- Duplicate-account check: index on `profiles.email_normalized` + IP/device fingerprint column (best-effort).

## 11. App Config

New `app_config` (key text PK, value jsonb) seeded with: `daily_login_reward`, `daily_learning_reward`, `daily_community_reward`, `referral_reward`, `mission_rewards`, `bix_score_weights`. Admin Rewards page edits these. All reward issuers read from config.

---

## Technical sections

### DB Migrations (one migration)
- ALTER `wallet_transactions` add columns; backfill `source='legacy'`.
- ALTER `profiles` add `bix_score int`, `bix_level int`, `current_streak int`, `last_claim_date date`, `verified bool`.
- New tables: `onboarding_missions`, `user_missions`, `daily_claims`, `referral_rewards`, `campaign_participations`, `invest_wallet`, `invest_products`, `invest_holdings`, `invest_transactions`, `audit_log`, `rate_limits`, `app_config`.
- ALTER `campaigns` add budget/audience/score columns.
- Functions: `recompute_balance`, `post_ledger`, `claim_daily`, `award_mission`, `update_bix_score` trigger.
- RLS + GRANTs for every new table (authenticated read own, admin via `is_admin`, service_role full).
- Seed onboarding missions + app_config defaults.

### Server functions (`src/lib/bixvest.functions.ts` + new `src/lib/ledger.functions.ts`)
- `postLedger` (internal helper, not exported as fn).
- Refactor `activateMembership`, `stakeVst`, `adminAdjustVst`, `reviewSubmission`, `submitTask` to use `postLedger`.
- New: `claimDaily`, `completeMission`, `getDailyStatus`, `getBixScore`, `getReferralStats`, `participateInCampaign`, `getLedgerPage` (admin), `setAppConfig` (admin), `getAuditLog` (admin), `createInvestProduct` (admin), `getInvestWallet`.
- Every admin fn wrapped with `logAdminAction(actor, action, target, payload)`.

### New routes
- `src/routes/_authenticated/daily.tsx` — Daily Hub.
- `src/routes/_authenticated/invest.tsx` — Invest landing.
- `src/routes/_authenticated/admin/ledger.tsx`
- `src/routes/_authenticated/admin/rewards.tsx`
- `src/routes/_authenticated/admin/economy.tsx`
- `src/routes/_authenticated/admin/audit.tsx`
- `src/routes/_authenticated/admin/invest.tsx`

### UI updates
- Dashboard: Welcome Journey card (if pending missions), BIX Score widget, daily streak indicator, CTA to `/daily`.
- App layout: add Daily + Invest to nav (mobile bottom tabs become scrollable or grouped).
- Admin layout: add Ledger/Rewards/Economy/Audit/Invest tabs.
- Profile: BIX Score breakdown, verified badge.

### Out of scope (saved for "Economy Engine" phase)
- Treasury model & VST supply rules.
- Real investment money flow / KYC.
- Business self-serve campaign onboarding (admin-only for now).
- Fraud ML detection (only basic rate limits + dup checks here).

---

## Build order
1. Migration (schema + functions + seeds + RLS).
2. Ledger helper + refactor existing fns.
3. Daily Hub + missions + BIX score.
4. Referral upgrade + campaign marketplace expansion.
5. Invest module skeleton.
6. Admin Command Center (Ledger Explorer → Rewards → Economy → Audit → Invest).
7. Dashboard + nav polish + rate limits + audit wrapper.

This is a multi-step build. I'll execute it in sequence with the migration as the first approval gate.