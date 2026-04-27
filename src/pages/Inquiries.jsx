import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/layout/PageTransition';

const STATUS_META = {
    PENDING: { label: 'Pending', Icon: Clock, color: '#B89645', bg: '#FFF8E7' },
    FORWARDED: { label: 'Forwarded', Icon: MessageCircle, color: '#1D4ED8', bg: '#EFF6FF' },
    RESOLVED: { label: 'Resolved', Icon: CheckCircle2, color: '#15803D', bg: '#ECFDF5' },
    IGNORED: { label: 'Ignored', Icon: XCircle, color: '#9CA3AF', bg: '#F3F4F6' }
};

const Inquiries = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [tab, setTab] = useState('mine');
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [response, setResponse] = useState({});
    const [saving, setSaving] = useState(null);

    const load = async () => {
        if (!user) return;
        setLoading(true);
        const column = tab === 'mine' ? 'inquirer_id' : 'mediator_id';
        const { data, error } = await supabase
            .from('item_inquiries')
            .select('id, created_at, message, response, status, inquirer_id, mediator_id, lender_id, item_id, items(name, image_url)')
            .eq(column, user.id)
            .order('created_at', { ascending: false });

        if (error) console.error('Inquiries load error:', error);
        setRows(data || []);
        setLoading(false);
    };

    useEffect(() => { load(); }, [user, tab]);

    const submitResponse = async (id) => {
        const text = (response[id] || '').trim();
        if (!text) return;
        setSaving(id);
        const { error } = await supabase
            .from('item_inquiries')
            .update({ response: text, status: 'FORWARDED' })
            .eq('id', id);
        if (error) {
            alert(`Couldn't save: ${error.message}`);
        } else {
            setRows(prev => prev.map(r => r.id === id ? { ...r, response: text, status: 'FORWARDED' } : r));
            setResponse(prev => ({ ...prev, [id]: '' }));
        }
        setSaving(null);
    };

    return (
        <PageTransition className="p-4 min-h-screen" style={{ backgroundColor: '#F2ECE3' }}>
            <div className="flex items-center mb-6">
                <button onClick={() => navigate(-1)} className="mr-3">
                    <ArrowLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Inquiries</h1>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-5 bg-white/50 p-1 rounded-xl border border-[#DDD5CB]">
                <button
                    onClick={() => setTab('mine')}
                    className={`py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'mine' ? 'bg-[#6b7c73] text-white' : 'text-[#726A60]'}`}
                >
                    My Questions
                </button>
                <button
                    onClick={() => setTab('incoming')}
                    className={`py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'incoming' ? 'bg-[#6b7c73] text-white' : 'text-[#726A60]'}`}
                >
                    For Me to Answer
                </button>
            </div>

            {loading ? (
                <p className="text-center text-sm text-gray-500 py-10">Loading…</p>
            ) : rows.length === 0 ? (
                <div className="text-center py-12 rounded-2xl bg-white/60 border border-[#DDD5CB]">
                    <MessageCircle size={32} className="mx-auto text-[#6b7c73] mb-3" />
                    <p className="text-sm text-[#726A60]">
                        {tab === 'mine'
                            ? "You haven't asked any questions yet."
                            : "No one has asked you to weigh in."}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {rows.map(row => {
                        const meta = STATUS_META[row.status] || STATUS_META.PENDING;
                        const { Icon } = meta;
                        const canRespond = tab === 'incoming' && (row.status === 'PENDING' || !row.response);
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
                                        <p className="text-xs text-gray-500">{new Date(row.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <span
                                        className="text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full flex items-center gap-1"
                                        style={{ color: meta.color, backgroundColor: meta.bg }}
                                    >
                                        <Icon size={12} /> {meta.label}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-700 leading-relaxed bg-[#F7F2EB] rounded-lg p-3 mb-3">
                                    "{row.message}"
                                </p>

                                {row.response && (
                                    <div className="text-sm text-gray-700 leading-relaxed border-l-2 border-[#6b7c73] pl-3 mb-3">
                                        <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Response</p>
                                        {row.response}
                                    </div>
                                )}

                                {canRespond && (
                                    <div className="space-y-2">
                                        <textarea
                                            rows={2}
                                            value={response[row.id] || ''}
                                            onChange={(e) => setResponse(prev => ({ ...prev, [row.id]: e.target.value }))}
                                            placeholder="Share what you know about this person or item…"
                                            className="w-full text-sm rounded-lg border border-gray-200 bg-gray-50 p-2 focus:ring-2 focus:ring-[#6b7c73] focus:outline-none resize-none"
                                        />
                                        <button
                                            onClick={() => submitResponse(row.id)}
                                            disabled={saving === row.id || !(response[row.id] || '').trim()}
                                            className="w-full text-xs font-bold py-2 rounded-lg bg-[#6b7c73] text-white disabled:opacity-50"
                                        >
                                            {saving === row.id ? 'Saving…' : 'Send Response'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </PageTransition>
    );
};

export default Inquiries;
