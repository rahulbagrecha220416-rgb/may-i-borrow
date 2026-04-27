
import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useItems } from '../context/ItemContext';
import { useNavigate } from 'react-router-dom';
import { Package, ChevronRight, Settings, LogOut, ArrowLeftRight, HandHeart, Camera, Shield, MessageCircle } from 'lucide-react';
import PageTransition from '../components/layout/PageTransition';
import ThemeSettings from '../components/ThemeSettings';
import { supabase } from '../supabaseClient';
import { uploadImage } from '../utils/uploadImage';

const Profile = () => {
    const { user, logout, refreshProfile } = useAuth();
    const { myItems } = useItems();
    const navigate = useNavigate();
    const avatarInputRef = useRef(null);
    const [avatarUploading, setAvatarUploading] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !user?.id) return;
        setAvatarUploading(true);
        try {
            const { url } = await uploadImage(file, 'avatars', user.id);
            const { error } = await supabase
                .from('profiles')
                .update({ avatar_url: url })
                .eq('id', user.id);
            if (error) throw error;
            await refreshProfile();
        } catch (err) {
            console.error('Avatar update failed:', err);
            alert(`Couldn't update photo: ${err.message}`);
        } finally {
            setAvatarUploading(false);
            if (avatarInputRef.current) avatarInputRef.current.value = '';
        }
    };

    return (
        <PageTransition className="p-4 space-y-6">
            {/* Profile Header */}
            <div className="rounded-2xl p-6 border" style={{ backgroundColor: '#D8D0C6', borderColor: '#DDD5CB' }}>
                <div className="flex items-center gap-4 mb-4">
                    <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={avatarUploading}
                        className="relative w-20 h-20 rounded-full border-2 border-[#DDD5CB] overflow-hidden group"
                        aria-label="Change profile photo"
                    >
                        <img
                            src={user?.avatar_url || user?.user_metadata?.avatar_url || user?.avatar || `https://ui-avatars.com/api/?name=${user?.email || 'User'}&background=random`}
                            className="w-full h-full object-cover"
                            alt="Profile"
                        />
                        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera size={20} className="text-white" />
                        </span>
                        {avatarUploading && (
                            <span className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs">
                                Uploading…
                            </span>
                        )}
                    </button>
                    <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                    />
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{user?.user_metadata?.full_name || user?.name || 'User'}</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">{user?.email}</p>
                        {user?.isPremium && (
                            <span className="inline-block mt-2 px-2 py-1 text-white text-xs font-bold rounded-full" style={{ backgroundColor: '#6b7c73' }}>
                                Premium
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* My Activity Section */}
            <div className="space-y-3">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">My Activity</h2>

                <div
                    onClick={() => navigate('/my-items')}
                    className="rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all"
                    style={{ backgroundColor: '#F7F2EB' }}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E5DFD6', color: '#726A60' }}>
                            <Package size={24} style={{ color: '#726A60' }} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">My Items</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {myItems.length} item{myItems.length !== 1 ? 's' : ''} listed
                            </p>
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 dark:text-gray-600" />
                </div>

                {/* Borrowed Items */}
                <div
                    onClick={() => navigate('/borrowed')}
                    className="rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all"
                    style={{ backgroundColor: '#F7F2EB' }}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E5DFD6', color: '#726A60' }}>
                            <ArrowLeftRight size={24} style={{ color: '#726A60' }} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Items I'm Borrowing</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">View items you borrowed</p>
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 dark:text-gray-600" />
                </div>

                {/* Lent Items */}
                <div
                    onClick={() => navigate('/lent')}
                    className="rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all"
                    style={{ backgroundColor: '#F7F2EB' }}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E5DFD6', color: '#726A60' }}>
                            <HandHeart size={24} style={{ color: '#726A60' }} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Items I've Lent Out</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Track your lent items</p>
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 dark:text-gray-600" />
                </div>

                {/* Mediations */}
                <div
                    onClick={() => navigate('/mediations')}
                    className="rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all"
                    style={{ backgroundColor: '#F7F2EB' }}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E5DFD6' }}>
                            <Shield size={24} style={{ color: '#726A60' }} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Mediations</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Temperature-check disputes</p>
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 dark:text-gray-600" />
                </div>

                {/* Inquiries */}
                <div
                    onClick={() => navigate('/inquiries')}
                    className="rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all"
                    style={{ backgroundColor: '#F7F2EB' }}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E5DFD6' }}>
                            <MessageCircle size={24} style={{ color: '#726A60' }} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Inquiries</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Ask friends for context</p>
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 dark:text-gray-600" />
                </div>
            </div>

            {/* Theme Settings */}
            <ThemeSettings />

            {/* Settings Section */}
            <div className="space-y-3">
                <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">App Settings</h2>

                {/* Premium Upgrade - Subtle */}
                {!user?.isPremium && (
                    <div
                        onClick={() => navigate('/upgrade')}
                        className="rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all"
                        style={{ backgroundColor: '#F7F2EB' }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E5DFD6' }}>
                                <span className="text-xl">→</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Upgrade to Premium</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Access network items</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-gray-300 dark:text-gray-600" />
                    </div>
                )}

                <div
                    onClick={() => navigate('/settings')}
                    className="rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all"
                    style={{ backgroundColor: '#F7F2EB' }}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E5DFD6', color: '#726A60' }}>
                            <Settings size={24} style={{ color: '#726A60' }} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Settings</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Preferences & privacy</p>
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 dark:text-gray-600" />
                </div>
            </div>

            {/* Logout Button */}
            <button
                onClick={handleLogout}
                className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
                <LogOut size={20} />
                Log Out
            </button>
        </PageTransition>
    );
};

export default Profile;
