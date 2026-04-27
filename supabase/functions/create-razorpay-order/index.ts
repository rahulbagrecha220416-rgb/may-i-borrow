// Supabase Edge Function: create-razorpay-order
//
// Exchanges a Razorpay KEY_SECRET for a server-side order. The browser
// never sees the key secret — it only gets back an order_id it can hand
// to Razorpay Checkout.
//
// Deploy:
//   supabase functions deploy create-razorpay-order --no-verify-jwt=false
//
// Required secrets (set in Supabase Dashboard → Project Settings → Edge Functions):
//   RAZORPAY_KEY_ID
//   RAZORPAY_KEY_SECRET
//
// Frontend sets VITE_CREATE_ORDER_URL to this function's URL.

// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: CORS });
    }

    try {
        // The platform validates the JWT automatically; we just need the caller to be authenticated.
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
                status: 401,
                headers: { ...CORS, 'Content-Type': 'application/json' }
            });
        }

        const { amount, currency = 'INR' } = await req.json();
        if (typeof amount !== 'number' || amount <= 0) {
            return new Response(JSON.stringify({ error: 'Invalid amount' }), {
                status: 400,
                headers: { ...CORS, 'Content-Type': 'application/json' }
            });
        }

        const keyId = Deno.env.get('RAZORPAY_KEY_ID');
        const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
        if (!keyId || !keySecret) {
            return new Response(JSON.stringify({ error: 'Razorpay not configured' }), {
                status: 500,
                headers: { ...CORS, 'Content-Type': 'application/json' }
            });
        }

        const auth = btoa(`${keyId}:${keySecret}`);
        const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount,
                currency,
                receipt: `rcpt_${crypto.randomUUID().slice(0, 18)}`,
                notes: { source: 'may-i-borrow' }
            })
        });

        if (!razorpayRes.ok) {
            const text = await razorpayRes.text();
            return new Response(JSON.stringify({ error: 'Razorpay order failed', detail: text }), {
                status: 502,
                headers: { ...CORS, 'Content-Type': 'application/json' }
            });
        }

        const order: any = await razorpayRes.json();
        return new Response(
            JSON.stringify({ order_id: order.id, amount: order.amount, currency: order.currency }),
            { headers: { ...CORS, 'Content-Type': 'application/json' } }
        );
    } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
            status: 500,
            headers: { ...CORS, 'Content-Type': 'application/json' }
        });
    }
});
