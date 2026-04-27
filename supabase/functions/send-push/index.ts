// Supabase Edge Function: send-push
//
// Sends a single FCM push notification to a user. Looks up the target's
// profile.fcm_token, mints an OAuth2 access token from a service account
// JWT, and POSTs to FCM HTTP v1.
//
// Deploy:
//   supabase functions deploy send-push --no-verify-jwt=false
//
// Required secrets (Supabase Dashboard → Edge Functions → Secrets):
//   FCM_PROJECT_ID                    e.g. "may-i-borrow-12345"
//   FCM_SERVICE_ACCOUNT_JSON          the entire service-account JSON (as a string)
//                                     — Firebase Console → Project Settings →
//                                     Service accounts → Generate new private key
//   SUPABASE_URL                      auto-injected
//   SUPABASE_SERVICE_ROLE_KEY         auto-injected
//
// Frontend sets VITE_SEND_PUSH_URL to this function's URL.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const b64urlEncode = (buf: ArrayBuffer | Uint8Array) => {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const pemToArrayBuffer = (pem: string) => {
    const body = pem
        .replace(/-----BEGIN [^-]+-----/, '')
        .replace(/-----END [^-]+-----/, '')
        .replace(/\s+/g, '');
    const binary = atob(body);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
};

async function getFcmAccessToken(serviceAccount: { client_email: string; private_key: string }) {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const claim = {
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600
    };
    const unsigned = `${b64urlEncode(new TextEncoder().encode(JSON.stringify(header)))}.${b64urlEncode(new TextEncoder().encode(JSON.stringify(claim)))}`;

    const key = await crypto.subtle.importKey(
        'pkcs8',
        pemToArrayBuffer(serviceAccount.private_key.replace(/\\n/g, '\n')),
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
    const jwt = `${unsigned}.${b64urlEncode(sig)}`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt
        })
    });
    if (!tokenRes.ok) throw new Error(`Google token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`);
    const { access_token } = await tokenRes.json();
    return access_token as string;
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
                status: 401, headers: { ...CORS, 'Content-Type': 'application/json' }
            });
        }

        const { user_id, title, body, data } = await req.json();
        if (!user_id || !title) {
            return new Response(JSON.stringify({ error: 'user_id and title are required' }), {
                status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
            });
        }

        const projectId = Deno.env.get('FCM_PROJECT_ID');
        const svcJson = Deno.env.get('FCM_SERVICE_ACCOUNT_JSON');
        if (!projectId || !svcJson) {
            return new Response(JSON.stringify({ error: 'FCM not configured' }), {
                status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
            });
        }

        // Look up target FCM token (service role — bypasses RLS).
        const admin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );
        const { data: profile, error: profileErr } = await admin
            .from('profiles')
            .select('fcm_token')
            .eq('id', user_id)
            .maybeSingle();

        if (profileErr) throw profileErr;
        if (!profile?.fcm_token) {
            return new Response(JSON.stringify({ ok: false, reason: 'no-token' }), {
                headers: { ...CORS, 'Content-Type': 'application/json' }
            });
        }

        const serviceAccount = JSON.parse(svcJson);
        const accessToken = await getFcmAccessToken(serviceAccount);

        const fcmRes = await fetch(
            `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: {
                        token: profile.fcm_token,
                        notification: { title, body: body ?? '' },
                        data: Object.fromEntries(
                            Object.entries(data ?? {}).map(([k, v]) => [k, String(v)])
                        )
                    }
                })
            }
        );

        if (!fcmRes.ok) {
            const text = await fcmRes.text();
            return new Response(JSON.stringify({ error: 'FCM send failed', detail: text }), {
                status: 502, headers: { ...CORS, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ ok: true }), {
            headers: { ...CORS, 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
            status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
        });
    }
});
