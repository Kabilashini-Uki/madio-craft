// src/pages/BuyerDashboard.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiPackage, FiShoppingBag, FiHeart, FiUser, FiLogOut,
  FiDollarSign, FiClock, FiCheckCircle, FiTruck, FiHome,
  FiMessageCircle, FiEdit, FiMapPin, FiPlus, FiStar
} from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const BuyerDashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const { wishlist } = useCart();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [profileEditing, setProfileEditing] = useState(false);
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
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my-orders');
      setOrders(res.data.orders || []);
    } catch (e) { console.error(e); }
    finally { setLoadingOrders(false); }
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
    shipped: 'bg-orange-100 text-orange-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: FiHome },
    { id: 'orders', label: 'My Orders', icon: FiShoppingBag },
    { id: 'wishlist', label: 'Wishlist', icon: FiHeart },
    { id: 'addresses', label: 'Addresses', icon: FiMapPin },
    { id: 'profile', label: 'Profile', icon: FiUser },
  ];

  const submitReview = async () => {
    if (!reviewForm.comment.trim()) { toast.error('Please write a review'); return; }
    setSubmittingReview(true);
    try {
      await api.post(`/artisans/${reviewModal.artisanId}/review`, {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        orderId: reviewModal.orderId
      });
      toast.success('Review submitted! Thank you.');
      setReviewModal(null);
      setReviewForm({ rating: 5, comment: '' });
    } catch (e) {
      toast.error('Failed to submit review');
    } finally { setSubmittingReview(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-white shadow-lg flex-shrink-0 fixed left-0 top-20 z-10">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {user?.name?.[0] || 'B'}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{user?.name}</p>
                <p className="text-xs text-gray-500">Buyer</p>
              </div>
            </div>
            <nav className="space-y-1">
              {navItems.map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              ))}
              <button onClick={() => { logout(); navigate('/login'); }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 mt-2">
                <FiLogOut className="h-4 w-4" /><span>Logout</span>
              </button>
            </nav>
          </div>
        </aside>

        <main className="ml-64 flex-1 p-8 pt-28">
          {/* Overview */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name?.split(' ')[0]}!</h1>
              <p className="text-gray-500 mb-8">Track your orders and manage your account.</p>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {[
                  { label: 'Total Orders', value: orders.length, icon: FiShoppingBag, color: 'from-blue-500 to-blue-600' },
                  { label: 'In Progress', value: orders.filter(o => !['delivered','cancelled'].includes(o.orderStatus)).length, icon: FiClock, color: 'from-yellow-500 to-orange-500' },
                  { label: 'Wishlist', value: wishlist.length, icon: FiHeart, color: 'from-red-500 to-pink-500' },
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

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Orders</h2>
                {loadingOrders ? <div className="text-gray-400 text-center py-8">Loading...</div> :
                  orders.length === 0 ? (
                    <div className="text-center py-10">
                      <FiShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 mb-3">No orders yet</p>
                      <Link to="/products" className="text-blue-600 hover:underline text-sm">Browse products</Link>
                    </div>
                  ) :
                  orders.slice(0, 5).map(order => (
                    <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-3">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{order.orderId}</p>
                        <p className="text-xs text-gray-500">Rs. {order.finalAmount?.toLocaleString()} · {new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.orderStatus]}`}>
                          {order.orderStatus?.replace(/_/g,' ')}
                        </span>
                        {order.chatRoom && (
                          <Link to={`/chat/${order.chatRoom}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                            <FiMessageCircle className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                }
              </div>
            </motion.div>
          )}

          {/* Orders */}
          {activeTab === 'orders' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
              {loadingOrders ? <div className="text-gray-400 text-center py-20">Loading...</div> :
                orders.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                    <FiShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No orders yet</p>
                    <Link to="/products" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium inline-block">Shop Now</Link>
                  </div>
                ) :
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order._id} className="bg-white rounded-2xl shadow-sm p-6">
                      <div className="flex flex-wrap justify-between gap-4 mb-4">
                        <div>
                          <p className="font-bold text-gray-900">{order.orderId}</p>
                          <p className="text-sm text-gray-500">
                            {order.artisan?.artisanProfile?.businessName || order.artisan?.name}
                          </p>
                          <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600 text-lg">Rs. {(order.totalAmount || order.finalAmount)?.toLocaleString()}</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${statusColors[order.orderStatus] || 'bg-gray-100 text-gray-700'}`}>
                            {order.orderStatus?.replace(/_/g,' ')}
                          </span>
                        </div>
                      </div>
                      <div className="border-t pt-3 flex flex-wrap gap-3 items-center">
                        {order.items?.slice(0,3).map((item, i) => (
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
                              className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100">
                              <FiMessageCircle className="h-3 w-3" /><span>Chat</span>
                            </Link>
                          )}
                          {order.orderStatus === 'delivered' && (
                            <button
                              onClick={() => setReviewModal({ orderId: order._id, artisanId: order.artisan?._id, artisanName: order.artisan?.artisanProfile?.businessName || order.artisan?.name })}
                              className="flex items-center space-x-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-100">
                              <FiStar className="h-3 w-3" /><span>Leave Review</span>
                            </button>
                          )}
                          {!['delivered','cancelled'].includes(order.orderStatus) && (
                            <button onClick={() => handleCancelOrder(order._id)}
                              className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100">
                              <span>Cancel Order</span>
                            </button>
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
                  <Link to="/products" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium inline-block">Browse Products</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlist.map(product => (
                    <Link key={product._id} to={`/products/${product._id}`}
                      className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
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
                  className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
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
                          onChange={e => setNewAddress({...newAddress, [f.key]: e.target.value})}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none" />
                      </div>
                    ))}
                    <div className="col-span-2 flex items-center space-x-2">
                      <input type="checkbox" checked={newAddress.isDefault}
                        onChange={e => setNewAddress({...newAddress, isDefault: e.target.checked})}
                        id="default" className="w-4 h-4" />
                      <label htmlFor="default" className="text-sm text-gray-700">Set as default</label>
                    </div>
                  </div>
                  <div className="flex space-x-3 mt-4">
                    <button onClick={() => setShowAddressForm(false)} className="flex-1 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700">Cancel</button>
                    <button onClick={handleAddAddress} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium">Save Address</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(user?.buyerProfile?.shippingAddresses || []).map((addr, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-sm p-6">
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

          {/* Profile */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
                {!profileEditing && (
                  <button onClick={() => setProfileEditing(true)}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
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
                          onChange={e => setProfileData({...profileData, [f.key]: e.target.value})}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none" />
                      </div>
                    ))}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      <textarea value={profileData.bio} rows={3}
                        onChange={e => setProfileData({...profileData, bio: e.target.value})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none resize-none" />
                    </div>
                    <div className="flex space-x-4 pt-2">
                      <button onClick={() => setProfileEditing(false)} className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-medium text-gray-700">Cancel</button>
                      <button onClick={handleSaveProfile} disabled={savingProfile}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50">
                        {savingProfile ? 'Saving...' : 'Save Profile'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                        {user?.name?.[0]}
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
            <h3 className="text-xl font-bold mb-1">Leave a Review</h3>
            <p className="text-gray-500 text-sm mb-5">for {reviewModal.artisanName}</p>
            <div className="mb-4">
              <p className="font-medium text-sm mb-2">Rating</p>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setReviewForm(f => ({...f, rating: s}))}
                    className={`text-3xl transition-colors ${s <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</button>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <p className="font-medium text-sm mb-2">Your Review</p>
              <textarea
                value={reviewForm.comment}
                onChange={e => setReviewForm(f => ({...f, comment: e.target.value}))}
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
  );
};

export default BuyerDashboard;
