import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '../supabaseClient';

// Register this device for FCM push notifications and sync the token to the user's
// profile row so the send-push Edge Function can target them.
//
// Call this once after login in AuthContext. Safe to call on web — it no-ops.
//
// Prerequisites:
//   1. Run migration_push_tokens.sql
//   2. Follow `DATABASE_MIGRATIONS.md` → "Firebase Cloud Messaging setup" to
//      drop `google-services.json` into `android/app/`.
export async function registerPushNotifications(userId) {
    if (!Capacitor.isNativePlatform() || !userId) return;

    try {
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
            perm = await PushNotifications.requestPermissions();
        }
        if (perm.receive !== 'granted') {
            console.log('Push permission not granted');
            return;
        }

        // Register once; listeners are idempotent within a session.
        await PushNotifications.register();

        PushNotifications.addListener('registration', async (token) => {
            console.log('✅ FCM token registered');
            const { error } = await supabase
                .from('profiles')
                .update({ fcm_token: token.value })
                .eq('id', userId);
            if (error) console.warn('Failed to save FCM token:', error.message);
        });

        PushNotifications.addListener('registrationError', (err) => {
            console.warn('Push registration error:', err);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push received in foreground:', notification);
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            console.log('Push tapped:', action);
            // Deep-link handling could navigate based on action.notification.data.link
        });
    } catch (err) {
        console.warn('registerPushNotifications failed:', err);
    }
}

/**
 * Ask the send-push Edge Function to deliver a push to a user.
 * No-op (and returns null) if VITE_SEND_PUSH_URL isn't set.
 */
export async function sendPushTo(userId, title, body, data = {}) {
    const url = import.meta.env.VITE_SEND_PUSH_URL;
    if (!url) return null;

    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;
    if (!token) return null;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ user_id: userId, title, body, data })
        });
        return res.ok ? await res.json() : null;
    } catch (err) {
        console.warn('sendPushTo failed:', err);
        return null;
    }
}
