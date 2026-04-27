// Supabase Edge Function: verify-razorpay-payment
//
// Verifies the HMAC-SHA256 signature Razorpay Checkout returns. If valid,
// flips profiles.is_premium=true for the caller (identified via the
// platform-validated JWT — we never trust a user_id from the request body).
//
// Deploy:
//   supabase functions deploy verify-razorpay-payment --no-verify-jwt=false
//
// Required secrets:
//   RAZORPAY_KEY_SECRET
//   SUPABASE_URL           (auto-provided by platform)
//   SUPABASE_SERVICE_ROLE_KEY   (used to bypass RLS and update the profile)

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const toHex = (buf: ArrayBuffer) =>
    Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');

async function hmacSha256Hex(secret: string, message: string) {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
    return toHex(sig);
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: CORS });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
                status: 401,
                headers: { ...CORS, 'Content-Type': 'application/json' }
            });
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return new Response(JSON.stringify({ error: 'Missing payment fields' }), {
                status: 400,
                headers: { ...CORS, 'Content-Type': 'application/json' }
            });
        }

        const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
        if (!keySecret) {
            return new Response(JSON.stringify({ error: 'Razorpay not configured' }), {
                status: 500,
                headers: { ...CORS, 'Content-Type': 'application/json' }
            });
        }

        const expected = await hmacSha256Hex(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`);
        if (expected !== razorpay_signature) {
            return new Response(JSON.stringify({ error: 'Invalid signature' }), {
                status: 400,
                headers: { ...CORS, 'Content-Type': 'application/json' }
            });
        }

        // Identify the caller via their JWT — never trust a user_id in the request.
        const userClient = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: authHeader } } }
        );
        const { data: userRes, error: userErr } = await userClient.auth.getUser();
        if (userErr || !userRes.user) {
            return new Response(JSON.stringify({ error: 'Not authenticated' }), {
                status: 401,
                headers: { ...CORS, 'Content-Type': 'application/json' }
            });
        }

        // Flip premium with the service-role key (bypasses RLS; safe because we verified the caller above).
        const admin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        const { error: updateErr } = await admin
            .from('profiles')
            .update({ is_premium: true })
            .eq('id', userRes.user.id);

        if (updateErr) {
            return new Response(JSON.stringify({ error: 'Profile update failed', detail: updateErr.message }), {
                status: 500,
                headers: { ...CORS, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ ok: true, paymentId: razorpay_payment_id }), {
            headers: { ...CORS, 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
            status: 500,
            headers: { ...CORS, 'Content-Type': 'application/json' }
        });
    }
});
