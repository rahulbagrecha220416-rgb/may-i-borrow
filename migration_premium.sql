-- Add is_premium column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- Add policy (optional, usually profiles are viewable by owner, but we might want public to see premium badge?)
-- For now, default RLS should be fine if it allows read.

-- Create a mock function or just update manually to test
-- UPDATE profiles SET is_premium = TRUE WHERE id = '...';
