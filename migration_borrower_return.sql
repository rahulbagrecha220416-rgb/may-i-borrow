-- Allow borrowers to return items they are currently borrowing
-- This fixes the bug where "I've returned this" fails silently due to RLS

-- 1. Create a policy that allows the current borrower of an item to update it
CREATE POLICY "Allow borrowers to return items"
ON items
FOR UPDATE
TO authenticated
USING (borrowed_by = auth.uid())
WITH CHECK (
    -- The borrower is only allowed to return the item (set it to AVAILABLE)
    -- They cannot steal ownership or change other fields maliciously
    status = 'AVAILABLE' AND 
    borrowed_by IS NULL AND 
    borrowed_until IS NULL
);

-- Note: If you run this and get "policy already exists", you can drop it first:
-- DROP POLICY IF EXISTS "Allow borrowers to return items" ON items;
