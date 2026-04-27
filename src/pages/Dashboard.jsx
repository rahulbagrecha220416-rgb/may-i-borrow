import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGroups } from '../context/GroupContext';
import { useItems } from '../context/ItemContext';
import { useAuth } from '../context/AuthContext';
import { Users, BookOpen, Home as HomeIcon, PlusCircle, ArrowRight, PackageOpen, HandHeart } from 'lucide-react';
import PageTransition from '../components/layout/PageTransition';
import { supabase } from '../supabaseClient';
import SkeletonCard from '../components/common/SkeletonCard';
import { getRandomQuote } from '../utils/sharingQuotes';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemAnim = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 }
};

const Dashboard = () => {
  const { availableItems, loadMore, hasMore, loading: itemsLoading } = useItems();
  const { user } = useAuth();
  const { groups, loading: groupsLoading } = useGroups(); // Get real groups
  const navigate = useNavigate();

  const [borrowedCount, setBorrowedCount] = React.useState(0);
  const [lentCount, setLentCount] = React.useState(0);
  const [quote] = React.useState(() => getRandomQuote());

  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const { count: borrowed } = await supabase
          .from('items')
          .select('*', { count: 'exact', head: true })
          .eq('borrowed_by', user.id)
          .eq('status', 'BORROWED');

        const { count: lent } = await supabase
          .from('items')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id)
          .eq('status', 'BORROWED');

        if (cancelled) return;
        setBorrowedCount(borrowed || 0);
        setLentCount(lent || 0);
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  // Feature Flag: Use real groups. If empty, show onboarding.
  // Note: For existing mock users, MOCK_GROUPS might need to be synced or we assume "groups" from context captures initial state.
  // Ideally, useGroups should return MOCK_GROUPS for guest.

  const hasGroups = groups && groups.length > 0;

  // Onboarding Screen: Only show if NOT loading and user actually has no groups
  if (!hasGroups && !groupsLoading) {
    return (
      <PageTransition className="min-h-screen flex flex-col justify-center pb-24">
        <div className="text-center px-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to the inner circle.</h1>
          <p className="text-gray-500">To see items, you need to join a tribe. Lending happens in groups, not random feeds.</p>
        </div>

        <div className="space-y-4 px-4">
          <div onClick={() => navigate('/groups/create')} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all active:scale-95 group">
            <div className="bg-orange-100 p-3 rounded-full text-orange-600">
              <Users size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">Sports / Hobby Group</h3>
              <p className="text-xs text-gray-500">Football team, Cycling club...</p>
            </div>
            <ArrowRight size={20} className="text-gray-300 group-hover:text-orange-500 transition-colors" />
          </div>

          <div onClick={() => navigate('/groups/create')} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all active:scale-95 group">
            <div className="bg-purple-100 p-3 rounded-full text-purple-600">
              <BookOpen size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">Book / Interest Club</h3>
              <p className="text-xs text-gray-500">Reading circle, Board games...</p>
            </div>
            <ArrowRight size={20} className="text-gray-300 group-hover:text-purple-500 transition-colors" />
          </div>

          <div onClick={() => navigate('/groups/create')} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all active:scale-95 group">
            <div className="bg-[#E5DFD6] p-3 rounded-full text-[#6b7c73]">
              <HomeIcon size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">Apartment / Neighbors</h3>
              <p className="text-xs text-gray-500">Tower A, 4th Floor...</p>
            </div>
            <ArrowRight size={20} className="text-gray-300 group-hover:text-[#6b7c73] transition-colors" />
          </div>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gray-50 px-2 text-xs text-gray-500">OR</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/groups/create')}
            className="w-full py-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            <PlusCircle size={20} />
            Create Custom Group
          </button>
        </div>
      </PageTransition>
    );
  }

  // Use availableItems from context (already filtered to exclude user's own items)

  // Separate items
  const groupItems = availableItems.filter(i => i.visibility !== 'network');
  const networkItems = availableItems.filter(i => i.visibility === 'network');

  // Interleave: 70% Group, 30% Network (Approx 2:1 ratio)
  // We'll create a new array by picking 2 group, 1 network, repeat.
  const feedItems = [];
  let gIndex = 0;
  let nIndex = 0;

  while (gIndex < groupItems.length || nIndex < networkItems.length) {
    if (gIndex < groupItems.length) feedItems.push(groupItems[gIndex++]);
    if (gIndex < groupItems.length) feedItems.push(groupItems[gIndex++]); // 2nd group item
    if (nIndex < networkItems.length) feedItems.push(networkItems[nIndex++]); // 1st network item
  }

  const isPremium = user?.isPremium;

  return (
    <PageTransition className="space-y-4 pb-4 bg-boho-bg">
      {/* Welcome Header with daily sharing quote */}
      <div className="px-4 pt-2">
        <p className="text-sm text-boho-text-secondary">
          {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}
        </p>
        {quote && (
          <p className="text-xs text-boho-text-secondary/80 leading-relaxed mt-1 pr-2">
            {quote}
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/groups')}
            style={{ backgroundColor: '#CFC6B8', color: '#433D36' }}
            className="p-4 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 flex flex-col items-start"
          >
            <Users size={24} className="mb-2" />
            <span className="font-bold text-sm">Your Groups</span>
            <span className="text-xs opacity-80">{groups?.length || 0} groups</span>
          </button>

          <button
            onClick={() => navigate('/add-request')}
            style={{ backgroundColor: '#B86445', color: '#FFFFFF' }}
            className="p-4 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 flex flex-col items-start"
          >
            <PlusCircle size={24} className="mb-2" />
            <span className="font-bold text-sm">Need Something?</span>
            <span className="text-xs opacity-90">Ask your group</span>
          </button>
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="bg-blue-50 text-blue-600 p-2 rounded-full mb-2">
              <PackageOpen size={20} />
            </div>
            <span className="font-bold text-2xl text-gray-900">{borrowedCount}</span>
            <span className="text-xs text-gray-500 font-medium">Borrowed</span>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="bg-green-50 text-green-600 p-2 rounded-full mb-2">
              <HandHeart size={20} />
            </div>
            <span className="font-bold text-2xl text-gray-900">{lentCount}</span>
            <span className="text-xs text-gray-500 font-medium">Lent Out</span>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <section className="px-4 pb-8">
        {/* Removed section header - obvious from context */}

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-4"
        >
          {itemsLoading ? (
            // Shimmer feed
            [1, 2, 3, 4].map(i => <SkeletonCard key={i} />)
          ) : feedItems.length === 0 ? (
            <div className="col-span-2 text-center py-10 rounded-2xl" style={{ backgroundColor: '#F7F2EB' }}>
              <p className="text-sm" style={{ color: '#726A60' }}>No items in your network yet.</p>
              <button onClick={() => navigate('/add-item')} className="mt-2 font-bold text-sm" style={{ color: '#6b7c73' }}>Add the first item</button>
            </div>
          ) : (
            feedItems.map(item => {
              const isLocked = item.visibility === 'network' && !isPremium;

              return (
                <motion.div
                  key={item.id}
                  variants={itemAnim}
                  onClick={() => isLocked ? navigate('/upgrade') : navigate(`/items/${item.id}`)}
                  className={`rounded-xl p-2.5 hover:bg-boho-card/50 dark:hover:bg-boho-dark-card/30 transition-colors cursor-pointer ${isLocked ? 'opacity-60' : ''} relative`}
                >
                  {/* People-first hierarchy: Person → Item → Status */}
                  <div className="flex items-start gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: '#C8B6A6', color: '#433D36' }}>
                      {(item.owner?.name || item.ownerName || 'U')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: '#433D36' }}>
                        {item.owner?.name || item.ownerName || 'User'}
                      </p>
                      <p className="text-xs truncate mt-0.5" style={{ color: '#726A60' }}>
                        {item.name}
                      </p>
                      {!isLocked && (
                        <p className="text-[10px] mt-1" style={{ color: '#726A60', opacity: 0.7 }}>
                          Usually free
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="aspect-square rounded-lg overflow-hidden relative" style={{ backgroundColor: '#F7F2EB' }}>
                    <img
                      src={getOptimizedUrl(item.image, 300)}
                      className="w-full h-full object-cover"
                      alt={item.name}
                      onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x400/e2e8f0/64748b?text=${encodeURIComponent(item.name)}`; }}
                    />
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <span className="bg-white/90 text-gray-900 text-[10px] px-2 py-1 rounded">Premium</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </motion.div>

        {/* Load More Button */}
        {hasMore && feedItems.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={loadMore}
              disabled={itemsLoading}
              className="px-6 py-2 rounded-full border border-[#726A60] text-[#726A60] text-sm font-medium disabled:opacity-50 hover:bg-[#E5DFD6] transition-colors"
            >
              {itemsLoading ? 'Loading...' : 'Load More Items'}
            </button>
          </div>
        )}
      </section>
    </PageTransition>
  );
};

// Utility for Supabase Image Optimization
const getOptimizedUrl = (url, width = 400) => {
  if (!url) return 'https://placehold.co/400x400/e2e8f0/64748b?text=Item';
  if (url.includes('supabase.co')) {
    // Supabase Storage Transform
    return `${url}?width=${width}&resize=cover&quality=75`;
  }
  return url;
};

export default Dashboard;
