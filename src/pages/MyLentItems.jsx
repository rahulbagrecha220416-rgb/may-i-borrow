import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useItems } from '../context/ItemContext';
import PageTransition from '../components/layout/PageTransition';
import SkeletonCard from '../components/common/SkeletonCard';

const MyLentItems = () => {
    const navigate = useNavigate();
    const authContext = useAuth();
    const { myItems, loading: itemsLoading, updateItem, deleteItem, refreshItems } = useItems();
    const user = authContext?.user;
    const authLoading = authContext?.loading;

    const [requestHistory, setRequestHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null); // For modal
    const [isProcessing, setIsProcessing] = useState(false);

    // Compute lent items from myItems in context
    const lentItems = myItems.filter(item => item.status === 'BORROWED');

    useEffect(() => {
        if (!authLoading && user) {
            fetchRequestHistory();
        }
    }, [user, authLoading]);

    const fetchRequestHistory = async () => {
        setHistoryLoading(true);
        try {
            // Fetch requests for items owned by this user
            const { data, error } = await supabase
                .from('requests')
                .select(`
                    id, title, description, status, created_at,
                    items!inner (owner_id, name, image_url)
                `) // LEAN QUERY
                .eq('items.owner_id', user.id)
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

    const sendReminder = async (item) => {
        if (!item.borrowed_by) return;

        // Prevent spamming locally (could be enhanced with DB check)
        const lastRemindedKey = `reminder_${item.id}`;
        const lastReminded = localStorage.getItem(lastRemindedKey);
        if (lastReminded && Date.now() - parseInt(lastReminded) < 24 * 60 * 60 * 1000) {
            alert('A reminder was already sent recently.');
            return;
        }

        try {
            const { error } = await supabase
                .from('notifications')
                .insert({
                    user_id: item.borrowed_by,
                    type: 'REMINDER',
                    content: `Just a gentle reminder regarding ${item.name}. No rush!`,
                    related_id: item.id
                });

            if (error) throw error;

            localStorage.setItem(lastRemindedKey, Date.now().toString());
            alert('Gentle reminder sent!');
        } catch (error) {
            console.error('Error sending reminder:', error);
            alert('Could not send reminder.');
        }
    };

    const handleReturn = async (action) => {
        if (!selectedItem) return;
        setIsProcessing(true);

        try {
            if (action === 'relist') {
                await updateItem(selectedItem.id, {
                    ...selectedItem,
                    status: 'AVAILABLE',
                    borrowed_until: null,
                    availableUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // reset to +30 days? or keep original?
                });

                // Mark the corresponding active request as RETURNED
                const { error: requestUpdateError } = await supabase
                    .from('requests')
                    .update({ status: 'RETURNED' })
                    .eq('item_id', selectedItem.id)
                    .in('status', ['ACCEPTED', 'BORROWED']);

                if (requestUpdateError) console.error('Error updating request status:', requestUpdateError);

                // Manually update status in local list to remove it
                await refreshItems();
                fetchRequestHistory();
                alert('Item returned and is now Available again!');
            } else if (action === 'delete') {
                if (window.confirm('Are you sure you want to stop lending this item? It will be removed permanently.')) {
                    await deleteItem(selectedItem.id);
                    await refreshItems();
                    alert('Item removed from your listings.');
                }
            }
        } catch (error) {
            console.error('Error processing return:', error);
            alert('Failed to update item.');
        } finally {
            setIsProcessing(false);
            setSelectedItem(null);
        }
    };

    return (
        <PageTransition className="p-4 min-h-screen" style={{ backgroundColor: '#F2ECE3' }}>
            <div className="flex items-center mb-6">
                <button onClick={() => navigate(-1)} className="mr-3">
                    <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">People You're Helping</h1>
            </div>

            {itemsLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                </div>
            ) : lentItems.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-gray-500">You haven't lent any items currently.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {lentItems.map(item => (
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

                                <div className="flex items-center text-sm text-gray-600 mb-2">
                                    <User size={16} className="mr-2" />
                                    Borrowed by: User
                                </div>

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

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => sendReminder(item)}
                                        className="flex-1 py-2 px-4 rounded-lg font-semibold transition-colors text-sm"
                                        style={{ backgroundColor: '#D8D0C6', color: '#433D36' }}
                                    >
                                        Remind
                                    </button>
                                    <button
                                        onClick={() => setSelectedItem(item)}
                                        className="flex-1 py-2 px-4 rounded-lg font-semibold transition-colors text-white text-sm bg-[#6b7c73] hover:bg-[#5a6b62]"
                                    >
                                        Mark Returned
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Return Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
                        <h3 className="text-xl font-bold text-gray-900">Item Returned?</h3>
                        <p className="text-gray-500 text-sm">
                            Has <b>{selectedItem.name}</b> been returned to you safely?
                        </p>

                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={() => handleReturn('relist')}
                                disabled={isProcessing}
                                className="flex items-center justify-center gap-2 w-full p-4 rounded-xl border-2 border-[#6b7c73]/20 bg-[#6b7c73]/10 text-[#6b7c73] font-bold hover:bg-[#6b7c73]/20 transition-colors disabled:opacity-50"
                            >
                                {isProcessing ? <div className="w-5 h-5 border-2 border-[#6b7c73]/30 border-t-[#6b7c73] rounded-full animate-spin" /> : <RefreshCw size={20} />}
                                {isProcessing ? "Processing..." : "Yes, Relist Item"}
                                {!isProcessing && <span className="text-xs font-normal opacity-70 ml-1">(Available for others)</span>}
                            </button>

                            <button
                                onClick={() => handleReturn('delete')}
                                disabled={isProcessing}
                                className="flex items-center justify-center gap-2 w-full p-4 rounded-xl border-2 border-red-100 bg-red-50 text-red-800 font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                                {isProcessing ? <div className="w-5 h-5 border-2 border-red-800/30 border-t-red-800 rounded-full animate-spin" /> : <XCircle size={20} />}
                                {isProcessing ? "Processing..." : "Stop Lending"}
                                {!isProcessing && <span className="text-xs font-normal opacity-70 ml-1">(Delete permanently)</span>}
                            </button>
                        </div>

                        <button
                            onClick={() => setSelectedItem(null)}
                            className="w-full py-3 text-gray-500 font-medium hover:text-gray-700"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Request History */}
            <div className="mt-8 pb-10">
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

export default MyLentItems;
