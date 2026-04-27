
-- Add missing columns to items table
alter table public.items 
add column if not exists pickup_address text,
add column if not exists pickup_time text,
add column if not exists surcharge numeric default 0;
