import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, CheckCircle } from 'lucide-react';
import { MOCK_USERS } from '../data/mockData';
import { useItems } from '../context/ItemContext';
import { useAuth } from '../context/AuthContext';
import { useRequests } from '../context/RequestContext';
import { supabase } from '../supabaseClient';
import PageTransition from '../components/layout/PageTransition';

const ItemDetails = () => {
    const { itemId } = useParams();
    const navigate = useNavigate();
    const { items } = useItems();
    const { user } = useAuth();
    const { addRequest } = useRequests();

    // Derived State
    const item = items?.find(i => i.id == itemId); // Loose equality for string/number mismatch
    // Fallback owner logic if item doesn't have owner object attached
    const owner = item?.owner || MOCK_USERS.find(u => u.id === item?.userId) || MOCK_USERS[0];

    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestReason, setRequestReason] = useState('');
    const [hasAgreed, setHasAgreed] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [deliveryMode, setDeliveryMode] = useState('pickup');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasExistingRequest, setHasExistingRequest] = useState(false);
    const [existingRequest, setExistingRequest] = useState(null);

    // Mediation State
    const [showMediationModal, setShowMediationModal] = useState(false);
    const [mediationStep, setMediationStep] = useState('question'); // question, success
    const [selectedQuestion, setSelectedQuestion] = useState('');

    // Mock Mutual Friend (Visual only for now, but ID needed for DB)
    // accessible Mutual Friend ID - utilizing the owner's ID or user's ID as placeholder if no distinct graph exists
    const mutualFriend = {
        id: user?.id, // using current user as mutual friend for testing FK constraints
        name: 'Amit Sharma',
        avatar: 'https://cdn.usegalileo.ai/sdxl10/602f9282-58bc-462b-b9c1-d4fda0b59f3c.png'
    };

    // Check for existing request
    React.useEffect(() => {
        if (user && item?.id) {
            checkExistingRequest();
        }
    }, [user, item?.id]);

    const checkExistingRequest = async () => {
        try {
            const { data, error } = await supabase
                .from('requests')
                .select('*')
                .eq('user_id', user.id)
                .eq('item_id', item.id)
                .in('status', ['PENDING', 'ACCEPTED'])
                .maybeSingle();

            if (data) {
                setHasExistingRequest(true);
                setExistingRequest(data);
            } else {
                setHasExistingRequest(false);
                setExistingRequest(null);
            }
        } catch (error) {
            console.error('Error checking existing request:', error);
        }
    };

    const handleBorrowRequest = async () => {
        if (!hasAgreed || requestReason.length < 10 || isSubmitting) return;

        setIsSubmitting(true);

        try {
            console.log('📤 Sending borrow request for item:', item.id);

            // Create the request with notification
            await addRequest({
                title: `Borrow ${item.name}`,
                description: requestReason,
                category: item.category,
                itemId: item.id, // This triggers notification to owner
                groupIds: item.group_ids || [],
                visibility: 'group'
            });

            console.log('✅ Borrow request sent successfully');
            setShowRequestModal(false);
            setShowSuccessModal(true);
            setTimeout(() => {
                setShowSuccessModal(false);
                navigate('/');
            }, 2000);
        } catch (error) {
            console.error('❌ Failed to send borrow request:', error);
            alert(`Failed to send request: ${error.message || 'Unknown error'}. Please try again.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMediationSubmit = async () => {
        if (!user || !item) return;

        try {
            const { data: mediation, error: mediationError } = await supabase
                .from('mediations')
                .insert({
                    requester_id: user.id,
                    owner_id: item.ownerId || item.owner_id || owner.id,
                    item_id: item.id,
                    mutual_friend_id: mutualFriend.id,
                    inquiry_type: 'FEE_CLARIFICATION',
                    question: selectedQuestion,
                    status: 'PENDING'
                })
                .select()
                .single();

            if (mediationError) throw mediationError;

            const { error: notifError } = await supabase
                .from('notifications')
                .insert({
                    user_id: mutualFriend.id,
                    type: 'MEDIATION_REQUEST',
                    content: `${user.user_metadata?.full_name || 'A friend'} needs advice about ${item.name}.`,
                    related_id: mediation.id,
                    related_type: 'mediation',
                    is_read: false
                });

            if (notifError) console.error("Notification failed", notifError);

            setMediationStep('success');
            setTimeout(() => {
                setShowMediationModal(false);
                setMediationStep('question');
                setSelectedQuestion('');
            }, 2500);

        } catch (error) {
            console.error('Error submitting mediation:', error);
            alert('Failed to send request. Please try again.');
        }
    };

    if (!item) return <div className="p-10 text-center">Loading item...</div>;

    return (
        <PageTransition className="pb-32 bg-white dark:bg-gray-900 min-h-screen relative">
            {/* Header Image */}
            <div className="relative h-72 w-full">
                <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                />
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 bg-white/80 p-2 rounded-full backdrop-blur-sm hover:bg-white transition-colors shadow-sm"
                >
                    <ArrowLeft size={20} className="text-gray-800" />
                </button>
            </div>

            <div className="p-5 -mt-6 bg-white dark:bg-gray-800 rounded-t-3xl relative z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <span className="text-emerald-600 font-semibold text-xs tracking-wider uppercase mb-1 block">{item.category}</span>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{item.name}</h1>
                    </div>
                    <div>
                        {item.maintenanceAmount > 0 && (
                            <div className="flex flex-col items-end">
                                <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold mb-1 border border-emerald-200">
                                    Free to borrow
                                </span>
                                <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-100/50 shadow-sm">
                                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Contribution</span>
                                    <span className="text-xs font-bold border-l border-amber-200/50 pl-2 ml-1">₹{item.maintenanceAmount}</span>
                                    <span className="text-[10px] font-medium opacity-80 italic">({item.maintenanceReason})</span>
                                </div>
                            </div>
                        )}
                        {(!item.maintenanceAmount || item.maintenanceAmount === 0) && (
                            <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold text-center">
                                {item.status}
                            </div>
                        )}
                    </div>
                </div>

                {/* Owner Info & Social Proof */}
                <div className="flex items-center p-3 bg-gray-50 rounded-xl mb-6 relative overflow-hidden">
                    <img src={owner.avatar} alt={owner.name} className="w-10 h-10 rounded-full object-cover mr-3 z-10" />
                    <div className="z-10 flex-1">
                        <p className="text-xs text-gray-400 font-medium">Lender</p>
                        <p className="text-sm font-semibold text-gray-800">{owner.name}</p>
                    </div>

                    {/* Point 3: Mutual Connection Visualization */}
                    {item.visibility === 'network' && (
                        <div className="absolute right-0 top-0 bottom-0 bg-indigo-50/50 w-2/3 flex items-center justify-end px-3">
                            <div className="flex items-center text-xs text-indigo-800 font-medium opacity-80">
                                <span className="mr-2 text-right leading-tight">Connected via<br /><strong>{mutualFriend.name}</strong></span>
                                <div className="flex -space-x-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[8px]">You</div>
                                    <div className="w-6 h-6 rounded-full bg-indigo-200 border-2 border-white flex items-center justify-center text-[8px]">AS</div>
                                    <img src={owner.avatar} className="w-6 h-6 rounded-full border-2 border-white" alt="" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="space-y-4 mb-4">
                    <div className="flex items-start text-gray-600">
                        <Calendar size={18} className="mr-3 mt-0.5 text-gray-400" />
                        <div>
                            <p className="text-sm font-medium text-gray-900">Available Until</p>
                            <p className="text-sm opacity-80">{item.availableUntil}</p>
                        </div>
                    </div>
                    <div className="flex items-start text-gray-600">
                        <MapPin size={18} className="mr-3 mt-0.5 text-gray-400" />
                        <div>
                            <p className="text-sm font-medium text-gray-900">Location</p>
                            <p className="text-sm opacity-80">{item.pickupAddress || "No address provided"}</p>
                            {item.pickupTime && (
                                <p className="text-xs text-emerald-600 mt-1">Best time: {item.pickupTime}</p>
                            )}
                        </div>
                    </div>
                    {item.description && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delivery Toggle & Estimator */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
                <div className="p-4 max-w-md mx-auto space-y-3">
                    {/* Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setDeliveryMode('pickup')}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${deliveryMode === 'pickup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Self Pickup
                        </button>
                        <button
                            onClick={() => setDeliveryMode('porter')}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${deliveryMode === 'porter' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Porter Delivery
                        </button>
                    </div>

                    {/* Dynamic Context */}
                    {deliveryMode === 'porter' ? (
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center">
                                <div className="bg-blue-100 p-1.5 rounded-full mr-3 text-blue-600">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 18H3c-.6 0-1-.4-1-1V9c0-.6.4-1 1-1h2v10zm4-12v12h12l-3-12H9zm-4 4h4" /></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] text-blue-800 font-bold uppercase tracking-wider">Estimated Cost</p>
                                    <p className="text-sm font-semibold text-blue-900">~₹140 - ₹180</p>
                                </div>
                            </div>
                            <span className="text-[10px] bg-white px-2 py-1 rounded border border-blue-200 font-medium text-blue-600">Est. 45 mins</span>
                        </div>
                    ) : (
                        item.visibility === 'network' ? (
                            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex items-center animate-in fade-in slide-in-from-bottom-2">
                                <MapPin size={16} className="text-indigo-600 mr-2" />
                                <p className="text-xs text-indigo-800 font-medium">Friend of Friend Item. Pickup: {item.pickupAddress || 'Locality'}.</p>
                            </div>
                        ) : (
                            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center animate-in fade-in slide-in-from-bottom-2">
                                <MapPin size={16} className="text-emerald-600 mr-2" />
                                <p className="text-xs text-emerald-800 font-medium">You will coordinate pickup directly with {owner.name}.</p>
                            </div>
                        )
                    )}

                    {hasExistingRequest ? (
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                            <p className="text-sm font-bold text-blue-900 mb-1">
                                {existingRequest.status === 'PENDING'
                                    ? '⏳ Request Pending'
                                    : '✅ Request Accepted'}
                            </p>
                            <p className="text-xs text-blue-700">
                                {existingRequest.status === 'PENDING'
                                    ? `You already requested this item. Waiting for ${owner.name}'s response.`
                                    : `${owner.name} accepted your request! Coordinate pickup.`}
                            </p>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowRequestModal(true)}
                            className="w-full py-4 rounded-xl font-bold text-lg bg-clay-400 hover:bg-clay-500 text-white transition-all active:scale-95"
                        >
                            Ask {owner.name}
                        </button>
                    )}

                    {/* Mediation Trigger */}
                    {item.visibility === 'network' && item.maintenanceAmount > 0 && (
                        <button
                            onClick={() => setShowMediationModal(true)}
                            className="w-full text-center text-xs text-gray-400 hover:text-indigo-600 transition-colors py-1 flex items-center justify-center gap-1 group"
                        >
                            <span className="group-hover:underline">Feels a bit expensive? Ask {mutualFriend.name} for advice</span>
                            <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[8px] text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600">?</div>
                        </button>
                    )}
                </div>
            </div>

            {/* Request Modal (Friction) */}
            {showRequestModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
                        <button onClick={() => setShowRequestModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><CheckCircle size={20} className="rotate-45" /></button>

                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Ask {owner.name} for a Favor</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">This is a personal favor, not a rental. {owner.name} will see your message.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Why do you need this?</label>
                                <textarea
                                    value={requestReason}
                                    onChange={(e) => setRequestReason(e.target.value)}
                                    placeholder={`Hey ${owner.name}, I'm hosting a party and...`}
                                    className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none min-h-[80px]"
                                />
                                {requestReason.length > 0 && requestReason.length < 10 && <p className="text-[10px] text-red-500 mt-1">Please be a bit more specific.</p>}
                            </div>

                            <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={hasAgreed}
                                    onChange={(e) => setHasAgreed(e.target.checked)}
                                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                                />
                                <span className="text-xs text-gray-600 font-medium leading-tight">
                                    I understand this is a personal favor, not a service. I will return it in the same condition.
                                </span>
                            </label>

                            <button
                                disabled={!hasAgreed || requestReason.length < 10 || isSubmitting}
                                onClick={handleBorrowRequest}
                                className="w-full py-3 bg-clay-400 hover:bg-clay-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all"
                            >
                                {isSubmitting ? 'Sending Request...' : 'Send Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mediation Modal */}
            {showMediationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
                        <button onClick={() => setShowMediationModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><CheckCircle size={20} className="rotate-45" /></button>

                        {mediationStep === 'question' ? (
                            <>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-600">AS</div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Check with {mutualFriend.name}</h2>
                                        <p className="text-xs text-gray-500">{mutualFriend.name} knows both you and {owner.name}.</p>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    Not sure about the fee or terms? Ask for a "Temperature Check". <br />
                                    <strong>This is not a dispute. It's just advice.</strong>
                                </p>

                                <div className="space-y-2 mb-4">
                                    {[
                                        "Is this contribution amount normal for this item?",
                                        "I need this for a charity event, think they'd waive it?",
                                        "Is this item in good condition?",
                                        "Can you ask if they are flexible on the dates?"
                                    ].map((q) => (
                                        <button
                                            key={q}
                                            onClick={() => setSelectedQuestion(q)}
                                            className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${selectedQuestion === q ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 text-gray-700'}`}
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    disabled={!selectedQuestion}
                                    onClick={handleMediationSubmit}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    Ask {mutualFriend.name}
                                    {selectedQuestion && <span className="text-indigo-200 text-xs font-normal"> (Privately)</span>}
                                </button>
                            </>
                        ) : (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-boho-paper text-sage-600 border border-boho-divider">
                                    <CheckCircle size={32} />
                                </div>
                                <h2 className="text-xl font-bold text-boho-text mb-2">Asking {mutualFriend.name}...</h2>
                                <p className="text-boho-text-secondary text-sm">We've sent your question privately. {mutualFriend.name} will reply if they can help.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-2xl transform scale-100 animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                            <CheckCircle size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Request Sent!</h2>
                        <p className="text-gray-500 text-sm">We've notified {owner.name}. You'll hear back shortly.</p>
                    </div>
                </div>
            )}
        </PageTransition>
    );
};

export default ItemDetails;
