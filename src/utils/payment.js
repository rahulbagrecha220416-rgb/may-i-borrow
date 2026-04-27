// Razorpay Checkout scaffold for the Premium subscription.
//
// This file does NOT contain any production payment logic — it's the boundary
// where the client hands off to Razorpay's hosted checkout. To activate it you
// need three things your dev team must supply:
//
//   1. A Razorpay Key ID        → set VITE_RAZORPAY_KEY_ID in .env
//   2. A backend endpoint that creates an order server-side (Supabase Edge
//      Function or a small Express route). It must use your Razorpay KEY_SECRET
//      and return { order_id, amount, currency }.
//      → set VITE_CREATE_ORDER_URL in .env
//   3. A second backend endpoint that verifies the signature Razorpay returns
//      and, if valid, flips profiles.is_premium=true for the current user.
//      → set VITE_VERIFY_PAYMENT_URL in .env
//
// Without those env vars this function throws with a clear message so the
// fallback (simulated upgrade) can kick in in dev.

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

const loadRazorpayScript = () =>
    new Promise((resolve, reject) => {
        if (window.Razorpay) return resolve();
        const s = document.createElement('script');
        s.src = RAZORPAY_SCRIPT;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Razorpay script blocked or failed to load'));
        document.head.appendChild(s);
    });

/**
 * Launch the Razorpay Checkout modal for a premium subscription.
 *
 * @param {{ user: { id: string, email: string, user_metadata?: { full_name?: string } }, amountPaise: number, accessToken: string }} opts
 * @returns {Promise<{ paymentId: string }>} — resolves after signature verification
 */
export async function startPremiumCheckout({ user, amountPaise = 9900, accessToken }) {
    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    const createOrderUrl = import.meta.env.VITE_CREATE_ORDER_URL;
    const verifyUrl = import.meta.env.VITE_VERIFY_PAYMENT_URL;

    if (!keyId || !createOrderUrl || !verifyUrl) {
        throw new Error('PAYMENT_NOT_CONFIGURED');
    }

    await loadRazorpayScript();

    // Ask our backend to create a Razorpay order with the server-side secret.
    const orderRes = await fetch(createOrderUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ amount: amountPaise, currency: 'INR' })
    });
    if (!orderRes.ok) {
        throw new Error(`Order creation failed: ${orderRes.status}`);
    }
    const { order_id, amount, currency } = await orderRes.json();

    return new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
            key: keyId,
            order_id,
            amount,
            currency,
            name: 'May We Borrow',
            description: 'Community Pass (monthly)',
            prefill: {
                email: user.email,
                name: user.user_metadata?.full_name || ''
            },
            theme: { color: '#6b7c73' },
            handler: async (response) => {
                try {
                    const verifyRes = await fetch(verifyUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${accessToken}`
                        },
                        body: JSON.stringify(response)
                    });
                    if (!verifyRes.ok) throw new Error(`Verification failed: ${verifyRes.status}`);
                    resolve({ paymentId: response.razorpay_payment_id });
                } catch (err) {
                    reject(err);
                }
            },
            modal: {
                ondismiss: () => reject(new Error('CHECKOUT_DISMISSED'))
            }
        });
        rzp.open();
    });
}
