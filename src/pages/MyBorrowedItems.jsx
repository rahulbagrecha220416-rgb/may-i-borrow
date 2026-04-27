import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Heart, MapPin, Phone, Clock } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useItems } from '../context/ItemContext';
import { getRandomPhrase } from '../utils/gratitudePhrases';
import PageTransition from '../components/layout/PageTransition';
import SkeletonCard from '../components/common/SkeletonCard';

const MyBorrowedItems = () => {
    const navigate = useNavigate();
    const authContext = useAuth();
    const user = authContext?.user;
    const authLoading = authContext?.loading;

    const { borrowedItems, loading: itemsLoading, refreshItems, removeBorrowedItemLocally } = useItems();
    const [requestHistory, setRequestHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [returningItem, setReturningItem] = useState(null); // For return confirmation modal
    const [thankingItem, setThankingItem] = useState(null); // For showing the "Thanks Sent" state
    const [showThanksPrompt, setShowThanksPrompt] = useState(null); // The item we are about to thank
    const [randomPhrase, setRandomPhrase] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!authLoading && user) {
            fetchRequestHistory();
        }
    }, [user, authLoading]);

    const fetchRequestHistory = async () => {
        setHistoryLoading(true);
        try {
            const { data, error } = await supabase
                .from('requests')
                .select(`
                    id, title, description, status, created_at,
                    items (name, image_url, owner_id)
                `) // LEAN QUERY
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            setRequestHistory(data || []);
        } catch (error) {
            console.error('Error fetching request history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSayThanksClick = (item) => {
        const thanksSent = localStorage.getItem(`thanks_sent_${item.id}`);
        if (thanksSent) {
            alert("You've already sent your thanks for this item! ❤️");
            return;
        }
        setRandomPhrase(getRandomPhrase());
        setShowThanksPrompt(item);
    };

    const sayThanks = async (item) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .insert({
                    user_id: item.owner_id,
                    type: 'THANK_YOU',
                    content: `${user?.user_metadata?.full_name || 'Someone'} sent you a warm thank you for the ${item.name}!`,
                    related_id: item.id
                });

            if (error) throw error;
            localStorage.setItem(`thanks_sent_${item.id}`, 'true');
            setThankingItem(item.id);
            setShowThanksPrompt(null);
            setTimeout(() => setThankingItem(null), 3000);
        } catch (error) {
            console.error('Error sending thanks:', error);
        }
    };

    const confirmReturn = async () => {
        if (!returningItem) return;
        setIsProcessing(true);
        await markAsReturned(returningItem.id);
        setIsProcessing(false);
        setReturningItem(null);
    };

    const markAsReturned = async (itemId) => {
        try {
            // Get item details to find owner. Join on owner_id to profiles.
            const { data: itemData, error: itemError } = await supabase
                .from('items')
                .select('id, name, owner_id, profiles!owner_id(id, full_name)')
                .eq('id', itemId)
                .single();

            if (itemError) throw itemError;

            // Create notification for owner (using owner_id)
            const { error: notifError } = await supabase
                .from('notifications')
                .insert({
                    user_id: itemData.owner_id,
                    type: 'ITEM_RETURNED',
                    content: `${user?.user_metadata?.full_name || 'Someone'} returned your ${itemData.name}`,
                    related_id: itemId
                });

            if (notifError) console.error('Notification error:', notifError);

            // Mark item as available (owner will decide to keep or remove)
            const { error } = await supabase
                .from('items')
                .update({
                    status: 'AVAILABLE',
                    borrowed_by: null,
                    borrowed_until: null
                })
                .eq('id', itemId);

            if (error) throw error;

            // Mark the corresponding active request as RETURNED
            const { error: requestUpdateError } = await supabase
                .from('requests')
                .update({ status: 'RETURNED' })
                .eq('item_id', itemId)
                .eq('user_id', user.id)
                .in('status', ['ACCEPTED', 'BORROWED']);

            if (requestUpdateError) console.error('Error updating request status:', requestUpdateError);

            removeBorrowedItemLocally(itemId); // Instant UI feedback
            refreshItems(); // Sync in background
            fetchRequestHistory(); // Refresh history
        } catch (error) {
            console.error('Error marking as returned:', error);
            alert(`Failed to return item: ${error.message}`);
        }
    };

    return (
        <PageTransition className="p-4 min-h-screen" style={{ backgroundColor: '#F2ECE3' }}>
            <div className="flex items-center mb-6">
                <button onClick={() => navigate(-1)} className="mr-3">
                    <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Borrowed</h1>
            </div>

            {itemsLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                </div>
            ) : borrowedItems.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-gray-500">You're not borrowing any items</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {borrowedItems.map(item => (
                        <div key={item.id} className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: '#F7F2EB' }}>
                            {item.image && (
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-40 object-cover"
                                />
                            )}
                            <div className="p-4">
                                <h3 className="font-bold text-lg mb-2">{item.name}</h3>

                                {item.borrowed_until && (() => {
                                    const dueDate = new Date(item.borrowed_until);
                                    const isOverdue = dueDate < new Date();
                                    return (
                                        <div className="flex items-center text-sm mb-3" style={{ color: isOverdue ? '#B89645' : '#726A60' }}>
                                            <Calendar size={16} className="mr-2" />
                                            Due: {dueDate.toLocaleDateString()}
                                        </div>
                                    );
                                })()}

                                {(item.pickupAddress || item.pickupTime || item.pickupContact) && (
                                    <div className="mb-3 rounded-lg border border-[#DDD5CB] bg-white/60 p-3 space-y-1.5 text-sm" style={{ color: '#433D36' }}>
                                        {item.pickupAddress && (
                                            <div className="flex items-start gap-2">
                                                <MapPin size={14} className="mt-0.5 text-[#726A60] flex-shrink-0" />
                                                <span>{item.pickupAddress}</span>
                                            </div>
                                        )}
                                        {item.pickupTime && (
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-[#726A60] flex-shrink-0" />
                                                <span>{item.pickupTime}</span>
                                            </div>
                                        )}
                                        {item.pickupContact && (
                                            <div className="flex items-center gap-2">
                                                <Phone size={14} className="text-[#726A60] flex-shrink-0" />
                                                <a href={`tel:${item.pickupContact}`} className="text-[#6b7c73] underline">{item.pickupContact}</a>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleSayThanksClick(item)}
                                        disabled={thankingItem === item.id || localStorage.getItem(`thanks_sent_${item.id}`)}
                                        className="flex-1 py-2 px-4 rounded-lg font-semibold transition-all text-sm"
                                        style={{
                                            backgroundColor: (thankingItem === item.id || localStorage.getItem(`thanks_sent_${item.id}`)) ? '#E5DFD6' : '#D8D0C6',
                                            color: '#433D36'
                                        }}
                                    >
                                        {(thankingItem === item.id || localStorage.getItem(`thanks_sent_${item.id}`)) ? 'Thanks Sent! ❤️' : 'Say Thanks'}
                                    </button>
                                    <button
                                        onClick={() => setReturningItem(item)}
                                        className="flex-1 text-white py-2 px-4 rounded-lg font-semibold transition-colors text-sm"
                                        style={{ backgroundColor: '#6b7c73' }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#566359'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = '#6b7c73'}
                                    >
                                        I've returned this
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Thanks Prompt Modal */}
            {showThanksPrompt && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl border border-gray-100">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Heart size={32} className="text-pink-500 fill-pink-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Send Love to {showThanksPrompt.owner_name || 'your Neighbor'}</h3>
                            <div className="bg-[#F2ECE3] p-4 rounded-xl mt-4 border border-[#DDD5CB]">
                                <p className="text-[#433D36] font-medium leading-relaxed italic">
                                    "{randomPhrase}"
                                </p>
                            </div>
                            <p className="text-xs text-gray-400 mt-4">
                                Sending thanks notifies them of your appreciation!
                            </p>
                        </div>

                        <div className="space-y-3 pt-2">
                            <button
                                onClick={() => sayThanks(showThanksPrompt)}
                                className="w-full bg-[#6b7c73] text-white py-3 rounded-xl font-bold hover:bg-[#566359] transition-all flex items-center justify-center gap-2"
                            >
                                Send Thanks ❤️
                            </button>
                            <button
                                onClick={() => setShowThanksPrompt(null)}
                                className="w-full py-2 text-gray-400 font-medium hover:text-gray-600 transition-colors"
                            >
                                Maybe later
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Return Confirmation Modal with Gratitude Suggestion */}
            {returningItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl border border-gray-100">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-[#F2ECE3] rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🍫</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Returning {returningItem.name}?</h3>
                            <p className="text-[#726A60] text-sm mt-2 leading-relaxed">
                                Our community thrives on kindness. A small gesture like a **chocolate** or a quick note is a lovely way to show gratitude to your neighbor!
                            </p>
                        </div>

                        <div className="space-y-3 pt-2">
                            <button
                                onClick={confirmReturn}
                                disabled={isProcessing}
                                className="w-full bg-[#6b7c73] text-white py-3 rounded-xl font-bold hover:bg-[#566359] transition-all disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </div>
                                ) : "I've Returned It"}
                            </button>
                            <button
                                onClick={() => setReturningItem(null)}
                                className="w-full py-2 text-gray-400 font-medium hover:text-gray-600 transition-colors"
                            >
                                Not yet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Request History */}
            <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Request History</h2>
                {historyLoading ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => (
                            <div key={i} className="h-20 w-full animate-pulse rounded-lg bg-gray-200" />
                        ))}
                    </div>
                ) : requestHistory.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No request history</p>
                ) : (
                    <div className="space-y-3">
                        {requestHistory.map(request => (
                            <div key={request.id} className="rounded-lg p-4" style={{ backgroundColor: '#F7F2EB' }}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm" style={{ color: '#433D36' }}>
                                            {request.items?.name || request.title}
                                        </h4>
                                        <p className="text-xs mt-1" style={{ color: '#726A60' }}>{request.description}</p>
                                        <p className="text-xs mt-2" style={{ color: '#726A60', opacity: 0.7 }}>
                                            {new Date(request.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className="text-xs font-medium" style={{
                                        color: request.status === 'ACCEPTED' ? '#6b7c73' :
                                            request.status === 'RETURNED' ? '#8b9c93' : '#726A60'
                                    }}>
                                        {request.status === 'PENDING' ? 'Waiting' :
                                            request.status === 'ACCEPTED' ? 'Agreed' :
                                                request.status === 'RETURNED' ? 'Returned' :
                                                    'Not this time'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default MyBorrowedItems;
