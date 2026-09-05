import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const authContext = useAuth();
    const user = authContext?.user;
    const authLoading = authContext?.loading;

    const [notifications, setNotifications] = useState([]);
    const [settings, setSettings] = useState({
        notify_requests: true,
        notify_marketing: false
    });
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;

        if (user.email === 'guest@mayiborrow.com') {
            setSettings({ notify_requests: true, notify_marketing: false });
            setNotifications([
                { id: 1, content: "Welcome to May We Borrow! (Guest Mode)", is_read: false, created_at: new Date().toISOString() }
            ]);
            setUnreadCount(1);
            return;
        }

        const { data: settingsData } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (settingsData) {
            setSettings(settingsData);
        } else {
            await supabase.from('user_settings').insert({ user_id: user.id });
        }

        const { data: notifData } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (notifData) {
            setNotifications(notifData);
            setUnreadCount(notifData.filter(n => !n.is_read).length);
        }
    }, [user]);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        fetchNotifications();

        // Real-time subscription for notifications
        const notifSubscription = supabase
            .channel('notifications-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('📡 New notification:', payload.new);

                    setNotifications(prev => [payload.new, ...prev]);

                    if (!payload.new.is_read) {
                        setUnreadCount(prev => prev + 1);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(notifSubscription);
        };
    }, [user, authLoading, fetchNotifications]);

    const markAsRead = async (id) => {
        if (user?.email === 'guest@mayiborrow.com') {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            return;
        }

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        if (!error) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const updateSettings = async (newSettings) => {
        if (user?.email === 'guest@mayiborrow.com') {
            setSettings(prev => ({ ...prev, ...newSettings }));
            return;
        }

        const { error } = await supabase
            .from('user_settings')
            .update(newSettings)
            .eq('user_id', user.id);

        if (!error) {
            setSettings(prev => ({ ...prev, ...newSettings }));
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, settings, updateSettings, fetchNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
