
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Users, Info, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGroups } from '../context/GroupContext';
import { supabase } from '../supabaseClient';
import PageTransition from '../components/layout/PageTransition';

const JoinGroup = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { refreshGroups } = useGroups();

    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [joining, setJoining] = useState(false);
    const [alreadyMember, setAlreadyMember] = useState(false);

    useEffect(() => {
        const fetchGroupDetails = async () => {
            if (!groupId) return;
            try {
                // Fetch basic group info (publicly viewable hopefully, or RLS might block if not public)
                // We assume we want to show a "Preview" card.
                const { data, error } = await supabase
                    .from('groups')
                    .select('*, group_members(count)')
                    .eq('id', groupId)
                    .single();

                if (error) throw error;

                // If user is logged in, check if they are already a member
                if (user) {
                    const { data: memberData } = await supabase
                        .from('group_members')
                        .select('group_id')
                        .eq('group_id', groupId)
                        .eq('user_id', user.id)
                        .single();

                    if (memberData) setAlreadyMember(true);
                }

                setGroup(data);
            } catch (err) {
                console.error("Error fetching group invite:", err);
                setError("This invite link appears to be invalid or expired.");
            } finally {
                setLoading(false);
            }
        };

        fetchGroupDetails();
    }, [groupId, user]);

    const handleJoin = useCallback(async () => {
        if (!user) {
            // Store return URL
            localStorage.setItem('returnUrl', `/join/${groupId}`);
            navigate('/login');
            return;
        }

        setJoining(true);
        try {
            // 1. Ensure Profile Exists (Self Healing - Reuse logic)
            await supabase.from('profiles').insert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || 'User',
                avatar_url: user.user_metadata?.avatar_url
            }).select().single();
            // Ignore duplicate key error

            // 2. Join
            const { error } = await supabase
                .from('group_members')
                .insert({ group_id: groupId, user_id: user.id });

            if (error) {
                if (error.code === '23505') { // Unique violation
                    setAlreadyMember(true);
                } else {
                    throw error;
                }
            } else {
                // 3. Create Notification (Only if actually joined new)
                await supabase.from('notifications').insert({
                    user_id: user.id,
                    type: 'GROUP_JOIN',
                    content: `You successfully joined the group "${group.name}".`,
                    related_id: groupId,
                    is_read: false
                });
            }

            // Success
            if (typeof refreshGroups === 'function') await refreshGroups();
            navigate(`/groups/${groupId}`);
        } catch (err) {
            alert(`Error joining group: ${err.message}`);
            setJoining(false);
        } finally {
            // setJoining(false); // Done above to prevent flicker on valid nav
        }
    }, [user, groupId, group, navigate, refreshGroups]);

    useEffect(() => {
        // Auto-Join Requirement: "it should open the app and join the group"
        if (group && user && !alreadyMember && !joining && !error) {
            const timer = setTimeout(() => {
                handleJoin();
            }, 800); // Small delay to let UI settle/animation play
            return () => clearTimeout(timer);
        }
    }, [group, user, alreadyMember, joining, error, handleJoin]);


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (error || !group) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-gray-50">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="text-red-500" size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Invite Not Found</h2>
                <p className="text-gray-500 mb-8 max-w-xs">{error || "We couldn't find the group you're looking for."}</p>
                <Link to="/" className="text-emerald-600 font-semibold hover:underline">Go Home</Link>
            </div>
        );
    }

    return (
        <PageTransition className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex flex-col pt-12 pb-8 px-4">
            <div className="flex-1 flex flex-col items-center max-w-md mx-auto w-full">

                <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    {/* Cover Image */}
                    <div className="h-32 bg-gray-200 relative">
                        <img
                            src={group.image_url}
                            alt={group.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20"></div>
                    </div>

                    <div className="p-6 text-center -mt-10 relative z-10">
                        <div className="w-20 h-20 bg-white rounded-2xl shadow-lg p-1 mx-auto mb-4 row-start-1">
                            <img
                                src={group.image_url}
                                alt={group.name}
                                className="w-full h-full object-cover rounded-xl"
                            />
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{group.name}</h1>
                        {group.description && (
                            <p className="text-gray-500 text-sm mb-4 line-clamp-3">{group.description}</p>
                        )}

                        <div className="flex items-center justify-center gap-2 text-gray-400 text-xs mb-8">
                            <Users size={14} />
                            <span>{group.group_members[0]?.count || 1} Members</span>
                        </div>

                        {alreadyMember ? (
                            <div className="space-y-3">
                                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                                    <CheckCircle size={16} /> You're already a member
                                </div>
                                <button
                                    onClick={() => navigate(`/groups/${group.id}`)}
                                    className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                                >
                                    Open Group <ArrowRight size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <button
                                    onClick={handleJoin}
                                    disabled={joining}
                                    className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
                                >
                                    {joining ? 'Joining Group...' : 'Join Circle'}
                                </button>

                                {!user && (
                                    <p className="text-xs text-gray-400">
                                        You'll need to log in or create an account first.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Powered By</p>
                    <div className="flex items-center justify-center gap-1.5 text-gray-900 font-bold text-lg">
                        <div className="w-6 h-6 bg-emerald-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs">M</span>
                        </div>
                        May We Borrow
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default JoinGroup;
