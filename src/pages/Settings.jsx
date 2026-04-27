import React from 'react';
import { ArrowLeft, Bell, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/layout/PageTransition';

const Settings = () => {
    const navigate = useNavigate();
    const { settings, updateSettings } = useNotifications();
    const { logout } = useAuth();

    return (
        <PageTransition className="p-4 bg-gray-50 min-h-screen">
            <div className="flex items-center mb-6">
                <button onClick={() => navigate(-1)} className="mr-3">
                    <ArrowLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>

            <div className="space-y-6">
                {/* Notifications Section */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center mb-4 text-[#6b7c73]">
                        <Bell size={20} className="mr-2" />
                        <h2 className="font-bold text-sm uppercase tracking-wide">Notifications</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">New Requests</p>
                                <p className="text-xs text-gray-500">Get alerted when neighbors need items.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings.notify_requests}
                                    onChange={(e) => updateSettings({ notify_requests: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#DDD5CB] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6b7c73]"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Marketing & Tips</p>
                                <p className="text-xs text-gray-500">Occasional updates and lending tips.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings.notify_marketing}
                                    onChange={(e) => updateSettings({ notify_marketing: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#DDD5CB] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6b7c73]"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Account Section */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center mb-4 text-gray-600">
                        <Shield size={20} className="mr-2" />
                        <h2 className="font-bold text-sm uppercase tracking-wide">Account</h2>
                    </div>
                    <button
                        onClick={async () => { await logout(); navigate('/login'); }}
                        className="w-full text-left flex items-center text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                        <LogOut size={18} className="mr-2" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </div>
        </PageTransition>
    );
};

export default Settings;
