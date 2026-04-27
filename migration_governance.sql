-- Group Governance System Migration
-- Run this in your Supabase SQL Editor

-- 1. Add governance_type column to groups table
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS governance_type TEXT DEFAULT 'monarchy'
CHECK (governance_type IN ('monarchy', 'republic'));

-- 2. Add role column to group_members table  
ALTER TABLE public.group_members
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member'
CHECK (role IN ('admin', 'member'));

-- 3. Make existing group creators admins (backfill existing data)
UPDATE public.group_members gm
SET role = 'admin'
FROM public.groups g
WHERE gm.group_id = g.id
AND gm.user_id = g.created_by;

-- 4. RLS Policy: Allow admins to remove members from their groups
DROP POLICY IF EXISTS "Admins can remove members" ON public.group_members;
CREATE POLICY "Admins can remove members"
ON public.group_members
FOR DELETE
TO authenticated
USING (
    -- Allow user to remove themselves (leave group)
    auth.uid() = user_id
    OR
    -- Allow admins to remove others
    EXISTS (
        SELECT 1 FROM public.group_members admin_check
        WHERE admin_check.group_id = group_members.group_id
        AND admin_check.user_id = auth.uid()
        AND admin_check.role = 'admin'
    )
);

-- 5. RLS Policy: Allow admins to update member roles
DROP POLICY IF EXISTS "Admins can update member roles" ON public.group_members;
CREATE POLICY "Admins can update member roles"
ON public.group_members
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.group_members admin_check
        WHERE admin_check.group_id = group_members.group_id
        AND admin_check.user_id = auth.uid()
        AND admin_check.role = 'admin'
    )
);

-- Verify the changes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name IN ('groups', 'group_members')
AND column_name IN ('governance_type', 'role')
ORDER BY table_name, column_name;
