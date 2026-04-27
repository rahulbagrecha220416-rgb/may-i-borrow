import React, { useState } from 'react';
import { ArrowLeft, Bell, MessageCircle, ShieldAlert, Package, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useRequests } from '../context/RequestContext';
import { supabase } from '../supabaseClient';
import PageTransition from '../components/layout/PageTransition';

const Notifications = () => {
    const navigate = useNavigate();
    const { notifications, markAsRead, fetchNotifications } = useNotifications();
    const { acceptRequest, rejectRequest } = useRequests();
    const [resolvingId, setResolvingId] = useState(null);

    const handleAccept = async (notification) => {
        try {
            await acceptRequest(notification.related_id);
            await markAsRead(notification.id);
            if (fetchNotifications) await fetchNotifications();
        } catch (error) {
            console.error('Failed to accept request:', error);
        }
    };

    const handleReject = async (notification) => {
        try {
            await rejectRequest(notification.related_id);
            await markAsRead(notification.id);
            if (fetchNotifications) await fetchNotifications();
        } catch (error) {
            console.error('Failed to decline request:', error);
        }
    };

    const handleMediationResponse = async (notification, action) => {
        setResolvingId(notification.id);
        await markAsRead(notification.id);

        if (action === 'chat') {
            // Future: Open chat
            console.log('Opening chat with borrower');
        }

        setResolvingId(null);
        if (fetchNotifications) await fetchNotifications();
    };

    const handleReturnChoice = async (notification, choice) => {
        try {
            if (choice === 'keep') {
                // Item already set to AVAILABLE by borrower
                console.log('Keeping item available');
            } else {
                // Archive/hide item
                const { error } = await supabase
                    .from('items')
                    .update({ status: 'ARCHIVED' })
                    .eq('id', notification.related_id);

                if (error) throw error;
            }

            await markAsRead(notification.id);
            if (fetchNotifications) await fetchNotifications();
        } catch (error) {
            console.error('Error handling return:', error);
        }
    };

    // Group notifications: unread first
    const unreadNotifications = notifications.filter(n => !n.is_read);
    const readNotifications = notifications.filter(n => n.is_read);
    const sortedNotifications = [...unreadNotifications, ...readNotifications];

    return (
        <PageTransition className="p-4 min-h-screen" style={{ backgroundColor: '#F2ECE3' }}>
            <div className="flex items-center mb-6">
                <button onClick={() => navigate(-1)} className="mr-3">
                    <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            </div>

            <div className="space-y-3">
                {sortedNotifications.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-full bg-sage-100 dark:bg-sage-900 flex items-center justify-center mx-auto mb-4">
                            <Bell size={32} className="text-sage-400" />
                        </div>
                        <p className="text-warm-muted dark:text-gray-400 mb-1">All caught up!</p>
                        <p className="text-xs text-gray-400">No new notifications</p>
                    </div>
                ) : (
                    sortedNotifications.map(n => {
                        // Mediation Request
                        if (n.type === 'MEDIATION_REQUEST') {
                            return (
                                <div
                                    key={n.id}
                                    className={`p-4 rounded-2xl border ${n.is_read ? 'bg-warm-card dark:bg-gray-800 border-warm-border dark:border-gray-700 opacity-60' : 'bg-sage-50 dark:bg-sage-900/20 border-sage-200 dark:border-sage-800'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-full shrink-0" style={{ backgroundColor: '#E5DFD6', color: '#6b7c73' }}>
                                            <ShieldAlert size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Mediation Request</h3>
                                            <p className="text-sm mb-3" style={{ color: '#726A60' }}>
                                                {n.content}
                                            </p>

                                            {!n.is_read && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleMediationResponse(n, 'chat')}
                                                        className="bg-sage-500 hover:bg-sage-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all flex items-center gap-1.5"
                                                    >
                                                        <MessageCircle size={14} />
                                                        I'll Talk to Them
                                                    </button>
                                                    <button
                                                        onClick={() => handleMediationResponse(n, 'ignore')}
                                                        className="text-xs font-bold px-3 py-2 rounded-lg border transition-all"
                                                        style={{ backgroundColor: '#F7F2EB', color: '#726A60', borderColor: '#DDD5CB' }}
                                                    >
                                                        Ignore
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // Item Returned - Owner Choice
                        if (n.type === 'ITEM_RETURNED') {
                            return (
                                <div
                                    key={n.id}
                                    className={`p-4 rounded-2xl border ${n.is_read ? 'bg-warm-card dark:bg-gray-800 border-warm-border dark:border-gray-700 opacity-60' : 'bg-sage-50 dark:bg-sage-900/20 border-sage-200 dark:border-sage-800'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-full shrink-0" style={{ backgroundColor: '#E5DFD6', color: '#6b7c73' }}>
                                            <RefreshCw size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Item Returned</h3>
                                            <p className="text-sm mb-3" style={{ color: '#726A60' }}>
                                                {n.content}
                                            </p>

                                            {!n.is_read && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleReturnChoice(n, 'keep')}
                                                        className="bg-sage-500 hover:bg-sage-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all"
                                                    >
                                                        Keep Available
                                                    </button>
                                                    <button
                                                        onClick={() => handleReturnChoice(n, 'remove')}
                                                        className="text-xs font-bold px-3 py-2 rounded-lg border transition-all"
                                                        style={{ backgroundColor: '#F7F2EB', color: '#726A60', borderColor: '#DDD5CB' }}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // Item Reminder
                        if (n.type === 'REMINDER') {
                            return (
                                <div
                                    key={n.id}
                                    className={`p-4 rounded-2xl border ${n.is_read ? 'bg-warm-card opacity-60' : 'bg-[#F2ECE3] border-[#DDD5CB]'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-full shrink-0" style={{ backgroundColor: '#E5DFD6', color: '#B89645' }}>
                                            <Bell size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-gray-900 mb-1">Friendly Reminder</h3>
                                            <p className="text-sm" style={{ color: '#726A60' }}>
                                                {n.content}
                                            </p>
                                            {!n.is_read && (
                                                <button
                                                    onClick={() => markAsRead(n.id)}
                                                    className="mt-2 text-xs font-bold text-[#6b7c73]"
                                                >
                                                    Got it
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // Thank You
                        if (n.type === 'THANK_YOU') {
                            return (
                                <div
                                    key={n.id}
                                    className={`p-4 rounded-2xl border ${n.is_read ? 'bg-warm-card opacity-60' : 'bg-pink-50/30 border-pink-100'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-full shrink-0 text-pink-500" style={{ backgroundColor: '#FFF0F3' }}>
                                            <span className="text-xl">❤️</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-gray-900 mb-1">A Note of Thanks</h3>
                                            <p className="text-sm italic" style={{ color: '#726A60' }}>
                                                "{n.content}"
                                            </p>
                                            {!n.is_read && (
                                                <button
                                                    onClick={() => markAsRead(n.id)}
                                                    className="mt-2 text-xs font-bold text-pink-600"
                                                >
                                                    You're welcome!
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // Item Request
                        if (n.type === 'ITEM_REQUEST') {
                            return (
                                <div
                                    key={n.id}
                                    className={`p-4 rounded-2xl border ${n.is_read ? 'opacity-60' : ''}`}
                                    style={{ backgroundColor: n.is_read ? '#E5DFD6' : '#F7F2EB', borderColor: '#DDD5CB' }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-full shrink-0 ${n.is_read ? '' : ''}`} style={{ backgroundColor: n.is_read ? '#D8D0C6' : '#E8DCD1', color: n.is_read ? '#726A60' : '#B86445' }}>
                                            <Package size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900 font-medium mb-1">
                                                {n.content}
                                            </p>

                                            {!n.is_read && (
                                                <div className="bg-white/50 p-2 rounded-lg border border-dashed border-[#DDD5CB] mb-3">
                                                    <p className="text-[11px] text-[#726A60] italic">
                                                        💡 Tip: A neutral pickup spot like a local cafe or your doorstep works great for exchanges!
                                                    </p>
                                                </div>
                                            )}

                                            <p className="text-[10px] text-gray-400 mb-3">
                                                {new Date(n.created_at).toLocaleDateString()}
                                            </p>

                                            {!n.is_read && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleAccept(n)}
                                                        className="text-white text-xs font-bold px-3 py-2 rounded-lg transition-all"
                                                        style={{ backgroundColor: '#B86445' }}
                                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#9a5837'}
                                                        onMouseLeave={(e) => e.target.style.backgroundColor = '#B86445'}
                                                    >
                                                        I'll help
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(n)}
                                                        className="text-xs font-bold px-3 py-2 rounded-lg border transition-all"
                                                        style={{ backgroundColor: '#F7F2EB', color: '#726A60', borderColor: '#DDD5CB' }}
                                                    >
                                                        Not this time
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // Default notification
                        return (
                            <div
                                key={n.id}
                                className={`p-4 rounded-2xl border transition-colors cursor-pointer ${n.is_read ? 'opacity-60' : ''}`}
                                style={{ backgroundColor: n.is_read ? '#E5DFD6' : '#F7F2EB', borderColor: '#DDD5CB' }}
                                onClick={() => markAsRead(n.id)}
                            >
                                <div className="flex gap-3">
                                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.is_read ? 'bg-transparent' : 'bg-sage-500'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900 dark:text-white">{n.content}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </PageTransition>
    );
};

export default Notifications;
