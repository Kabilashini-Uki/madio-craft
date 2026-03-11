// src/pages/ArtisanDashboard.js
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPackage, FiShoppingBag, FiUser, FiSettings, FiLogOut,
  FiTrendingUp, FiClock, FiCheckCircle, FiTruck,
  FiHome, FiStar, FiMessageCircle, FiEdit, FiPlus, FiImage,
  FiX, FiUpload, FiEye, FiToggleLeft, FiToggleRight, FiTrash2,
  FiInstagram, FiFacebook, FiGlobe, FiCamera, FiAward, FiZap,
  FiCheck, FiAlertCircle, FiRefreshCw, FiChevronDown, FiLink,
  FiGrid, FiList, FiLogIn, FiBarChart2, FiDownload, FiMessageSquare, FiTool,
  FiMenu, FiShoppingCart
} from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotif } from '../context/NotifContext';
import { useSocket } from '../context/SocketContext';
import NotificationBell from '../components/NotificationBell';
import api from '../services/api';
import toast from 'react-hot-toast';

// Revenue Icon (receipt/bill style — replaces dollar sign)
const RevenueIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
  </svg>
);

const CATEGORIES = ['jewelry', 'pottery', 'textiles', 'woodwork', 'metalwork', 'glass', 'other'];

const ArtisanDashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const { notifications } = useNotif();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    phone: user?.phone || '',
    artisanProfile: {
      businessName: user?.artisanProfile?.businessName || '',
      description: user?.artisanProfile?.description || '',
      specialties: user?.artisanProfile?.specialties?.join(', ') || '',
      yearsOfExperience: user?.artisanProfile?.yearsOfExperience || 0,
      socialLinks: {
        instagram: user?.artisanProfile?.socialLinks?.instagram || '',
        facebook: user?.artisanProfile?.socialLinks?.facebook || '',
        website: user?.artisanProfile?.socialLinks?.website || ''
      }
    }
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const avatarInputRef = React.useRef(null);
  const coverInputRef = React.useRef(null);
  const [orderViewMode, setOrderViewMode] = useState('list');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [loadingFinancials, setLoadingFinancials] = useState(false);
  const [customizationRequests, setCustomizationRequests] = useState([]);

  const handleLoginAsBuyer = async () => {
    try {
      const res = await api.get('/admin/users');
      // Just navigate to home as buyer mode hint — proper impersonation needs admin
      toast('As artisan you can browse the store from the View Shop link below.', { icon: '💡' });
    } catch (e) { }
  };

  // Handle incoming customization requests from buyers
  useEffect(() => {
    if (!socket) return;
    const handleCustomizationRequest = (data) => {
      // New payload shape: { requestId, sender:{id,name,avatar}, product:{id,name,image}, ... }
      setCustomizationRequests(prev => [{
        ...data,
        id:        Date.now(),
        // Normalise legacy fields for dashboard display
        requestId: data.requestId,
        productId: data.product?.id   || data.productId,
        productName: data.product?.name || data.productName,
        buyerId:   data.sender?.id    || data.buyerId,
        buyerName: data.sender?.name  || data.buyerName,
        status:    'pending',
      }, ...prev]);
    };
    socket.on('customization-request', handleCustomizationRequest);
    return () => socket.off('customization-request', handleCustomizationRequest);
  }, [socket]);

  const handleCustomizationResponse = async (request, available) => {
    try {
      if (request.isChatRequest) {
        // This is a message-based request — notify buyer via socket directly
        const io_roomId = request.roomId || request.requestId;
        const buyerId = request.buyerId || request.sender?.id;
        if (socket && buyerId) {
          socket.emit('chat-request-response', {
            buyerId,
            artisanId: user?._id || user?.id,
            artisanName: user?.name,
            roomId: io_roomId,
            available,
            status: available ? 'accepted' : 'rejected',
          });
        }
        // Also emit via backend for persistence
        if (buyerId) {
          try {
            await api.post('/chat/request-response', {
              buyerId, available, roomId: io_roomId,
            });
          } catch { /* non-critical */ }
        }
      } else {
        await api.post(`/products/${request.productId || request.product?.id}/customization-response`, {
          available,
          buyerId:   request.buyerId || request.sender?.id,
          requestId: request.requestId,
        });
      }
      setCustomizationRequests(prev => prev.map(r =>
        r.id === request.id ? { ...r, status: available ? 'accepted' : 'rejected' } : r
      ));
      toast.success(available ? 'Accepted! Buyer has been notified.' : 'Buyer notified of unavailability.');
    } catch (e) {
      toast.error('Failed to respond');
    }
  };

  const fetchFinancials = async () => {
    setLoadingFinancials(true);
    try {
      const res = await api.get('/orders/artisan-orders');
      const ords = res.data.orders || [];
      const delivered = ords.filter(o => o.orderStatus === 'delivered');
      const cancelled = ords.filter(o => o.orderStatus === 'cancelled');
      const pending = ords.filter(o => ['pending', 'confirmed'].includes(o.orderStatus));
      const revenue = delivered.reduce((s, o) => s + (o.totalAmount || 0), 0);

      const monthly = {};
      ords.forEach(o => {
        const d = new Date(o.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthly[key]) monthly[key] = { month: key, count: 0, revenue: 0, commission: 0, quantity: 0 };
        monthly[key].count++;
        if (o.orderStatus === 'delivered') {
          monthly[key].revenue += o.totalAmount || 0;
          monthly[key].commission += (o.totalAmount || 0) * 0.1;
        }
        monthly[key].quantity += o.items?.reduce((s, i) => s + i.quantity, 0) || 0;
      });

      setFinancials({
        total: ords.length, delivered: delivered.length, cancelled: cancelled.length,
        pending: pending.length, revenue, commission: revenue * 0.1,
        netEarnings: revenue * 0.9,
        monthly: Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month)),
      });
    } catch (e) { toast.error('Failed to load financials'); }
    finally { setLoadingFinancials(false); }
  };

  const handlePrintFinancials = () => {
    window.print();
  };

  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => ['pending', 'confirmed'].includes(o.orderStatus)).length,
    revenue: orders.filter(o => o.orderStatus === 'delivered').reduce((s, o) => s + (o.totalAmount || o.finalAmount || 0), 0),
    activeProducts: products.filter(p => p.isActive).length,
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchFinancials(); // Auto-load income data so the Finance Board is always up-to-date
  }, []);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get('/orders/artisan-orders');
      // Handle both {orders:[...]} and direct array responses
      const ordersData = res.data?.orders || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setOrders(ordersData);
    } catch (e) {
      console.error('Failed to load orders:', e);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally { setLoadingOrders(false); }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get('/products/my');
      // Handle both {products:[...]} and direct array responses
      const productsData = res.data?.products || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setProducts(productsData);
    } catch (e) {
      console.error('Failed to load products:', e);
      toast.error('Failed to load products');
      setProducts([]);
    } finally { setLoadingProducts(false); }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success('Order status updated');
      fetchOrders();
    } catch (e) { toast.error('Failed to update order'); }
  };

  const handleToggleProduct = async (product) => {
    try {
      await api.put(`/products/${product._id}`, { isActive: !product.isActive });
      toast.success(`Product ${!product.isActive ? 'activated' : 'deactivated'}`);
      fetchProducts();
    } catch (e) { toast.error('Failed to update product'); }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${productId}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (e) { toast.error('Failed to delete product'); }
  };

  const handleUploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await api.post('/users/avatar', fd);
      if (res.data.success) {
        updateUser(res.data.user);
        // Force avatar re-render by updating local state
        toast.success('Profile photo updated!');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleUploadCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error('Image must be under 8MB'); return; }
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append('coverImage', file);
      const res = await api.post('/users/cover', fd);
      if (res.data.success) {
        updateUser(res.data.user);
        toast.success('Cover image updated!');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to upload cover');
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const payload = {
        name: profileData.name,
        bio: profileData.bio,
        location: profileData.location,
        phone: profileData.phone,
        artisanProfile: {
          ...profileData.artisanProfile,
          specialties: profileData.artisanProfile.specialties.split(',').map(s => s.trim()).filter(Boolean)
        }
      };
      const res = await api.put('/users/profile', payload);
      updateUser(res.data.user);
      toast.success('Profile updated!');
      setProfileEditing(false);
    } catch (e) { toast.error('Failed to update profile'); }
    finally { setSavingProfile(false); }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    'order ready': 'bg-indigo-100 text-indigo-800',
    confirmed: 'bg-blue-100 text-blue-800',
    in_production: 'bg-purple-100 text-purple-800',
    ready: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-orange-100 text-orange-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  const paymentStatusColors = {
    confirmed: 'bg-blue-100 text-blue-800',
    in_production: 'bg-purple-100 text-purple-800',
    ready: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-orange-100 text-orange-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: FiHome },
    { id: 'products', label: 'My Products', icon: FiPackage },
    { id: 'orders', label: 'Orders', icon: FiShoppingBag },
    { id: 'financials', label: 'Financials', icon: RevenueIcon },
    { id: 'profile', label: 'Profile', icon: FiUser },
  ];

  return (
    <div className="min-h-screen bg-amber-50/30">
      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} min-h-screen bg-gradient-to-b from-amber-900 to-amber-800 text-white flex-shrink-0 fixed left-0 top-0 z-20 transition-all duration-300`}>
          <div className="p-4 flex items-center justify-between border-b border-amber-800 h-16">
            {sidebarOpen && <h1 className="text-lg font-bold text-amber-100">Artisan Panel</h1>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-amber-800 rounded-lg ml-auto">
              <FiMenu className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4">
            {sidebarOpen && (
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                  {user?.name?.[0] || 'A'}
                </div>
                <div>
                  <p className="font-semibold text-amber-100 text-sm">{user?.name}</p>
                  <p className="text-xs text-amber-300">Artisan</p>
                </div>
              </div>
            )}
            <nav className="space-y-1">
              {navItems.map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center ${sidebarOpen ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.id
                    ? 'bg-white/20 text-white shadow-md'
                    : 'text-amber-200 hover:bg-white/10 hover:text-white'
                    }`}
                  title={!sidebarOpen ? item.label : undefined}>
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              ))}
              <button onClick={() => { navigate('/'); }}
                className={`w-full flex items-center ${sidebarOpen ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 rounded-xl text-sm font-medium text-amber-200 hover:bg-white/10 hover:text-white mt-2`}
                title={!sidebarOpen ? 'View Shop' : undefined}>
                <FiGlobe className="h-4 w-4 flex-shrink-0" />{sidebarOpen && <span>View Shop</span>}
              </button>
              <div className="border-t border-amber-700 pt-2 mt-4">
                <button onClick={() => { logout(); navigate('/login'); }}
                  className={`w-full flex items-center ${sidebarOpen ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 rounded-xl text-sm font-medium text-red-300 hover:bg-red-900/30`}
                  title={!sidebarOpen ? 'Logout' : undefined}>
                  <FiLogOut className="h-4 w-4 flex-shrink-0" />{sidebarOpen && <span>Logout</span>}
                </button>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 flex flex-col transition-all duration-300`}>
          {/* Top Header Bar */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
            <h2 className="text-gray-700 font-semibold capitalize">{navItems.find(n => n.id === activeTab)?.label || 'Dashboard'}</h2>
            <div className="flex items-center space-x-3">
              {/* Add Product button */}
              <button onClick={() => setShowProductModal(true)}
                className="flex items-center space-x-1 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl text-sm font-medium transition-colors">
                <FiPlus className="h-4 w-4" />
                <span>Add Product</span>
              </button>
              {/* Notification Bell */}
              <NotificationBell />
            </div>
          </header>

        {/* Main content */}
        <main className="flex-1 p-8">
          {/* Overview */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name?.split(' ')[0]}!</h1>
              <p className="text-gray-500 mb-8">Here's your shop overview.</p>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  { label: 'Total Orders', value: stats.totalOrders, icon: FiShoppingBag, color: 'from-blue-500 to-blue-600' },
                  { label: 'Pending', value: stats.pendingOrders, icon: FiClock, color: 'from-yellow-500 to-orange-500' },
                  { label: 'Revenue', value: `Rs. ${stats.revenue.toLocaleString()}`, icon: RevenueIcon, color: 'from-green-500 to-emerald-600' },
                  { label: 'Active Products', value: stats.activeProducts, icon: FiPackage, color: 'from-purple-500 to-purple-600' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                      <s.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                    <div className="text-sm text-gray-500">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent orders */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Orders</h2>
                {loadingOrders ? <div className="text-gray-400 text-center py-8">Loading...</div> :
                  orders.length === 0 ? <div className="text-gray-400 text-center py-8">No orders yet</div> :
                    <div className="space-y-3">
                      {orders.slice(0, 5).map(order => (
                        <div key={order._id} className="flex items-center justify-between p-4 bg-amber-50/60 rounded-xl">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{order.orderId}</p>
                            <p className="text-xs text-gray-500">by {order.buyer?.name} · Rs. {order.finalAmount?.toLocaleString()}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.orderStatus]}`}>
                            {order.orderStatus?.replace(/_/g, ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                }
              </div>

              {/* Customisation Requests Panel */}
              {customizationRequests.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden mt-6">
                  <div className="px-6 py-4 flex items-center gap-3" style={{ background: 'linear-gradient(90deg,#7c3aed,#9333ea)' }}>
                    <FiTool className="h-5 w-5 text-white" />
                    <span className="font-bold text-white">Customisation Requests</span>
                    {customizationRequests.filter(r => r.status === 'pending').length > 0 && (
                      <span className="ml-auto px-2.5 py-0.5 bg-white/20 text-white text-xs rounded-full font-semibold">
                        {customizationRequests.filter(r => r.status === 'pending').length} pending
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-gray-50">
                    {customizationRequests.map(request => {
                      // Support both old and new payload shapes
                      const senderName   = request.sender?.name  || request.buyerName  || 'Buyer';
                      const senderAvatar = request.sender?.avatar || '';
                      const productName  = request.product?.name || request.productName || 'Product';
                      const productImage = request.product?.image || '';
                      const requestMsg   = request.message || '';
                      const requestTime  = request.timestamp
                        ? new Date(request.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                        : '';
                      const statusCfg = {
                        pending:  { label: 'Pending',  cls: 'bg-yellow-100 text-yellow-700' },
                        accepted: { label: 'Accepted', cls: 'bg-green-100  text-green-700'  },
                        rejected: { label: 'Declined', cls: 'bg-red-100    text-red-700'    },
                      }[request.status] || { label: request.status, cls: 'bg-gray-100 text-gray-500' };

                      return (
                        <div key={request.id} className={`p-5 ${request.status === 'pending' ? 'bg-violet-50/40' : 'bg-white'}`}>
                          <div className="flex items-start gap-3">
                            {/* Sender avatar */}
                            {senderAvatar ? (
                              <img src={senderAvatar} alt={senderName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {senderName[0]?.toUpperCase() || 'B'}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              {/* Sender + status row */}
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <p className="font-semibold text-gray-900 text-sm">{senderName}</p>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusCfg.cls}`}>
                                  {statusCfg.label}
                                </span>
                              </div>

                              {/* Timestamp */}
                              {requestTime && (
                                <p className="text-[10px] text-gray-400 mb-2">{requestTime}</p>
                              )}

                              {/* Product */}
                              <div className="flex items-center gap-2 mb-2 bg-violet-50 rounded-xl p-2">
                                {productImage && (
                                  <img src={productImage} alt={productName} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <p className="text-[10px] text-gray-500">Product</p>
                                  <p className="text-xs font-semibold text-gray-800 truncate">{productName}</p>
                                </div>
                              </div>

                              {/* Message */}
                              {requestMsg && (
                                <p className="text-xs text-gray-600 mb-2 italic">"{requestMsg}"</p>
                              )}

                              {/* Detail chips */}
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {request.color && (
                                  <span className="px-2.5 py-1 bg-violet-100 text-violet-700 rounded-full text-[11px] font-semibold">🎨 {request.color}</span>
                                )}
                                {request.size && (
                                  <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-[11px] font-semibold">📐 {request.size}</span>
                                )}
                                {request.notes && (
                                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[11px] border border-amber-100">
                                    📝 {request.notes.slice(0, 50)}{request.notes.length > 50 ? '…' : ''}
                                  </span>
                                )}
                              </div>

                              {/* Action buttons */}
                              {request.status === 'pending' ? (
                                <div className="flex gap-2">
                                  <button onClick={() => handleCustomizationResponse(request, true)}
                                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs rounded-xl font-semibold transition-colors">
                                    ✓ Accept
                                  </button>
                                  <button onClick={() => handleCustomizationResponse(request, false)}
                                    className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded-xl font-semibold transition-colors">
                                    ✕ Decline
                                  </button>
                                </div>
                              ) : (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusCfg.cls}`}>
                                  {request.status === 'accepted' ? '✓ Accepted — buyer notified' : '✗ Declined — buyer notified'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
                <button onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg transition-all">
                  <FiPlus /><span>Add Product</span>
                </button>
              </div>
              {loadingProducts ? <div className="text-gray-400 text-center py-20">Loading...</div> :
                products.length === 0 ?
                  <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                    <FiPackage className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No products yet</h3>
                    <p className="text-gray-500 mb-4">Add your first product to start selling</p>
                    <button onClick={() => setShowProductModal(true)} className="px-6 py-3 bg-amber-500 text-white rounded-xl font-medium">
                      Add Product
                    </button>
                  </div> :
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map(product => (
                      <div key={product._id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="relative h-48 bg-gray-100">
                          <img
                            src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1565193564382-fb8bb0b9e5b4?w=300'}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                          <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                          <p className="text-amber-600 font-bold">Rs. {product.price?.toLocaleString()}</p>
                          <p className="text-xs text-gray-500 mt-1">Stock: {product.stock} · {product.category}</p>
                          <div className="flex items-center space-x-2 mt-3">
                            <button onClick={() => { setEditingProduct(product); setShowProductModal(true); }}
                              className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-center space-x-1">
                              <FiEdit className="h-3 w-3" /><span>Edit</span>
                            </button>
                            <button onClick={() => handleToggleProduct(product)}
                              className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center space-x-1 ${product.isActive ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                }`}>
                              {product.isActive ? <FiToggleRight className="h-3 w-3" /> : <FiToggleLeft className="h-3 w-3" />}
                              <span>{product.isActive ? 'Active' : 'Inactive'}</span>
                            </button>
                            <button onClick={() => handleDeleteProduct(product._id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </motion.div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                  <div className="flex space-x-3 mt-1 text-sm">
                    <span className="text-green-600 font-medium">{orders.filter(o => o.orderStatus === 'delivered').length} delivered</span>
                    <span className="text-red-500 font-medium">{orders.filter(o => o.orderStatus === 'cancelled').length} cancelled</span>
                    <span className="text-yellow-600 font-medium">{orders.filter(o => ['pending', 'confirmed'].includes(o.orderStatus)).length} pending</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => setOrderViewMode('list')} className={`p-2 rounded-lg ${orderViewMode === 'list' ? 'bg-amber-100 text-amber-600' : 'bg-white text-gray-400'}`}><FiList /></button>
                  <button onClick={() => setOrderViewMode('grid')} className={`p-2 rounded-lg ${orderViewMode === 'grid' ? 'bg-amber-100 text-amber-600' : 'bg-white text-gray-400'}`}><FiGrid /></button>
                </div>
              </div>

              {loadingOrders ? <div className="text-gray-400 text-center py-20">Loading...</div> :
                orders.length === 0 ?
                  <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                    <FiShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No orders yet</p>
                  </div> :
                  orderViewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {orders.map(order => (
                        <div key={order._id} className="bg-white rounded-2xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedOrder(order)}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{order.orderId}</p>
                              <p className="text-xs text-gray-500">{order.buyer?.name}</p>
                              <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.orderStatus] || 'bg-gray-100 text-gray-600'}`}>{order.orderStatus?.replace(/_/g, ' ')}</span>
                          </div>
                          <p className="font-bold text-amber-600">LKR {order.totalAmount?.toLocaleString()}</p>
                          <p className="text-xs text-gray-400 mt-1">{order.items?.length || 0} item(s)</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map(order => (
                        <div key={order._id} className="bg-white rounded-2xl shadow-sm p-6">
                          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                            <div>
                              <p className="font-bold text-gray-900">{order.orderId}</p>
                              <p className="text-sm text-gray-500">Buyer: {order.buyer?.name}</p>
                              {order.buyer?.phone && <p className="text-xs text-gray-400">📞 {order.buyer.phone}</p>}
                              <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-amber-600 text-lg">LKR {order.totalAmount?.toLocaleString()}</p>
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${statusColors[order.orderStatus] || 'bg-gray-100 text-gray-600'}`}>
                                {order.orderStatus?.replace(/_/g, ' ')}
                              </span>
                              <button onClick={() => setSelectedOrder(order)} className="block ml-auto mt-2 text-xs text-blue-500 hover:underline">View details</button>
                            </div>
                          </div>
                          <div className="border-t pt-3 mb-4">
                            {order.items?.map((item, i) => (
                              <div key={i} className="flex items-center space-x-3 py-2">
                                <img src={item.product?.images?.[0]?.url || 'https://images.unsplash.com/photo-1565193564382-fb8bb0b9e5b4?w=60'} className="w-10 h-10 rounded-lg object-cover" alt={item.product?.name} />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{item.product?.name}</p>
                                  <p className="text-xs text-gray-500">Qty: {item.quantity} × LKR {item.price?.toLocaleString()}</p>
                                  {item.customization?.notes && <p className="text-xs text-amber-600 mt-1">Note: {item.customization.notes}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                          {order.orderStatus !== 'cancelled' && order.orderStatus !== 'delivered' && (
                            <div className="flex flex-wrap gap-2">
                              {[
                                { s: 'processing', label: '⚙️ Processing' }, { s: 'order ready', label: '🎁 Ready' },
                                { s: 'shipped', label: '🚚 Shipped' }, { s: 'delivered', label: '✓ Delivered' }, { s: 'cancelled', label: '✗ Cancel' },
                              ].filter(a => {
                                const flow = ['pending', 'processing', 'order ready', 'shipped', 'delivered'];
                                const curr = flow.indexOf(order.orderStatus);
                                const next = flow.indexOf(a.s);
                                if (a.s === 'cancelled') return curr < flow.length - 1;
                                return next > curr;
                              }).map(action => (
                                <button key={action.s} onClick={() => handleUpdateOrderStatus(order._id, action.s)}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${action.s === 'cancelled' ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>
                                  {action.label}
                                </button>
                              ))}
                              {order.chatRoom && (
                                <Link to={`/chat/${order.chatRoom}`} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 flex items-center space-x-1">
                                  <FiMessageCircle className="h-3 w-3" /><span>Chat</span>
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

              {/* Order Detail Modal */}
              {selectedOrder && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setSelectedOrder(null)}>
                  <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
                    <div className="p-5 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
                      <h2 className="font-bold text-gray-900">Order {selectedOrder.orderId}</h2>
                      <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full"><FiX /></button>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {[['Buyer', selectedOrder.buyer?.name], ['Email', selectedOrder.buyer?.email], ['Phone', selectedOrder.buyer?.phone], ['Amount', `LKR ${selectedOrder.totalAmount?.toLocaleString()}`], ['Status', selectedOrder.orderStatus?.replace(/_/g, ' ')], ['Date', new Date(selectedOrder.createdAt).toLocaleString()]].map(([k, v]) => v && (
                          <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="text-sm font-medium text-gray-900">{v}</p></div>
                        ))}
                      </div>
                      {selectedOrder.shippingAddress && (
                        <div className="p-4 bg-amber-50/60 rounded-xl">
                          <p className="text-xs font-medium text-gray-600 mb-2">DELIVERY ADDRESS</p>
                          <p className="text-sm text-gray-900">{selectedOrder.shippingAddress.name}</p>
                          <p className="text-sm text-gray-600">{selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.city}</p>
                          <p className="text-sm text-gray-600">{selectedOrder.shippingAddress.district}, {selectedOrder.shippingAddress.province}</p>
                          {selectedOrder.shippingAddress.phone && <p className="text-xs text-gray-500 mt-1">📞 {selectedOrder.shippingAddress.phone}</p>}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-2">ITEMS</p>
                        {selectedOrder.items?.map((item, i) => (
                          <div key={i} className="flex items-center space-x-3 py-2 border-b last:border-0">
                            <img src={item.product?.images?.[0]?.url || 'https://images.unsplash.com/photo-1565193564382-fb8bb0b9e5b4?w=50'} className="w-10 h-10 rounded-lg object-cover" alt="" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{item.product?.name}</p>
                              <p className="text-xs text-gray-500">Qty: {item.quantity} × LKR {item.price?.toLocaleString()}</p>
                              {item.customization?.notes && <p className="text-xs text-amber-600">Note: {item.customization.notes}</p>}
                            </div>
                            <p className="text-sm font-bold text-gray-900">LKR {(item.quantity * item.price)?.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                      {selectedOrder.orderStatus !== 'cancelled' && selectedOrder.orderStatus !== 'delivered' && (
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-2">UPDATE STATUS</p>
                          <div className="flex flex-wrap gap-2">
                            {[{ s: 'processing', label: '⚙️ Processing' }, { s: 'order ready', label: '🎁 Ready' }, { s: 'shipped', label: '🚚 Shipped' }, { s: 'delivered', label: '✓ Delivered' }, { s: 'cancelled', label: '✗ Cancel' }].map(action => (
                              <button key={action.s} onClick={() => { handleUpdateOrderStatus(selectedOrder._id, action.s); setSelectedOrder(null); }}
                                className={`px-3 py-1.5 text-xs rounded-lg font-medium ${action.s === 'cancelled' ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>
                                {action.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Financials Tab */}
          {activeTab === 'financials' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Financial Board</h1>
                  <p className="text-gray-500">Your sales performance and earnings</p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={fetchFinancials} className="flex items-center space-x-2 px-4 py-2 bg-white rounded-xl shadow-sm text-gray-600 hover:shadow-md">
                    <FiRefreshCw className="h-4 w-4" /><span>Refresh</span>
                  </button>
                  <button onClick={handlePrintFinancials} className="flex items-center space-x-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600">
                    <FiDownload className="h-4 w-4" /><span>Print / PDF</span>
                  </button>
                </div>
              </div>

              {loadingFinancials && (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent mx-auto mb-4" />
                  <p className="text-gray-500">Loading financial data...</p>
                </div>
              )}

              {financials && !loadingFinancials && (
                <div className="space-y-6" id="financials-print">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Orders', value: financials.total, color: 'from-blue-500 to-blue-600' },
                      { label: 'Delivered', value: financials.delivered, color: 'from-green-500 to-emerald-600' },
                      { label: 'Cancelled', value: financials.cancelled, color: 'from-red-500 to-red-600' },
                      { label: 'Pending', value: financials.pending, color: 'from-yellow-500 to-yellow-600' },
                    ].map(s => (
                      <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}><FiShoppingBag className="h-5 w-5 text-white" /></div>
                        <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                        <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm">
                      <p className="text-sm text-gray-500 mb-1">Gross Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">LKR {financials.revenue?.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm">
                      <p className="text-sm text-gray-500 mb-1">Platform Commission (10%)</p>
                      <p className="text-2xl font-bold text-red-600">- LKR {financials.commission?.toLocaleString()}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 shadow-sm text-white">
                      <p className="text-sm opacity-80 mb-1">Net Earnings (90%)</p>
                      <p className="text-2xl font-bold">LKR {financials.netEarnings?.toLocaleString()}</p>
                    </div>
                  </div>

                  {financials.monthly?.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                      <div className="p-5 border-b">
                        <h3 className="font-bold text-gray-900">Monthly Sales Breakdown</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>{['Month', 'Orders', 'Quantity', 'Revenue (LKR)', 'Commission (LKR)', 'Net (LKR)'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {financials.monthly.map(m => (
                              <tr key={m.month} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{m.month}</td>
                                <td className="px-4 py-3 text-gray-600">{m.count}</td>
                                <td className="px-4 py-3 text-gray-600">{m.quantity}</td>
                                <td className="px-4 py-3 text-gray-900">{m.revenue?.toLocaleString()}</td>
                                <td className="px-4 py-3 text-red-600">{m.commission?.toLocaleString()}</td>
                                <td className="px-4 py-3 font-medium text-green-700">{(m.revenue * 0.9)?.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50 font-bold">
                            <tr>
                              <td className="px-4 py-3 text-gray-900">Total</td>
                              <td className="px-4 py-3 text-gray-900">{financials.total}</td>
                              <td className="px-4 py-3 text-gray-600">—</td>
                              <td className="px-4 py-3 text-gray-900">{financials.revenue?.toLocaleString()}</td>
                              <td className="px-4 py-3 text-red-600">{financials.commission?.toLocaleString()}</td>
                              <td className="px-4 py-3 text-green-700">{financials.netEarnings?.toLocaleString()}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Profile & Portfolio</h1>
                {!profileEditing && (
                  <button onClick={() => setProfileEditing(true)}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors">
                    <FiEdit /><span>Edit Profile</span>
                  </button>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-8">
                {profileEditing ? (
                  <div className="space-y-6">
                    {/* Photo uploads inside edit mode */}
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Photos</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Avatar upload */}
                        <div className="relative bg-gray-50 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-amber-400 transition-colors cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                          <div className="flex items-center gap-4 p-4">
                            {user?.avatar?.url ? (
                              <img src={user.avatar.url} alt="Profile" className="w-16 h-16 rounded-xl object-cover flex-shrink-0 shadow" />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                                {user?.name?.[0]}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">Profile Photo</p>
                              <p className="text-xs text-gray-400 mt-0.5">Click to upload a new photo</p>
                              {uploadingAvatar && <p className="text-xs text-amber-600 mt-1">Uploading…</p>}
                            </div>
                            <FiCamera className="h-5 w-5 text-amber-500 ml-auto flex-shrink-0" />
                          </div>
                          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadAvatar} />
                        </div>
                        {/* Cover upload */}
                        <div className="relative bg-gray-50 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-amber-400 transition-colors cursor-pointer" onClick={() => coverInputRef.current?.click()}>
                          <div className="h-full min-h-[88px] relative">
                            {user?.coverImage?.url
                              ? <img src={user.coverImage.url} alt="Cover" className="w-full h-full object-cover absolute inset-0" />
                              : <div className="w-full h-full absolute inset-0 bg-gradient-to-r from-amber-200 to-orange-200" />}
                            <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-1">
                              {uploadingCover
                                ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                : <FiCamera className="h-5 w-5 text-white" />}
                              <p className="text-white text-xs font-medium">Cover Image</p>
                            </div>
                          </div>
                          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadCover} />
                        </div>
                      </div>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 pt-2 border-t">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: 'Full Name', key: 'name', type: 'text' },
                        { label: 'Phone', key: 'phone', type: 'tel' },
                        { label: 'Location', key: 'location', type: 'select', options: ['Eravur', 'Marudhamunai', 'Valaichenai', 'Ottamavadi', 'Kaatankudy'] },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                          {f.type === 'select' ? (
                            <select value={profileData[f.key]}
                              onChange={e => setProfileData({ ...profileData, [f.key]: e.target.value })}
                              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-500 outline-none transition-colors bg-white">
                              <option value="">Select location</option>
                              {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input type={f.type} value={profileData[f.key]}
                              onChange={e => setProfileData({ ...profileData, [f.key]: e.target.value })}
                              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-500 outline-none transition-colors" />
                          )}
                        </div>
                      ))}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea value={profileData.bio} rows={3}
                          onChange={e => setProfileData({ ...profileData, bio: e.target.value })}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-500 outline-none transition-colors resize-none" />
                      </div>
                    </div>

                    <h2 className="text-lg font-semibold text-gray-900 pt-4 border-t">Artisan Portfolio</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                        <input value={profileData.artisanProfile.businessName}
                          onChange={e => setProfileData({ ...profileData, artisanProfile: { ...profileData.artisanProfile, businessName: e.target.value } })}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                        <input type="number" value={profileData.artisanProfile.yearsOfExperience}
                          onChange={e => setProfileData({ ...profileData, artisanProfile: { ...profileData.artisanProfile, yearsOfExperience: Number(e.target.value) } })}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-500 outline-none" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
                        <textarea value={profileData.artisanProfile.description} rows={4}
                          onChange={e => setProfileData({ ...profileData, artisanProfile: { ...profileData.artisanProfile, description: e.target.value } })}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-500 outline-none resize-none" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Specialties (comma separated)</label>
                        <input value={profileData.artisanProfile.specialties}
                          placeholder="e.g. Silver Jewelry, Meenakari, Kundan Work"
                          onChange={e => setProfileData({ ...profileData, artisanProfile: { ...profileData.artisanProfile, specialties: e.target.value } })}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-500 outline-none" />
                      </div>
                    </div>

                    <h2 className="text-lg font-semibold text-gray-900 pt-4 border-t">Social Links</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { icon: FiInstagram, key: 'instagram', placeholder: 'Instagram URL', color: 'text-pink-500' },
                        { icon: FiFacebook, key: 'facebook', placeholder: 'Facebook URL', color: 'text-blue-600' },
                        { icon: FiGlobe, key: 'website', placeholder: 'Website URL', color: 'text-gray-600' },
                      ].map(f => (
                        <div key={f.key} className="relative">
                          <f.icon className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${f.color}`} />
                          <input value={profileData.artisanProfile.socialLinks[f.key]}
                            placeholder={f.placeholder}
                            onChange={e => setProfileData({ ...profileData, artisanProfile: { ...profileData.artisanProfile, socialLinks: { ...profileData.artisanProfile.socialLinks, [f.key]: e.target.value } } })}
                            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-500 outline-none" />
                        </div>
                      ))}
                    </div>

                    <div className="flex space-x-4 pt-4">
                      <button onClick={() => setProfileEditing(false)} className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                      <button onClick={handleSaveProfile} disabled={savingProfile}
                        className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50 transition-all">
                        {savingProfile ? 'Saving...' : 'Save Profile'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Cover image upload */}
                    <div className="relative h-32 -mx-8 -mt-8 mb-6 rounded-t-2xl overflow-hidden bg-gradient-to-r from-amber-200 to-orange-200">
                      {user?.coverImage?.url && <img src={user.coverImage.url} alt="cover" className="w-full h-full object-cover" />}
                      <button onClick={() => coverInputRef.current?.click()}
                        className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-black/50 text-white text-xs rounded-xl hover:bg-black/70 transition-colors backdrop-blur-sm">
                        {uploadingCover ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" /> : <FiCamera className="h-3.5 w-3.5" />}
                        {uploadingCover ? 'Uploading...' : 'Change Cover'}
                      </button>
                    </div>

                    <div className="flex items-start space-x-6">
                      <div className="relative flex-shrink-0">
                        {user?.avatar?.url ? (
                          <img src={user.avatar.url} alt={user.name} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                            {user?.name?.[0]}
                          </div>
                        )}
                        <button onClick={() => avatarInputRef.current?.click()}
                          className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-amber-600 transition-colors">
                          {uploadingAvatar ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" /> : <FiCamera className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
                        <p className="text-amber-600 font-medium">{user?.artisanProfile?.businessName}</p>
                        <p className="text-gray-500 text-sm mt-1">{user?.location}</p>
                        <p className="text-gray-600 mt-2 max-w-lg">{user?.bio}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-amber-50 rounded-xl text-center">
                        <div className="text-2xl font-bold text-amber-600">{user?.artisanProfile?.yearsOfExperience || 0}</div>
                        <div className="text-xs text-gray-500">Years Experience</div>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-xl text-center">
                        <div className="text-2xl font-bold text-amber-600">{products.length}</div>
                        <div className="text-xs text-gray-500">Products</div>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-xl text-center">
                        <div className="text-2xl font-bold text-amber-600">{orders.length}</div>
                        <div className="text-xs text-gray-500">Orders</div>
                      </div>
                    </div>
                    {/* Chat Section in Profile */}
                    <div className="mt-6 border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <FiMessageSquare className="h-5 w-5 text-amber-500" />
                        <span>Order Chats</span>
                      </h3>
                      <div className="space-y-3">
                        {orders.filter(o => o.chatRoom).length === 0 ? (
                          <div className="bg-amber-50/60 rounded-xl p-6 text-center text-gray-400">
                            <FiMessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No active chats yet. Chats appear when orders have a chat room.</p>
                          </div>
                        ) : (
                          orders.filter(o => o.chatRoom).slice(0, 5).map(order => (
                            <Link key={order._id} to={`/chat/${order.chatRoom}`}
                              className="flex items-center justify-between p-4 bg-amber-50/60 rounded-xl hover:bg-amber-50 transition-colors">
                              <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-600">
                                  {order.buyer?.name?.[0] || '?'}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{order.buyer?.name}</p>
                                  <p className="text-xs text-gray-500">{order.orderId}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{order.orderStatus?.replace(/_/g, ' ')}</span>
                                <FiMessageCircle className="h-4 w-4 text-amber-500" />
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </main>
        </div>
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <ProductModal
            product={editingProduct}
            onClose={() => setShowProductModal(false)}
            onSave={() => { setShowProductModal(false); fetchProducts(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Product Create/Edit Modal
const ProductModal = ({ product, onClose, onSave }) => {
  const [form, setForm] = useState({
    name:          product?.name || '',
    description:   product?.description || '',
    price:         product?.price || '',
    category:      product?.category || 'jewelry',
    stock:         product?.stock || 1,
    materials:     product?.materials?.join(', ') || '',
    tags:          product?.tags?.join(', ') || '',
    isCustomizable: product?.isCustomizable || false,
  });

  // Track real File objects and their base64 previews separately
  const [newFiles,    setNewFiles]    = useState([]);       // actual File objects (new uploads)
  const [newPreviews, setNewPreviews] = useState([]);       // base64 for new files
  const [keptImages,  setKeptImages]  = useState(         // original images kept from existing product
    product?.images?.map(img => ({ url: img.url, public_id: img.public_id || '' })) || []
  );
  const [saving, setSaving] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    // Store actual File objects
    setNewFiles(prev => [...prev, ...files]);
    // Generate previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setNewPreviews(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
    // Reset so same file can be picked again
    e.target.value = '';
  };

  const removeKept = (idx) => setKeptImages(prev => prev.filter((_, i) => i !== idx));
  const removeNew  = (idx) => {
    setNewFiles(prev    => prev.filter((_, i) => i !== idx));
    setNewPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.description) {
      toast.error('Please fill in name, description and price'); return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name',          form.name);
      fd.append('description',   form.description);
      fd.append('price',         Number(form.price));
      fd.append('category',      form.category);
      fd.append('stock',         Number(form.stock));
      fd.append('isCustomizable', String(form.isCustomizable));
      if (form.materials) fd.append('materials', form.materials);
      if (form.tags)      fd.append('tags',      form.tags);

      // Append real File objects (multer will receive these as `images`)
      newFiles.forEach(file => fd.append('images', file));

      // If no new files uploaded but there are kept originals, pass them as JSON
      if (newFiles.length === 0 && keptImages.length > 0) {
        fd.append('images', JSON.stringify(keptImages.map((img, i) => ({ ...img, isPrimary: i === 0 }))));
      }

      if (product?._id) {
        await api.put(`/products/${product._id}`, fd);
        toast.success('Product updated!');
      } else {
        await api.post('/products', fd);
        toast.success('Product created!');
      }
      onSave();
    } catch (e) {
      console.error('Save product error:', e);
      toast.error(e.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const totalImages = keptImages.length + newPreviews.length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl p-6 border-b flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-900">{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><FiX /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Enter product name"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-500 outline-none transition-colors" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
            <textarea value={form.description} rows={4}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your product in detail..."
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-500 outline-none resize-none transition-colors" />
          </div>

          {/* Price + Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Price (Rs.) *</label>
              <input type="number" min="0" value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-500 outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Stock Qty</label>
              <input type="number" min="0" value={form.stock}
                onChange={e => setForm({ ...form, stock: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-500 outline-none transition-colors" />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-500 outline-none bg-white capitalize transition-colors">
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>

          {/* Materials + Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Materials</label>
              <input value={form.materials} placeholder="e.g. Silver, Enamel"
                onChange={e => setForm({ ...form, materials: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-500 outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tags</label>
              <input value={form.tags} placeholder="e.g. necklace, silver"
                onChange={e => setForm({ ...form, tags: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-500 outline-none transition-colors" />
            </div>
          </div>

          {/* ── Image Upload ── */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Images {totalImages > 0 && <span className="text-amber-600 font-normal">({totalImages} added)</span>}
            </label>

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-amber-300 rounded-2xl p-8 text-center cursor-pointer hover:border-amber-500 hover:bg-amber-50 active:bg-amber-100 transition-all select-none"
            >
              <div className="text-5xl mb-3">📷</div>
              <p className="font-semibold text-gray-800 text-sm">Tap to choose images from your device</p>
              <p className="text-xs text-gray-400 mt-1">JPG · PNG · WEBP · up to 5MB each · multiple allowed</p>
            </div>

            {/* Hidden real file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Image grid — kept originals + new uploads */}
            {totalImages > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {/* Kept original images */}
                {keptImages.map((img, i) => (
                  <div key={`kept-${i}`} className="relative group">
                    <img src={img.url} alt="" className="w-20 h-20 object-cover rounded-xl border-2 border-gray-200 shadow-sm" />
                    <button type="button" onClick={() => removeKept(i)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm font-bold flex items-center justify-center shadow hover:bg-red-600 transition-colors leading-none">
                      ×
                    </button>
                    {i === 0 && keptImages.length > 0 && (
                      <span className="absolute bottom-0 inset-x-0 text-center text-[9px] bg-amber-500 text-white rounded-b-xl py-0.5 font-semibold">Primary</span>
                    )}
                  </div>
                ))}

                {/* New uploaded images */}
                {newPreviews.map((src, i) => (
                  <div key={`new-${i}`} className="relative group">
                    <img src={src} alt="" className="w-20 h-20 object-cover rounded-xl border-2 border-amber-300 shadow-sm" />
                    <button type="button" onClick={() => removeNew(i)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm font-bold flex items-center justify-center shadow hover:bg-red-600 transition-colors leading-none">
                      ×
                    </button>
                    {keptImages.length === 0 && i === 0 && (
                      <span className="absolute bottom-0 inset-x-0 text-center text-[9px] bg-amber-500 text-white rounded-b-xl py-0.5 font-semibold">Primary</span>
                    )}
                    <span className="absolute top-0 left-0 text-[9px] bg-blue-500 text-white rounded-tl-xl rounded-br-xl px-1 py-0.5">New</span>
                  </div>
                ))}

                {/* Add more */}
                <div onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all">
                  <span className="text-gray-400 text-2xl leading-none">+</span>
                  <span className="text-[9px] text-gray-400 mt-0.5">Add more</span>
                </div>
              </div>
            )}
          </div>

          {/* Customizable toggle */}
          <div className="flex items-center gap-3 py-2">
            <button type="button" onClick={() => setForm({ ...form, isCustomizable: !form.isCustomizable })}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.isCustomizable ? 'bg-amber-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isCustomizable ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
            <label className="text-sm font-medium text-gray-700 cursor-pointer" onClick={() => setForm({ ...form, isCustomizable: !form.isCustomizable })}>
              Allow buyers to request customizations
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white rounded-b-3xl p-6 border-t flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
            {saving
              ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /><span>Saving…</span></>
              : product ? 'Update Product' : 'Create Product'
            }
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ArtisanDashboard;