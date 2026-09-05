
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { MOCK_ITEMS, MOCK_USERS } from '../data/mockData';

const ItemContext = createContext();

export const ItemProvider = ({ children }) => {
    const authContext = useAuth();
    const user = authContext?.user;
    const authLoading = authContext?.loading; // Get auth loading state

    // const [items, setItems] = useState([]); // REMOVED: Derived from userItems + feedItems
    const [loading, setLoading] = useState(true);

    const [feedItems, setFeedItems] = useState([]);
    const [userItems, setUserItems] = useState([]);
    const [borrowedItems, setBorrowedItems] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_LIMIT = 10;

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setUserItems([]);
            setFeedItems([]);
            setLoading(false);
            return;
        }

        if (user?.email === 'guest@mayiborrow.com') {
            const mappedMock = MOCK_ITEMS.map(i => {
                const ownerProfile = MOCK_USERS.find(u => u.id === i.ownerId);
                return {
                    ...i,
                    image: i.image || i.image_url,
                    availableUntil: i.availableUntil || i.available_until,
                    pickupAddress: i.pickupAddress || 'Address shared after request',
                    maintenanceAmount: i.maintenanceAmount || i.surcharge || 0,
                    maintenanceReason: i.maintenanceReason || (i.surcharge ? 'upkeep' : null),
                    owner: ownerProfile,
                    ownerName: ownerProfile?.name
                };
            });
            setFeedItems(mappedMock.filter(i => i.ownerId !== user.id && i.status !== 'BORROWED'));
            setUserItems(mappedMock.filter(i => i.ownerId === user.id));
            setBorrowedItems(mappedMock.filter(i => i.borrowedBy === user.id && i.status === 'BORROWED'));
            setLoading(false);
            return;
        }

        loadInitialData();

        // The fetchers close over the same `user` this effect is keyed on; listing
        // them would only add churn (they are re-created every render).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, authLoading]);

    const loadInitialData = async () => {
        setLoading(true);
        await Promise.all([fetchMyItems(), fetchFeedPage(0), fetchBorrowedItems()]);
        setLoading(false);
    };

    const fetchMyItems = async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('items')
            .select('*, owner:profiles!items_owner_id_fkey(name:full_name, avatar:avatar_url)')
            .eq('owner_id', user.id)
            .neq('status', 'DELETED')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('fetchMyItems error:', error);
            return;
        }
        setUserItems(mapItems(data || []));
    };

    const fetchBorrowedItems = async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('items')
            .select('*, owner:profiles!items_owner_id_fkey(name:full_name, avatar:avatar_url)')
            .eq('borrowed_by', user.id)
            .eq('status', 'BORROWED')
            .order('borrowed_until', { ascending: true });

        if (error) {
            console.error('fetchBorrowedItems error:', error);
            return;
        }
        setBorrowedItems(mapItems(data || []));
    };

    const fetchFeedPage = async (pageIndex) => {
        const from = pageIndex * PAGE_LIMIT;
        const to = from + PAGE_LIMIT - 1;

        console.log(`Resource Efficiency: Loading feed items ${from}-${to}`);

        const { data, error } = await supabase
            .from('items')
            .select('*, owner:profiles!items_owner_id_fkey(name:full_name, avatar:avatar_url)')
            .eq('status', 'AVAILABLE')
            .neq('owner_id', user.id) // Don't fetch my own items here
            .order('created_at', { ascending: false })
            .range(from, to);

        if (!error && data) {
            const newItems = mapItems(data);
            if (pageIndex === 0) {
                setFeedItems(newItems);
            } else {
                setFeedItems(prev => [...prev, ...newItems]);
            }

            setHasMore(data.length === PAGE_LIMIT);
            setPage(pageIndex);
        }
    };

    const loadMore = async () => {
        if (hasMore && !loading) {
            await fetchFeedPage(page + 1);
        }
    };

    const mapItems = (data) => data.map(i => ({
        ...i,
        image: i.image_url,
        availableUntil: i.available_until,
        ownerId: i.owner_id,
        owner: i.owner || undefined,
        ownerName: i.owner?.name || i.ownerName || 'Neighbor',
        pickupAddress: i.pickup_address || i.pickupAddress || 'Bangalore',
        pickupContact: i.pickup_contact || i.pickupContact,
        pickupTime: i.pickup_time || i.pickupTime,
        maintenanceAmount: i.maintenance_amount || i.surcharge || 0,
        maintenanceReason: i.maintenance_reason
    }));

    const addItem = async (itemData) => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('items')
                .insert({
                    name: itemData.name,
                    description: itemData.description,
                    category: itemData.category,
                    image_url: itemData.image || 'https://placehold.co/400x400/f3f4f6/374151?text=Item',
                    status: 'AVAILABLE',
                    owner_id: user.id,
                    available_until: itemData.availableUntil, // Ensure DB has this column
                    visibility: itemData.visibility || 'network',
                    maintenance_amount: itemData.maintenanceAmount || 0,
                    maintenance_reason: itemData.maintenanceReason || null,
                    pickup_address: itemData.pickupAddress || null,
                    pickup_contact: itemData.pickupContact || null,
                    pickup_time: itemData.pickupTime || null
                })
                .select()
                .single();

            if (error) throw error;

            const newItem = {
                ...data,
                image: data.image_url,
                availableUntil: data.available_until,
                ownerId: data.owner_id,
                pickupAddress: data.pickup_address || data.pickupAddress || 'Bangalore', // Fallback
                pickupContact: data.pickup_contact,
                pickupTime: data.pickup_time,
                maintenanceAmount: data.maintenance_amount || data.surcharge || 0,
                maintenanceReason: data.maintenance_reason
            };

            // Immediately update local state so item appears instantly
            console.log('✅ Item created successfully, adding to local state');
            setUserItems(prev => [newItem, ...prev]);

            // Optional: Refresh after short delay to ensure sync
            setTimeout(() => refreshItems(), 500);
        } catch (error) {
            console.error("Error adding item:", error);
            throw error;
        }
    };

    const updateItem = async (itemId, itemData) => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('items')
                .update({
                    name: itemData.name,
                    description: itemData.description,
                    category: itemData.category,
                    image_url: itemData.image || 'https://placehold.co/400x400/f3f4f6/374151?text=Item',
                    available_until: itemData.availableUntil,
                    status: itemData.status || 'AVAILABLE',
                    visibility: itemData.visibility || 'network',
                    maintenance_amount: itemData.maintenanceAmount || 0,
                    maintenance_reason: itemData.maintenanceReason || null,
                    pickup_address: itemData.pickupAddress,
                    pickup_contact: itemData.pickupContact,
                    pickup_time: itemData.pickupTime,
                    borrowed_by: itemData.borrowed_by !== undefined ? itemData.borrowed_by : null,
                    borrowed_until: itemData.borrowed_until !== undefined ? itemData.borrowed_until : null
                })
                .eq('id', itemId)
                .eq('owner_id', user.id) // Ensure user can only update their own items
                .select()
                .single();

            if (error) throw error;

            const updatedItem = {
                ...data,
                image: data.image_url,
                availableUntil: data.available_until,
                ownerId: data.owner_id,
                pickupAddress: data.pickup_address,
                pickupContact: data.pickup_contact,
                pickupTime: data.pickup_time,
                maintenanceAmount: data.maintenance_amount || 0,
                maintenanceReason: data.maintenance_reason
            };

            setUserItems(prev => prev.map(item => item.id === itemId ? updatedItem : item));
        } catch (error) {
            console.error("Error updating item:", error);
            throw error;
        }
    };

    const deleteItem = async (itemId) => {
        if (!user) return;

        try {
            // SOFT DELETE IMPLEMENTATION
            // Instead of deleting (which fails due to FKs), we update status to DELETED
            const { error } = await supabase
                .from('items')
                .update({ status: 'DELETED' })
                .eq('id', itemId)
                .eq('owner_id', user.id);

            if (error) throw error;

            // Remove from local state immediately
            setUserItems(prev => prev.filter(item => item.id !== itemId));
        } catch (error) {
            console.error("Error deleting item:", error);
            throw error;
        }
    };

    const refreshItems = async () => {
        await loadInitialData();
    };

    const removeBorrowedItemLocally = (itemId) => {
        setBorrowedItems(prev => prev.filter(item => item.id !== itemId));
    };

    // Computed merge for backward compatibility if needed, 
    // but better to expose explicitly.
    const items = [...userItems, ...feedItems];
    const myItems = userItems;
    const availableItems = feedItems;

    return (
        <ItemContext.Provider value={{ items, myItems, availableItems, borrowedItems, addItem, updateItem, deleteItem, refreshItems, removeBorrowedItemLocally, loadMore, hasMore, loading }}>
            {children}
        </ItemContext.Provider>
    );
};

export const useItems = () => useContext(ItemContext);
