# May We Borrow — launch posts for honest feedback

> Drafted 17 Sep 2026 against the live build (`may-i-borrow.vercel.app`, commit 613abad+).
> Post in this order, a few days apart, and fix what the first venue surfaces before the next.
> Every post links the same URL and invites "Continue as Guest" so nobody has to sign up to look.
> Posting is done from your own accounts. Replace `[your name]` where it appears.

Before posting, three checks that reviewers will do in the first minute:
1. Open the link in a private window, tap **Continue as Guest**, open an item, tap **Ask to Borrow**. It must not throw.
2. Supabase free tier pauses after a week idle. The flow-test routine keeps it warm; confirm it ran in the last 3 days.
3. Have the Android APK link ready only if it is the same build as the web. Otherwise mention web only.

---

## 1. r/SideProject

**Title:** I built a lending app for apartment blocks and hobby clubs — borrow the drill instead of buying one. Looking for honest feedback.

**Body:**

May We Borrow is a small web app for groups of people who already know each other: an apartment tower, a cycling club, an office floor. You join a group, list the things you're willing to lend (ladder, stand mixer, board games, camera lens), and ask to borrow what others listed. Requests go to the owner, who accepts or declines; the app tracks who has what and when it's due back.

A few choices I'd like opinions on:

- **No public marketplace.** Items are only visible inside your groups. I think trust needs a circle, not a feed. Does that make it feel too small?
- **Groups have a "monarchy" or "republic" setting.** Admins control membership, or members vote. Gimmick or useful?
- **A "mutual friend" button** on every item lets you ask someone who knows the owner before you request. Would you use that, or is it awkward?
- **Premium items** cost karma points you earn by lending. Fair, or a reason to leave?

Stack: React + Vite, Supabase for auth and data, Google sign-in, Android wrapper via Capacitor. Solo project, no funding, not selling anything.

Try it without signing up: https://may-i-borrow.vercel.app → "Continue as Guest" (that's sample data; sign in with Google to make a real group).

What would stop you from actually using this with your neighbours?

---

## 2. r/IMadeThis

**Title:** May We Borrow — a "favour, not service" app for sharing stuff within groups you already trust

**Body:**

Made this because my building has eleven drills and nobody can find one when they need it.

How it works: create a group, share the invite link, list items, request items. The owner approves, the app tracks due dates and nudges both sides. Lending earns karma; some items are marked premium and cost karma to borrow. Every member signs a short pledge to look after what they borrow.

Live at https://may-i-borrow.vercel.app. "Continue as Guest" shows a sample group so you can click around in ten seconds. Feedback on anything from the flow to the copy is welcome, especially from anyone who has tried to run a tool library or a shared-equipment group before.

---

## 3. Indie Hackers (post in "Share your product" or as a build-in-public update)

**Title:** May We Borrow: lending within trusted groups, with a reputation layer instead of deposits. Roast the model.

**Body:**

**What it is.** A group-based lending app. Not a rental marketplace: no strangers, no payments, no insurance. You lend to people in your circle and the app handles the awkward parts: asking, agreeing a return date, reminders, and a record of who returned what on time.

**The bet.** Peer-to-peer rental apps die on trust and logistics. Removing strangers removes most of the trust problem; keeping it inside apartment blocks, clubs and offices removes most of the logistics. What's left is a reputation system: a trust score from successful returns, karma from lending, premium items gated behind karma, and an optional mutual-friend "temperature check" before a request.

**What exists today.** Web app (React + Supabase), Google sign-in, groups with invite links and two governance modes, items with availability windows and pickup or courier options, borrow requests with accept/decline, borrowed and lent views, notifications, a basic mediation flow for disputes, and an Android build. Live: https://may-i-borrow.vercel.app, guest mode available.

**What I don't know.** Whether anyone will maintain their listings after the novelty fades. Whether karma reads as fun or as a chore. Whether a group admin will actually police returns. I'd rather hear that it's a bad idea now than after another six months.

Where would you take it, or where would you stop?

---

## 4. Show HN (only after 1–3 have been digested and fixed)

**Title:** Show HN: May We Borrow – lend and borrow within groups you already trust

**Body (first comment, HN style, plain):**

Hi HN. May We Borrow is a small web app for lending things inside a closed group: an apartment building, a club, a team. Members list items, others request them, the owner approves, the app tracks the return. There's no marketplace, no payments and no strangers; the interesting part is the reputation layer (trust score from returns, karma from lending, a "mutual friend" check before you ask someone you barely know).

It's React + Vite on the front, Supabase (Postgres + RLS + auth) on the back, Google sign-in, and a Capacitor wrapper for Android. Every borrow/lend path is exercised by an automated flow test every three days against the live database, which is also what keeps the free-tier project awake.

Live: https://may-i-borrow.vercel.app ("Continue as Guest" for sample data). Source is not public yet.

Happy to answer questions about the RLS policy design (per-group visibility without a backend server) or about the governance modes for groups.

---

## Replying to feedback

- Thank, don't defend. Ask one follow-up question per critic.
- Anything three people mention goes into the next commit, and gets a reply "shipped" with a link.
- Keep a single list of feedback in `docs/FEEDBACK.md` with date, venue, quote, decision.
