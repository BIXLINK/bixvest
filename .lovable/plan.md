# BIXVEST Phase 1 — Build Plan

A premium fintech-style community participation ecosystem with VST points, staking, referrals, and a full admin control panel. Built on TanStack Start + Lovable Cloud (Supabase under the hood).

## Scope for Phase 1

Everything in your brief: auth, activation codes, dashboard, rewards hub, vault/staking, wallet, referrals, admin panel, analytics. Production-ready, responsive, secure (RLS + role-based).

> Note on stack: your brief mentions Next.js, but this Lovable template runs on **TanStack Start + React + TypeScript + Tailwind**, which gives the same SSR/edge capabilities. Backend will be **Lovable Cloud** (managed Supabase). If you need true Next.js, say so and I'll flag it — otherwise I'll proceed on TanStack Start.

---

## 1. Backend (Lovable Cloud)

Enable Lovable Cloud, then create the schema via migration.

**Tables**
- `profiles` — id (FK auth.users), full_name, email, referral_code (unique), referred_by, membership_status (`pending`|`active`|`suspended`), vst_balance, vst_locked, current_stake_level, created_at
- `user_roles` — separate roles table with enum `app_role` (`super_admin`, `admin`, `user`). `has_role()` security-definer function (prevents recursion / privilege escalation)
- `activation_codes` — id, code (unique, `VST-XXXX-XXXX`), assigned_email (nullable), status (`unused`|`used`|`disabled`), used_by, used_at, created_by, created_at
- `stake_levels` — level (1–10), name, vst_required (seeded with your 10 tiers)
- `stakes` — id, user_id, level, amount, status (`active`|`unstaked`), created_at, unstaked_at
- `tasks` — id, title, description, type (`engagement`|`community`|`brand`|`challenge`), vst_reward, status, starts_at, ends_at, created_by
- `campaigns` — id, title, description, vst_reward, status, starts_at, ends_at, created_by
- `task_submissions` — id, user_id, task_id, status (`pending`|`approved`|`rejected`), proof, vst_awarded, created_at, reviewed_by
- `wallet_transactions` — id, user_id, type (`earn`|`spend`|`stake`|`unstake`|`admin_adjust`), amount, balance_after, reference_table, reference_id, note, created_at
- `referrals` — id, referrer_id, referred_id, status, created_at
- `notifications` — id, user_id, title, body, read_at, created_at

**Security**
- RLS enabled on every table; `GRANT`s for `authenticated`/`service_role` (anon only on public reads, none needed in phase 1)
- Users see/modify only their own rows; admins use `has_role(uid, 'super_admin')` policies
- Trigger `handle_new_user()` auto-creates `profiles` row + unique referral code on signup, applies `referred_by` from signup metadata
- Seed `stake_levels` (50k → 50M VST)
- Seed `user_roles` row granting `super_admin` to `danickbix@gmail.com` (resolved via auth.users lookup at first login through a trigger; nothing exposed client-side)

**Server functions (`createServerFn`)**
- `activateMembership(code)` — validates code, atomic update: code → used, profile → active, transaction log
- `generateActivationCodes(count, assigned_email?)` — admin only
- `stakeVst(level)` — checks balance, deducts, creates stake, updates level
- `submitTask(task_id, proof)` / `reviewSubmission(id, decision)` — admin reviews credit VST
- `adminAdjustVst(user_id, amount, note)` — super_admin only
- Analytics aggregator for admin dashboard

All admin functions check `has_role` server-side. Bearer attacher already wired by Lovable Cloud integration.

## 2. Frontend Routes

```
/                      Landing (marketing, CTA to signup)
/auth                  Login / Signup (tabs) + forgot password
/reset-password        Password reset page
/_authenticated/
  activate             Pending-activation gate page (enter VST code)
  dashboard            Home dashboard
  rewards              VST Rewards Hub (tasks/campaigns/challenges tabs + history)
  vault                Staking system (levels + stake/unstake)
  wallet               Balance + transactions
  referrals            Referral link, network list
  profile              Profile management
  _admin/              (gated via has_role super_admin)
    overview           Analytics dashboard
    users              User management
    codes              Activation code management
    campaigns          Campaign CRUD
    tasks              Task CRUD + submission review
    staking            Stake-level config
```

A pre-activation guard inside `_authenticated` redirects users with `pending` status to `/activate` for any ecosystem route.

## 3. Design system

Premium fintech aesthetic — deep navy/charcoal base, refined gold/emerald accent (not casino-y), generous spacing, restrained gradients, crisp typography (Space Grotesk display + Inter body, loaded via `<link>` in `__root.tsx`). All tokens in `src/styles.css` as oklch; no hardcoded colors in components. Light + dark themes. Mobile bottom-nav, desktop sidebar (shadcn sidebar), tablet adaptive.

## 4. Layout shells

- `MarketingLayout` (landing)
- `AppLayout` — sidebar (desktop) + bottom nav (mobile), header with VST balance chip, notifications
- `AdminLayout` — separate sidebar for admin tools

## 5. Deliverables this phase

1. Cloud enabled + full migration with RLS, grants, triggers, seeds
2. Auth flows (email/password; Google can be added later if you want)
3. Activation flow end-to-end
4. All 5 user modules with real data wired through server functions / Supabase client
5. Full admin panel with all listed permissions
6. Responsive shells, design system, landing page
7. Notifications surfaced in header
8. sitemap.xml + robots.txt for public routes

## Technical notes

- `super_admin` boot: migration inserts the role assignment keyed off `auth.users` where email = `danickbix@gmail.com`; if the user doesn't exist yet, a trigger on `auth.users` insert grants it when they sign up.
- All money/VST math goes through server functions inside Supabase transactions to avoid race conditions.
- Activation codes generated with crypto-random base32 (no ambiguous chars) in format `VST-XXXX-XXXX`.
- Referral codes are short unique slugs on `profiles`.

## Out of scope (future phases)

Real payments / token bridge, KYC, mobile native apps, email delivery beyond Supabase defaults, advanced analytics charts beyond core metrics.

---

Approve and I'll start building: enable Cloud → migration → auth/activation → user modules → admin → polish.
