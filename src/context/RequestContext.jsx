import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { sendPushTo } from '../utils/pushNotifications';

const RequestContext = createContext();

export const RequestProvider = ({ children }) => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setRequests([]);
            setLoading(false);
            return;
        }

        const fetchRequests = async () => {
            if (user?.email === 'guest@mayiborrow.com') {
                setRequests([]); // No mock requests for now, or add some if desired
                setLoading(false);
                return;
            }

            // Fetch pending requests (canonical status used by ItemDetails/MyLentItems/MyBorrowedItems)
            const { data, error } = await supabase
                .from('requests')
                .select('*')
                .eq('status', 'PENDING')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching requests:", error);
            } else {
                setRequests(data);
            }
            setLoading(false);
        };

        fetchRequests();
    }, [user]);

    const addRequest = async (requestData) => {
        if (!user) return;
        try {
            console.log('📝 Creating request...', requestData);

            const { data, error } = await supabase
                .from('requests')
                .insert({
                    title: requestData.title,
                    description: requestData.description,
                    category: requestData.category,
                    user_id: user.id,
                    item_id: requestData.itemId || null,
                    group_ids: requestData.groupIds || [],
                    visibility: requestData.visibility || 'group',
                    status: 'PENDING'
                })
                .select()
                .single();

            if (error) {
                console.error('Request insert error:', error);
                throw error;
            }

            console.log('✅ Request created:', data);
            setRequests(prev => [data, ...prev]);

            // Create notification asynchronously - don't wait
            if (requestData.itemId) {
                createItemRequestNotification(data, requestData.itemId)
                    .catch(err => console.error('Notification failed:', err));
            }

            return data;
        } catch (error) {
            console.error("Error creating request:", error);
            throw error;
        }
    };

    const createItemRequestNotification = async (request, itemId) => {
        try {
            // Get item details to find owner
            const { data: item } = await supabase
                .from('items')
                .select('owner_id, name')
                .eq('id', itemId)
                .single();

            if (!item || item.owner_id === user.id) return; // Don't notify if requesting own item

            // Get requester name
            const requesterName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Someone';

            // Create notification for item owner
            const { error } = await supabase
                .from('notifications')
                .insert({
                    user_id: item.owner_id,
                    type: 'ITEM_REQUEST',
                    content: `${requesterName} wants to borrow your "${item.name}"`,
                    related_id: request.id,
                    related_type: 'request',
                    is_read: false
                });

            if (error) {
                console.error('Failed to create notification:', error);
            } else {
                console.log(`✅ Notification sent to owner for item: ${item.name}`);
                sendPushTo(item.owner_id, 'New borrow request', `${requesterName} wants to borrow "${item.name}"`, { itemId, requestId: request.id });
            }
        } catch (error) {
            console.error('Error creating notification:', error);
            // Don't throw - notification failure shouldn't break request creation
        }
    };

    const acceptRequest = async (requestId) => {
        try {
            const { data: request, error: requestError } = await supabase
                .from('requests')
                .update({ status: 'ACCEPTED' })
                .eq('id', requestId)
                .select();

            if (requestError) throw requestError;

            if (!request || request.length === 0) {
                throw new Error('Request not found or no permission to update');
            }

            const requestData = request[0];

            if (requestData.item_id) {
                const { data: updatedItem, error: updateError } = await supabase
                    .from('items')
                    .update({
                        status: 'BORROWED',
                        borrowed_by: requestData.user_id,
                        borrowed_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                    })
                    .eq('id', requestData.item_id)
                    .select()
                    .single();

                if (updateError) {
                    console.error('❌ Failed to mark item as borrowed:', updateError);
                    throw updateError;
                }

                console.log('✅ Item marked as BORROWED:', updatedItem);
            }

            const { data: item } = await supabase
                .from('items')
                .select('name')
                .eq('id', requestData.item_id)
                .maybeSingle();

            await supabase
                .from('notifications')
                .insert({
                    user_id: requestData.user_id,
                    type: 'REQUEST_ACCEPTED',
                    content: `Your request for "${item?.name || 'an item'}" was accepted! 🎉`,
                    related_id: requestId,
                    related_type: 'request',
                    is_read: false
                });

            sendPushTo(requestData.user_id, 'Request accepted 🎉', `"${item?.name || 'An item'}" is yours — coordinate pickup.`, { itemId: requestData.item_id });

            setRequests(prev => prev.map(r =>
                r.id === requestId ? { ...r, status: 'ACCEPTED' } : r
            ));
        } catch (error) {
            console.error('Failed to accept request:', error);
            throw error;
        }
    };

    const rejectRequest = async (requestId) => {
        try {
            await supabase
                .from('requests')
                .update({ status: 'REJECTED' })
                .eq('id', requestId);

            setRequests(prev => prev.map(r =>
                r.id === requestId ? { ...r, status: 'REJECTED' } : r
            ));
        } catch (error) {
            console.error('Failed to reject request:', error);
            throw error;
        }
    };

    return (
        <RequestContext.Provider value={{ requests, addRequest, acceptRequest, rejectRequest, loading }}>
            {children}
        </RequestContext.Provider>
    );
};

export const useRequests = () => useContext(RequestContext);
