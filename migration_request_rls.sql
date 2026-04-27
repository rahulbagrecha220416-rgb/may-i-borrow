-- Check RLS policies on requests table
-- This will show if there's a policy preventing updates
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'requests';

-- Add RLS policy to allow request updates by item owner
CREATE POLICY "Item owners can update requests for their items"
ON requests
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM items
        WHERE items.id = requests.item_id
        AND items.owner_id = auth.uid()
    )
);

-- Verify the policy was created
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'requests';
