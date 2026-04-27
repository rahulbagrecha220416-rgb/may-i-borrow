-- 1. Mediations Table
create table if not exists public.mediations (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    requester_id uuid references auth.users(id) not null,
    owner_id uuid references auth.users(id) not null,
    item_id uuid references public.items(id) not null,
    
    -- The Mutual Friend who is being asked for advice
    mutual_friend_id uuid references auth.users(id) not null, 
    
    inquiry_type text default 'FEE_CLARIFICATION', -- 'FEE_CLARIFICATION', 'CONDITION_CHECK', 'OTHER'
    question text, -- The specific question asked
    
    status text default 'PENDING' -- 'PENDING', 'ADVISED', 'IGNORED', 'RESOLVED'
);

-- 2. RLS Policies

alter table public.mediations enable row level security;

-- Requester can see their own requests
create policy "Users can view own initiated mediations" 
on public.mediations for select 
using (auth.uid() = requester_id);

-- Mutual Friend can see requests sent to them
create policy "Mutual friends can view requests sent to them" 
on public.mediations for select 
using (auth.uid() = mutual_friend_id);

-- Everyone can insert (authenticated)
create policy "Users can create mediation requests" 
on public.mediations for insert 
with check (auth.uid() = requester_id);

-- Updates (e.g., Mutual friend marking as advised)
create policy "Mutual friend can update status" 
on public.mediations for update 
using (auth.uid() = mutual_friend_id);
