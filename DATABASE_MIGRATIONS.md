# Database Migration Required ⚠️

Before using the new features, you MUST run these two SQL migrations in your Supabase SQL Editor:

## 1. Borrowed Items Tracking

**File**: `migration_borrowed_items.sql`

```sql
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
```

**What it does**: Adds columns to track who borrowed an item and when it's due back

---

## 2. Request Permissions

**File**: `migration_request_rls.sql`

```sql
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
```

**What it does**: Allows item owners to accept/reject borrow requests

---

## How to Run

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to your project → SQL Editor
3. Copy and paste each migration one at a time
4. Click "Run"
5. Verify no errors

---

## Verification

After running both migrations, verify with:

```sql
-- Check borrowed_by and borrowed_until columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'items' 
AND column_name IN ('borrowed_by', 'borrowed_until', 'status');

-- Check RLS policy exists
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'requests';
```

You should see 3 rows for the first query and at least one policy for the second.

---

## Schema ↔ Implementation Status

This is a living checklist: which migrations have actual frontend code behind
them, and what's still scaffolded / stubbed. Read before onboarding a new
developer — it prevents "I can't find the feature you described" confusion.

| Feature | Migration | Frontend | Status |
| --- | --- | --- | --- |
| Profiles (auto-created on auth) | `supabase_schema.sql` | `AuthContext.fetchProfile` | ✅ Working |
| Items (AV → BORROWED lifecycle) | `migration_borrowed_items.sql` | `ItemContext`, `AddItem`, `EditItem`, `MyItems` | ✅ Working |
| Requests (PENDING / ACCEPTED / REJECTED / RETURNED) | `migration_request_rls.sql`, `migration_requests_notifications.sql` | `RequestContext`, `ItemDetails`, `Notifications` | ✅ Working |
| Groups + multi-group | `migration_multi_group.sql`, `supabase_schema.sql` | `GroupContext`, `Groups`, `GroupDetails`, `CreateGroup` | ✅ Working |
| Governance: monarchy/republic + admin role | `migration_governance.sql` | `CreateGroup` (label), `GroupDetails` (admin can remove + promote) | 🟡 Role-based admin only — no actual voting proposals/tallying |
| Maintenance fees | `migration_maintenance_fee.sql` | `AddItem`, `ItemDetails` | 🟡 Displayed on items — no charging flow |
| Mediations (temperature check) | `migration_mediations.sql` | `ItemDetails` (create), `Mediations` page (view + respond + resolve) | ✅ Working |
| Item inquiries (Q&A via mutual friend) | `migration_inquiries.sql` | `Inquiries` page (view + respond) | 🟡 Page works, create-flow not yet surfaced from ItemDetails (mediation flow covers the same use case today) |
| Logistics (pickup) | `migration_logistics_v2.sql` | `AddItem`, `EditItem`, `ItemDetails`, `MyBorrowedItems` | ✅ Pickup address/time/contact shown to borrower on accepted items |
| Borrower return | `migration_borrower_return.sql` | `MyBorrowedItems` | ✅ Working |
| Premium subscription | `migration_premium.sql` | `Upgrade` page, `src/utils/payment.js`, Edge Functions in `supabase/functions/{create-razorpay-order,verify-razorpay-payment}` | 🟡 Client + Edge Functions built. Deploy the functions, set secrets + VITE_* env vars, and it charges for real. |
| Governance voting (proposals) | `migration_proposals.sql` | `GroupProposals.jsx` inside `GroupDetails` | ✅ Members create proposals, vote yes/no, proposer or admin closes. No auto-execution. |
| Realtime notifications | `migration_enable_realtime.sql` | `NotificationContext` | ✅ Working |
| Image storage | `migration_storage_buckets.sql` | `src/utils/uploadImage.js` wired into `AddItem`, `EditItem`, `CreateGroup`, `Profile` | ✅ Run the migration once and uploads go to Supabase Storage. Without it, falls back to data URLs. |
| Push notifications (FCM) | `migration_push_tokens.sql` | `src/utils/pushNotifications.js` + `supabase/functions/send-push` | 🟡 Full stack built. Needs Firebase project + `google-services.json` dropped into `android/app/` + secrets set (see below). |

### Supabase Storage buckets

Run `migration_storage_buckets.sql` in the SQL Editor. It creates three public
buckets (`item-images`, `group-images`, `avatars`), scopes write access to
`${userId}/...` paths, and allows public read. One-liner — no dashboard clicks.

Until you run it, `uploadImage` transparently falls back to storing the image
as a base64 data URL on the row. That works in dev but bloats Postgres rows —
don't ship that way.

### Deploy the Razorpay Edge Functions (Premium billing)

Source: `supabase/functions/{create-razorpay-order,verify-razorpay-payment}`.

```bash
# one-time
npm i -g supabase
supabase login
supabase link --project-ref <your-project-ref>

# set secrets (use your dashboard or CLI)
supabase secrets set RAZORPAY_KEY_ID=rzp_live_xxx
supabase secrets set RAZORPAY_KEY_SECRET=xxx
# SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY are auto-injected

# deploy
supabase functions deploy create-razorpay-order
supabase functions deploy verify-razorpay-payment
```

Then add to `.env`:

```
VITE_RAZORPAY_KEY_ID=rzp_live_xxx
VITE_CREATE_ORDER_URL=https://<project-ref>.supabase.co/functions/v1/create-razorpay-order
VITE_VERIFY_PAYMENT_URL=https://<project-ref>.supabase.co/functions/v1/verify-razorpay-payment
```

### Firebase Cloud Messaging setup (Push notifications)

1. Firebase Console → create a project (or reuse existing) → Add Android app
   with package name `com.mayiborrow.app`.
2. Download `google-services.json` and drop it at `android/app/google-services.json`.
   (`android/app/build.gradle` already detects it and applies the plugin.)
3. Project Settings → Service accounts → Generate new private key → download
   the JSON.
4. Run `migration_push_tokens.sql` once.
5. Deploy the Edge Function:

   ```bash
   supabase secrets set FCM_PROJECT_ID=your-firebase-project-id
   supabase secrets set FCM_SERVICE_ACCOUNT_JSON="$(cat path/to/service-account.json)"
   supabase functions deploy send-push
   ```

6. Add to `.env`:

   ```
   VITE_SEND_PUSH_URL=https://<project-ref>.supabase.co/functions/v1/send-push
   ```

On Android 13+ the client will prompt for `POST_NOTIFICATIONS`; permission is
declared in `AndroidManifest.xml`. The client registers once per login and
stores the FCM token on `profiles.fcm_token`. `RequestContext` already fires
`sendPushTo(...)` after creating the in-app notification for new borrow
requests and acceptances — so once the pieces above are in place, push works
end-to-end with no other code changes.

## migration_perf_advisors.sql (5 Sep 2026)

Applied to the live project the same day (Supabase migration
`perf_advisors_fk_indexes_policy_merge`). Clears every performance-advisor
finding without changing permissions:

- covering indexes on the 12 foreign keys that had none;
- the duplicate permissive policies on `items`, `requests`, `mediations`,
  `item_inquiries` and `group_members` merged into one policy per action (each
  merged expression is the OR of the ones it replaced);
- every `auth.uid()` / `auth.role()` inside a policy wrapped in `(select …)`
  so it is evaluated once per query instead of once per row.

Unused indexes were left alone on purpose — with a handful of users the usage
stats say nothing yet. Verified afterwards with `node scripts/flow-test.mjs`.
