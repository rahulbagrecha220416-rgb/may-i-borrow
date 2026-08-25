import React, { useEffect, useState } from 'react';
import { Vote, Plus, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { MOCK_PROPOSALS } from '../../data/mockData';

const GroupProposals = ({ groupId, userId, isAdmin, guest }) => {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');

    const load = async () => {
        setLoading(true);
        if (guest) {
            setProposals(MOCK_PROPOSALS[groupId] || []);
            setLoading(false);
            return;
        }
        const { data: props } = await supabase
            .from('group_proposals')
            .select('id, title, description, status, created_at, closed_at, created_by')
            .eq('group_id', groupId)
            .order('created_at', { ascending: false });

        if (!props?.length) {
            setProposals([]);
            setLoading(false);
            return;
        }

        const ids = props.map(p => p.id);
        const { data: votes } = await supabase
            .from('proposal_votes')
            .select('proposal_id, vote, voter_id')
            .in('proposal_id', ids);

        const withTallies = props.map(p => {
            const myVote = votes?.find(v => v.proposal_id === p.id && v.voter_id === userId)?.vote;
            const yes = votes?.filter(v => v.proposal_id === p.id && v.vote === 'yes').length || 0;
            const no = votes?.filter(v => v.proposal_id === p.id && v.vote === 'no').length || 0;
            return { ...p, yes, no, myVote };
        });

        setProposals(withTallies);
        setLoading(false);
    };

    useEffect(() => { if (groupId && userId) load(); }, [groupId, userId, guest]);

    const createProposal = async () => {
        if (guest) { alert('Guest mode is read-only. Sign in to start a proposal.'); return; }
        if (!newTitle.trim()) return;
        setCreating(true);
        const { error } = await supabase
            .from('group_proposals')
            .insert({
                group_id: groupId,
                created_by: userId,
                title: newTitle.trim(),
                description: newDesc.trim() || null
            });
        setCreating(false);
        if (error) {
            alert(`Couldn't create: ${error.message}`);
            return;
        }
        setNewTitle('');
        setNewDesc('');
        setShowCreate(false);
        load();
    };

    const castVote = async (proposalId, vote) => {
        if (guest) { alert('Guest mode is read-only. Sign in to vote.'); return; }
        // Upsert: delete any existing vote first, then insert.
        await supabase
            .from('proposal_votes')
            .delete()
            .eq('proposal_id', proposalId)
            .eq('voter_id', userId);

        const { error } = await supabase
            .from('proposal_votes')
            .insert({ proposal_id: proposalId, voter_id: userId, vote });
        if (error) {
            alert(`Couldn't vote: ${error.message}`);
            return;
        }
        load();
    };

    const closeProposal = async (proposalId) => {
        if (guest) { alert('Guest mode is read-only. Sign in to close a proposal.'); return; }
        if (!window.confirm('Close this proposal? Voting will end.')) return;
        const { error } = await supabase
            .from('group_proposals')
            .update({ status: 'CLOSED', closed_at: new Date().toISOString() })
            .eq('id', proposalId);
        if (error) {
            alert(`Couldn't close: ${error.message}`);
            return;
        }
        load();
    };

    return (
        <section>
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Vote size={16} /> Proposals
                </h2>
                <button
                    onClick={() => setShowCreate(v => !v)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-semibold text-white"
                    style={{ backgroundColor: '#6b7c73' }}
                >
                    <Plus size={12} /> New
                </button>
            </div>

            {showCreate && (
                <div className="bg-white border border-[#DDD5CB] rounded-xl p-3 mb-3 space-y-2">
                    <input
                        type="text"
                        placeholder="Proposal title"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b7c73]"
                    />
                    <textarea
                        rows={2}
                        placeholder="Context (optional)"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b7c73] resize-none"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={createProposal}
                            disabled={creating || !newTitle.trim()}
                            className="flex-1 text-xs font-bold py-2 rounded-lg bg-[#6b7c73] text-white disabled:opacity-50"
                        >
                            {creating ? 'Posting…' : 'Post'}
                        </button>
                        <button
                            onClick={() => setShowCreate(false)}
                            className="flex-1 text-xs font-bold py-2 rounded-lg bg-gray-100 text-gray-700"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <p className="text-xs text-gray-400 text-center py-4">Loading proposals…</p>
            ) : proposals.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No proposals yet. Start one above.</p>
            ) : (
                <div className="space-y-2">
                    {proposals.map(p => {
                        const total = p.yes + p.no;
                        const yesPct = total ? Math.round((p.yes / total) * 100) : 0;
                        const canVote = p.status === 'OPEN';
                        const canClose = p.status === 'OPEN' && (p.created_by === userId || isAdmin);
                        return (
                            <div key={p.id} className="bg-white rounded-xl border border-[#DDD5CB] p-3">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <h3 className="text-sm font-semibold text-gray-900">{p.title}</h3>
                                    <span
                                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0"
                                        style={{
                                            color: p.status === 'OPEN' ? '#1D4ED8' : '#9CA3AF',
                                            backgroundColor: p.status === 'OPEN' ? '#EFF6FF' : '#F3F4F6'
                                        }}
                                    >
                                        {p.status === 'OPEN' ? <Clock size={10} /> : <CheckCircle2 size={10} />} {p.status}
                                    </span>
                                </div>
                                {p.description && (
                                    <p className="text-xs text-gray-600 mb-2">{p.description}</p>
                                )}

                                {/* Tally */}
                                <div className="text-[11px] text-gray-500 mb-2 flex items-center gap-3">
                                    <span>Yes: <b className="text-gray-900">{p.yes}</b></span>
                                    <span>No: <b className="text-gray-900">{p.no}</b></span>
                                    {total > 0 && <span>· {yesPct}% yes</span>}
                                </div>
                                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-3">
                                    <div className="h-full bg-[#6b7c73]" style={{ width: `${yesPct}%` }} />
                                </div>

                                {canVote && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => castVote(p.id, 'yes')}
                                            className={`flex-1 text-xs font-bold py-1.5 rounded-lg border transition-colors ${p.myVote === 'yes' ? 'bg-[#6b7c73] text-white border-[#6b7c73]' : 'bg-white text-[#6b7c73] border-[#DDD5CB] hover:bg-[#F7F2EB]'}`}
                                        >
                                            Yes
                                        </button>
                                        <button
                                            onClick={() => castVote(p.id, 'no')}
                                            className={`flex-1 text-xs font-bold py-1.5 rounded-lg border transition-colors ${p.myVote === 'no' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-red-500 border-[#DDD5CB] hover:bg-red-50'}`}
                                        >
                                            No
                                        </button>
                                    </div>
                                )}

                                {canClose && (
                                    <button
                                        onClick={() => closeProposal(p.id)}
                                        className="w-full mt-2 text-xs font-semibold py-1 rounded-lg text-gray-500 hover:text-gray-700"
                                    >
                                        Close proposal
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
};

export default GroupProposals;
