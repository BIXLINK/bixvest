## BIXVEST — README

BIXVEST is an experimental platform for rewarding community participation using VST tokens. Users earn VST from campaigns, stake tokens into progressive vault tiers, and maintain a verifiable activity profile.

Quick start

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open your browser at `http://localhost:5173`.

Project overview

- Frontend: React + TypeScript
- Routing & server functions: TanStack Start
- Data fetching: React Query
- Auth & storage: Supabase

Key folders

- `src/routes/` — file-based routes (pages)
- `src/components/` — shared UI components and layout
- `src/lib/` — server functions and core business logic
- `src/integrations/supabase/` — Supabase clients and types
- `supabase/migrations/` — DB migrations

Important files

- `src/routes/_authenticated/vault.tsx` — vault UI and staking flow
- `src/lib/bixvest.functions.ts` — server-side functions (including `stakeVst`)

Contributing

- Run lint/format locally:

```bash
npm run lint
npm run format
```

- Make changes on a feature branch and open a pull request.

Contact

For questions or support, contact hello@bixvest.example.
