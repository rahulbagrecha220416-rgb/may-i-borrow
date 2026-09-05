import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, X, MapPin, Phone, ArrowLeft } from 'lucide-react';
import { useItems } from '../context/ItemContext';
import { useAuth } from '../context/AuthContext';
import { uploadImage } from '../utils/uploadImage';
import PageTransition from '../components/layout/PageTransition';

const EditItem = () => {
    const { itemId } = useParams();
    const navigate = useNavigate();
    const { items, updateItem } = useItems();
    const { user } = useAuth();
    const fileInputRef = useRef(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [loading, setLoading] = useState(false);

    // Find the item to edit
    const item = items.find(i => i.id === itemId);

    const [formData, setFormData] = useState({
        name: '',
        category: 'General',
        availableUntil: '',
        description: '',
        visibility: 'group',
        groupId: '',
        pickupAddress: '',
        pickupTime: '',
        pickupContact: '',
        feeEnabled: false,
        maintenanceAmount: '',
        maintenanceReason: '',
        maintenanceReasonSelect: '',
        image: null,
        riskAcknowledged: true // Pre-checked since they already acknowledged when creating
    });

    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name || '',
                category: item.category || 'General',
                availableUntil: item.availableUntil || item.available_until || '',
                description: item.description || '',
                visibility: item.visibility || 'group',
                groupId: item.groupId || '',
                pickupAddress: item.pickupAddress || item.pickup_address || '',
                pickupTime: item.pickupTime || item.pickup_time || '',
                pickupContact: item.pickupContact || item.pickup_contact || '',
                feeEnabled: (item.maintenanceAmount || item.maintenance_amount || 0) > 0,
                maintenanceAmount: item.maintenanceAmount || item.maintenance_amount || '',
                maintenanceReason: item.maintenanceReason || item.maintenance_reason || '',
                maintenanceReasonSelect: item.maintenanceReason || item.maintenance_reason || '',
                image: item.image || item.image_url || null,
                riskAcknowledged: true
            });
            setImagePreview(item.image || item.image_url);
        }
    }, [item]);

    if (!item) {
        return (
            <div className="p-4 text-center mt-10">
                <p className="text-gray-500">Item not found or you don't have permission to edit it.</p>
                <button
                    onClick={() => navigate('/my-items')}
                    className="mt-4 text-[#6b7c73] font-semibold"
                >
                    Go Back to My Items
                </button>
            </div>
        );
    }

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }
        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    setFormData(prev => ({ ...prev, pickupAddress: data.display_name || `${latitude}, ${longitude}` }));
                } catch (error) {
                    console.error("Error getting location address:", error);
                    setFormData(prev => ({ ...prev, pickupAddress: `${latitude}, ${longitude}` }));
                } finally {
                    setLocationLoading(false);
                }
            },
            (error) => {
                console.error("Error retrieving location:", error);
                alert('Unable to retrieve your location');
                setLocationLoading(false);
            }
        );
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const removeImage = (e) => {
        e.stopPropagation();
        setImagePreview(null);
        setImageFile(null);
        setFormData(prev => ({ ...prev, image: null }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let imageUrl = formData.image;
            if (imageFile && user?.id) {
                const { url } = await uploadImage(imageFile, 'item-images', user.id);
                imageUrl = url;
            }
            await updateItem(itemId, { ...formData, image: imageUrl });
            navigate('/my-items');
        } catch (error) {
            alert(`Failed to update item: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageTransition className="p-4">
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate('/my-items')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Edit Item</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-40 bg-gray-50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300 text-gray-400 cursor-pointer hover:bg-gray-100 transition-colors relative overflow-hidden active:scale-98 transform"
                    >
                        {imagePreview ? (
                            <>
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 backdrop-blur-md"
                                >
                                    <X size={20} />
                                </button>
                            </>
                        ) : (
                            <>
                                <Camera size={32} />
                                <span className="text-sm mt-2 font-medium">Add Photo</span>
                            </>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Item Name</label>
                        <input
                            required
                            type="text"
                            className="block w-full rounded-xl border-gray-200 bg-gray-50 border p-4 focus:ring-2 focus:ring-[#6b7c73] focus:bg-white focus:outline-none transition-all"
                            placeholder="e.g. Camping Tent"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                        <select
                            className="block w-full rounded-xl border-gray-200 bg-gray-50 border p-4 focus:ring-2 focus:ring-[#6b7c73] focus:bg-white focus:outline-none transition-all"
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
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Available Until</label>
                        <input
                            required
                            type="date"
                            className="block w-full rounded-xl border-gray-200 bg-gray-50 border p-4 focus:ring-2 focus:ring-[#6b7c73] focus:bg-white focus:outline-none transition-all"
                            value={formData.availableUntil}
                            onChange={(e) => setFormData({ ...formData, availableUntil: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pickup Address</label>
                        <div className="flex gap-2">
                            <input
                                required
                                type="text"
                                className="block w-full rounded-xl border-gray-200 bg-gray-50 border p-4 focus:ring-2 focus:ring-[#6b7c73] focus:bg-white focus:outline-none transition-all"
                                placeholder="e.g. 123 Green St, Apt 4B"
                                value={formData.pickupAddress}
                                onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={handleCurrentLocation}
                                disabled={locationLoading}
                                className="bg-[#6b7c73]/10 text-[#6b7c73] p-4 rounded-xl flex items-center justify-center hover:bg-[#6b7c73]/20 transition-colors"
                            >
                                {locationLoading ? <span className="animate-spin">↻</span> : <MapPin size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pickup Contact</label>
                            <div className="relative">
                                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="tel"
                                    className="block w-full rounded-xl border-gray-200 bg-gray-50 border p-4 pl-11 focus:ring-2 focus:ring-[#6b7c73] focus:bg-white focus:outline-none transition-all"
                                    placeholder="+91..."
                                    value={formData.pickupContact}
                                    onChange={(e) => setFormData({ ...formData, pickupContact: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Best Time</label>
                            <input
                                type="text"
                                className="block w-full rounded-xl border-gray-200 bg-gray-50 border p-4 focus:ring-2 focus:ring-[#6b7c73] focus:bg-white focus:outline-none transition-all"
                                placeholder="e.g. Evenings"
                                value={formData.pickupTime}
                                onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description (Optional)</label>
                        <textarea
                            rows={3}
                            className="block w-full rounded-xl border-gray-200 bg-gray-50 border p-4 focus:ring-2 focus:ring-[#6b7c73] focus:bg-white focus:outline-none transition-all resize-none"
                            placeholder="Condition, included accessories..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>

                <div className="pt-2 space-y-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#6b7c73] disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-[#5a6b62] hover:shadow-[#6b7c73]/30 transition-all active:scale-95"
                    >
                        {loading ? 'Updating...' : 'Update Item'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/my-items')}
                        className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </PageTransition>
    );
};

export default EditItem;
