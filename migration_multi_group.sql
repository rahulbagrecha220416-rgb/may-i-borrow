
-- Add group_ids array column to items table
alter table public.items 
add column if not exists group_ids uuid[] default '{}';

-- Optional: Migrate existing single group_id to the array (if any data exists)
update public.items 
set group_ids = array[group_id] 
where group_id is not null and group_ids = '{}';
