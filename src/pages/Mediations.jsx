import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Clock, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/layout/PageTransition';

const STATUS_META = {
    PENDING: { label: 'Pending', Icon: Clock, color: '#B89645', bg: '#FFF8E7' },
    ADVISED: { label: 'Advised', Icon: MessageSquare, color: '#1D4ED8', bg: '#EFF6FF' },
    RESOLVED: { label: 'Resolved', Icon: CheckCircle2, color: '#15803D', bg: '#ECFDF5' },
    IGNORED: { label: 'Ignored', Icon: XCircle, color: '#9CA3AF', bg: '#F3F4F6' }
};

const Mediations = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [tab, setTab] = useState('mine'); // 'mine' | 'incoming'
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resolvingId, setResolvingId] = useState(null);

    const load = async () => {
        if (!user) return;
        setLoading(true);
        const column = tab === 'mine' ? 'requester_id' : 'mutual_friend_id';
        const { data, error } = await supabase
            .from('mediations')
            .select('id, created_at, inquiry_type, question, status, requester_id, owner_id, mutual_friend_id, item_id, items(name, image_url)')
            .eq(column, user.id)
            .order('created_at', { ascending: false });

        if (error) console.error('Mediations load error:', error);
        setRows(data || []);
        setLoading(false);
    };

    useEffect(() => { load(); }, [user, tab]);

    const updateStatus = async (id, status) => {
        setResolvingId(id);
        const { error } = await supabase
            .from('mediations')
            .update({ status })
            .eq('id', id);
        if (error) {
            alert(`Failed to update: ${error.message}`);
        } else {
            setRows(prev => prev.map(r => r.id === id ? { ...r, status } : r));
        }
        setResolvingId(null);
    };

    return (
        <PageTransition className="p-4 min-h-screen" style={{ backgroundColor: '#F2ECE3' }}>
            <div className="flex items-center mb-6">
                <button onClick={() => navigate(-1)} className="mr-3">
                    <ArrowLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Mediations</h1>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-5 bg-white/50 p-1 rounded-xl border border-[#DDD5CB]">
                <button
                    onClick={() => setTab('mine')}
                    className={`py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'mine' ? 'bg-[#6b7c73] text-white' : 'text-[#726A60]'}`}
                >
                    I Asked
                </button>
                <button
                    onClick={() => setTab('incoming')}
                    className={`py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'incoming' ? 'bg-[#6b7c73] text-white' : 'text-[#726A60]'}`}
                >
                    Asked of Me
                </button>
            </div>

            {loading ? (
                <p className="text-center text-sm text-gray-500 py-10">Loading…</p>
            ) : rows.length === 0 ? (
                <div className="text-center py-12 rounded-2xl bg-white/60 border border-[#DDD5CB]">
                    <Shield size={32} className="mx-auto text-[#6b7c73] mb-3" />
                    <p className="text-sm text-[#726A60]">
                        {tab === 'mine'
                            ? "You haven't asked a mutual friend for mediation yet."
                            : "No one has asked you to weigh in."}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {rows.map(row => {
                        const meta = STATUS_META[row.status] || STATUS_META.PENDING;
                        const { Icon } = meta;
                        const canRespond = tab === 'incoming' && row.status === 'PENDING';
                        return (
                            <div key={row.id} className="bg-white rounded-2xl border border-[#DDD5CB] p-4">
                                <div className="flex items-start gap-3 mb-3">
                                    <img
                                        src={row.items?.image_url || 'https://placehold.co/80x80/f3f4f6/374151?text=Item'}
                                        alt={row.items?.name || 'Item'}
                                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                        onError={(e) => { e.target.src = 'https://placehold.co/80x80/f3f4f6/374151?text=Item'; }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{row.items?.name || 'Item'}</p>
                                        <p className="text-xs text-gray-500">{row.inquiry_type?.replace(/_/g, ' ').toLowerCase()}</p>
                                    </div>
                                    <span
                                        className="text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full flex items-center gap-1"
                                        style={{ color: meta.color, backgroundColor: meta.bg }}
                                    >
                                        <Icon size={12} /> {meta.label}
                                    </span>
                                </div>

                                {row.question && (
                                    <p className="text-sm text-gray-700 leading-relaxed bg-[#F7F2EB] rounded-lg p-3 mb-3">
                                        "{row.question}"
                                    </p>
                                )}

                                {canRespond && (
                                    <div className="flex gap-2">
                                        <button
                                            disabled={resolvingId === row.id}
                                            onClick={() => updateStatus(row.id, 'ADVISED')}
                                            className="flex-1 text-xs font-bold py-2 rounded-lg bg-[#6b7c73] text-white disabled:opacity-50"
                                        >
                                            Mark Advised
                                        </button>
                                        <button
                                            disabled={resolvingId === row.id}
                                            onClick={() => updateStatus(row.id, 'IGNORED')}
                                            className="flex-1 text-xs font-bold py-2 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50"
                                        >
                                            Ignore
                                        </button>
                                    </div>
                                )}

                                {tab === 'mine' && row.status === 'ADVISED' && (
                                    <button
                                        disabled={resolvingId === row.id}
                                        onClick={() => updateStatus(row.id, 'RESOLVED')}
                                        className="w-full text-xs font-bold py-2 rounded-lg bg-[#B86445] text-white disabled:opacity-50"
                                    >
                                        Mark Resolved
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </PageTransition>
    );
};

export default Mediations;
