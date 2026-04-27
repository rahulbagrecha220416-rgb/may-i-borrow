-- Migration: Add indexes for borrowed and lent items performance
-- Run this in your Supabase SQL Editor

-- Index for My Borrowed Items query
CREATE INDEX IF NOT EXISTS idx_items_borrowed_by_status 
ON items (borrowed_by, status);

-- Index for My Lent Items query
CREATE INDEX IF NOT EXISTS idx_items_owner_id_status 
ON items (owner_id, status);

-- Index for Request History
CREATE INDEX IF NOT EXISTS idx_requests_user_id 
ON requests (user_id);

-- Index for join performance with Items table
CREATE INDEX IF NOT EXISTS idx_requests_item_id 
ON requests (item_id); 

CREATE INDEX IF NOT EXISTS idx_requests_created_at 
ON requests (created_at DESC);
