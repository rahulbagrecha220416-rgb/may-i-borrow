-- Group proposals + voting for Republic-style governance.
-- Run in Supabase SQL Editor.

-- 1. Proposals -----------------------------------------------------------
create table if not exists public.group_proposals (
    id uuid primary key default gen_random_uuid(),
    group_id uuid references public.groups(id) on delete cascade not null,
    created_by uuid references auth.users(id) not null,
    title text not null,
    description text,
    status text not null default 'OPEN' check (status in ('OPEN', 'CLOSED')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    closed_at timestamp with time zone
);

create index if not exists idx_group_proposals_group on public.group_proposals(group_id);
create index if not exists idx_group_proposals_status on public.group_proposals(status);

-- 2. Votes ---------------------------------------------------------------
create table if not exists public.proposal_votes (
    id uuid primary key default gen_random_uuid(),
    proposal_id uuid references public.group_proposals(id) on delete cascade not null,
    voter_id uuid references auth.users(id) not null,
    vote text not null check (vote in ('yes', 'no')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (proposal_id, voter_id)
);

create index if not exists idx_proposal_votes_proposal on public.proposal_votes(proposal_id);

-- 3. RLS -----------------------------------------------------------------
alter table public.group_proposals enable row level security;
alter table public.proposal_votes enable row level security;

-- Members of a group can read proposals for that group.
drop policy if exists "members read group proposals" on public.group_proposals;
create policy "members read group proposals"
on public.group_proposals for select to authenticated
using (
    exists (
        select 1 from public.group_members gm
        where gm.group_id = group_proposals.group_id
        and gm.user_id = auth.uid()
    )
);

-- Members can create proposals for groups they belong to.
drop policy if exists "members create proposals" on public.group_proposals;
create policy "members create proposals"
on public.group_proposals for insert to authenticated
with check (
    created_by = auth.uid()
    and exists (
        select 1 from public.group_members gm
        where gm.group_id = group_proposals.group_id
        and gm.user_id = auth.uid()
    )
);

-- Proposer or group admin can close a proposal.
drop policy if exists "proposer or admin closes" on public.group_proposals;
create policy "proposer or admin closes"
on public.group_proposals for update to authenticated
using (
    created_by = auth.uid()
    or exists (
        select 1 from public.group_members gm
        where gm.group_id = group_proposals.group_id
        and gm.user_id = auth.uid()
        and gm.role = 'admin'
    )
);

-- Members of the proposal's group can read votes.
drop policy if exists "members read proposal votes" on public.proposal_votes;
create policy "members read proposal votes"
on public.proposal_votes for select to authenticated
using (
    exists (
        select 1 from public.group_proposals p
        join public.group_members gm on gm.group_id = p.group_id
        where p.id = proposal_votes.proposal_id
        and gm.user_id = auth.uid()
    )
);

-- Members of the proposal's group can vote (one vote per proposal thanks to UNIQUE).
drop policy if exists "members cast vote" on public.proposal_votes;
create policy "members cast vote"
on public.proposal_votes for insert to authenticated
with check (
    voter_id = auth.uid()
    and exists (
        select 1 from public.group_proposals p
        join public.group_members gm on gm.group_id = p.group_id
        where p.id = proposal_votes.proposal_id
        and gm.user_id = auth.uid()
        and p.status = 'OPEN'
    )
);

-- Voters can change their own vote (delete old row first, or update).
drop policy if exists "voter changes own vote" on public.proposal_votes;
create policy "voter changes own vote"
on public.proposal_votes for update to authenticated
using (voter_id = auth.uid());

drop policy if exists "voter deletes own vote" on public.proposal_votes;
create policy "voter deletes own vote"
on public.proposal_votes for delete to authenticated
using (voter_id = auth.uid());
