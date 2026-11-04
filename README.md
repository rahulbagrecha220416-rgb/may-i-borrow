# May We Borrow

**A free lending circle for apartment blocks, hobby clubs and offices.**
Your building has eleven drills and nobody can find one when they need it. May We Borrow lets a
group of people who already know each other list what they own and borrow from each other
instead of buying.

**Try it:** https://mayweborrow.com → tap **Continue as Guest** to look around a sample
group, no sign-up needed. Sign in with Google to start a real group for your building.

Free, no ads, no tracking, not a business. Built as a community service.

## How it works

1. Someone creates a group (a building, a club, a floor) and shares the invite link on WhatsApp.
2. Members list things they're happy to lend: ladder, mixer, board games, camera lens, tools.
3. A member asks to borrow, the owner accepts or declines, and the app tracks who has what and
   when it is due back.

Items are only visible inside your groups. There is no public marketplace, so trust stays inside
a circle of people who know each other.

## Run it yourself

Any group can host its own copy.

```bash
npm install
cp .env.example .env   # add your Supabase project URL and anon key
npm run dev            # http://localhost:5199
```

You need a free [Supabase](https://supabase.com) project. The schema is in `supabase_schema.sql`
plus the `migration_*.sql` files (order in `DATABASE_MIGRATIONS.md`). All access control is
Postgres row-level security, so the anon key is the only key the browser ever sees.

Stack: React 19, Vite, Tailwind 4, Supabase (auth, Postgres, realtime, storage), Capacitor for
the Android app.

## Help out

Ideas, bug reports and pull requests are welcome. Open an issue on GitHub. The most useful thing
you can do is start a group in your own building and tell us what got in the way.

## License

[MIT](LICENSE)
