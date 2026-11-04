# May I Borrow — agent playbook

A lending app for apartment blocks and hobby clubs: members of a group list things they own
and borrow from each other instead of buying. Public name in posts: **May We Borrow**.
Live web build: `mayweborrow.com` (Namecheap DNS → Vercel; `may-i-borrow.vercel.app` redirects to it). Also shipped as an Android app (Capacitor).

## Stack

- React 19 + Vite + Tailwind 4, react-router 7, framer-motion, lucide-react
- Supabase (project ref `yynngojgbpviigrynuut`) — auth (Google OAuth + guest), Postgres, RLS,
  realtime, storage; client in `src/supabaseClient.js`
- Capacitor 8 for Android (`android/`, `capacitor.config.json`); push notifications via
  `@capacitor/push-notifications`
- Hosted on Vercel (`vercel.json` rewrites everything to `index.html`)

## Layout

- `src/pages/` — one file per screen (Dashboard, ItemDetails, Groups, Mediations, …)
- `src/context/` — app state: Auth, Group, Item, Request, Notification, Theme
- `migration_*.sql` and `supabase_schema.sql` in the root — schema history; see
  `DATABASE_MIGRATIONS.md`. `seed_dummy_data.sql` is test data only.
- `OAUTH_CONFIG.md` — the redirect URLs Supabase and Google need for mobile sign-in
- `docs/LAUNCH-POSTS.md` — drafted launch posts (the user posts them, not Claude)

## Scripts

- `npm run dev` — Vite on port 5199
- `npm run build` / `npm run lint`

## Rules

- The security boundary is Supabase RLS, not the UI. Any new table gets RLS and policies in a
  new `migration_*.sql`; never rely on hiding a button.
- Only the Supabase anon key belongs in the browser. Never commit a service-role key.
- Applying a migration to the live Supabase project, or deleting data → ask first.
- "Continue as Guest" → open an item → "Ask to Borrow" must always work; it is the first thing
  a new visitor tries. Check it after any auth or request change.
- Supabase free tier pauses after a week idle; a flow-test routine keeps it awake.
