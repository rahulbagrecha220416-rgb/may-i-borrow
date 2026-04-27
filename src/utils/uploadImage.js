import { supabase } from '../supabaseClient';

// Supabase Storage upload helper.
//
// Required one-time setup in the Supabase Dashboard (Storage → New bucket):
//   1. "item-images"   (public)
//   2. "group-images"  (public)
//   3. "avatars"       (public)
//
// Each bucket needs an INSERT policy for authenticated users, e.g.:
//   create policy "auth users can upload" on storage.objects
//     for insert to authenticated
//     with check (bucket_id = 'item-images');
//
// Until those buckets exist, this helper transparently falls back to a data URL
// so the app still works locally — but data URLs bloat Postgres rows and should
// not be used in production.

const ALLOWED_BUCKETS = new Set(['item-images', 'group-images', 'avatars']);

/**
 * Convert a File to a base64 data URL (fallback when Storage is unavailable).
 */
const readAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

/**
 * Upload a File to a Supabase Storage bucket, returning a public URL.
 * Falls back to a base64 data URL if the bucket isn't reachable.
 *
 * @param {File} file - A File/Blob from an <input type="file" /> change event
 * @param {'item-images' | 'group-images' | 'avatars'} bucket
 * @param {string} userId - Used as a path prefix so users only write to their own folder
 * @returns {Promise<{ url: string, usedFallback: boolean }>}
 */
export async function uploadImage(file, bucket, userId) {
    if (!file) throw new Error('uploadImage: file is required');
    if (!ALLOWED_BUCKETS.has(bucket)) {
        throw new Error(`uploadImage: unknown bucket "${bucket}"`);
    }
    if (!userId) throw new Error('uploadImage: userId is required');

    const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase();
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || 'image/jpeg'
        });

    if (uploadError) {
        console.warn(`Storage upload failed (${bucket}): ${uploadError.message} — falling back to data URL`);
        const dataUrl = await readAsDataUrl(file);
        return { url: dataUrl, usedFallback: true };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl, usedFallback: false };
}
