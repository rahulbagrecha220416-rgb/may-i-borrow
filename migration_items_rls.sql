-- Phase 1: Fix RLS Policies for Items Table

-- 1. Allow item owners to update their own items (for marking as BORROWED)
CREATE POLICY "Allow owners to update their items"
ON items
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid());

-- 2. Verify the policy was created
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'items' AND cmd = 'UPDATE';

-- 3. Test: Check if any items are marked as BORROWED
SELECT id, name, status, owner_id, borrowed_by, borrowed_until
FROM items
WHERE status = 'BORROWED'
ORDER BY borrowed_until DESC;

-- 4. If no borrowed items found, manually test the update
-- (Replace the UUIDs with actual values from your database)
-- UPDATE items 
-- SET status = 'BORROWED', 
--     borrowed_by = '[borrower_user_id]',
--     borrowed_until = NOW() + INTERVAL '7 days'
-- WHERE id = '[item_id]';
