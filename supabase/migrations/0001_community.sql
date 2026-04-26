-- =============================================================================
-- Gibor KeAri — Community schema (Phase A-D)
-- Username/password auth only (no email OAuth). Supabase Auth is configured
-- client-side to use synthetic emails of the form `<username>@guard.local`
-- so we get its password hashing / JWT for free but never surface emails.
-- =============================================================================

-- =========================== PROFILES ========================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null check (char_length(username) between 3 and 24
                                             and username ~ '^[a-zA-Z0-9_]+$'),
  display_name  text,
  avatar_emoji  text default '🦁',
  bio           text,
  created_at    timestamptz not null default now(),

  -- Streak snapshot (synced from device)
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_synced_at timestamptz,

  -- Per-user toggles (mirrored from local store)
  community_enabled       boolean not null default true,
  partner_enabled         boolean not null default true,
  partner_allow_requests  boolean not null default true,
  forums_enabled          boolean not null default true,
  leaderboard_visible     boolean not null default true,

  -- Moderation
  is_banned     boolean not null default false,
  ban_reason    text
);

alter table public.profiles enable row level security;

-- Anyone authenticated can read non-private fields.
drop policy if exists "profiles_read_all" on public.profiles;
create policy "profiles_read_all" on public.profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create index if not exists profiles_username_idx on public.profiles (lower(username));
create index if not exists profiles_streak_idx on public.profiles (current_streak desc)
  where leaderboard_visible = true and is_banned = false;

-- =========================== PARTNERSHIPS ====================================
-- A pairing between two users. user_a initiates; user_b accepts.
create table if not exists public.partnerships (
  id          uuid primary key default gen_random_uuid(),
  user_a      uuid not null references public.profiles(id) on delete cascade,
  user_b      uuid references public.profiles(id) on delete cascade,
  status      text not null default 'pending'
              check (status in ('pending','active','ended')),
  invite_code text unique,
  created_at  timestamptz not null default now(),
  ended_at    timestamptz,
  check (user_b is null or user_a <> user_b),
  -- Once active, user_b is required.
  check (status <> 'active' or user_b is not null)
);

alter table public.partnerships enable row level security;

drop policy if exists "partnerships_read_members" on public.partnerships;
create policy "partnerships_read_members" on public.partnerships
  for select using (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "partnerships_insert_self" on public.partnerships;
create policy "partnerships_insert_self" on public.partnerships
  for insert with check (auth.uid() = user_a);

drop policy if exists "partnerships_update_members" on public.partnerships;
create policy "partnerships_update_members" on public.partnerships
  for update using (auth.uid() = user_a or auth.uid() = user_b);

create index if not exists partnerships_user_a_idx on public.partnerships (user_a);
create index if not exists partnerships_user_b_idx on public.partnerships (user_b);
create index if not exists partnerships_invite_idx on public.partnerships (invite_code)
  where invite_code is not null;

-- =========================== URGE ALERTS =====================================
create table if not exists public.urge_alerts (
  id             uuid primary key default gen_random_uuid(),
  from_user      uuid not null references public.profiles(id) on delete cascade,
  partnership_id uuid not null references public.partnerships(id) on delete cascade,
  intensity      integer not null check (intensity between 1 and 10),
  note           text,
  created_at     timestamptz not null default now(),
  acknowledged_at timestamptz
);

alter table public.urge_alerts enable row level security;

drop policy if exists "urges_read_partners" on public.urge_alerts;
create policy "urges_read_partners" on public.urge_alerts
  for select using (
    exists (
      select 1 from public.partnerships p
      where p.id = partnership_id
        and (p.user_a = auth.uid() or p.user_b = auth.uid())
    )
  );

drop policy if exists "urges_insert_self" on public.urge_alerts;
create policy "urges_insert_self" on public.urge_alerts
  for insert with check (
    auth.uid() = from_user
    and exists (
      select 1 from public.partnerships p
      where p.id = partnership_id
        and p.status = 'active'
        and (p.user_a = auth.uid() or p.user_b = auth.uid())
    )
  );

drop policy if exists "urges_update_partners" on public.urge_alerts;
create policy "urges_update_partners" on public.urge_alerts
  for update using (
    exists (
      select 1 from public.partnerships p
      where p.id = partnership_id
        and (p.user_a = auth.uid() or p.user_b = auth.uid())
    )
  );

create index if not exists urges_partnership_idx on public.urge_alerts (partnership_id, created_at desc);

-- =========================== FORUMS ==========================================
create table if not exists public.forums (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null check (slug ~ '^[a-z0-9-]{3,40}$'),
  title       text not null check (char_length(title) between 3 and 60),
  description text check (char_length(description) <= 300),
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  is_locked   boolean not null default false,
  is_hidden   boolean not null default false
);

alter table public.forums enable row level security;

drop policy if exists "forums_read_visible" on public.forums;
create policy "forums_read_visible" on public.forums
  for select using (is_hidden = false or auth.uid() = created_by);

drop policy if exists "forums_insert_authed" on public.forums;
create policy "forums_insert_authed" on public.forums
  for insert with check (auth.uid() = created_by);

create table if not exists public.forum_posts (
  id          uuid primary key default gen_random_uuid(),
  forum_id    uuid not null references public.forums(id) on delete cascade,
  author_id   uuid references public.profiles(id) on delete set null,
  title       text not null check (char_length(title) between 3 and 120),
  body        text not null check (char_length(body) between 1 and 4000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  reply_count integer not null default 0,
  is_hidden   boolean not null default false,
  hidden_reason text
);

alter table public.forum_posts enable row level security;

drop policy if exists "posts_read_visible" on public.forum_posts;
create policy "posts_read_visible" on public.forum_posts
  for select using (is_hidden = false or auth.uid() = author_id);

drop policy if exists "posts_insert_self" on public.forum_posts;
create policy "posts_insert_self" on public.forum_posts
  for insert with check (auth.uid() = author_id);

drop policy if exists "posts_update_author" on public.forum_posts;
create policy "posts_update_author" on public.forum_posts
  for update using (auth.uid() = author_id);

create index if not exists posts_forum_idx on public.forum_posts (forum_id, created_at desc);

create table if not exists public.forum_replies (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.forum_posts(id) on delete cascade,
  author_id   uuid references public.profiles(id) on delete set null,
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now(),
  is_hidden   boolean not null default false,
  hidden_reason text
);

alter table public.forum_replies enable row level security;

drop policy if exists "replies_read_visible" on public.forum_replies;
create policy "replies_read_visible" on public.forum_replies
  for select using (is_hidden = false or auth.uid() = author_id);

drop policy if exists "replies_insert_self" on public.forum_replies;
create policy "replies_insert_self" on public.forum_replies
  for insert with check (auth.uid() = author_id);

create index if not exists replies_post_idx on public.forum_replies (post_id, created_at asc);

-- Keep reply counts fresh
create or replace function public.bump_reply_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.forum_posts set reply_count = reply_count + 1, updated_at = now()
    where id = new.post_id;
  return new;
end $$;

drop trigger if exists trg_bump_reply on public.forum_replies;
create trigger trg_bump_reply after insert on public.forum_replies
  for each row execute function public.bump_reply_count();

-- =========================== REPORTS (moderation) ============================
create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid references public.profiles(id) on delete set null,
  target_type   text not null check (target_type in ('post','reply','profile')),
  target_id     uuid not null,
  reason        text not null,
  created_at    timestamptz not null default now(),
  resolved      boolean not null default false
);

alter table public.reports enable row level security;

drop policy if exists "reports_insert_authed" on public.reports;
create policy "reports_insert_authed" on public.reports
  for insert with check (auth.uid() = reporter_id);

drop policy if exists "reports_read_self" on public.reports;
create policy "reports_read_self" on public.reports
  for select using (auth.uid() = reporter_id);

-- =========================== LEADERBOARD VIEW ================================
create or replace view public.leaderboard as
select
  p.id,
  p.username,
  p.display_name,
  p.avatar_emoji,
  p.current_streak,
  p.longest_streak,
  p.last_synced_at
from public.profiles p
where p.leaderboard_visible = true
  and p.community_enabled = true
  and p.is_banned = false
order by p.current_streak desc, p.longest_streak desc
limit 200;

grant select on public.leaderboard to authenticated;

-- =========================== HELPERS =========================================
-- Invite-code based partnership acceptance, in a single atomic call.
create or replace function public.accept_partner_invite(p_code text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_partnership public.partnerships%rowtype;
begin
  select * into v_partnership from public.partnerships
    where invite_code = p_code and status = 'pending';
  if not found then
    raise exception 'Invalid or expired invite code';
  end if;
  if v_partnership.user_a = auth.uid() then
    raise exception 'Cannot accept your own invite';
  end if;
  update public.partnerships
    set user_b = auth.uid(), status = 'active', invite_code = null
    where id = v_partnership.id;
  return v_partnership.id;
end $$;

grant execute on function public.accept_partner_invite(text) to authenticated;
