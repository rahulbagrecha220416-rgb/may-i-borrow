-- Group creators were saved as plain members, so in a Monarchy nobody could invite anyone
-- after the "Circle Created" screen. The client's follow-up "promote to admin" update is
-- blocked by RLS (only an existing admin may update roles). Also, the join policy did not
-- check the role, so any signed-in user could insert themselves into any group as admin.

-- 1. The create-group RPC adds the creator as admin.
CREATE OR REPLACE FUNCTION public.create_group_and_ensure_profile(p_name text, p_description text, p_image_url text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid;
  v_group_id uuid;
  v_group_data json;
BEGIN
  v_user_id := auth.uid();
  -- 1. Ensure Profile Exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), raw_user_meta_data->>'avatar_url'
    FROM auth.users WHERE id = v_user_id;
  END IF;

  -- 2. Create Group
  INSERT INTO public.groups (name, description, image_url, created_by)
  VALUES (p_name, p_description, p_image_url, v_user_id)
  RETURNING id INTO v_group_id;

  -- 3. Add creator as admin
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_group_id, v_user_id, 'admin');

  SELECT row_to_json(g) INTO v_group_data FROM public.groups g WHERE id = v_group_id;
  RETURN v_group_data;
END;
$function$;

-- 2. Joining yourself is allowed only as a member, except the group's creator
--    (the client's REST fallback inserts the creator as admin).
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
CREATE POLICY "Users can join groups" ON public.group_members
  FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id
    AND (
      role = 'member'
      OR EXISTS (
        SELECT 1 FROM public.groups g
        WHERE g.id = group_members.group_id AND g.created_by = (select auth.uid())
      )
    )
  );

-- 3. Backfill: creators stuck as members become admins of the groups they created.
UPDATE public.group_members m
SET role = 'admin'
FROM public.groups g
WHERE g.id = m.group_id AND g.created_by = m.user_id AND m.role <> 'admin';
