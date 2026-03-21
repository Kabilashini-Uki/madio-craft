// src/pages/CustomizationDetail.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPackage, FiMessageCircle, FiCheck, FiX, FiLoader, FiTag, FiClock } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const CustomizationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToCart } = useCart();

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [responding, setResponding] = useState(null); // 'accept' | 'reject'
    const [priceInput, setPriceInput] = useState('');
    const [buyingNow, setBuyingNow] = useState(false);

    const isArtisan = user && request && String(user.id || user._id) === String(request.artisan?._id || request.artisan);
    const isBuyer = user && request && String(user.id || user._id) === String(request.sender?._id || request.sender);

    const fetchRequest = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/products/customization-request/${id}`);
            if (data.success && data.request) {
                setRequest(data.request);
                if (data.request.customizationPrice) setPriceInput(data.request.customizationPrice.toString());
            } else {
                toast.error('Could not find this request');
                navigate(-1);
            }
        } catch (error) {
            console.error('Failed to load customization request:', error);
            toast.error('Failed to load request details');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchRequest();
    }, [fetchRequest]);

    const handleResponse = async (available) => {
        const wasAccepted = request?.status === 'accepted';
        if (!available) {
            const msg = wasAccepted
                ? 'Are you sure you want to cancel your accepted customisation?'
                : 'Are you sure you want to decline this request?';
            if (!window.confirm(msg)) return;
        } else if (!priceInput || isNaN(priceInput) || Number(priceInput) <= 0) {
            toast.error('Please enter a valid price for the customization');
            return;
        }

        setResponding(available ? 'accept' : 'reject');
        try {
            const { data } = await api.post(`/products/${request.product?._id}/customization-response`, {
                available,
                buyerId: request.sender?._id,
                requestId: request._id,
                customizationPrice: available ? Number(priceInput) : 0
            });

            if (data.success) {
                if (available) toast.success('✓ Customization accepted — buyer notified!');
                else if (wasAccepted) toast.success('✓ Acceptance cancelled — buyer notified!');
                else toast.success('Request declined');
                fetchRequest(); // Refresh
            }
        } catch (error) {
            toast.error('Failed to send response');
        } finally {
            setResponding(null);
        }
    };

    const handleBuyNow = async () => {
        if (!request || !request.product) return;
        setBuyingNow(true);
        try {
            // Logic to add to cart with customization data
            // The CartContext needs to handle customization price and data
            const customizationData = {
                requestId: request._id,
                price: request.customizationPrice,
                color: request.color,
                size: request.size,
                notes: request.notes
            };

            await addToCart(request.product, customizationData, 1);
            navigate('/cart');
        } catch (error) {
            toast.error('Failed to add to cart');
        } finally {
            setBuyingNow(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-800 border-t-transparent mb-4"></div>
                    <p className="text-stone-500 font-medium">Loading request details...</p>
                </div>
            </div>
        );
    }

    if (!request) return null;

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-700',
        accepted: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-24 pb-12">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => navigate(-1)} className="flex items-center text-stone-600 hover:text-amber-900 transition-colors group">
                        <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" /> <span>Back to Dashboard</span>
                    </button>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${statusColors[request.status]}`}>
                        {request.status}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Request Summary Card */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-br from-amber-900 via-stone-800 to-stone-900 p-8 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div className="flex items-center gap-5 relative z-10">
                                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl text-3xl shadow-inner border border-white/10">🎨</div>
                                    <div>
                                        <h1 className="text-2xl font-black tracking-tight">Customisation Detail</h1>
                                        <p className="text-amber-200/60 text-xs font-medium uppercase tracking-widest mt-1">Request ID: {request._id.slice(-8).toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* Options Table */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Selected Options</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                            <p className="text-xs text-gray-500 mb-1">Colour</p>
                                            <div className="flex items-center gap-2">
                                                {request.color ? (
                                                    <>
                                                        <span className="w-5 h-5 rounded-full border border-stone-200 shadow-sm" style={{ background: request.color.toLowerCase() === 'original' ? '#D2B48C' : request.color }} />
                                                        <span className="font-bold text-stone-900">{request.color}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-stone-400 italic">No preference</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                            <p className="text-xs text-gray-500 mb-1">Size</p>
                                            <span className="font-semibold text-gray-900">{request.size || 'No preference'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4">Message / Notes</h3>
                                    <div className="bg-amber-50/50 rounded-2xl p-6 border border-amber-100/50">
                                        <FiMessageCircle className="text-amber-700/40 mb-3 h-5 w-5" />
                                        <p className="text-stone-800 leading-relaxed font-serif italic text-lg opacity-90">
                                            "{request.notes || request.message || "No specific notes provided."}"
                                        </p>
                                    </div>
                                </div>

                                {/* Sender/Receiver */}
                                <div className="flex flex-col sm:flex-row gap-8 pt-4 border-t border-gray-50">
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Requested By</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                                                <img src={request.sender?.avatar?.url || `https://ui-avatars.com/api/?name=${request.sender?.name}&background=7c3aed&color=fff`} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{request.sender?.name}</p>
                                                <p className="text-xs text-gray-500">Buyer</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Artisan</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                                                <img src={request.artisan?.avatar?.url || `https://ui-avatars.com/api/?name=${request.artisan?.name}&background=8B4513&color=fff`} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{request.artisan?.name}</p>
                                                <p className="text-xs text-gray-500">Master Crafter</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Area */}
                    <div className="space-y-6">
                        {/* Product Card */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="aspect-square relative">
                                <img src={request.product?.images?.[0]?.url || 'https://via.placeholder.com/300'} alt="" className="w-full h-full object-cover" />
                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold text-violet-700 uppercase">
                                    {request.product?.category}
                                </div>
                            </div>
                            <div className="p-5">
                                <h2 className="font-bold text-gray-900 mb-1">{request.product?.name}</h2>
                                <p className="text-lg font-bold text-amber-700">Rs. {request.product?.price?.toLocaleString()}</p>
                                <button onClick={() => navigate(`/products/${request.product?._id}`)} className="mt-4 w-full py-3 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition-all flex items-center justify-center gap-2">
                                    <FiPackage /> View Item Detail
                                </button>
                            </div>
                        </div>

                        {/* Response Card */}
                        <div className="bg-white rounded-3xl shadow-xl border border-amber-100 overflow-hidden">
                            <div className="p-6">
                                <h3 className="font-black text-stone-900 mb-5 flex items-center gap-2 uppercase tracking-tight text-sm">
                                    <FiTag className="text-amber-800" />
                                    {isArtisan ? 'Your Response' : 'Proposed Pricing'}
                                </h3>

                                {request.status === 'pending' ? (
                                    isArtisan ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Customisation Extra Cost (LKR)</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rs.</span>
                                                    <input
                                                        type="number"
                                                        value={priceInput}
                                                        onChange={(e) => setPriceInput(e.target.value)}
                                                        placeholder="e.g. 500"
                                                        className="w-full pl-12 pr-4 py-4 bg-stone-50 border-2 border-stone-100 rounded-2xl focus:border-amber-500/50 focus:bg-white outline-none font-black text-lg transition-all"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-2 italic">Total for buyer will be: Rs. {(request.product?.price + (Number(priceInput) || 0)).toLocaleString()}</p>
                                            </div>

                                            <div className="flex flex-col gap-2 pt-2">
                                                <button
                                                    onClick={() => handleResponse(true)}
                                                    disabled={responding !== null}
                                                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    {responding === 'accept' ? <FiLoader className="animate-spin" /> : <FiCheck />}
                                                    Accept & Notify
                                                </button>
                                                <button
                                                    onClick={() => handleResponse(false)}
                                                    disabled={responding !== null}
                                                    className="w-full py-3 text-red-600 hover:bg-red-50 rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2"
                                                >
                                                    {responding === 'reject' ? <FiLoader className="animate-spin" /> : <FiX />}
                                                    Decline Request
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-3 text-yellow-600">
                                                <FiClock className="h-6 w-6 animate-pulse" />
                                            </div>
                                            <p className="text-sm text-gray-600">Waiting for artisan to fix the cost and confirm availability.</p>
                                            <p className="text-xs text-gray-400 mt-2">You'll be notified via popup once they respond.</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="space-y-4 text-center">
                                        <div className={`p-4 rounded-2xl ${request.status === 'accepted' ? 'bg-green-50' : 'bg-red-50'}`}>
                                            <p className={`text-sm font-bold ${request.status === 'accepted' ? 'text-green-700' : 'text-red-700'}`}>
                                                {request.status === 'accepted' ? 'Request Accepted' : 'Request Declined'}
                                            </p>
                                            {request.status === 'accepted' && (
                                                <div className="mt-2">
                                                    <p className="text-3xl font-black text-gray-900">Rs. {request.customizationPrice?.toLocaleString()}</p>
                                                    <p className="text-[10px] text-gray-500 font-medium">Agreement Price</p>
                                                </div>
                                            )}
                                        </div>

                                        {request.status === 'accepted' && isArtisan && (
                                            <button
                                                onClick={() => handleResponse(false)}
                                                disabled={responding !== null}
                                                className="w-full py-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-2xl font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                {responding === 'reject' ? <FiLoader className="animate-spin" /> : <FiX />}
                                                Cancel Acceptance
                                            </button>
                                        )}

                                        {request.status === 'accepted' && isBuyer && (
                                            <button
                                                onClick={handleBuyNow}
                                                disabled={buyingNow}
                                                className="w-full py-4 bg-amber-700 hover:bg-amber-800 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                {buyingNow ? <FiLoader className="animate-spin" /> : <FiCheck />}
                                                Add to Cart
                                            </button>
                                        )}

                                        <p className="text-[10px] text-gray-400">
                                            Responded on {new Date(request.respondedAt).toLocaleDateString()} at {new Date(request.respondedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomizationDetail;
