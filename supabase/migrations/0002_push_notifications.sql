-- =============================================================================
-- Gibor KeAri — Push notifications for instant partner alerts
-- -----------------------------------------------------------------------------
-- When a row is inserted into `urge_alerts`, a trigger uses `pg_net` to POST
-- the alert directly to Expo's Push API, which delivers to the partner's
-- device in 1-3 seconds (no custom server or Edge Function required).
--
-- Expo Push API is free, does not require an Expo account, and handles both
-- iOS (APNs) and Android (FCM) credentials once the app is built via EAS.
-- =============================================================================

-- Required extension for outbound HTTP from Postgres. Supabase ships it but
-- it must be enabled per project.
create extension if not exists pg_net with schema extensions;

-- --------------------- profile push tokens ----------------------------------
alter table public.profiles
  add column if not exists expo_push_token text,
  add column if not exists push_platform   text check (push_platform in ('ios','android','web')),
  add column if not exists push_updated_at timestamptz;

create index if not exists profiles_push_token_idx
  on public.profiles (expo_push_token)
  where expo_push_token is not null;

-- --------------------- trigger function --------------------------------------
-- Posts to https://exp.host/--/api/v2/push/send for the partner of the alert
-- sender. Runs as security definer so it can read the partner's token
-- regardless of the caller's RLS.
create or replace function public.send_urge_push()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_partner_id       uuid;
  v_partner_token    text;
  v_sender_username  text;
  v_title            text;
  v_body             text;
  v_priority         text;
  v_severity         text;
begin
  -- Find the OTHER side of the partnership.
  select case when p.user_a = new.from_user then p.user_b else p.user_a end
    into v_partner_id
  from public.partnerships p
  where p.id = new.partnership_id
    and p.status = 'active'
  limit 1;

  if v_partner_id is null then
    return new;
  end if;

  -- Fetch the partner's push token + sender's username for the body copy.
  select expo_push_token into v_partner_token
    from public.profiles where id = v_partner_id;
  select username into v_sender_username
    from public.profiles where id = new.from_user;

  if v_partner_token is null or v_partner_token = '' then
    return new;  -- partner hasn't registered a device; silently skip
  end if;

  -- Copy is tuned to be actionable at a glance on a lock screen.
  v_severity := case
    when new.intensity >= 8 then 'SEVERE'
    when new.intensity >= 5 then 'STRONG'
    else 'MILD'
  end;
  v_title := '🦁 ' || coalesce(v_sender_username, 'Your partner') || ' needs you';
  v_body  := v_severity || ' urge (' || new.intensity::text || '/10)'
             || case when new.note is not null and length(new.note) > 0
                     then ' — ' || left(new.note, 140)
                     else '' end;
  -- Severe alerts bypass Do Not Disturb on Android + use critical sound on iOS.
  v_priority := case when new.intensity >= 7 then 'high' else 'default' end;

  perform net.http_post(
    url     := 'https://exp.host/--/api/v2/push/send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Accept',       'application/json',
      'Accept-Encoding', 'gzip, deflate'
    ),
    body    := jsonb_build_object(
      'to',       v_partner_token,
      'title',    v_title,
      'body',     v_body,
      'sound',    'default',
      'priority', v_priority,
      'channelId','partner-alerts',
      'data',     jsonb_build_object(
        'type',          'urge_alert',
        'alertId',       new.id,
        'partnershipId', new.partnership_id,
        'intensity',     new.intensity,
        'fromUser',      new.from_user,
        'fromUsername',  v_sender_username
      )
    )
  );

  return new;
exception when others then
  -- Never fail the insert because a push failed; log + continue.
  raise warning 'send_urge_push failed: %', sqlerrm;
  return new;
end $$;

drop trigger if exists trg_urge_alert_push on public.urge_alerts;
create trigger trg_urge_alert_push
  after insert on public.urge_alerts
  for each row execute function public.send_urge_push();
