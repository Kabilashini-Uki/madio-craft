// src/pages/BuyerDashboard.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiShoppingBag, FiHeart, FiUser, FiLogOut,
  FiClock, FiHome,
  FiMessageCircle, FiEdit, FiMapPin, FiPlus, FiStar, FiShoppingCart, FiMenu
} from 'react-icons/fi';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import NotificationBell from '../components/NotificationBell';
import { SkeletonCard, SkeletonRow } from '../components/LoadingSkeleton';
import api from '../services/api';
import toast from 'react-hot-toast';

const BuyerDashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const { wishlist, cartItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const [activeTab, setActiveTab] = useState(queryParams.get('tab') || 'overview');

  useEffect(() => {
    const tab = queryParams.get('tab');
    if (tab && ['overview', 'orders', 'wishlist', 'addresses', 'customizations', 'profile'].includes(tab)) {
      setActiveTab(tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [profileEditing, setProfileEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = React.useRef(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
  });
  const [newAddress, setNewAddress] = useState({ name: '', address: '', city: '', state: '', zipCode: '', phone: '', isDefault: false });
  const [savingProfile, setSavingProfile] = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [customizationRequests, setCustomizationRequests] = useState([]);
  const [loadingCustomizations, setLoadingCustomizations] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchCustomizationRequests();
  }, []);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get('/orders/my-orders');
      const ordersData = res.data?.orders || [];
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (e) {
      console.error('Failed to load orders:', e);
      toast.error('Failed to load orders. Please refresh.');
      setOrders([]);
    } finally { setLoadingOrders(false); }
  };

  const fetchCustomizationRequests = async () => {
    setLoadingCustomizations(true);
    try {
      const res = await api.get('/products/my-customization-requests');
      const requests = res.data?.requests || [];
      setCustomizationRequests(Array.isArray(requests) ? requests : []);
    } catch (e) {
      console.error('Failed to load customizations:', e);
      setCustomizationRequests([]);
    } finally {
      setLoadingCustomizations(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Cancel this order? This action cannot be undone.')) return;
    try {
      await api.put(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled successfully');
      fetchOrders();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleNotReceived = async (orderId) => {
    if (!window.confirm('Are you sure you want to mark this product as Not Received?')) return;
    try {
      await api.post(`/orders/${orderId}/confirm-received`, { received: false });
      toast.success('Marked as not received. The artisan has been notified.');
      fetchOrders();
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await api.put('/users/profile', profileData);
      updateUser(res.data.user);
      toast.success('Profile updated!');
      setProfileEditing(false);
    } catch (e) { toast.error('Failed to update profile'); }
    finally { setSavingProfile(false); }
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
      const res = await api.post('/users/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        updateUser(res.data.user);
        toast.success('Profile photo updated!');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.address || !newAddress.city || !newAddress.state || !newAddress.zipCode) {
      toast.error('Please fill all required fields'); return;
    }
    try {
      const res = await api.post('/users/shipping-address', { ...newAddress, setDefault: newAddress.isDefault });
      updateUser({ ...user, buyerProfile: { ...user.buyerProfile, shippingAddresses: res.data.addresses } });
      toast.success('Address saved');
      setNewAddress({ name: '', address: '', city: '', state: '', zipCode: '', phone: '', isDefault: false });
      setShowAddressForm(false);
    } catch (e) { toast.error('Failed to save address'); }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-blue-100 text-blue-800',
    'order ready': 'bg-indigo-100 text-indigo-800',
    in_production: 'bg-purple-100 text-purple-800',
    ready: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: FiHome },
    { id: 'orders', label: 'My Orders', icon: FiShoppingBag },
    { id: 'wishlist', label: 'Wishlist', icon: FiHeart },
    { id: 'addresses', label: 'Addresses', icon: FiMapPin },
    { id: 'customizations', label: 'Customizations', icon: FiEdit },
    { id: 'profile', label: 'Profile', icon: FiUser },
  ];

  const submitReview = async () => {
    if (!reviewForm.comment.trim()) { toast.error('Please write a review'); return; }
    setSubmittingReview(true);
    try {
      await api.post(`/orders/${reviewModal.orderId}/confirm-received`, {
        received: true,
        comment: reviewForm.comment
      });
      toast.success('Feedback submitted! Thank you.');
      setReviewModal(null);
      setReviewForm({ comment: '' });
      fetchOrders();
    } catch (e) {
      toast.error('Failed to submit feedback');
    } finally { setSubmittingReview(false); }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} min-h-screen bg-gradient-to-b from-stone-800 to-amber-900 text-white flex-shrink-0 fixed left-0 top-0 z-20 transition-all duration-300`}>
          <div className="p-4 flex items-center justify-between border-b border-amber-800 h-16">
            {sidebarOpen && <h1 className="text-lg font-bold text-amber-100">My Account</h1>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-amber-800 rounded-lg ml-auto">
              <FiMenu className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4">
            {sidebarOpen && (
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                  {user?.name?.[0] || 'B'}
                </div>
                <div>
                  <p className="font-semibold text-amber-100 text-sm">{user?.name}</p>
                  <p className="text-xs text-amber-300">Buyer</p>
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
                title={!sidebarOpen ? 'Visit Site' : undefined}>
                <FiHome className="h-4 w-4 flex-shrink-0" />{sidebarOpen && <span>Visit Site</span>}
              </button>
              <div className="border-t border-amber-800 pt-2 mt-4">
                <button onClick={() => { logout(); navigate('/login'); }}
                  className={`w-full flex items-center ${sidebarOpen ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 rounded-xl text-sm font-medium text-red-300 hover:bg-red-900/30`}>
                  <FiLogOut className="h-4 w-4 flex-shrink-0" />
                  {sidebarOpen && <span>Logout</span>}
                </button>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 flex flex-col transition-all duration-300`}>
          {/* Top Header Bar */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
            <h2 className="text-gray-700 font-semibold capitalize">{activeTab === 'dashboard' ? 'Buyer Dashboard' : activeTab}</h2>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-amber-600 mr-2 hidden sm:inline">Happy Shopping, {user?.name}!</span>
              <button onClick={() => navigate('/')} className="flex items-center space-x-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition-colors font-medium text-sm">
                <FiHome className="h-4 w-4" /><span>Home</span>
              </button>
              {/* Notification Bell */}
              <NotificationBell />
              {/* Cart Icon */}
              <Link to="/cart" className="relative p-2 hover:bg-amber-50 rounded-xl transition-colors">
                <FiShoppingCart className="h-5 w-5 text-gray-600" />
                {cartItems?.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartItems.length}
                  </span>
                )}
              </Link>
            </div>
          </header>

          <main className="flex-1 p-8">
            {/* Overview */}
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name?.split(' ')[0]}!</h1>
                <p className="text-gray-500 mb-8">Track your orders and manage your account.</p>

                {loadingOrders ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      <SkeletonCard color="amber" height="h-32" />
                      <SkeletonCard color="yellow" height="h-32" />
                      <SkeletonCard color="red" height="h-32" />
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
                      {[...Array(3)].map((_, i) => (
                        <SkeletonRow key={i} color="amber" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      {[
                        { label: 'Total Orders', value: orders.length, icon: FiShoppingBag, color: 'from-amber-500 to-amber-600' },
                        { label: 'In Progress', value: orders.filter(o => !['delivered', 'cancelled'].includes(o.orderStatus)).length, icon: FiClock, color: 'from-yellow-500 to-orange-500' },
                        { label: 'Wishlist', value: wishlist.length, icon: FiHeart, color: 'from-red-500 to-pink-500' },
                        { label: 'Custom Requests', value: customizationRequests.length, icon: FiEdit, color: 'from-purple-500 to-indigo-500' },
                      ].map((s, i) => (
                        <div key={i} className="bg-[#F5EBE0] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-[#D5C4A1]/30">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                            <s.icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                          <div className="text-sm text-gray-500">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-[#FAF0E6] rounded-2xl shadow-sm p-6 border border-[#D5C4A1]/30">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Orders</h2>
                        {orders.length === 0 ? (
                          <div className="text-center py-10">
                            <FiShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 mb-3">No orders yet</p>
                            <Link to="/products" className="text-amber-700 hover:underline text-sm">Browse products</Link>
                          </div>
                        ) :
                          orders.slice(0, 5).map(order => (
                            <div key={order._id} className="flex items-center justify-between p-4 bg-[#EDDBCD] rounded-xl mb-3 hover:bg-[#E4CDB7] transition-colors">
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{order.orderId}</p>
                                <p className="text-xs text-gray-500">Rs. {order.finalAmount?.toLocaleString()} · {new Date(order.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.orderStatus]}`}>
                                  {order.orderStatus?.replace(/_/g, ' ')}
                                </span>
                                {order.chatRoom && (
                                  <Link to={`/chat/${order.chatRoom}`} className="p-2 text-amber-700 hover:bg-amber-50 rounded-lg">
                                    <FiMessageCircle className="h-4 w-4" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          ))
                        }
                      </div>

                      <div className="bg-[#FAF0E6] rounded-2xl shadow-sm p-6 border border-[#D5C4A1]/30 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-lg font-bold text-gray-900">Customised Order Requests</h2>
                          <button onClick={() => setActiveTab('customizations')} className="text-sm text-amber-700 hover:underline">View All</button>
                        </div>
                        {customizationRequests.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                            <FiEdit className="h-12 w-12 text-gray-300 mb-3" />
                            <p className="text-gray-500 mb-3">No custom requests sent right now</p>
                            <Link to="/products" className="text-amber-700 hover:underline text-sm">Find Custom Crafts</Link>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {customizationRequests.slice(0, 5).map(req => (
                              <div key={req._id} className="flex items-center justify-between p-4 bg-[#EDDBCD] rounded-xl hover:bg-[#E4CDB7] transition-colors">
                                <div>
                                  <p className="font-medium text-gray-900 text-sm truncate max-w-[150px]">{req.productName || 'Custom Request'}</p>
                                  <p className="text-xs text-gray-500">To {req.artisan?.name || 'Artisan'}</p>
                                </div>
                                <div className="text-right">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${req.status === 'accepted' ? 'bg-green-100 text-green-700' : req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{req.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Orders */}
            {activeTab === 'orders' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
                {loadingOrders ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <SkeletonRow key={i} color="amber" />
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                    <FiShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No orders yet</p>
                    <Link to="/products" className="px-6 py-3 bg-amber-700 text-white rounded-xl font-medium inline-block">Shop Now</Link>
                  </div>
                ) :
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div key={order._id} className="bg-[#F5EBE0] rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow border border-[#D5C4A1]/30">
                        <div className="flex flex-wrap justify-between gap-4 mb-4">
                          <div>
                            <p className="font-bold text-gray-900">{order.orderId}</p>
                            <p className="text-sm text-gray-500">
                              {order.artisan?.artisanProfile?.businessName || order.artisan?.name}
                            </p>
                            <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-amber-700 text-lg">Rs. {(order.totalAmount || order.finalAmount)?.toLocaleString()}</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${statusColors[order.orderStatus] || 'bg-gray-100 text-gray-700'}`}>
                              {order.orderStatus?.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                        <div className="border-t pt-3 flex flex-wrap gap-3 items-center">
                          {order.items?.slice(0, 3).map((item, i) => (
                            <div key={i} className="flex items-center space-x-2">
                              <img src={item.product?.images?.[0]?.url || 'https://images.unsplash.com/photo-1565193564382-fb8bb0b9e5b4?w=60'}
                                className="w-10 h-10 rounded-lg object-cover" alt="" />
                              <div>
                                <p className="text-xs font-medium text-gray-800">{item.product?.name}</p>
                                <p className="text-xs text-gray-500">×{item.quantity}</p>
                              </div>
                            </div>
                          ))}
                          <div className="ml-auto flex items-center gap-2">
                            {order.chatRoom && (
                              <Link to={`/chat/${order.chatRoom}`}
                                className="flex items-center space-x-2 px-4 py-2 bg-amber-50 text-amber-800 rounded-lg text-sm font-medium hover:bg-amber-100">
                                <FiMessageCircle className="h-3 w-3" /><span>Chat</span>
                              </Link>
                            )}
                            {order.orderStatus === 'delivered' && order.buyerReceived === undefined && (
                              <>
                                <button
                                  onClick={() => setReviewModal({ orderId: order._id, artisanId: order.artisan?._id, artisanName: order.artisan?.artisanProfile?.businessName || order.artisan?.name })}
                                  className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100">
                                  <FiStar className="h-3 w-3" /><span>Product Received</span>
                                </button>
                                <button
                                  onClick={() => handleNotReceived(order._id)}
                                  className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100">
                                  <span>Not Received</span>
                                </button>
                              </>
                            )}
                            {order.buyerReceived === true && (
                              <span className="text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">Received</span>
                            )}
                            {order.buyerReceived === false && (
                              <span className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">Reported Not Received</span>
                            )}
                            {!['order ready', 'delivered', 'cancelled'].includes(order.orderStatus) && (
                              <button onClick={() => handleCancelOrder(order._id)}
                                className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100">
                                <span>Cancel Order</span>
                              </button>
                            )}
                            {order.orderStatus === 'order ready' && (
                              <span className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">Ready — Cannot cancel</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              </motion.div>
            )}

            {/* Wishlist */}
            {activeTab === 'wishlist' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold text-gray-900 mb-6">My Wishlist</h1>
                {wishlist.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                    <FiHeart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Your wishlist is empty</p>
                    <Link to="/products" className="px-6 py-3 bg-amber-700 text-white rounded-xl font-medium inline-block">Browse Products</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map(product => (
                      <Link key={product._id} to={`/products/${product._id}`}
                        className="bg-[#FAF0E6] rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-[#D5C4A1]/30">
                        <img src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1565193564382-fb8bb0b9e5b4?w=300'}
                          className="w-full h-48 object-cover" alt={product.name} />
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900">{product.name}</h3>
                          <p className="text-blue-600 font-bold mt-1">Rs. {product.price?.toLocaleString()}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Addresses */}
            {activeTab === 'addresses' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Saved Addresses</h1>
                  <button onClick={() => setShowAddressForm(true)}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-amber-700 text-white rounded-xl font-medium hover:bg-amber-800">
                    <FiPlus /><span>Add Address</span>
                  </button>
                </div>

                {showAddressForm && (
                  <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">New Address</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: 'Name', key: 'name', span: 2 },
                        { label: 'Address Line *', key: 'address', span: 2 },
                        { label: 'City *', key: 'city' },
                        { label: 'State *', key: 'state' },
                        { label: 'ZIP Code *', key: 'zipCode' },
                        { label: 'Phone', key: 'phone' },
                      ].map(f => (
                        <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                          <input value={newAddress[f.key]}
                            onChange={e => setNewAddress({ ...newAddress, [f.key]: e.target.value })}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-500 outline-none" />
                        </div>
                      ))}
                      <div className="col-span-2 flex items-center space-x-2">
                        <input type="checkbox" checked={newAddress.isDefault}
                          onChange={e => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                          id="default" className="w-4 h-4" />
                        <label htmlFor="default" className="text-sm text-gray-700">Set as default</label>
                      </div>
                    </div>
                    <div className="flex space-x-3 mt-4">
                      <button onClick={() => setShowAddressForm(false)} className="flex-1 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700">Cancel</button>
                      <button onClick={handleAddAddress} className="flex-1 py-2.5 bg-amber-700 text-white rounded-xl font-medium">Save Address</button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(user?.buyerProfile?.shippingAddresses || []).map((addr, i) => (
                    <div key={i} className="bg-[#F5EBE0] rounded-2xl shadow-sm p-6 border border-[#D5C4A1]/30">
                      <div className="flex justify-between items-start mb-3">
                        <p className="font-semibold text-gray-900">{addr.name || 'Address ' + (i + 1)}</p>
                        {addr.isDefault && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Default</span>}
                      </div>
                      <p className="text-gray-600 text-sm">{addr.address}</p>
                      <p className="text-gray-600 text-sm">{addr.city}, {addr.state} - {addr.zipCode}</p>
                      {addr.phone && <p className="text-gray-600 text-sm">📞 {addr.phone}</p>}
                    </div>
                  ))}
                  {!user?.buyerProfile?.shippingAddresses?.length && !showAddressForm && (
                    <div className="col-span-2 text-center py-10 bg-white rounded-2xl shadow-sm">
                      <FiMapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No saved addresses</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Customizations */}
            {activeTab === 'customizations' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold text-gray-900 mb-6 font-primary">Customisation Requests</h1>
                {loadingCustomizations ? <div className="text-gray-400 text-center py-20 font-medium">Loading...</div> :
                  customizationRequests.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                      <FiEdit className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No customisation requests sent yet.</p>
                      <Link to="/products" className="text-amber-700 hover:underline text-sm font-bold mt-2 inline-block">Explore unique crafts</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {customizationRequests.map(req => {
                        const statusCfg = {
                          pending: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700' },
                          accepted: { label: 'Accepted', cls: 'bg-green-100 text-green-700' },
                          rejected: { label: 'Declined', cls: 'bg-red-100 text-red-700' },
                        }[req.status] || { label: req.status, cls: 'bg-gray-100 text-gray-500' };

                        return (
                          <motion.button key={req._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            onClick={() => navigate(`/customization/${req._id}`)}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-amber-200 transition-all text-left flex flex-col justify-between h-full relative group">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-gray-900 text-sm truncate pr-2">{req.productName || req.product?.name || 'Customization'}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusCfg.cls}`}>{statusCfg.label}</span>
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">{req.description}</p>
                            </div>
                            <div className="pt-3 border-t border-gray-50 flex justify-between items-end w-full">
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase font-semibold">Artisan</p>
                                <p className="text-xs font-medium text-gray-700">{req.artisan?.name || 'Unknown'}</p>
                              </div>
                              {req.status === 'accepted' && (
                                <div className="text-right">
                                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Price</p>
                                  <p className="text-sm font-black text-amber-700">LKR {req.customizationPrice?.toLocaleString()}</p>
                                </div>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )
                }
              </motion.div>
            )}

            {/* Profile */}
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
                  {!profileEditing && (
                    <button onClick={() => setProfileEditing(true)}
                      className="flex items-center space-x-2 px-5 py-2.5 bg-amber-700 text-white rounded-xl font-medium hover:bg-amber-800">
                      <FiEdit /><span>Edit</span>
                    </button>
                  )}
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-8">
                  {profileEditing ? (
                    <div className="space-y-4">
                      {[
                        { label: 'Full Name', key: 'name' },
                        { label: 'Phone', key: 'phone' },
                        { label: 'Location', key: 'location' },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                          <input value={profileData[f.key]}
                            onChange={e => setProfileData({ ...profileData, [f.key]: e.target.value })}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-500 outline-none" />
                        </div>
                      ))}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea value={profileData.bio} rows={3}
                          onChange={e => setProfileData({ ...profileData, bio: e.target.value })}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-500 outline-none resize-none" />
                      </div>
                      <div className="flex space-x-4 pt-2">
                        <button onClick={() => setProfileEditing(false)} className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-medium text-gray-700">Cancel</button>
                        <button onClick={handleSaveProfile} disabled={savingProfile}
                          className="flex-1 py-3 bg-amber-700 text-white rounded-xl font-medium hover:bg-amber-800 disabled:opacity-50">
                          {savingProfile ? 'Saving...' : 'Save Profile'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          {user?.avatar?.url ? (
                            <img src={user.avatar.url} alt={user.name} className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl font-bold border-4 border-white shadow-lg">
                              {user?.name?.[0]}
                            </div>
                          )}
                          <button onClick={() => avatarInputRef.current?.click()}
                            className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-amber-700 transition-colors">
                            {uploadingAvatar ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" /> : <span style={{ fontSize: '10px' }}>📷</span>}
                          </button>
                          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadAvatar} />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                          <p className="text-gray-500 text-sm">{user?.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        {[['Phone', user?.phone], ['Location', user?.location], ['Member since', new Date(user?.createdAt || Date.now()).toLocaleDateString()]].map(([l, v]) => (
                          <div key={l} className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500">{l}</p>
                            <p className="font-medium text-gray-900">{v || 'Not set'}</p>
                          </div>
                        ))}
                      </div>
                      {user?.bio && <p className="text-gray-600">{user.bio}</p>}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </main>
        </div>

        {/* Review Modal */}
        {reviewModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setReviewModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold mb-1">Confirm Delivery & Feedback</h3>
              <p className="text-gray-500 text-sm mb-5">Private feedback for {reviewModal.artisanName}</p>
              <div className="mb-5">
                <p className="font-medium text-sm mb-2">Private Feedback</p>
                <textarea
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                  placeholder="Share your experience with this artisan..."
                  rows={4}
                  className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setReviewModal(null)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={submitReview} disabled={submittingReview}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark disabled:opacity-50">
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BuyerDashboard;
