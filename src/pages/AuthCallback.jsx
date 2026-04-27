import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const AuthCallback = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Supabase JS Client automatically handles the hash/query parsing
                // when getSession is called if it detects auth params.
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) throw error;

                if (session) {
                    // Success! Redirect to intended page or home
                    const returnUrl = localStorage.getItem('returnUrl');
                    if (returnUrl) {
                        localStorage.removeItem('returnUrl');
                        navigate(returnUrl);
                    } else {
                        navigate('/');
                    }
                } else {
                    // If no session found in URL, maybe check for code manually (PKCE)
                    // But getSession usually handles it. 
                    // If we are here, it means we redirected back but valid session wasn't found.
                    // Wait a moment purely for potential async storage set
                    setTimeout(async () => {
                        const { data: { session: retrySession } } = await supabase.auth.getSession();
                        if (retrySession) {
                            navigate('/');
                        } else {
                            navigate('/login');
                        }
                    }, 1000);
                }
            } catch (err) {
                console.error("Auth Callback Error:", err);
                setError(err.message);
                setTimeout(() => navigate('/login'), 3000);
            }
        };

        handleAuthCallback();
    }, [navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            {error ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-center">
                    <h3 className="font-bold mb-1">Login Verification Failed</h3>
                    <p>{error}</p>
                    <p className="text-xs mt-2">Redirecting to login...</p>
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mb-4"></div>
                    <p className="text-gray-600 font-medium animate-pulse">Completing Secure Login...</p>
                </div>
            )}
        </div>
    );
};

export default AuthCallback;
