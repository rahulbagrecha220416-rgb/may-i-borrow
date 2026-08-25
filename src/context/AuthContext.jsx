
import React, { createContext, useContext, useState, useEffect } from 'react';
import { App } from '@capacitor/app';
import { supabase } from '../supabaseClient';
import { MOCK_USERS } from '../data/mockData';
import { registerPushNotifications } from '../utils/pushNotifications';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async (sessionUser) => {
            if (!sessionUser) return null;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sessionUser.id)
                .maybeSingle();

            if (error) {
                console.error('Profile fetch error:', error);
                return null;
            }

            if (data) return data;

            // No row — create profile lazily (covers the case where the DB trigger didn't fire)
            const newProfile = {
                id: sessionUser.id,
                email: sessionUser.email,
                full_name: sessionUser.user_metadata?.full_name || sessionUser.email,
                avatar_url: sessionUser.user_metadata?.avatar_url,
                is_premium: false
            };
            const { error: insertError } = await supabase.from('profiles').insert(newProfile);
            if (insertError) {
                console.error('Profile create error:', insertError);
            }
            return newProfile;
        };

        const initializeAuth = async () => {
            try {
                // Get session directly - no arbitrary timeout
                const { data: { session: currentSession } } = await supabase.auth.getSession();

                if (currentSession?.user) {
                    setSession(currentSession);
                    const profile = await fetchProfile(currentSession.user);
                    setUser({ ...currentSession.user, ...profile, isPremium: profile?.is_premium });
                    registerPushNotifications(currentSession.user.id);
                } else {
                    setUser(null);
                    setSession(null);
                }
            } catch (error) {
                console.warn("Auth initialization failed:", error);
                setUser(null);
                setSession(null);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log('🔐 Auth event:', event, newSession?.user?.email || 'no user');

            // Handle TOKEN_REFRESHED separately - don't trigger full profile refetch
            if (event === 'TOKEN_REFRESHED') {
                console.log('✅ Token auto-refreshed successfully');
                setSession(newSession);
                // Update user with new session data without refetching profile
                if (newSession?.user) {
                    setUser(prev => prev ? { ...prev, ...newSession.user } : newSession.user);
                }
                setLoading(false);
                return;
            }

            // Handle SIGNED_OUT - user explicitly logged out
            if (event === 'SIGNED_OUT') {
                console.log('👋 User signed out');
                setUser(null);
                setSession(null);
                setLoading(false);
                return;
            }

            // For other events (SIGNED_IN, USER_UPDATED, etc.)
            if (newSession?.user) {
                console.log('✅ Session active for:', newSession.user.email);
                setSession(newSession);

                // Set the user immediately from the session so the UI unlocks right away.
                // IMPORTANT: never `await` a Supabase data call *inside* onAuthStateChange —
                // the auth client holds a lock and awaiting here deadlocks (this was the cause
                // of the "Auth loading took too long. Forcing unlock" hang + stuck login).
                setUser(prev => prev ? { ...prev, ...newSession.user } : newSession.user);

                // Fetch the full profile OUTSIDE the auth callback (deferred), then merge.
                if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                    setTimeout(async () => {
                        const profile = await fetchProfile(newSession.user);
                        if (profile) {
                            setUser(prev => ({ ...(prev || newSession.user), ...profile, isPremium: profile?.is_premium }));
                        }
                        if (event === 'SIGNED_IN') registerPushNotifications(newSession.user.id);
                    }, 0);
                }
            } else if (event === 'INITIAL_SESSION') {
                // Only clear on initial session check if no session
                console.log('⚠️ No initial session found');
                setUser(null);
                setSession(null);
            }

            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Global Failsafe: Ensure loading never hangs indefinitely
    useEffect(() => {
        const safetyTimer = setTimeout(() => {
            if (loading) {
                console.warn("⚠️ Auth loading took too long. Forcing unlock.");
                setLoading(false);
            }
        }, 5000); // 5 seconds max wait

        return () => clearTimeout(safetyTimer);
    }, [loading]);

    // Listen for Deep Links (Android/iOS)
    useEffect(() => {
        let listenerHandle;

        const setupListener = async () => {
            // App.addListener returns a promise that resolves to a handle
            const handle = await App.addListener('appUrlOpen', async (data) => {
                console.log('App opened with URL:', data.url);

                if (data.url.includes('access_token') || data.url.includes('refresh_token') || data.url.includes('code=')) {
                    setLoading(true);

                    // Local safety timeout specific to this deep link event
                    const localSafetyTimer = setTimeout(() => {
                        console.log("FORCE UNLOCK: Auth logic timed out after 10s.");
                        setLoading(false);
                    }, 10000);

                    try {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (session) {
                            setUser(session.user);
                            setSession(session);
                            setLoading(false);
                        } else {
                            // Handle PKCE (Query Params - ?code=...)
                            const urlObj = new URL(data.url);
                            const code = urlObj.searchParams.get('code');

                            if (code) {
                                const { data: { session: newSession }, error } = await supabase.auth.exchangeCodeForSession(code);
                                if (error) throw error;
                                if (newSession) {
                                    // NON-BLOCKING FIX: Update UI immediately, persist in background
                                    setSession(newSession);
                                    setUser(newSession.user);
                                    setLoading(false);

                                    // Persist in background
                                    supabase.auth.setSession(newSession).catch(e =>
                                        console.error("Background session persist failed:", e)
                                    );
                                }
                            } else {
                                // Handle Implicit (Hash Fragment - #access_token=...)
                                const hashFragment = data.url.split('#')[1];
                                if (hashFragment) {
                                    const params = new URLSearchParams(hashFragment);
                                    const accessToken = params.get('access_token');
                                    const refreshToken = params.get('refresh_token');

                                    if (accessToken) {
                                        const { data: { user } } = await supabase.auth.getUser(accessToken);
                                        if (user) {
                                            // NON-BLOCKING FIX: Update UI immediately
                                            console.log("✅ Valid user from token, unlocking UI");
                                            setSession({ access_token: accessToken, refresh_token: refreshToken, user });
                                            setUser(user);
                                            setLoading(false);

                                            // Persist in background
                                            supabase.auth.setSession({
                                                access_token: accessToken,
                                                refresh_token: refreshToken
                                            }).catch(e => console.error("Background session persist failed:", e));
                                        }
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error("Login handling error:", error);
                        setLoading(false);
                    } finally {
                        clearTimeout(localSafetyTimer);
                        // setLoading(false); // This is now handled inside try/catch blocks
                    }
                }
            });
            listenerHandle = handle;
        };

        setupListener();

        return () => {
            if (listenerHandle) {
                listenerHandle.remove();
            }
        };
    }, []);

    // Function to refresh profile (e.g. after upgrade)
    const refreshProfile = async () => {
        if (!user) return;
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
            setUser(prev => ({ ...prev, ...data, isPremium: data.is_premium }));
        }
    };

    // Login function (Supabase handles this usually via UI, but keeping wrapper for consistency)
    const login = async (email, password) => {
        // For MVP phase 2, we can fallback to mock if keys are missing
        if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your_supabase_url')) {
            console.warn("Supabase keys missing. Using mock login.");
            setUser(MOCK_USERS[0]);
            return;
        }
        // Real implementation would go here or be handled by Auth UI component
    };

    const logout = async () => {
        try {
            if (import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('your_supabase_url')) {
                await supabase.auth.signOut();
            }
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setUser(null);
            setSession(null);
        }
    };

    const loginAsGuest = () => {
        const guestUser = {
            id: crypto.randomUUID(), // Use real UUID to satisfy Postgres
            email: 'guest@mayiborrow.com',
            user_metadata: {
                full_name: 'Guest User',
                avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest'
            },
            role: 'authenticated',
            isPremium: false
        };
        setUser(guestUser);
    };


    return (
        <AuthContext.Provider value={{ user, session, login, logout, loginAsGuest, loading, isAuthenticated: !!user, refreshProfile }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
