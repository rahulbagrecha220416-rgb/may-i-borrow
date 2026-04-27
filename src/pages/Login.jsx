import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { user, loginAsGuest } = useAuth();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isCheckingCallback, setIsCheckingCallback] = useState(false);
    const [authMode, setAuthMode] = useState('google'); // 'google', 'email', 'signup'

    React.useEffect(() => {
        // Detect if we are in an Auth Callback flow (Code or Hash)
        const hash = window.location.hash;
        const search = window.location.search;
        if (hash.includes('access_token') || hash.includes('refresh_token') || search.includes('code=')) {
            setIsCheckingCallback(true);
        }

        if (user) {
            // SMALL DELAY to account for logout state updates
            const timer = setTimeout(() => {
                const returnUrl = localStorage.getItem('returnUrl');
                if (returnUrl) {
                    localStorage.removeItem('returnUrl');
                    navigate(returnUrl);
                } else {
                    navigate('/');
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [user, navigate]);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setMessage('');

        try {
            const isNative = Capacitor.isNativePlatform();

            // Only clear auth state on mobile (prevents OAuth corruption)
            if (isNative) {
                await supabase.auth.signOut({ scope: 'local' });
            }

            const options = {
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    }
                }
            };

            // Use custom scheme for Android, let web use default
            if (isNative) {
                options.options.redirectTo = 'com.mayiborrow.app://callback';
                options.options.skipBrowserRedirect = false;
            }

            console.log('🔐 Initiating Google OAuth with:', isNative ? 'custom scheme' : 'web redirect');

            const { error } = await supabase.auth.signInWithOAuth(options);

            if (error) {
                console.error('OAuth error:', error);
                setMessage(`Login failed: ${error.message}`);
            }
        } catch (err) {
            console.error('Unexpected login error:', err);
            setMessage(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setMessage('Please enter both email and password');
            return;
        }
        setLoading(true);
        setMessage('');
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setMessage(error.message);
        }
        setLoading(false);
    };

    const handleEmailSignup = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setMessage('Please enter both email and password');
            return;
        }
        if (password.length < 6) {
            setMessage('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        setMessage('');
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
            setMessage(error.message);
        } else {
            setMessage('Check your email to confirm your account!');
        }
        setLoading(false);
    };

    const hasKeys = import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('your_supabase_url');

    if (isCheckingCallback) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6b7c73] mb-4"></div>
                <p className="text-[#6b7c73] font-medium animate-pulse">Verifying Login...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-boho-bg">
            <div className="w-full max-w-md p-8 rounded-2xl border bg-boho-paper border-boho-divider">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2 text-boho-text">May We Borrow</h1>
                    <p className="text-sm text-boho-text-secondary">Borrow from people you know.</p>
                </div>

                {hasKeys ? (
                    <div className="space-y-4">
                        {authMode === 'google' && (
                            <>
                                <button
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-3 bg-white border border-boho-divider text-boho-text font-semibold py-3 px-4 rounded-xl hover:bg-boho-paper transition-colors active:scale-95"
                                >
                                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                                    Sign in with Google
                                </button>

                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-boho-divider"></div>
                                    <span className="flex-shrink-0 mx-4 text-boho-text-secondary text-xs uppercase">Or</span>
                                    <div className="flex-grow border-t border-boho-divider"></div>
                                </div>

                                <button
                                    onClick={() => setAuthMode('email')}
                                    className="w-full font-semibold py-3 px-4 rounded-xl border border-boho-divider bg-white text-boho-text transition-colors active:scale-95 hover:bg-boho-paper"
                                >
                                    Sign in with Email/Password
                                </button>

                                <button
                                    onClick={loginAsGuest}
                                    className="w-full py-3 px-4 rounded-xl font-medium text-boho-text-secondary transition-colors active:scale-95 hover:text-boho-text"
                                >
                                    Continue as Guest
                                </button>
                            </>
                        )}

                        {authMode === 'email' && (
                            <>
                                <form onSubmit={handleEmailLogin} className="space-y-3">
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                                        required
                                    />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-sage-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-sage-600 transition-colors active:scale-95 disabled:opacity-50"
                                    >
                                        {loading ? 'Signing in...' : 'Sign In'}
                                    </button>
                                </form>

                                <div className="text-center space-y-2">
                                    <button
                                        onClick={() => setAuthMode('signup')}
                                        className="text-sage-600 hover:text-sage-700 text-sm font-semibold"
                                    >
                                        Don't have an account? Sign up
                                    </button>
                                    <br />
                                    <button
                                        onClick={() => setAuthMode('google')}
                                        className="text-boho-text-secondary hover:text-boho-text text-sm"
                                    >
                                        ← Back to other options
                                    </button>
                                </div>
                            </>
                        )}

                        {authMode === 'signup' && (
                            <>
                                <form onSubmit={handleEmailSignup} className="space-y-3">
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                                        required
                                    />
                                    <input
                                        type="password"
                                        placeholder="Password (minimum 6 characters)"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-sage-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-sage-600 transition-colors active:scale-95 disabled:opacity-50"
                                    >
                                        {loading ? 'Creating account...' : 'Sign Up'}
                                    </button>
                                </form>

                                <div className="text-center space-y-2">
                                    <button
                                        onClick={() => setAuthMode('email')}
                                        className="text-sage-600 hover:text-sage-700 text-sm font-semibold"
                                    >
                                        Already have an account? Sign in
                                    </button>
                                    <br />
                                    <button
                                        onClick={() => setAuthMode('google')}
                                        className="text-boho-text-secondary hover:text-boho-text text-sm"
                                    >
                                        ← Back to other options
                                    </button>
                                </div>
                            </>
                        )}

                        {message && (
                            <div className={`mt-4 p-3 rounded-lg text-sm text-center ${message.includes('Check') || message.includes('email') ? 'bg-[#F2ECE3] text-[#6b7c73]' : 'bg-red-50 text-red-700'}`}>
                                {message}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <button
                            onClick={loginAsGuest}
                            className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-emerald-700 shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95"
                        >
                            Continue as Guest
                        </button>
                        <p className="text-xs text-gray-500 text-center">
                            Configure Supabase credentials in .env to enable real auth.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Login;
