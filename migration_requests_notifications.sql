-- Add missing columns to requests table
ALTER TABLE requests
ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES items(id);

-- Add missing columns to notifications table
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS type VARCHAR(50);

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS related_id UUID;

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS related_type VARCHAR(50);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_requests_item_id ON requests(item_id);
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_related ON notifications(related_id, related_type);

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'requests' 
ORDER BY ordinal_position;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;
