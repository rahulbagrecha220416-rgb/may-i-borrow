
import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, PlusCircle, User, Users, Bell, PackageOpen, HandHeart } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

import CommunityPledge from '../trust/CommunityPledge';

const AppLayout = () => {
    const { user } = useAuth();
    const { unreadCount } = useNotifications();
    const navigate = useNavigate();
    const location = useLocation();

    const isLoginPage = location.pathname === '/login';

    if (isLoginPage) {
        return <Outlet />;
    }

    return (
        <div className="min-h-screen flex flex-col max-w-md mx-auto overflow-hidden relative border-x border-boho-divider bg-boho-bg">
            {/* Trust & Safety Pledge */}
            <CommunityPledge />

            {/* Header */}
            <header className="p-3 flex justify-between items-center sticky top-0 z-10 bg-boho-bg border-b border-boho-divider">
                <div className="flex items-center flex-1 min-w-0 ml-1">
                    <img
                        src="/logo.png"
                        alt="May We Borrow"
                        className="h-10 w-auto object-contain"
                        style={{ mixBlendMode: 'multiply' }}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/notifications')}
                        aria-label="Notifications"
                        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border border-white"></span>
                        )}
                    </button>
                    {user && (
                        <div onClick={() => navigate('/settings')} className="cursor-pointer">
                            <img
                                src={user.user_metadata?.avatar_url || user.avatar || 'https://ui-avatars.com/api/?name=' + (user.email || 'User')}
                                alt="Profile"
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=User&background=random'; }}
                                className="w-8 h-8 rounded-full border border-gray-200"
                            />
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-4 pb-24">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="bg-white border-t border-gray-100 fixed bottom-0 w-full max-w-md pb-safe">
                <div className="flex justify-around items-center h-16">
                    <NavLink to="/"
                        className={({ isActive }) => clsx("flex flex-col items-center p-2 text-xs font-medium transition-colors",
                            isActive ? "text-[#6b7c73] font-bold" : "text-gray-400 hover:text-gray-600"
                        )}>
                        {({ isActive }) => (
                            <>
                                <Home size={24} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="mt-1">Home</span>
                            </>
                        )}
                    </NavLink>

                    <NavLink to="/borrowed"
                        className={({ isActive }) => clsx("flex flex-col items-center p-2 text-xs font-medium transition-colors",
                            isActive ? "text-[#B86445] font-bold" : "text-gray-400 hover:text-gray-600"
                        )}>
                        {({ isActive }) => (
                            <>
                                <PackageOpen size={24} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="mt-1">Borrowing</span>
                            </>
                        )}
                    </NavLink>

                    <NavLink to="/add-item"
                        aria-label="Add an item to lend"
                        className={() => clsx("flex flex-col items-center p-2 -mt-8",
                        )}>
                        {({ isActive }) => (
                            <div className={clsx("w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105",
                                isActive ? "bg-[#6b7c73] text-white" : "bg-[#566359] text-white"
                            )}>
                                <PlusCircle size={28} />
                            </div>
                        )}
                    </NavLink>

                    <NavLink to="/lent"
                        className={({ isActive }) => clsx("flex flex-col items-center p-2 text-xs font-medium transition-colors",
                            isActive ? "text-[#6b7c73] font-bold" : "text-gray-400 hover:text-gray-600"
                        )}>
                        {({ isActive }) => (
                            <>
                                <HandHeart size={24} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="mt-1">Lent</span>
                            </>
                        )}
                    </NavLink>

                    <NavLink to="/profile"
                        className={({ isActive }) => clsx("flex flex-col items-center p-2 text-xs font-medium transition-colors",
                            isActive ? "text-gray-600" : "text-gray-400 hover:text-gray-600"
                        )}>
                        {({ isActive }) => (
                            <>
                                <User size={24} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="mt-1">Profile</span>
                            </>
                        )}
                    </NavLink>
                </div>
            </nav>
        </div>
    );
};

export default AppLayout;
