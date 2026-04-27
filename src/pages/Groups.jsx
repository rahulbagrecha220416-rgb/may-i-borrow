
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Users } from 'lucide-react';
import { useGroups } from '../context/GroupContext';
import PageTransition from '../components/layout/PageTransition';
import { getRandomVibe } from '../utils/neighborhoodVibes';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const itemAnim = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
};

const Groups = () => {
    const navigate = useNavigate();
    const { groups, error, refreshGroups, refreshing } = useGroups();
    const [vibe] = React.useState(() => getRandomVibe());

    return (
        <PageTransition className="p-4 space-y-6 bg-boho-bg min-h-screen">
            <div>
                <h1 className="text-2xl font-bold text-boho-text">My Circles</h1>
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-boho-text-secondary text-sm">Manage the groups you trust.</p>
                    {vibe && (
                        <span className="text-[10px] text-boho-warning font-medium bg-boho-paper px-2 py-0.5 rounded-full border border-boho-divider whitespace-nowrap">
                            {vibe}
                        </span>
                    )}
                </div>
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-3"
            >
                {Array.isArray(groups) && groups.map(group => (
                    <motion.div
                        key={group.id}
                        variants={itemAnim}
                        onClick={() => navigate(`/groups/${group.id}`, { state: { group } })}
                        className="bg-boho-paper p-4 rounded-xl border border-boho-divider flex items-center justify-between cursor-pointer active:scale-98 transition-transform"
                    >
                        <div className="flex items-center">
                            <img src={group.image} alt={group.name} className="w-12 h-12 rounded-full object-cover mr-4" />
                            <div>
                                <h3 className="font-semibold text-boho-text">{group.name}</h3>
                                <div className="flex items-center text-xs text-boho-text-secondary mt-1">
                                    <Users size={14} className="mr-1" />
                                    <span>{group.memberCount} Members</span>
                                </div>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-boho-divider" />
                    </motion.div>
                ))}
            </motion.div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <p className="text-red-800 text-sm font-medium mb-2">⚠️ {error}</p>
                    <button
                        onClick={refreshGroups}
                        disabled={refreshing}
                        className="text-xs bg-red-600 text-white px-3 py-1 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {refreshing ? 'Retrying...' : 'Retry'}
                    </button>
                </div>
            )}

            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/groups/create')}
                className="w-full py-4 rounded-xl border border-dashed border-boho-divider text-boho-text-secondary font-medium hover:bg-boho-paper transition-colors"
            >
                + Create New Group
            </motion.button>
        </PageTransition>
    );
};

export default Groups;
