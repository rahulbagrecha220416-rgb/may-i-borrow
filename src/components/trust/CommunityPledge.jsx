import React, { useState, useEffect } from 'react';
import { Shield, Heart, Users, CheckCircle, AlertOctagon, Hand, ShoppingBag, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CommunityPledge = ({ onAgree }) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Check if user has already pledged
        const hasPledged = localStorage.getItem('may-i-borrow-pledge');
        if (!hasPledged) {
            // Small delay for better UX on load
            setTimeout(() => setIsOpen(true), 1000);
        }
    }, []);

    const handleAgree = () => {
        localStorage.setItem('may-i-borrow-pledge', 'true');
        setIsOpen(false);
        if (onAgree) onAgree();
    };

    const principles = [
        {
            icon: <AlertOctagon size={20} />,
            color: "text-amber-600",
            bg: "bg-amber-50",
            title: "Adults Only (18+)",
            desc: "This is a community for adults who can take responsibility for shared items and offline interactions."
        },
        {
            icon: <Heart size={20} />,
            color: "text-red-500",
            bg: "bg-red-50",
            title: "Favors First, Money Second",
            desc: "Sharing here is based on goodwill. Any money is for maintenance, not profit."
        },
        {
            icon: <Users size={20} />,
            color: "text-blue-500",
            bg: "bg-blue-50",
            title: "Mutual Friends are the Backbone",
            desc: "They create accountability. If something feels off, pause and talk."
        },
        {
            icon: <Clock size={20} />,
            color: "text-purple-500",
            bg: "bg-purple-50",
            title: "Offline Responsibility Matters",
            desc: "Be punctual. Return items better than you found them. Communicate clearly."
        },
        {
            icon: <Hand size={20} />,
            color: "text-[#6b7c73]",
            bg: "bg-[#6b7c73]/10",
            title: "Say No Without Guilt",
            desc: "You can decline any request without explanation or penalty. Boundaries build trust."
        },
        {
            icon: <ShoppingBag size={20} />,
            color: "text-slate-500",
            bg: "bg-slate-50",
            title: "This Is Not a Marketplace",
            desc: "No algorithms, no bidding. If it feels transactional, something is wrong."
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        <div className="bg-[#6b7c73] p-6 text-white text-center relative shrink-0">
                            <Shield size={40} className="mx-auto mb-2 relative z-10 opacity-90" />
                            <h2 className="text-xl font-bold relative z-10">Community Principles</h2>
                            <p className="text-white/80 text-xs font-medium relative z-10 mt-1">Non-negotiable rules of engagement.</p>
                        </div>

                        <div className="p-4 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                            {principles.map((item, idx) => (
                                <div key={idx} className="flex gap-4 items-start group">
                                    <div className={`${item.bg} ${item.color} p-2 rounded-full h-fit shrink-0 mt-0.5 group-hover:scale-110 transition-transform`}>
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm leading-tight">{item.title}</h3>
                                        <p className="text-xs text-gray-500 leading-relaxed mt-1">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
                            <p className="text-[10px] text-center text-gray-400 mb-3 px-4">
                                By continuing, you confirm you are 18+ and agree to hold yourself accountable to these standards.
                            </p>
                            <button
                                onClick={handleAgree}
                                className="w-full bg-[#433D36] text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-[#2d2925] transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={18} />
                                I Confirm & Agree
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CommunityPledge;
