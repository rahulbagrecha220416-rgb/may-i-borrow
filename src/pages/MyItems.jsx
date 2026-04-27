import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Package, ArrowLeft, Printer } from 'lucide-react';
import { useItems } from '../context/ItemContext';
import { printItemLabel } from '../utils/printItemLabel';
import PageTransition from '../components/layout/PageTransition';
import SkeletonCard from '../components/common/SkeletonCard';

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

const MyItems = () => {
    const navigate = useNavigate();
    const { myItems, deleteItem, loading: itemsLoading } = useItems();
    const [deleting, setDeleting] = useState(null);

    const handleDelete = async (itemId, itemName) => {
        if (!window.confirm(`Are you sure you want to remove "${itemName}" from your listings?`)) {
            return;
        }

        setDeleting(itemId);
        try {
            await deleteItem(itemId);
        } catch (error) {
            alert(`Failed to delete item: ${error.message}`);
        } finally {
            setDeleting(null);
        }
    };

    return (
        <PageTransition className="p-4 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/profile')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Items</h1>
                        <p className="text-gray-500 text-sm">{myItems.length} item{myItems.length !== 1 ? 's' : ''} listed</p>
                    </div>
                </div>
            </div>

            {itemsLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                </div>
            ) : myItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Package className="text-gray-400" size={40} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Items Listed Yet</h3>
                    <p className="text-gray-500 text-sm mb-6 max-w-xs">
                        Start lending items to your trusted circle and build your sharing economy!
                    </p>
                    <button
                        onClick={() => navigate('/add-item')}
                        className="bg-[#6b7c73] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#5a6b62] transition-colors"
                    >
                        List Your First Item
                    </button>
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-3"
                >
                    {myItems.map(item => (
                        <motion.div
                            key={item.id}
                            variants={itemAnim}
                            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
                        >
                            <div className="flex gap-4">
                                <img
                                    src={item.image || item.image_url}
                                    alt={item.name}
                                    className="w-20 h-20 rounded-lg object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {item.category} • Until {new Date(item.availableUntil || item.available_until).toLocaleDateString()}
                                    </p>
                                    {item.description && (
                                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-3">
                                        <button
                                            onClick={() => navigate(`/edit-item/${item.id}`)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                            style={{ backgroundColor: '#F7F2EB', color: '#6b7c73' }}
                                        >
                                            <Edit2 size={14} />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => printItemLabel(item)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                            style={{ backgroundColor: '#F7F2EB', color: '#6b7c73' }}
                                            title="Print label"
                                        >
                                            <Printer size={14} />
                                            Label
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id, item.name)}
                                            disabled={deleting === item.id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                                        >
                                            {deleting === item.id ? (
                                                <>
                                                    <span className="animate-spin">↻</span>
                                                    Deleting...
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 size={14} />
                                                    Delete
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            <button
                onClick={() => navigate('/add-item')}
                className="w-full py-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
                + Add Another Item
            </button>
        </PageTransition>
    );
};

export default MyItems;
