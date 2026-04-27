-- Add maintenance fee columns to items table
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS maintenance_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS maintenance_reason TEXT;

-- Update existing items to have 0 maintenance fee if null (handled by default, but good for clarity)
UPDATE items SET maintenance_amount = 0 WHERE maintenance_amount IS NULL;
