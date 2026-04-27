-- Connect to your Supabase SQL Editor and run this to populate the DB with dummy items

-- 1. Ensure you have some profiles (users). Ideally, run this after signing up a few users or create dummy ones.
-- This script assumes there is at least one user with ID 'user-uuid-here' (REPLACE THIS WITH A REAL USER ID IF NEEDED)
-- OR it just picks a random user from profiles if available.

DO $$
DECLARE
    dummy_user_id UUID;
    group_id_1 UUID;
BEGIN
    -- Try to get a user ID, fallback to creating one or erroring if none exist
    SELECT id INTO dummy_user_id FROM auth.users LIMIT 1;
    
    -- If no user, we can't insert items linked to a user.
    IF dummy_user_id IS NULL THEN
        RAISE NOTICE 'No users found in auth.users. Please sign up a user first.';
        RETURN;
    END IF;

    -- Insert Items
    INSERT INTO items (name, description, category, available_until, status, image_url, visibility, owner_id)
    VALUES
    ('Dyson Airwrap Multistyler', 'Complete set with all attachments. Perfect for parties.', 'Electronics', '2026-02-01', 'AVAILABLE', 'https://images.unsplash.com/photo-1522338242992-e1a54906a8ae?w=500&auto=format&fit=crop', 'group', dummy_user_id),
    ('Bosch Professional Drill', 'Cordless, 18V. Comes with drill bit set.', 'Tools', '2026-06-01', 'AVAILABLE', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop', 'group', dummy_user_id),
    ('Thule 2-Bike Car Rack', 'Trunk mount, fits most sedans. Secure straps included.', 'Sports', '2026-12-31', 'AVAILABLE', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500&auto=format&fit=crop', 'network', dummy_user_id),
    ('KitchenAid Stand Mixer', 'Classic red. Includes whisk and dough hook.', 'Kitchen', '2026-03-15', 'AVAILABLE', 'https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?w=500&auto=format&fit=crop', 'group', dummy_user_id),
    ('Camping Tent (4 Person)', 'Waterproof, easy setup. Used twice.', 'Sports', '2026-05-20', 'AVAILABLE', 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=500&auto=format&fit=crop', 'network', dummy_user_id),
    ('JBL PartyBox Speaker', 'Massive sound, built-in lights. Great for house parties.', 'Electronics', '2026-02-28', 'AVAILABLE', 'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=500&auto=format&fit=crop', 'network', dummy_user_id),
    ('Aluminum Extension Ladder', '12-foot reach. Lightweight but sturdy.', 'Tools', '2026-11-01', 'AVAILABLE', 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500&auto=format&fit=crop', 'group', dummy_user_id),
    ('GoPro Hero 10 Black', 'Includes waterproof case and chest mount.', 'Electronics', '2026-04-10', 'AVAILABLE', 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=500&auto=format&fit=crop', 'network', dummy_user_id),
    ('Barbeque Grill (Portable)', 'Charcoal grill, foldable legs. Perfect for balconies.', 'Kitchen', '2026-08-15', 'AVAILABLE', 'https://images.unsplash.com/photo-1555077402-dd19082ef765?w=500&auto=format&fit=crop', 'group', dummy_user_id),
    ('Catan Board Game', 'Base game + 5-6 player extension.', 'Party', '2027-01-01', 'AVAILABLE', 'https://images.unsplash.com/photo-1610890716171-6b1c9f85581d?w=500&auto=format&fit=crop', 'group', dummy_user_id),
    ('Canon DSLR 50mm Lens', 'Canon EF 50mm f/1.8 STM. Great for portraits.', 'Electronics', '2026-06-30', 'AVAILABLE', 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=500&auto=format&fit=crop', 'network', dummy_user_id),
    ('High Pressure Washer', 'Karcher K2. Good for cleaning cars and patios.', 'Tools', '2026-03-01', 'AVAILABLE', 'https://plus.unsplash.com/premium_photo-1663089688180-444ff0066e5d?w=500&auto=format&fit=crop', 'group', dummy_user_id);

END $$;
