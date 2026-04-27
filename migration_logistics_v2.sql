
-- Add pickup_contact column
alter table public.items 
add column if not exists pickup_contact text;

-- Ensure group_id is present (it was in original schema, but good to double check or add index)
-- alter table public.items add column if not exists group_id uuid references public.groups(id);
