import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, MapPin, Phone } from 'lucide-react';
import { useItems } from '../context/ItemContext';
import { useGroups } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { uploadImage } from '../utils/uploadImage';
import PageTransition from '../components/layout/PageTransition';

const AddItem = () => {
    const navigate = useNavigate();
    const { addItem } = useItems();
    const { groups } = useGroups();
    const { user } = useAuth();
    const fileInputRef = useRef(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);

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
        riskAcknowledged: false
    });

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
                    // Simple reverse geocoding using OpenStreetMap (Nominatim) - Free & No Key needed for basic use
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
        if (uploading) return;

        try {
            let imageUrl = null;
            if (imageFile && user?.id) {
                setUploading(true);
                const { url } = await uploadImage(imageFile, 'item-images', user.id);
                imageUrl = url;
            }
            await addItem({ ...formData, image: imageUrl });
            navigate('/');
        } catch (error) {
            console.error('Item create failed:', error);
            alert(`Failed to create item: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <PageTransition className="p-4">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">Lend an Item</h1>

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
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Visibility</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div
                                onClick={() => setFormData({ ...formData, visibility: 'group', groupId: '' })}
                                className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.visibility === 'group' ? 'border-[#6b7c73] bg-[#6b7c73]/10' : 'border-gray-100 bg-gray-50'}`}
                            >
                                <span className={`block text-sm font-bold ${formData.visibility === 'group' ? 'text-[#6b7c73]' : 'text-gray-700'}`}>All My Groups</span>
                                <span className="text-[10px] text-gray-500 leading-tight block mt-1">Visible to all groups I'm in.</span>
                            </div>
                            <div
                                onClick={() => setFormData({ ...formData, visibility: 'network', groupId: '' })}
                                className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.visibility === 'network' ? 'border-[#6b7c73] bg-[#6b7c73]/10' : 'border-gray-100 bg-gray-50'}`}
                            >
                                <span className={`block text-sm font-bold ${formData.visibility === 'network' ? 'text-[#6b7c73]' : 'text-gray-700'}`}>Friends of Friends</span>
                                <span className="text-[10px] text-gray-500 leading-tight block mt-1">+ Extended trusted network.</span>
                            </div>
                            <div
                                onClick={() => setFormData({ ...formData, visibility: 'specific', groupIds: [] })}
                                className={`p-3 rounded-xl border-2 cursor-pointer transition-all col-span-2 ${formData.visibility === 'specific' ? 'border-[#6b7c73] bg-[#6b7c73]/10' : 'border-gray-100 bg-gray-50'}`}
                            >
                                <span className={`block text-sm font-bold ${formData.visibility === 'specific' ? 'text-[#6b7c73]' : 'text-gray-700'}`}>Specific Groups Only</span>
                                <span className="text-[10px] text-gray-500 leading-tight block mt-1">Select which circles can see this.</span>
                            </div>
                        </div>

                        {formData.visibility === 'specific' && (
                            <div className="mt-3 animate-in fade-in slide-in-from-top-2 space-y-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Select Groups</label>
                                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                                    {groups.map(g => {
                                        const isSelected = formData.groupIds.includes(g.id);
                                        return (
                                            <div
                                                key={g.id}
                                                onClick={() => {
                                                    const newIds = isSelected
                                                        ? formData.groupIds.filter(id => id !== g.id)
                                                        : [...formData.groupIds, g.id];
                                                    setFormData({ ...formData, groupIds: newIds });
                                                }}
                                                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isSelected ? 'border-[#6b7c73] bg-[#6b7c73]/10' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                                            >
                                                <span className={`text-sm font-medium ${isSelected ? 'text-[#2d3a33]' : 'text-gray-700'}`}>{g.name}</span>
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-[#6b7c73] border-[#6b7c73]' : 'border-gray-300'}`}>
                                                    {isSelected && <span className="text-white text-xs">✓</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {formData.groupIds.length === 0 && (
                                    <p className="text-xs text-red-500">Please select at least one group.</p>
                                )}
                            </div>
                        )}
                        {formData.visibility === 'network' && (
                            <div className="mt-3 bg-gray-50 border border-gray-100 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
                                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.feeEnabled}
                                        onChange={(e) => setFormData(prev => ({ ...prev, feeEnabled: e.target.checked, maintenanceAmount: '', maintenanceReason: '' }))}
                                        className="w-4 h-4 text-[#6b7c73] rounded focus:ring-[#6b7c73] border-gray-300"
                                    />
                                    <span className="text-sm font-bold text-gray-700">Request Maintenance Contribution?</span>
                                </label>

                                {formData.feeEnabled && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-1 pl-6 border-l-2 border-gray-200 ml-2">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Amount (₹)</label>
                                            <div className="flex items-center">
                                                <span className="text-gray-400 font-bold mr-2">₹</span>
                                                <input
                                                    type="number"
                                                    max="500"
                                                    required={formData.feeEnabled}
                                                    className="block w-full rounded-lg border-gray-200 bg-white border p-2 text-sm focus:ring-2 focus:ring-[#6b7c73] focus:outline-none"
                                                    placeholder="Max 500"
                                                    value={formData.maintenanceAmount}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || '';
                                                        if (val > 500) return; // Hard Cap
                                                        setFormData({ ...formData, maintenanceAmount: val });
                                                    }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">Capped at ₹500 to prevent commercial rentals.</p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Reason (Required)</label>
                                            <select
                                                required={formData.feeEnabled}
                                                className="block w-full rounded-lg border-gray-200 bg-white border p-2 text-sm focus:ring-2 focus:ring-[#6b7c73] focus:outline-none mb-2"
                                                value={formData.maintenanceReasonSelect}
                                                onChange={(e) => setFormData({ ...formData, maintenanceReasonSelect: e.target.value, maintenanceReason: e.target.value === 'Other' ? '' : e.target.value })}
                                            >
                                                <option value="">Select a reason...</option>
                                                <option value="Cleaning / Washing">Cleaning / Washing</option>
                                                <option value="Battery / Fuel Refill">Battery / Fuel Refill</option>
                                                <option value="Wear & Tear">High Wear & Tear</option>
                                                <option value="Repair Fund">Repair Fund</option>
                                                <option value="Other">Other (Specify)</option>
                                            </select>

                                            {formData.maintenanceReasonSelect === 'Other' && (
                                                <input
                                                    type="text"
                                                    required
                                                    maxLength="30"
                                                    placeholder="e.g. Expensive bulb replacement"
                                                    className="block w-full rounded-lg border-gray-200 bg-white border p-2 text-sm focus:ring-2 focus:ring-[#6b7c73] focus:outline-none"
                                                    value={formData.maintenanceReason}
                                                    onChange={(e) => setFormData({ ...formData, maintenanceReason: e.target.value })}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
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

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Logistics</label>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Pickup Address</label>
                            <div className="flex gap-2">
                                <input
                                    required
                                    type="text"
                                    className="block w-full rounded-lg border-gray-200 bg-white border p-3 focus:ring-2 focus:ring-[#6b7c73] focus:outline-none"
                                    placeholder="e.g. Flat 402, Sunshine Apts"
                                    value={formData.pickupAddress}
                                    onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={handleCurrentLocation}
                                    disabled={locationLoading}
                                    className="bg-[#6b7c73]/10 text-[#6b7c73] p-3 rounded-lg hover:bg-[#6b7c73]/20 active:scale-95 transition-all"
                                    title="Use Current Location"
                                >
                                    {locationLoading ? <span className="animate-spin block">↻</span> : <MapPin size={20} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Best Pickup Time</label>
                            <input
                                required
                                type="text"
                                className="block w-full rounded-lg border-gray-200 bg-white border p-3 focus:ring-2 focus:ring-[#6b7c73] focus:outline-none"
                                placeholder="e.g. Weekends after 11 AM"
                                value={formData.pickupTime}
                                onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Pickup Contact Number</label>
                            <div className="relative">
                                <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    required
                                    type="tel"
                                    className="block w-full rounded-lg border-gray-200 bg-white border p-3 pl-10 focus:ring-2 focus:ring-[#6b7c73] focus:outline-none"
                                    placeholder="+91 98765 43210"
                                    value={formData.pickupContact}
                                    onChange={(e) => setFormData({ ...formData, pickupContact: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-2 space-y-4">
                    <label className="flex items-start gap-3 p-4 bg-[#6b7c73]/10 rounded-xl cursor-pointer hover:bg-[#6b7c73]/20 transition-colors border border-[#6b7c73]/20">
                        <input
                            required
                            type="checkbox"
                            checked={formData.riskAcknowledged}
                            onChange={(e) => setFormData(prev => ({ ...prev, riskAcknowledged: e.target.checked }))}
                            className="mt-1 w-4 h-4 text-[#6b7c73] rounded focus:ring-[#6b7c73] border-gray-300"
                        />
                        <span className="text-sm text-gray-700 font-medium leading-tight">
                            I understand that lending implies some risk. I am comfortable performing this favor for my network.
                        </span>
                    </label>

                    <button
                        type="submit"
                        disabled={!formData?.riskAcknowledged || uploading}
                        className="w-full bg-[#6b7c73] disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-[#5a6b62] hover:shadow-[#6b7c73]/30 transition-all active:scale-95"
                    >
                        {uploading ? 'Uploading photo…' : 'List for Borrowing'}
                    </button>
                </div>
            </form>
        </PageTransition>
    );
};

export default AddItem;
