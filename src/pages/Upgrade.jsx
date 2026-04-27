import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { startPremiumCheckout } from '../utils/payment';
import PageTransition from '../components/layout/PageTransition';

const Upgrade = () => {
    const { user, session, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const markPremium = async () => {
        const { error } = await supabase
            .from('profiles')
            .update({ is_premium: true })
            .eq('id', user.id);
        if (error) throw error;
        await refreshProfile();
    };

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            await startPremiumCheckout({
                user,
                amountPaise: 9900,
                accessToken: session?.access_token
            });
            await markPremium();
            navigate(-1);
        } catch (err) {
            if (err.message === 'PAYMENT_NOT_CONFIGURED') {
                // Dev fallback: no Razorpay keys set. Flip the flag so the
                // rest of the app can be tested. Production should never hit this.
                console.warn('⚠️ Razorpay not configured — flipping is_premium without charging.');
                try {
                    await markPremium();
                    navigate(-1);
                } catch (dbErr) {
                    console.error('Upgrade fallback failed:', dbErr);
                    alert('Something went wrong. Please try again.');
                }
            } else if (err.message === 'CHECKOUT_DISMISSED') {
                // User closed the modal — silent no-op.
            } else {
                console.error('Upgrade failed:', err);
                alert(`Payment failed: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageTransition className="min-h-screen bg-boho-bg flex flex-col">
            <div className="p-6 pb-12 relative bg-sage-500 text-white">
                <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                    <ArrowLeft size={20} />
                </button>

                <div className="mt-8 text-center">
                    <div className="inline-block p-4 rounded-full mb-4 bg-white/15 border border-white/20">
                        <GlobeIcon size={40} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2 tracking-tight">Community Pass</h1>
                    <p className="text-white/80 text-sm">Expand your reach. Support the network.</p>
                </div>
            </div>

            <div className="max-w-md mx-auto w-full px-6 -mt-6 relative z-10 pb-8">
                <div className="bg-boho-paper rounded-2xl border border-boho-divider overflow-hidden">
                    <div className="p-6 space-y-5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-boho-bg text-sage-600">
                                <GlobeIcon />
                            </div>
                            <div>
                                <h3 className="font-bold text-boho-text">Unlock Network Reach</h3>
                                <p className="text-sm text-boho-text-secondary">Borrow from friends of friends.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-boho-bg text-sage-600">
                                <Shield size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-boho-text">Verified Identity</h3>
                                <p className="text-sm text-boho-text-secondary">Build trust with the wider community.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-boho-bg text-sage-600">
                                <Zap size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-boho-text">Community Support</h3>
                                <p className="text-sm text-boho-text-secondary">Keep this platform ad-free and safe.</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-boho-divider">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <span className="text-sm text-boho-text-secondary font-medium">Monthly Contribution</span>
                                    <div className="text-3xl font-bold text-boho-text">₹99<span className="text-sm font-normal text-boho-text-secondary">/mo</span></div>
                                </div>
                                <div className="text-sage-600 font-bold bg-boho-bg px-3 py-1 rounded-full text-xs border border-boho-divider">
                                    Cancel Anytime
                                </div>
                            </div>

                            <button
                                onClick={handleUpgrade}
                                disabled={loading}
                                className="w-full bg-sage-500 hover:bg-sage-600 text-white py-4 rounded-xl font-bold text-lg transition-colors active:scale-95 disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Processing...' : 'Get Access Pass'}
                                {!loading && <ArrowRightIcon />}
                            </button>
                            <p className="text-center text-xs text-boho-text-secondary mt-3">Secure, transparent, and low-pressure.</p>
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

// Simple icons for local usage
const GlobeIcon = ({ size = 24, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="2" x2="22" y1="12" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
);

const ArrowRightIcon = ({ size = 20, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
);

export default Upgrade;
