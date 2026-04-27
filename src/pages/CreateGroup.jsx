
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Link as LinkIcon, Check, Copy, RefreshCw, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useGroups } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { uploadImage } from '../utils/uploadImage';
import PageTransition from '../components/layout/PageTransition';
import { getGovernanceQuote } from '../data/governanceQuotes';

const CreateGroup = () => {
    const navigate = useNavigate();
    const { refreshGroups } = useGroups();
    const { user, session } = useAuth();
    const [errorMsg, setErrorMsg] = useState(null);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [creating, setCreating] = useState(false);
    const [governanceType, setGovernanceType] = useState('monarchy');

    const fileInputRef = useRef(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Rotating quotes for each card
    const [monarchyQuote, setMonarchyQuote] = useState(() => getGovernanceQuote('monarchy'));
    const [republicQuote, setRepublicQuote] = useState(() => getGovernanceQuote('republic'));

    // Success State
    const [showSuccess, setShowSuccess] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [copied, setCopied] = useState(false);

    const rotateMonarchyQuote = (e) => {
        e.stopPropagation();
        setMonarchyQuote(getGovernanceQuote('monarchy'));
    };

    const rotateRepublicQuote = (e) => {
        e.stopPropagation();
        setRepublicQuote(getGovernanceQuote('republic'));
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        setErrorMsg(null);

        const log = (msg) => console.log(`[CreateGroup] ${msg}`);

        try {
            if (!session?.access_token) {
                throw new Error("No Access Token found. Please re-login.");
            }

            log("Starting Raw Fetch Creation...");

            const headers = {
                'Content-Type': 'application/json',
                'apikey': supabase.supabaseKey,
                'Authorization': `Bearer ${session.access_token}`,
                'Prefer': 'return=representation'
            };

            let imageUrl = 'https://placehold.co/600x400/CFC6B8/433D36?text=Circle';
            if (imageFile && user?.id) {
                const { url } = await uploadImage(imageFile, 'group-images', user.id);
                imageUrl = url;
            }
            let newGroup = null;

            // STEP 1: Try RPC via Raw Fetch
            try {
                const rpcBody = {
                    p_name: name,
                    p_description: description,
                    p_image_url: imageUrl
                };

                const rpcResponse = await fetch(`${supabase.supabaseUrl}/rest/v1/rpc/create_group_and_ensure_profile`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(rpcBody)
                });

                if (rpcResponse.ok) {
                    const rawJson = await rpcResponse.json();
                    log(`RPC Raw Response: ${JSON.stringify(rawJson)}`);

                    if (rawJson && typeof rawJson === 'object') {
                        if (Array.isArray(rawJson)) newGroup = rawJson[0];
                        else if (rawJson.id) newGroup = rawJson;
                        else if (rawJson.result) newGroup = rawJson.result;
                        else if (typeof rawJson === 'string') newGroup = { id: rawJson };
                    } else if (typeof rawJson === 'string') {
                        newGroup = { id: rawJson };
                    }

                    if (!newGroup || !newGroup.id) throw new Error(`RPC OK but ID missing.`);
                    log(`RPC Success! ID: ${newGroup.id}`);
                } else {
                    throw new Error(`RPC Failed: ${rpcResponse.status}`);
                }
            } catch (rpcErr) {
                console.warn("RPC failed, trying REST fallback:", rpcErr);

                await fetch(`${supabase.supabaseUrl}/rest/v1/profiles`, {
                    method: 'POST',
                    headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
                    body: JSON.stringify({
                        id: user.id,
                        email: user.email,
                        full_name: user.user_metadata?.full_name || 'User',
                        avatar_url: user.user_metadata?.avatar_url
                    })
                });

                const groupResponse = await fetch(`${supabase.supabaseUrl}/rest/v1/groups`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        name,
                        description,
                        image_url: imageUrl,
                        created_by: user.id,
                        governance_type: governanceType
                    })
                });

                const groupResult = await groupResponse.json();
                if (!groupResponse.ok) throw new Error(`Group Insert Failed: ${JSON.stringify(groupResult)}`);
                newGroup = Array.isArray(groupResult) ? groupResult[0] : groupResult;
                if (!newGroup || !newGroup.id) throw new Error(`REST Insert succeeded but ID missing.`);

                // Insert creator as ADMIN
                await fetch(`${supabase.supabaseUrl}/rest/v1/group_members`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ group_id: newGroup.id, user_id: user.id, role: 'admin' })
                });

                log(`REST Fallback Success! ID: ${newGroup.id}`);
            }

            // Update governance_type if group was created via RPC (which may not have it)
            if (newGroup?.id) {
                await supabase
                    .from('groups')
                    .update({ governance_type: governanceType })
                    .eq('id', newGroup.id);

                // Ensure creator is marked as admin
                await supabase
                    .from('group_members')
                    .update({ role: 'admin' })
                    .eq('group_id', newGroup.id)
                    .eq('user_id', user.id);
            }

            let origin = window.location.origin;
            if (Capacitor.isNativePlatform() || origin.includes('localhost')) {
                origin = import.meta.env.VITE_APP_URL || 'https://may-i-borrow.vercel.app';
            }

            const webLink = `${origin}/join/${newGroup.id}?ref=${Math.random().toString(36).substring(7)}`;
            setInviteLink(webLink);

            if (typeof refreshGroups === 'function') refreshGroups();
            setCreating(false);
            setShowSuccess(true);

        } catch (error) {
            console.error(error);
            // Emergency Recovery
            try {
                if (session?.access_token) {
                    const headers = {
                        'apikey': supabase.supabaseKey,
                        'Authorization': `Bearer ${session.access_token}`
                    };
                    const recoveryResp = await fetch(`${supabase.supabaseUrl}/rest/v1/groups?created_by=eq.${user.id}&order=created_at.desc&limit=1`, { headers });
                    const recoveryData = await recoveryResp.json();
                    if (recoveryData?.length > 0) {
                        const origin = import.meta.env.VITE_APP_URL || 'https://may-i-borrow.vercel.app';
                        setInviteLink(`${origin}/join/${recoveryData[0].id}`);
                        if (typeof refreshGroups === 'function') refreshGroups();
                        setShowSuccess(true);
                        setCreating(false);
                        return;
                    }
                }
            } catch (recErr) {
                console.warn("Recovery failed", recErr);
            }

            setErrorMsg(`Failed: ${error.message}`);
            setCreating(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (showSuccess) {
        return (
            <PageTransition className="p-4 bg-white min-h-screen flex flex-col items-center justify-center text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-sm"
                >
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl bg-boho-paper border border-boho-divider">
                        {governanceType === 'monarchy' ? '🏰' : '🗳️'}
                    </div>

                    <h2 className="text-2xl font-bold text-boho-text mb-1">Circle Created</h2>
                    <p className="text-sm font-medium text-boho-text-secondary mb-1">
                        {governanceType === 'monarchy' ? '🏰 Monarchy' : '🗳️ Republic'}
                    </p>
                    <p className="text-gray-500 mb-8">Share this magic link with friends to add them instantly.</p>

                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 flex items-center justify-between">
                        <code className="text-sm text-gray-600 truncate flex-1 text-left mr-3">
                            {inviteLink}
                        </code>
                        <button
                            onClick={copyToClipboard}
                            className={`p-2 rounded-lg transition-colors ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900'}`}
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                    </div>

                    <button
                        onClick={() => navigate('/groups')}
                        className="w-full text-white font-bold py-4 rounded-xl hover:opacity-90 transition-all shadow-lg mb-3"
                        style={{ backgroundColor: '#6b7c73' }}
                    >
                        Done
                    </button>
                </motion.div>
            </PageTransition>
        );
    }

    return (
        <PageTransition className="p-4">
            <header className="flex items-center mb-8">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-gray-900 ml-2">Create New Circle</h1>
            </header>

            <form onSubmit={handleCreate} className="space-y-6">
                {/* Image Picker */}
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="relative w-24 h-24 bg-gray-100 rounded-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 text-gray-400 hover:bg-gray-50 transition-colors overflow-hidden"
                    >
                        {imagePreview ? (
                            <>
                                <img src={imagePreview} alt="Group preview" className="absolute inset-0 w-full h-full object-cover" />
                                <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setImageFile(null);
                                        setImagePreview(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                                >
                                    <X size={12} />
                                </span>
                            </>
                        ) : (
                            <>
                                <Camera size={24} className="mb-1" />
                                <span className="text-[10px]">Add Photo</span>
                            </>
                        )}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setImageFile(file);
                            const reader = new FileReader();
                            reader.onloadend = () => setImagePreview(reader.result);
                            reader.readAsDataURL(file);
                        }}
                    />
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Circle Name</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Hiking Buddies, Indiranagar Readers"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#6b7c73] focus:border-[#6b7c73] outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                        <textarea
                            rows="3"
                            placeholder="What's this circle about?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#6b7c73] focus:border-[#6b7c73] outline-none transition-all resize-none"
                        />
                    </div>
                </div>

                {/* Governance Type Picker */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Choose Your Circle's Style</label>
                    <div className="grid grid-cols-2 gap-3">

                        {/* Monarchy Card */}
                        <motion.div
                            onClick={() => setGovernanceType('monarchy')}
                            whileTap={{ scale: 0.97 }}
                            className={`relative rounded-xl p-4 cursor-pointer border transition-all ${governanceType === 'monarchy'
                                    ? 'border-sage-500 bg-boho-paper'
                                    : 'border-boho-divider bg-boho-paper/60'
                                }`}
                        >
                            {governanceType === 'monarchy' && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-sage-500 rounded-full flex items-center justify-center">
                                    <Check size={12} className="text-white" />
                                </div>
                            )}
                            <div className="text-3xl mb-2">🏰</div>
                            <h3 className="font-bold text-sm text-boho-text mb-1">Monarchy</h3>
                            <p className="text-xs text-boho-text-secondary mb-3">Admin-run. One leader, all the power, generous with the drill.</p>
                            <p className="text-xs text-boho-text-secondary leading-relaxed min-h-[52px]">"{monarchyQuote}"</p>
                            <button
                                type="button"
                                onClick={rotateMonarchyQuote}
                                className="mt-2 flex items-center gap-1 text-xs text-boho-text-secondary hover:text-boho-text transition-colors"
                            >
                                <RefreshCw size={10} /> New quote
                            </button>
                        </motion.div>

                        {/* Republic Card */}
                        <motion.div
                            onClick={() => setGovernanceType('republic')}
                            whileTap={{ scale: 0.97 }}
                            className={`relative rounded-xl p-4 cursor-pointer border transition-all ${governanceType === 'republic'
                                    ? 'border-sage-500 bg-boho-paper'
                                    : 'border-boho-divider bg-boho-paper/60'
                                }`}
                        >
                            {governanceType === 'republic' && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-sage-500 rounded-full flex items-center justify-center">
                                    <Check size={12} className="text-white" />
                                </div>
                            )}
                            <div className="text-3xl mb-2">🗳️</div>
                            <h3 className="font-bold text-sm text-boho-text mb-1">Republic</h3>
                            <p className="text-xs text-boho-text-secondary mb-3">Community-led. Everyone votes. Slightly chaotic. Very fair.</p>
                            <p className="text-xs text-boho-text-secondary leading-relaxed min-h-[52px]">"{republicQuote}"</p>
                            <button
                                type="button"
                                onClick={rotateRepublicQuote}
                                className="mt-2 flex items-center gap-1 text-xs text-boho-text-secondary hover:text-boho-text transition-colors"
                            >
                                <RefreshCw size={10} /> New quote
                            </button>
                        </motion.div>

                    </div>
                </div>

                <button
                    type="submit"
                    disabled={!name || creating}
                    className="w-full text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                    style={{ backgroundColor: '#6b7c73' }}
                >
                    {creating ? 'Creating...' : (
                        <>Create {governanceType === 'monarchy' ? '🏰' : '🗳️'} Circle <LinkIcon size={18} /></>
                    )}
                </button>

                {errorMsg && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm mt-4 border border-red-100">
                        {errorMsg}
                    </div>
                )}
            </form>
        </PageTransition>
    );
};

export default CreateGroup;
