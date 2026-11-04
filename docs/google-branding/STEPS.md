# Google sign-in branding — steps

Goal: Google's sign-in screen says "May We Borrow" instead of `yynngojgbpviigrynuut.supabase.co`.
Done in your own browser while signed in to the Google account that owns the OAuth client.

## Before you start

1. **Privacy page is live:** https://mayweborrow.com/privacy.html should open.
2. **Contact email works:** the policy lists `hello@mayweborrow.com`. In Namecheap →
   mayweborrow.com → **Manage** → **Domain** tab → **Redirect Email** → add alias `hello` →
   forward to your Gmail. (Free. Skip if you'd rather show another address; tell Claude to change it.)

## In Google Cloud

1. Go to https://console.cloud.google.com/auth/branding
   (older console: **APIs & Services → OAuth consent screen**).
2. At the top, pick the project that holds the OAuth client Supabase uses. To check: **Clients**
   (or **Credentials**) → the Web client's *Authorized redirect URIs* lists
   `https://yynngojgbpviigrynuut.supabase.co/auth/v1/callback`.
3. Fill in **Branding**:

   | Field | Value |
   |---|---|
   | App name | `May We Borrow` |
   | User support email | your Gmail |
   | App logo | `docs/google-branding/logo-120.png` (120×120) |
   | Application home page | `https://mayweborrow.com` |
   | Application privacy policy link | `https://mayweborrow.com/privacy.html` |
   | Authorized domains | `mayweborrow.com` and `supabase.co` |
   | Developer contact email | your Gmail |

4. **Save**.
5. **Audience** → if *Publishing status* is "Testing", click **Publish app**. While it's in
   testing, only listed test users can sign in.
6. Back on **Branding**, if Google shows **Verify branding**, click it. Google may ask you to prove
   you own `mayweborrow.com` through Google Search Console: it gives you a TXT record to add in
   Namecheap → **Advanced DNS** → *Add new record* → TXT, Host `@`. Verification usually takes 2–3
   business days.

Until verification finishes, the sign-in screen keeps showing the Supabase address. Sign-in still
works the whole time.
