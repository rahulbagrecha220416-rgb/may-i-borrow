// Automated borrow/lend flow test — exercises the full item lifecycle through
// the real Supabase API with the synthetic @mayiborrow.test users, and doubles
// as a keep-alive so the free-tier project never auto-pauses.
//
// Run from the repo root:  node scripts/flow-test.mjs
// Exit code 0 = all steps passed; 1 = at least one failure (details on stdout).
//
// Rotates the lender/borrower pair by day-of-year so different users and items
// are exercised on each run. Leaves RETURNED requests and read notifications
// behind on purpose — requests have no DELETE policy, and the history mimics
// real usage.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
    readFileSync(join(root, '.env'), 'utf8')
        .split(/\r?\n/)
        .filter(l => l.includes('='))
        .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const URL = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_ANON_KEY;
if (!URL || !KEY) { console.error('FAIL env: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing from .env'); process.exit(1); }

const USERS = [
    'asha.test@mayiborrow.test',
    'bharat.test@mayiborrow.test',
    'chitra.test@mayiborrow.test',
    'dinesh.test@mayiborrow.test',
];
const PASSWORD = 'Test@MayIBorrow1';

// Rotate the (lender, borrower) pair daily: 4 users -> 12 ordered pairs.
const day = Math.floor(Date.now() / 86400000);
const lenderEmail = USERS[day % 4];
const borrowerEmail = USERS.filter(u => u !== lenderEmail)[day % 3];

let failures = 0;
const ok = msg => console.log(`  OK   ${msg}`);
const fail = (msg, err) => { failures++; console.log(`  FAIL ${msg}${err ? ' — ' + (err.message || JSON.stringify(err)) : ''}`); };

const newClient = () => createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

async function signIn(email) {
    const client = newClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
    if (error) throw new Error(`sign-in ${email}: ${error.message}`);
    return { client, user: data.user };
}

console.log(`May We Borrow flow test — ${new Date().toISOString()}`);
console.log(`  lender: ${lenderEmail}  borrower: ${borrowerEmail}`);

try {
    // 1. Both users authenticate (exercises GoTrue + the profiles trigger data)
    const lender = await signIn(lenderEmail); ok('lender signed in');
    const borrower = await signIn(borrowerEmail); ok('borrower signed in');

    // 2. Borrower finds the lender's [TEST] item
    const { data: items, error: itemErr } = await borrower.client
        .from('items').select('*')
        .eq('owner_id', lender.user.id).like('name', '[TEST]%').limit(1);
    if (itemErr || !items?.length) throw new Error(`find test item: ${itemErr?.message || 'no [TEST] item for lender'}`);
    let item = items[0];
    ok(`borrower sees "${item.name}" (status ${item.status})`);

    // 2b. Self-heal: if a previous failed run left it BORROWED, the lender resets it
    if (item.status !== 'AVAILABLE') {
        const { error } = await lender.client.from('items')
            .update({ status: 'AVAILABLE', borrowed_by: null, borrowed_until: null })
            .eq('id', item.id);
        error ? fail('self-heal stuck item', error) : ok('self-healed stuck BORROWED state from a prior run');
    }

    // 3. Borrower requests the item (same shape as RequestContext.addRequest)
    const { data: request, error: reqErr } = await borrower.client
        .from('requests').insert({
            title: `Borrow request: ${item.name}`,
            description: 'Automated flow test',
            category: item.category || 'General',
            user_id: borrower.user.id,
            item_id: item.id,
            group_ids: item.group_ids || [],
            visibility: 'group',
            status: 'PENDING',
        }).select().single();
    reqErr ? fail('borrower creates request', reqErr) : ok(`request created (${request.id.slice(0, 8)}…)`);
    if (reqErr) throw new Error('cannot continue without a request');

    // 4. Borrower notifies the owner (app inserts this client-side too)
    {
        const { error } = await borrower.client.from('notifications').insert({
            user_id: lender.user.id, type: 'ITEM_REQUEST',
            content: `[flow-test] wants to borrow your "${item.name}"`,
            related_id: request.id, related_type: 'request', is_read: false,
        });
        error ? fail('notify owner of request', error) : ok('owner notified of request');
    }

    // 5. Lender sees the pending request and accepts (owner RLS policy)
    const { data: pend, error: pendErr } = await lender.client
        .from('requests').select('*').eq('id', request.id).eq('status', 'PENDING').maybeSingle();
    (pendErr || !pend) ? fail('lender sees pending request', pendErr) : ok('lender sees pending request');

    {
        const { data, error } = await lender.client.from('requests')
            .update({ status: 'ACCEPTED' }).eq('id', request.id).select();
        (error || !data?.length) ? fail('lender accepts request (owner RLS)', error) : ok('request ACCEPTED by item owner');
    }
    {
        const until = new Date(Date.now() + 7 * 86400000).toISOString();
        const { error } = await lender.client.from('items')
            .update({ status: 'BORROWED', borrowed_by: borrower.user.id, borrowed_until: until })
            .eq('id', item.id);
        error ? fail('item marked BORROWED', error) : ok('item marked BORROWED with due date');
    }
    {
        const { error } = await lender.client.from('notifications').insert({
            user_id: borrower.user.id, type: 'REQUEST_ACCEPTED',
            content: `[flow-test] "${item.name}" is yours — coordinate pickup.`,
            related_id: request.id, related_type: 'request', is_read: false,
        });
        error ? fail('notify borrower of acceptance', error) : ok('borrower notified of acceptance');
    }

    // 6. Borrower sees it in "My Borrowed Items"
    {
        const { data, error } = await borrower.client.from('items')
            .select('id,status').eq('id', item.id).eq('borrowed_by', borrower.user.id).eq('status', 'BORROWED').maybeSingle();
        (error || !data) ? fail('borrower sees item as borrowed', error) : ok('borrower sees item in My Borrowed Items');
    }

    // 7. Borrower returns it (the borrower-return RLS policy)
    {
        const { data, error } = await borrower.client.from('items')
            .update({ status: 'AVAILABLE', borrowed_by: null, borrowed_until: null })
            .eq('id', item.id).select();
        (error || !data?.length) ? fail('borrower returns item (return RLS)', error) : ok('borrower returned the item');
    }
    {
        const { error } = await borrower.client.from('requests')
            .update({ status: 'RETURNED' }).eq('id', request.id);
        error ? fail('request marked RETURNED', error) : ok('request marked RETURNED');
    }
    {
        const { error } = await borrower.client.from('notifications').insert({
            user_id: lender.user.id, type: 'ITEM_RETURNED',
            content: `[flow-test] returned your "${item.name}". All good!`,
            related_id: request.id, related_type: 'request', is_read: false,
        });
        error ? fail('notify owner of return', error) : ok('owner notified of return');
    }

    // 8. Final state assertion
    {
        const { data, error } = await lender.client.from('items').select('status,borrowed_by').eq('id', item.id).single();
        (error || data.status !== 'AVAILABLE' || data.borrowed_by !== null)
            ? fail('item back to AVAILABLE', error || { message: `status=${data?.status}` })
            : ok('item is AVAILABLE again');
    }

    // 9. Tidy: both users mark their [flow-test] notifications read
    for (const who of [lender, borrower]) {
        const { error } = await who.client.from('notifications')
            .update({ is_read: true }).eq('user_id', who.user.id).like('content', '[flow-test]%');
        if (error) fail('mark notifications read', error);
    }
    ok('flow-test notifications marked read');

    await lender.client.auth.signOut();
    await borrower.client.auth.signOut();
} catch (e) {
    fail('aborted', e);
}

console.log(failures === 0 ? '\nRESULT: PASS — full borrow/lend cycle OK' : `\nRESULT: FAIL — ${failures} step(s) failed`);
process.exit(failures === 0 ? 0 : 1);
