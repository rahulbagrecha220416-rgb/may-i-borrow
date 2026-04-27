-- Enable Realtime for Tables

-- 1. Enable realtime for items table
ALTER PUBLICATION supabase_realtime ADD TABLE items;

-- 2. Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 3. Enable realtime for requests table
ALTER PUBLICATION supabase_realtime ADD TABLE requests;

-- 4. Verify realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- 5. Optional: Enable for groups and group_members
ALTER PUBLICATION supabase_realtime ADD TABLE groups;
ALTER PUBLICATION supabase_realtime ADD TABLE group_members;
