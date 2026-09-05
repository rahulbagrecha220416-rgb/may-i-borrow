
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Users, LogOut, UserMinus, UserPlus, Crown } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useGroups } from '../context/GroupContext';
import PageTransition from '../components/layout/PageTransition';
import GroupProposals from '../components/groups/GroupProposals';
import { Capacitor } from '@capacitor/core';
import { MOCK_GROUPS, MOCK_USERS } from '../data/mockData';

const isGuest = (user) => user?.email === 'guest@mayiborrow.com';

const GroupDetails = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { refreshGroups } = useGroups();

    const [group, setGroup] = useState(location.state?.group || null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [leaving, setLeaving] = useState(false);
    const [removingMember, setRemovingMember] = useState(null);
    const [currentUserRole, setCurrentUserRole] = useState('member');
    const [copied, setCopied] = useState(false);

    const isAdmin = currentUserRole === 'admin';

    const buildInviteLink = (gId) => {
        let origin = window.location.origin;
        if (Capacitor.isNativePlatform() || origin.includes('localhost')) {
            origin = import.meta.env.VITE_APP_URL || 'https://may-i-borrow.vercel.app';
        }
        return `${origin}/join/${gId}?ref=${Math.random().toString(36).substring(7)}`;
    };

    const fetchMembers = async () => {
        const { data: memberData, error } = await supabase
            .from('group_members')
            .select(`
                user_id,
                role,
                profiles (id, full_name, avatar_url)
            `)
            .eq('group_id', groupId);

        if (error) { console.warn("Member fetch failed:", error); return; }

        if (memberData) {
            const formatted = memberData.map(m => ({
                id: m.profiles?.id || m.user_id,
                name: m.profiles?.full_name || 'Unknown User',
                avatar: m.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.profiles?.full_name || 'User')}&background=random`,
                role: m.role || 'member'
            }));
            setMembers(formatted);

            const me = memberData.find(m => m.user_id === user?.id);
            setCurrentUserRole(me?.role || 'member');
        }
    };

    useEffect(() => {
        const fetchGroupData = async () => {
            if (!groupId) return;

            // Guest mode: hydrate the circle, members, and roles from mock data.
            if (isGuest(user)) {
                const mockGroup = MOCK_GROUPS.find(g => g.id === groupId);
                if (mockGroup) {
                    setGroup({
                        ...mockGroup,
                        image_url: mockGroup.image,
                        governance_type: mockGroup.governanceType || 'monarchy'
                    });
                    setMembers((mockGroup.members || []).map((uid, idx) => {
                        const u = MOCK_USERS.find(mu => mu.id === uid);
                        return {
                            id: uid,
                            name: u?.name || 'Member',
                            avatar: u?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || 'Member')}`,
                            role: idx === 0 ? 'admin' : 'member'
                        };
                    }));
                    setCurrentUserRole('member');
                }
                setLoading(false);
                return;
            }

            if (group) {
                try { await fetchMembers(); } catch (err) { console.error(err); }
                setLoading(false);
                return;
            }

            try {
                const { data: groupData, error: groupError } = await supabase
                    .from('groups')
                    .select('*')
                    .eq('id', groupId)
                    .single();

                if (groupError) throw groupError;
                setGroup(groupData);
                await fetchMembers();
            } catch (error) {
                console.error("Error fetching group details:", error);
                alert(`Group Not Found: ${error.message || JSON.stringify(error)}`);
            } finally {
                setLoading(false);
            }
        };

        fetchGroupData();
        // Runs once per circle. `group` and `user` are only read for the guest and
        // re-entry shortcuts; keying on them would refetch members on every render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupId]);

    const handleLeaveGroup = async () => {
        if (isGuest(user)) { alert('Guest mode is read-only. Sign in to manage your circles.'); return; }
        if (!user || !window.confirm("Are you sure you want to leave this group?")) return;
        setLeaving(true);
        try {
            const { count } = await supabase
                .from('group_members')
                .select('*', { count: 'exact', head: true })
                .eq('group_id', groupId);

            const { error: leaveError } = await supabase
                .from('group_members')
                .delete()
                .eq('group_id', groupId)
                .eq('user_id', user.id);

            if (leaveError) throw leaveError;

            if (count <= 1) {
                await supabase.from('groups').delete().eq('id', groupId);
            }

            if (refreshGroups) await refreshGroups();
            navigate('/groups');
        } catch (error) {
            alert(`Error leaving group: ${error.message}`);
        } finally {
            setLeaving(false);
        }
    };

    const handleRemoveMember = async (memberId, memberName) => {
        if (isGuest(user)) { alert('Guest mode is read-only. Sign in to manage members.'); return; }
        if (!window.confirm(`Remove ${memberName} from this group?`)) return;
        setRemovingMember(memberId);
        try {
            const { error } = await supabase
                .from('group_members')
                .delete()
                .eq('group_id', groupId)
                .eq('user_id', memberId);

            if (error) throw error;
            setMembers(prev => prev.filter(m => m.id !== memberId));
        } catch (error) {
            alert(`Error removing member: ${error.message}`);
        } finally {
            setRemovingMember(null);
        }
    };

    const handlePromoteMember = async (memberId, memberName) => {
        if (isGuest(user)) { alert('Guest mode is read-only. Sign in to manage members.'); return; }
        if (!window.confirm(`Promote ${memberName} to admin?`)) return;
        try {
            const { error } = await supabase
                .from('group_members')
                .update({ role: 'admin' })
                .eq('group_id', groupId)
                .eq('user_id', memberId);

            if (error) throw error;
            setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: 'admin' } : m));
        } catch (error) {
            alert(`Error promoting member: ${error.message}`);
        }
    };

    const handleShareInvite = async () => {
        const link = buildInviteLink(groupId);

        if (Capacitor.isNativePlatform() && navigator.share) {
            try {
                await navigator.share({
                    title: `Join ${group?.name} on May I Borrow`,
                    text: `Hey! Join our lending circle "${group?.name}" on May I Borrow.`,
                    url: link
                });
            } catch (err) { console.warn('Share cancelled', err); }
        } else {
            navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const governanceType = group?.governance_type || 'monarchy';
    const isMonarchy = governanceType === 'monarchy';

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!group) {
        return <div className="p-4 text-center mt-10">Group not found</div>;
    }

    return (
        <PageTransition className="pb-20">
            {/* Header Image */}
            <div className="relative h-48 w-full">
                <img
                    src={group.image_url || group.image}
                    alt={group.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4 text-white">
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute top-4 left-4 bg-black/30 p-2 rounded-full backdrop-blur-sm hover:bg-black/50 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <button
                        onClick={handleLeaveGroup}
                        disabled={leaving}
                        className="absolute top-4 right-4 bg-red-500/80 p-2 rounded-full backdrop-blur-sm hover:bg-red-600 transition-colors text-white"
                        title="Leave Group"
                    >
                        {leaving ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <LogOut size={20} />}
                    </button>

                    <h1 className="text-2xl font-bold leading-tight mb-1">{group.name}</h1>
                    <div className="flex items-center gap-3 text-sm opacity-90">
                        <span className="flex items-center gap-1">
                            <Users size={16} /> {members.length} Members
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isMonarchy ? 'bg-amber-400/80 text-amber-900' : 'bg-blue-400/80 text-blue-900'}`}>
                            {isMonarchy ? '🏰 Monarchy' : '🗳️ Republic'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* About */}
                <section>
                    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">About</h2>
                    <p className="text-gray-600 text-sm leading-relaxed">{group.description || 'No description provided.'}</p>
                </section>

                {/* Members */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Members</h2>
                        {isAdmin && (
                            <button
                                onClick={handleShareInvite}
                                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-semibold text-white transition-all"
                                style={{ backgroundColor: '#6b7c73' }}
                            >
                                <UserPlus size={12} />
                                {copied ? 'Copied!' : 'Invite'}
                            </button>
                        )}
                    </div>

                    <div className="space-y-2">
                        {members.map(member => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between p-3 rounded-xl"
                                style={{ backgroundColor: '#F7F2EB' }}
                            >
                                <div className="flex items-center gap-3">
                                    <img
                                        src={member.avatar}
                                        alt={member.name}
                                        className="w-9 h-9 rounded-full object-cover ring-2 ring-white"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                                            {member.name}
                                            {member.role === 'admin' && (
                                                <span title="Admin" className="text-amber-500">👑</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                                    </div>
                                </div>

                                {/* Admin controls: promote to admin, remove */}
                                {isAdmin && member.id !== user?.id && (
                                    <div className="flex items-center gap-1">
                                        {member.role !== 'admin' && (
                                            <button
                                                onClick={() => handlePromoteMember(member.id, member.name)}
                                                className="p-2 rounded-lg text-amber-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                                                title={`Promote ${member.name} to admin`}
                                            >
                                                <Crown size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleRemoveMember(member.id, member.name)}
                                            disabled={removingMember === member.id}
                                            className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                            title={`Remove ${member.name}`}
                                        >
                                            {removingMember === member.id
                                                ? <div className="animate-spin h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full" />
                                                : <UserMinus size={16} />}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {!isAdmin && (
                        <p className="text-xs text-center text-gray-400 mt-3">
                            {isMonarchy ? 'Only admins can invite or remove members in a Monarchy.' : 'In a Republic, members vote on changes. Contact an admin to invite new members.'}
                        </p>
                    )}
                </section>

                {/* Proposals (Republic groups surface this more prominently, but available to all) */}
                <GroupProposals groupId={groupId} userId={user?.id} isAdmin={isAdmin} guest={isGuest(user)} />

                {/* Available to Borrow */}
                <section>
                    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Available to Borrow</h2>
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-400 text-sm">Items loading coming soon...</p>
                        <button onClick={() => navigate('/add-item')} className="mt-2 text-emerald-600 font-medium text-sm">Add Item</button>
                    </div>
                </section>
            </div>
        </PageTransition>
    );
};

export default GroupDetails;
