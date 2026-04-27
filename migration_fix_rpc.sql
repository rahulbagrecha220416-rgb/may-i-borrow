-- Migration: Fix Group Creation FK Error and Timeouts
-- Run this in the Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.create_group_and_ensure_profile(
  p_name text,
  p_description text,
  p_image_url text
) 
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with superuser privileges to ensure Profile creation works
AS $$
DECLARE
  v_user_id uuid;
  v_group_id uuid;
  v_group_data json;
BEGIN
  -- 1. Get Current User ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Ensure Profile Exists (Self-Healing)
  -- If the profile is missing (causing FK errors), we create it here using data from auth.users
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    SELECT 
      id, 
      email, 
      COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), 
      raw_user_meta_data->>'avatar_url'
    FROM auth.users
    WHERE id = v_user_id;
  END IF;

  -- 3. Create the Group
  INSERT INTO public.groups (name, description, image_url, created_by)
  VALUES (p_name, p_description, p_image_url, v_user_id)
  RETURNING id INTO v_group_id;

  -- 4. Add Creator as Member (Admin)
  INSERT INTO public.group_members (group_id, user_id)
  VALUES (v_group_id, v_user_id);

  -- 5. Return the new group data
  SELECT row_to_json(g) INTO v_group_data 
  FROM public.groups g 
  WHERE id = v_group_id;

  RETURN v_group_data;
END;
$$;
