
-- 1. Create Profiles Table (Public user data)
create table public.profiles (
  id uuid not null references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone" 
  on profiles for select using (true);

create policy "Users can insert their own profile" 
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile" 
  on profiles for update using (auth.uid() = id);

-- 2. Create Groups Table
create table public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  image_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- Enable RLS for Groups
alter table public.groups enable row level security;

-- Groups Policies
create policy "Groups are viewable by everyone" 
  on groups for select using (true);

create policy "Authenticated users can create groups" 
  on groups for insert with check (auth.role() = 'authenticated');

create policy "Group creators can update their groups" 
  on groups for update using (auth.uid() = created_by);

-- 3. Create Group Members Table (Many-to-Many)
create table public.group_members (
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

-- Enable RLS for Group Members
alter table public.group_members enable row level security;

-- Group Members Policies
create policy "Group members are viewable by everyone" 
  on group_members for select using (true);

create policy "Users can join groups" 
  on group_members for insert with check (auth.uid() = user_id);

create policy "Users can leave groups" 
  on group_members for delete using (auth.uid() = user_id);

-- 4. Create Items Table
create table public.items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  category text,
  image_url text,
  status text default 'AVAILABLE', -- 'AVAILABLE', 'BORROWED'
  visibility text default 'network', -- 'public', 'network'
  available_until date,
  owner_id uuid references public.profiles(id) not null,
  group_id uuid references public.groups(id), -- Optional: if tied to specific group
  created_at timestamptz default now()
);

-- Enable RLS for Items
alter table public.items enable row level security;

-- Items Policies
create policy "Items viewable by everyone if public" 
  on items for select using (visibility = 'public');

create policy "Items viewable by authenticated users" 
  on items for select using (auth.role() = 'authenticated');

create policy "Users can create items" 
  on items for insert with check (auth.uid() = owner_id);

create policy "Users can update their own items" 
  on items for update using (auth.uid() = owner_id);

create policy "Users can delete their own items" 
  on items for delete using (auth.uid() = owner_id);

-- 5. Helper Functions (Optional but useful)

-- Trigger to create profile on signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
