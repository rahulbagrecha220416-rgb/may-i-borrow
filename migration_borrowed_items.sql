-- Add borrowed tracking columns to items table
ALTER TABLE items
ADD COLUMN IF NOT EXISTS borrowed_by UUID REFERENCES auth.users(id);

ALTER TABLE items
ADD COLUMN IF NOT EXISTS borrowed_until TIMESTAMP;

-- Create index for borrowed items
CREATE INDEX IF NOT EXISTS idx_items_borrowed_by ON items(borrowed_by);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);

-- Update existing items to ensure status is set
UPDATE items 
SET status = 'AVAILABLE' 
WHERE status IS NULL OR status = '';

-- Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'items' 
AND column_name IN ('borrowed_by', 'borrowed_until', 'status')
ORDER BY ordinal_position;
