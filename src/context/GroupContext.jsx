
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { MOCK_GROUPS } from '../data/mockData';

const GroupContext = createContext();

export const useGroups = () => {
    return useContext(GroupContext);
};

export const GroupProvider = ({ children }) => {
    const authContext = useAuth();
    const user = authContext?.user || null;
    const authLoading = authContext?.loading; // Get auth loading state

    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchGroups = async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) setRefreshing(true);
            else setLoading(true);
            setError(null);

            if (!user) {
                setGroups([]);
                return;
            }

            if (user?.email === 'guest@mayiborrow.com') {
                setGroups(MOCK_GROUPS.map(g => ({ ...g, memberCount: g.members?.length || 1 })));
                return;
            }

            const { data: memberData, error: memberError } = await supabase
                .from('group_members')
                .select('group_id')
                .eq('user_id', user.id);

            if (memberError) throw new Error(`Member fetch: ${memberError.message}`);

            if (!memberData || memberData.length === 0) {
                setGroups([]);
                return;
            }

            const groupIds = memberData.map(m => m.group_id);

            const { data: groupsData, error: groupsError } = await supabase
                .from('groups')
                .select('*')
                .in('id', groupIds);

            if (groupsError) throw new Error(`Groups fetch: ${groupsError.message}`);

            setGroups((groupsData || []).map(group => ({
                ...group,
                memberCount: 1,
                image: group.image_url
            })));
        } catch (error) {
            if (error.name === 'AbortError' || error.message?.includes('aborted') || error.message?.includes('Failed to fetch')) {
                return;
            }
            console.error("Error in fetchGroups:", error);
            setError(error.message || "Failed to load groups");
            setGroups([]);
        } finally {
            setLoading(false);
            if (isManualRefresh) setRefreshing(false);
        }
    };

    useEffect(() => {
        // CRITICAL FIX: Wait for auth to finish loading
        if (authLoading) {
            console.log('⏳ Waiting for auth to complete...');
            return;
        }

        if (user) {
            console.log('✅ Auth complete, fetching groups for:', user.email);
            fetchGroups();
        } else {
            console.log('ℹ️ No user, clearing groups');
            setGroups([]);
        }
    }, [user, authLoading]); // Add authLoading dependency

    const refreshGroups = () => fetchGroups(true);

    const createGroup = async (newGroupData) => {
        if (!user) return null;

        try {
            const { data: groupData, error: groupError } = await supabase
                .from('groups')
                .insert({
                    name: newGroupData.name,
                    description: newGroupData.description,
                    image_url: newGroupData.image || 'https://placehold.co/600x400/e2e8f0/64748b?text=Group',
                    created_by: user.id
                })
                .select()
                .single();

            if (groupError) throw groupError;

            const { error: memberError } = await supabase
                .from('group_members')
                .insert({
                    group_id: groupData.id,
                    user_id: user.id
                });

            if (memberError) throw memberError;

            const newGroup = { ...groupData, image: groupData.image_url, memberCount: 1 };
            setGroups([newGroup, ...groups]);

            setTimeout(() => refreshGroups(), 500);

            return newGroup;
        } catch (error) {
            console.error("Error creating group:", error);
            throw error;
        }
    };

    return (
        <GroupContext.Provider value={{ groups, createGroup, loading, refreshing, refreshGroups, error }}>
            {children}
        </GroupContext.Provider>
    );
};
