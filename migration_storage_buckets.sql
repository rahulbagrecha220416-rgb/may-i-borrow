-- Storage bucket setup for May We Borrow.
-- Run once in the Supabase SQL Editor. Idempotent — safe to re-run.
--
-- Creates three public buckets used by src/utils/uploadImage.js:
--   - item-images   (item photos)
--   - group-images  (group banners)
--   - avatars       (profile photos)

-- 1. Buckets ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
    ('item-images', 'item-images', true),
    ('group-images', 'group-images', true),
    ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

-- 2. Upload policies (authenticated users can INSERT into these buckets).
--    We scope uploads to paths prefixed with the user's id so a user cannot
--    overwrite another user's files (see uploadImage.js which writes to
--    `${userId}/...`).
drop policy if exists "auth users upload item-images" on storage.objects;
create policy "auth users upload item-images"
on storage.objects for insert to authenticated
with check (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "auth users upload group-images" on storage.objects;
create policy "auth users upload group-images"
on storage.objects for insert to authenticated
with check (
    bucket_id = 'group-images'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "auth users upload avatars" on storage.objects;
create policy "auth users upload avatars"
on storage.objects for insert to authenticated
with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Owners can update/delete their own uploads.
drop policy if exists "owners manage own uploads" on storage.objects;
create policy "owners manage own uploads"
on storage.objects for all to authenticated
using (
    bucket_id in ('item-images', 'group-images', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Public read — everyone can view images (buckets are also public).
drop policy if exists "public read images" on storage.objects;
create policy "public read images"
on storage.objects for select to public
using (bucket_id in ('item-images', 'group-images', 'avatars'));
