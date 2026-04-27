-- Create Inquiries Table for Mutual Friend Mediation
create table if not exists public.item_inquiries (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    item_id uuid references public.items(id) not null,
    inquirer_id uuid references auth.users(id) not null, -- Who is asking
    mediator_id uuid references auth.users(id) not null, -- The mutual friend
    lender_id uuid references auth.users(id) not null,   -- The item owner
    message text not null, -- The "Temperature Check" question
    status text default 'PENDING', -- PENDING, FORWARDED, RESOLVED, IGNORED
    response text -- Optional response from mediator
);

-- RLS
alter table public.item_inquiries enable row level security;

-- Inquirer can see their own inquiries
create policy "Inquirers can view own inquiries" on public.item_inquiries 
    for select using (auth.uid() = inquirer_id);

-- Mediator can see inquiries assigned to them
create policy "Mediators can view assigned inquiries" on public.item_inquiries 
    for select using (auth.uid() = mediator_id);

-- Inquirer can insert
create policy "Users can create inquiries" on public.item_inquiries 
    for insert with check (auth.uid() = inquirer_id);

-- Mediator can update (to respond)
create policy "Mediators can update inquiries" on public.item_inquiries 
    for update using (auth.uid() = mediator_id);
