# Community Backend Setup

The app stays 100% offline by default. Community features (accountability partner, forums, leaderboard) need a backend — this project uses **Supabase** on the free tier.

## 1. Create a Supabase project

1. Sign up at https://supabase.com (it's free).
2. Click **New Project**. Pick a name, region, and strong database password.
3. Wait ~2 minutes for provisioning.

## 2. Run the migration

1. In the Supabase dashboard, open **SQL Editor**.
2. Paste the entire contents of [`migrations/0001_community.sql`](./migrations/0001_community.sql) and click **Run**.
3. Verify you see tables: `profiles`, `partnerships`, `urge_alerts`, `forums`, `forum_posts`, `forum_replies`, `reports`.
4. Paste [`migrations/0002_push_notifications.sql`](./migrations/0002_push_notifications.sql) and click **Run**. This enables the `pg_net` extension and installs the trigger that sends a push notification to your partner the instant you tap an urge-alert button.

## 3. Configure auth

The app uses **username + password only** — no email confirmations, no OAuth. The Supabase Auth UI surfaces `email` everywhere, but we never collect a real one: usernames are suffixed with `@guard.local` to satisfy Supabase's internal format.

In the Supabase dashboard:

1. Go to **Authentication → Providers → Email**.
2. **Turn OFF** "Confirm email". (We don't send emails; signups must succeed without a confirmation loop.)
3. That's it — no other providers need to be enabled.

## 4. Seed some starter forums (optional)

Paste this into SQL Editor to give new users something to open day one:

```sql
insert into public.forums (slug, title, description) values
  ('introductions',   'Introductions',   'Say hi. Share your recovery goal.'),
  ('late-night',      'Late Night',      'For the 10pm-2am struggle.'),
  ('spiritual',       'Spiritual Growth', 'Mussar, tefillah, faith through struggle.'),
  ('wins',            'Wins',            'Celebrate small and big victories.'),
  ('tactics',         'What Worked',     'Tactics that broke an urge for you.')
on conflict (slug) do nothing;
```

## 5. Get your keys

In the Supabase dashboard:

1. **Project Settings → API**.
2. Copy **Project URL** (looks like `https://abc123.supabase.co`).
3. Copy **Project API keys → anon public**. This is safe to ship in a client app — Row-Level Security in the DB prevents abuse. **Never** paste the `service_role` key anywhere.

## 6. Paste into the app

1. Open the app → Profile → Community → Server setup.
2. Paste the URL and anon key, save.
3. Sign up with a username and password. You're in.

## How the data model works

- **`profiles`** — one row per user, mirrors some local state (streak, toggles).
- **`partnerships`** — pairs of users. Invite code is generated client-side; the partner redeems it via `accept_partner_invite()`.
- **`urge_alerts`** — partner-to-partner signals (intensity 1-10 + optional note).
- **`forums` / `forum_posts` / `forum_replies`** — standard flat forum.
- **`reports`** — user-submitted moderation flags.
- **`leaderboard`** — a view over `profiles` filtered by `leaderboard_visible = true`.

Row-Level Security is on for every table. Key rules:

- Users can only **read** posts/replies/forums that aren't hidden.
- Users can only **write** rows where `auth.uid()` matches the author / partnership member.
- Partnership invites can only be accepted via the SECURITY DEFINER function `accept_partner_invite()`, which atomically swaps `user_b` and sets `status = 'active'`.

## AI moderation

The app calls the user's configured AI provider (from AI Coach settings) to classify every post/reply **before** it's submitted. If no provider is configured, a small local keyword filter still catches the worst stuff (explicit ads, slurs). Moderation can be toggled off in Community Settings.

## Push notifications (instant partner alerts)

Migration `0002_push_notifications.sql` wires this up end-to-end — no Edge Function or extra hosting required.

**How it works:**

1. On sign-in, the app calls Expo and gets a device push token, then stores it in `profiles.expo_push_token`.
2. When you tap Mild/Strong/Severe on the Partner screen, a row is inserted into `urge_alerts`.
3. The `trg_urge_alert_push` trigger fires, looks up the partner's token, and uses `pg_net` to POST directly to `https://exp.host/--/api/v2/push/send`.
4. Expo delivers to APNs (iOS) / FCM (Android) in 1-3 seconds. Severity ≥ 7 uses `priority: high` so Android delivers immediately even in Doze mode.

**Requirements:**

- The `pg_net` extension must be available (it is on every Supabase project; the migration enables it).
- Push tokens are only issued on real iOS/Android builds — not Expo Go simulators or web. Use an **EAS development build** or a TestFlight/internal Android build to test.
- No Expo account is needed; `exp.host` accepts tokens without auth.

**Debugging:**

- If pushes don't arrive, check `select id, expo_push_token, push_platform, push_updated_at from public.profiles;` to confirm tokens are being saved.
- Check `select * from net._http_response order by created desc limit 20;` to see Expo's responses. A `DeviceNotRegistered` error means the partner uninstalled — clear their token with `update public.profiles set expo_push_token = null where id = '...';`.
- The trigger runs `security definer` and swallows errors (`raise warning`), so a push failure never blocks the alert insert. Warnings show up in the Supabase logs.

Left as a follow-up — the DB insert already works; the UI just polls on load.
