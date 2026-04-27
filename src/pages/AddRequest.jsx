import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Users, Globe, Lock } from 'lucide-react';
import { useRequests } from '../context/RequestContext';
import { useGroups } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/layout/PageTransition';

const AddRequest = () => {
    const navigate = useNavigate();
    const { addRequest } = useRequests();
    const { groups } = useGroups();
    const { user } = useAuth();
    const isPremium = user?.isPremium;

    const [formData, setFormData] = useState({
        title: '',
        category: 'General',
        description: '',
        visibility: 'group',
        groupIds: []
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await addRequest(formData);
        navigate('/'); // Go back to dashboard or requests feed
    };

    return (
        <PageTransition className="p-4">
            <h1 className="text-2xl font-bold mb-2 text-gray-900">Ask to Borrow</h1>
            <p className="text-gray-500 text-sm mb-6">Ask your trusted network for help.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">What do you need?</label>
                    <input
                        required
                        type="text"
                        className="block w-full rounded-xl border-gray-200 bg-gray-50 border p-4 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
                        placeholder="e.g. Power Drill, Ladder, HDMI Cable"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                    <select
                        className="block w-full rounded-xl border-gray-200 bg-gray-50 border p-4 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                        <option>General</option>
                        <option>Electronics</option>
                        <option>Tools</option>
                        <option>Kitchen</option>
                        <option>Sports</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">The "Why" (Required)</label>
                    <textarea
                        required
                        rows={3}
                        className="block w-full rounded-xl border-gray-200 bg-gray-50 border p-4 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all resize-none"
                        placeholder="Explain why you need this. Neighbors are more likely to help if they know the story!"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                {/* ... visibility section ... */}

                <div className="pt-4">
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 hover:shadow-blue-500/30 transition-all active:scale-95"
                    >
                        Ask Network
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="w-full mt-3 py-3 text-gray-500 font-medium hover:text-gray-700"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </PageTransition>
    );
};

export default AddRequest;
