-- Store each user's FCM/APNs push token on their profile so the
-- send-push Edge Function can reach them.

alter table public.profiles
    add column if not exists fcm_token text;

create index if not exists idx_profiles_fcm_token
    on public.profiles (fcm_token)
    where fcm_token is not null;
