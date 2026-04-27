# Mobile OAuth Configuration Guide

## What You Need to Do in Supabase & Google Cloud

### 1. Supabase Configuration

**Add Redirect URL:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Authentication → URL Configuration
4. Under "Redirect URLs", add:
   ```
   com.mayiborrow.app://callback
   ```
5. Click "Save"

### 2. Google OAuth Configuration

**Add Authorized Redirect URI:**
1. Go to https://console.cloud.google.com
2. Select your project
3. Go to APIs & Services → Credentials
4. Click on your OAuth 2.0 Client ID
5. Under "Authorized redirect URIs", add:
   ```
   https://[your-supabase-project-ref].supabase.co/auth/v1/callback
   ```
6. Click "Save"

### 3. Test the Flow

**On Android:**
1. Install new APK
2. Click "Sign in with Google"
3. Should redirect to Google login
4. After login, should deep link back to app
5. If successful, you'll be logged in!

**On Web:**
- Google OAuth should work as before
- No changes needed

---

## Troubleshooting

### If Google OAuth still fails on Android:

**Use email/password instead:**
- Click "Sign in with Email/Password"
- More reliable on Android
- No OAuth complexity

### If deep link doesn't work:

**Check:**
1. AndroidManifest.xml has `com.mayiborrow.app` scheme
2. Supabase has the redirect URL added
3. Google OAuth has the callback URL

---

## What's Changed

**OAuth Flow:**
- Clears auth state before login (prevents corruption)
- Uses `com.mayiborrow.app://callback` for Android
- Adds `access_type=offline` for better token refresh
- Better error handling and logging

**Result:** Google OAuth should work more reliably on Android!
