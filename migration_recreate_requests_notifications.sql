-- Requests, Notifications & User Settings tables
-- These were originally created ad-hoc in the Supabase SQL Editor and never
-- saved to the repo — meaning a fresh project could not be rebuilt from the
-- checked-in SQL alone. This file closes that gap. Definitions dumped from the
-- live project (yynngojgbpviigrynuut) on 25 Aug 2026 after the unpause.
-- Idempotent — safe to re-run. Run AFTER supabase_schema.sql, BEFORE
-- migration_requests_notifications.sql.

create table if not exists public.requests (
    id uuid default gen_random_uuid() primary key,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    user_id uuid not null references auth.users(id),
    title text not null,
    description text,
    category text default 'General',
    group_ids uuid[] default '{}',
    visibility text default 'group',
    status text default 'OPEN', -- OPEN/PENDING/ACCEPTED/REJECTED/RETURNED
    item_id uuid references public.items(id)
);

alter table public.requests enable row level security;

drop policy if exists "Authenticated users can view requests" on public.requests;
create policy "Authenticated users can view requests"
    on public.requests for select to authenticated using (true);

drop policy if exists "Users create own requests" on public.requests;
create policy "Users create own requests"
    on public.requests for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users update own requests" on public.requests;
create policy "Users update own requests"
    on public.requests for update to authenticated using (auth.uid() = user_id);
-- Note: "Item owners can update requests for their items" comes from
-- migration_request_rls.sql.

create table if not exists public.notifications (
    id uuid default gen_random_uuid() primary key,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    user_id uuid not null references auth.users(id),
    type text not null,
    content text not null,
    link text,
    is_read boolean default false,
    related_id uuid,
    related_type varchar(50)
);

alter table public.notifications enable row level security;

drop policy if exists "Users view own notifications" on public.notifications;
create policy "Users view own notifications"
    on public.notifications for select to authenticated using (auth.uid() = user_id);

-- Any authenticated user may create a notification for another user (the
-- requester's client inserts a row addressed to the item owner).
drop policy if exists "Authenticated can create notifications" on public.notifications;
create policy "Authenticated can create notifications"
    on public.notifications for insert to authenticated with check (true);

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications"
    on public.notifications for update to authenticated using (auth.uid() = user_id);

create table if not exists public.user_settings (
    user_id uuid primary key references auth.users(id),
    notify_requests boolean default true,
    notify_marketing boolean default false,
    updated_at timestamptz default timezone('utc'::text, now())
);

alter table public.user_settings enable row level security;

drop policy if exists "Users manage own settings" on public.user_settings;
create policy "Users manage own settings"
    on public.user_settings for all to authenticated
    using (auth.uid() = user_id) with check (auth.uid() = user_id);
