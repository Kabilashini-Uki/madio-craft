// src/pages/AdminDashboard.js - Complete Admin Panel (Updated)
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUsers, FiPackage, FiShoppingBag,
  FiCheckCircle, FiSearch, FiEye, FiTrash2,
  FiHome, FiLogOut, FiMenu,
  FiRefreshCw, FiX,
  FiAward,
  FiGrid, FiList,
  FiLogIn,
  FiStar, FiMessageSquare,
  FiArrowLeft, FiAlertCircle
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotif } from '../context/NotifContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import toast from 'react-hot-toast';

// Revenue Icon (receipt/bill style)
const RevenueIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
  </svg>
);

const AdminDashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const { addNotification } = useNotif();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: {}, products: {}, orders: {} });
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModal, setSelectedModal] = useState(null);
  const [actionLoading, setActionLoading] = useState('');
  const [artisanViewMode, setArtisanViewMode] = useState('grid');
  const [buyerViewMode, setBuyerViewMode] = useState('grid');

  // Artisan detail
  const [selectedArtisan, setSelectedArtisan] = useState(null);
  const [artisanDetailTab, setArtisanDetailTab] = useState('profile');
  const [artisanStats, setArtisanStats] = useState(null);
  const [loadingArtisanStats, setLoadingArtisanStats] = useState(false);

  // Buyer detail
  const [selectedBuyer, setSelectedBuyer] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  // Listen for new user registrations
  useEffect(() => {
    if (!socket) return;
    const handleNewUser = (data) => {
      addNotification({
        type: 'new-registration',
        title: 'New User Registered!',
        body: `${data.name} (${data.role}) just signed up.`,
        icon: '👤',
      });
      toast.custom((t) => (
        <div className={`bg-white border-l-4 border-indigo-500 rounded-xl shadow-xl p-4 max-w-sm w-full cursor-pointer ${t.visible ? 'opacity-100' : 'opacity-0'}`} onClick={() => toast.dismiss(t.id)}>
          <p className="font-bold text-gray-900 text-sm">👤 New Registration!</p>
          <p className="text-xs text-gray-600 mt-1">{data.name} registered as <span className="font-semibold capitalize text-indigo-700">{data.role}</span></p>
        </div>
      ), { duration: 6000, position: 'top-right' });
      fetchAll();
    };
    socket.on('new-user-registered', handleNewUser);
    return () => socket.off('new-user-registered', handleNewUser);
  }, [socket, addNotification]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, productsRes, ordersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/products'),
        api.get('/admin/orders'),
      ]);
      setStats(statsRes.data.stats || {});
      setUsers(usersRes.data.users || []);
      setProducts(productsRes.data.products || []);
      setOrders(ordersRes.data.orders || []);
    } catch (e) {
      toast.error('Failed to load data');
    } finally { setLoading(false); }
  };

  const openArtisanDetail = async (artisan) => {
    setSelectedArtisan(artisan);
    setArtisanDetailTab('profile');
    setLoadingArtisanStats(true);
    try {
      const res = await api.get(`/admin/artisans/${artisan._id}/stats`);
      setArtisanStats(res.data.stats);
    } catch (e) { toast.error('Failed to load artisan stats'); }
    finally { setLoadingArtisanStats(false); }
  };

  const handleVerifyArtisan = async (userId) => {
    setActionLoading(userId);
    try { await api.put(`/admin/users/${userId}/verify`); toast.success('Artisan verified'); fetchAll(); }
    catch (e) { toast.error('Failed'); } finally { setActionLoading(''); }
  };

  const handleSuspendUser = async (userId) => {
    setActionLoading(userId);
    try { await api.put(`/admin/users/${userId}/suspend`); toast.success('User status updated'); fetchAll(); }
    catch (e) { toast.error('Failed'); } finally { setActionLoading(''); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Permanently delete this user?')) return;
    setActionLoading(userId);
    try { await api.delete(`/admin/users/${userId}`); toast.success('User deleted'); fetchAll(); }
    catch (e) { toast.error('Failed'); } finally { setActionLoading(''); }
  };

  const handleToggleProduct = async (productId, isActive) => {
    try { await api.put(`/admin/products/${productId}/status`, { isActive: !isActive }); toast.success('Product updated'); fetchAll(); }
    catch (e) { toast.error('Failed'); }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product?')) return;
    try { await api.delete(`/admin/products/${productId}`); toast.success('Product deleted'); fetchAll(); }
    catch (e) { toast.error('Failed'); }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try { await api.put(`/admin/orders/${orderId}/status`, { status }); toast.success('Order updated'); fetchAll(); }
    catch (e) { toast.error('Failed'); }
  };

  const handleRefund = async (orderId) => {
    if (!window.confirm('Process refund for this order?')) return;
    try { await api.post(`/admin/orders/${orderId}/refund`); toast.success('Refund processed'); fetchAll(); }
    catch (e) { toast.error('Failed'); }
  };

  const handleLoginAs = async (targetUser) => {
    if (!window.confirm(`Login as ${targetUser.name} (${targetUser.role})?\nThis will replace your current session.`)) return;
    try {
      const res = await api.post(`/admin/login-as/${targetUser._id}`);
      const { token, user: impUser } = res.data;
      localStorage.setItem('adminToken', localStorage.getItem('token'));
      localStorage.setItem('adminUser', localStorage.getItem('user'));
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(impUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      updateUser(impUser);
      toast.success(`Now browsing as ${impUser.name}`);
      if (impUser.role === 'buyer') navigate('/buyer/dashboard');
      else if (impUser.role === 'artisan') navigate('/artisan/dashboard');
    } catch (e) { toast.error('Failed to switch account'); }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800',
    in_production: 'bg-purple-100 text-purple-800', shipped: 'bg-orange-100 text-orange-800',
    delivered: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800',
    processing: 'bg-blue-100 text-blue-800', 'order ready': 'bg-indigo-100 text-indigo-800',
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome },
    { id: 'buyers', label: 'Buyers', icon: FiUsers },
    { id: 'artisans', label: 'Artisans', icon: FiAward },
    { id: 'products', label: 'Products', icon: FiPackage },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto mb-4" />
        <p className="text-gray-500">Loading admin panel...</p>
      </div>
    </div>
  );

  const Sidebar = ({ children, backLabel, onBack }) => (
    <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} min-h-screen bg-gradient-to-b from-indigo-900 to-indigo-800 text-white flex-shrink-0 fixed left-0 top-0 z-20 transition-all duration-300`}>
      <div className="p-4 flex items-center justify-between border-b border-indigo-700">
        {sidebarOpen && <h1 className="text-xl font-bold">⚙️ Admin</h1>}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-indigo-700 rounded-lg ml-auto"><FiMenu className="h-5 w-5" /></button>
      </div>
      {sidebarOpen && onBack && (
        <div className="p-4 border-b border-indigo-700">
          <button onClick={onBack} className="flex items-center space-x-2 text-indigo-200 hover:text-white text-sm mb-2">
            <FiArrowLeft className="h-4 w-4" /><span>{backLabel}</span>
          </button>
          {children}
        </div>
      )}
      {!onBack && sidebarOpen && (
        <div className="p-4 border-b border-indigo-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold">{user?.name?.[0] || 'A'}</div>
            <div><p className="font-medium text-sm">{user?.name}</p><p className="text-xs text-indigo-300">Administrator</p></div>
          </div>
        </div>
      )}
    </aside>
  );

  // ─── Artisan Detail View ──────────────────────────────────────────────────
  if (selectedArtisan) {
    const artisanOrderList = orders.filter(o =>
      (o.artisan?._id || o.artisan?.id || o.artisan) === selectedArtisan._id ||
      o.artisan?.name === selectedArtisan.name
    );
    const deliveredOrders = artisanOrderList.filter(o => o.orderStatus === 'delivered');
    const cancelledOrders = artisanOrderList.filter(o => o.orderStatus === 'cancelled');

    const artDetailNavItems = [
      { id: 'profile', label: 'Profile', icon: FiUsers },
      { id: 'finance', label: 'Monthly Finance', icon: RevenueIcon },
      { id: 'all-orders', label: 'All Orders', icon: FiShoppingBag },
      { id: 'delivered', label: 'Delivered Orders', icon: FiCheckCircle },
      { id: 'cancelled', label: 'Cancelled Orders', icon: FiAlertCircle },
      { id: 'reviews', label: 'Customer Reviews', icon: FiMessageSquare },
      { id: 'ratings', label: 'Ratings', icon: FiStar },
    ];

    return (
      <div className="min-h-screen bg-gray-100 flex">
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} min-h-screen bg-gradient-to-b from-indigo-900 to-indigo-800 text-white flex-shrink-0 fixed left-0 top-0 z-20 transition-all duration-300`}>
          <div className="p-4 flex items-center justify-between border-b border-indigo-700">
            {sidebarOpen && <h1 className="text-xl font-bold">⚙️ Admin</h1>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-indigo-700 rounded-lg ml-auto"><FiMenu className="h-5 w-5" /></button>
          </div>
          {sidebarOpen && (
            <div className="p-4 border-b border-indigo-700">
              <button onClick={() => { setSelectedArtisan(null); setArtisanStats(null); }} className="flex items-center space-x-2 text-indigo-200 hover:text-white text-sm mb-3">
                <FiArrowLeft className="h-4 w-4" /><span>Back to Artisans</span>
              </button>
              <p className="text-xs text-indigo-400 uppercase tracking-wider mb-1">Artisan</p>
              <p className="font-semibold text-white text-sm">{selectedArtisan.name}</p>
              <p className="text-xs text-indigo-300">{selectedArtisan.artisanProfile?.businessName}</p>
            </div>
          )}
          <nav className="p-4 space-y-1">
            {artDetailNavItems.map(item => (
              <button key={item.id} onClick={() => setArtisanDetailTab(item.id)}
                className={`w-full flex items-center ${sidebarOpen ? 'space-x-3 px-4' : 'justify-center px-0'} py-3 rounded-xl text-sm font-medium transition-all ${artisanDetailTab === item.id ? 'bg-white/20 text-white' : 'text-indigo-200 hover:bg-white/10 hover:text-white'}`}>
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
        </aside>

        <main className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 p-6 pt-8 transition-all duration-300`}>
          {loadingArtisanStats ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
            </div>
          ) : (
            <>
              {artisanDetailTab === 'profile' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h1 className="text-2xl font-bold text-gray-900 mb-6">Artisan Profile</h1>
                  <div className="bg-white rounded-2xl shadow-sm p-6 max-w-2xl">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center text-3xl font-bold text-amber-600">{selectedArtisan.name?.[0]}</div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{selectedArtisan.name}</h2>
                        <p className="text-gray-500">{selectedArtisan.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedArtisan.isVerified ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{selectedArtisan.isVerified ? '✓ Verified' : 'Pending Verification'}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedArtisan.isSuspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{selectedArtisan.isSuspended ? 'Suspended' : 'Active'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[
                        ['Business Name', selectedArtisan.artisanProfile?.businessName],
                        ['Description', selectedArtisan.artisanProfile?.description],
                        ['Phone', selectedArtisan.phone],
                        ['Location', selectedArtisan.location],
                        ['Years Experience', selectedArtisan.artisanProfile?.yearsOfExperience],
                        ['Joined', new Date(selectedArtisan.createdAt).toLocaleDateString()],
                      ].filter(([, v]) => v != null && v !== '').map(([k, v]) => (
                        <div key={k} className="flex justify-between py-2 border-b border-gray-50">
                          <span className="text-sm text-gray-500">{k}</span>
                          <span className="text-sm font-medium text-gray-900 text-right max-w-xs">{v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-6">
                      {!selectedArtisan.isVerified && (
                        <button onClick={() => handleVerifyArtisan(selectedArtisan._id)} className="px-4 py-2 bg-green-600 text-white text-sm rounded-xl hover:bg-green-700">Verify Artisan</button>
                      )}
                      <button onClick={() => handleSuspendUser(selectedArtisan._id)} className={`px-4 py-2 text-sm rounded-xl ${selectedArtisan.isSuspended ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'}`}>{selectedArtisan.isSuspended ? 'Unsuspend' : 'Suspend'}</button>
                      <button onClick={() => handleLoginAs(selectedArtisan)} className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm rounded-xl flex items-center space-x-1 hover:bg-indigo-100"><FiLogIn className="h-3.5 w-3.5" /><span>Login As</span></button>
                      <button onClick={() => handleDeleteUser(selectedArtisan._id)} className="px-4 py-2 bg-red-50 text-red-700 text-sm rounded-xl flex items-center space-x-1 hover:bg-red-100"><FiTrash2 className="h-3.5 w-3.5" /><span>Delete</span></button>
                    </div>
                  </div>
                </motion.div>
              )}

              {artisanDetailTab === 'finance' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h1 className="text-2xl font-bold text-gray-900 mb-6">Monthly Finance / Revenue</h1>
                  {artisanStats ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: 'Total Orders', value: artisanStats.total, color: 'bg-blue-50 text-blue-700' },
                          { label: 'Delivered', value: artisanStats.delivered, color: 'bg-green-50 text-green-700' },
                          { label: 'Cancelled', value: artisanStats.cancelled, color: 'bg-red-50 text-red-700' },
                          { label: 'Pending', value: artisanStats.pending, color: 'bg-yellow-50 text-yellow-700' },
                        ].map(s => (
                          <div key={s.label} className={`${s.color} rounded-xl p-4 text-center`}>
                            <p className="text-2xl font-bold">{s.value}</p>
                            <p className="text-xs mt-1 opacity-80">{s.label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50 rounded-xl p-4">
                          <div className="flex items-center space-x-2 mb-1"><RevenueIcon className="h-4 w-4 text-emerald-600" /><p className="text-xs text-emerald-600 font-medium">Total Revenue (Delivered only)</p></div>
                          <p className="text-xl font-bold text-emerald-800">LKR {artisanStats.revenue?.toLocaleString()}</p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4">
                          <div className="flex items-center space-x-2 mb-1"><RevenueIcon className="h-4 w-4 text-purple-600" /><p className="text-xs text-purple-600 font-medium">Platform Commission (10%)</p></div>
                          <p className="text-xl font-bold text-purple-800">LKR {artisanStats.commission?.toLocaleString()}</p>
                        </div>
                      </div>
                      {artisanStats.monthly?.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                          <div className="p-4 border-b"><h3 className="font-semibold text-gray-900">Monthly Breakdown</h3></div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50"><tr>{['Month', 'Orders', 'Qty', 'Revenue (LKR)', 'Commission (LKR)'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
                              <tbody className="divide-y divide-gray-100">
                                {artisanStats.monthly.map(m => (
                                  <tr key={m.month} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{m.month}</td>
                                    <td className="px-4 py-3 text-gray-600">{m.count}</td>
                                    <td className="px-4 py-3 text-gray-600">{m.quantity}</td>
                                    <td className="px-4 py-3 text-gray-900 font-bold">{m.revenue?.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-purple-700 font-medium">{m.commission?.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : <div className="bg-white rounded-2xl p-8 text-center text-gray-400">No financial data available.</div>}
                </motion.div>
              )}

              {artisanDetailTab === 'all-orders' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h1 className="text-2xl font-bold text-gray-900 mb-6">All Orders ({artisanOrderList.length})</h1>
                  <OrderTable orders={artisanOrderList} statusColors={statusColors} onViewOrder={(o) => setSelectedModal({ type: 'order', data: o })} />
                </motion.div>
              )}

              {artisanDetailTab === 'delivered' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h1 className="text-2xl font-bold text-gray-900 mb-6">Delivered Orders ({deliveredOrders.length})</h1>
                  <OrderTable orders={deliveredOrders} statusColors={statusColors} onViewOrder={(o) => setSelectedModal({ type: 'order', data: o })} />
                </motion.div>
              )}

              {artisanDetailTab === 'cancelled' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h1 className="text-2xl font-bold text-gray-900 mb-6">Cancelled Orders ({cancelledOrders.length})</h1>
                  <OrderTable orders={cancelledOrders} statusColors={statusColors} onViewOrder={(o) => setSelectedModal({ type: 'order', data: o })} />
                </motion.div>
              )}

              {artisanDetailTab === 'reviews' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h1 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h1>
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    {artisanStats?.reviews?.length > 0 ? (
                      <div className="space-y-4">
                        {artisanStats.reviews.map((review, idx) => (
                          <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-gray-900 text-sm">{review.buyer?.name || 'Buyer'}</p>
                              <div className="flex items-center space-x-1">
                                {[...Array(5)].map((_, i) => (
                                  <FiStar key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        <FiMessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No reviews yet</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {artisanDetailTab === 'ratings' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h1 className="text-2xl font-bold text-gray-900 mb-6">Ratings</h1>
                  <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md">
                    <div className="text-center py-4 mb-6">
                      <div className="text-5xl font-bold text-gray-900 mb-2">
                        {(artisanStats?.averageRating || selectedArtisan.artisanProfile?.rating?.average || 0).toFixed(1)}
                      </div>
                      <div className="flex justify-center space-x-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <FiStar key={i} className={`h-6 w-6 ${i < Math.round(artisanStats?.averageRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <p className="text-sm text-gray-500">Based on {artisanStats?.total || 0} orders</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-indigo-50 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-indigo-700">{artisanStats?.delivered || 0}</p>
                        <p className="text-xs text-indigo-500">Successful Deliveries</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-green-700">
                          {artisanStats?.total ? Math.round((artisanStats.delivered / artisanStats.total) * 100) : 0}%
                        </p>
                        <p className="text-xs text-green-500">Completion Rate</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </main>

        <AnimatePresence>
          {selectedModal && (
            <OrderModal order={selectedModal.data} onClose={() => setSelectedModal(null)} statusColors={statusColors} onUpdateStatus={handleUpdateOrderStatus} onRefund={handleRefund} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─── Buyer Detail View ────────────────────────────────────────────────────
  if (selectedBuyer) {
    const buyerOrderList = orders.filter(o =>
      (o.buyer?._id || o.buyer?.id) === selectedBuyer._id
    );

    return (
      <div className="min-h-screen bg-gray-100 flex">
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} min-h-screen bg-gradient-to-b from-indigo-900 to-indigo-800 text-white flex-shrink-0 fixed left-0 top-0 z-20 transition-all duration-300`}>
          <div className="p-4 flex items-center justify-between border-b border-indigo-700">
            {sidebarOpen && <h1 className="text-xl font-bold">⚙️ Admin</h1>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-indigo-700 rounded-lg ml-auto"><FiMenu className="h-5 w-5" /></button>
          </div>
          {sidebarOpen && (
            <div className="p-4 border-b border-indigo-700">
              <button onClick={() => setSelectedBuyer(null)} className="flex items-center space-x-2 text-indigo-200 hover:text-white text-sm mb-3">
                <FiArrowLeft className="h-4 w-4" /><span>Back to Buyers</span>
              </button>
              <p className="text-xs text-indigo-400 uppercase tracking-wider mb-1">Buyer</p>
              <p className="font-semibold text-white text-sm">{selectedBuyer.name}</p>
            </div>
          )}
          <nav className="p-4 space-y-1">
            {navItems.map(item => (
              <button key={item.id} onClick={() => { setSelectedBuyer(null); setActiveTab(item.id); }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-indigo-200 hover:bg-white/10 hover:text-white">
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
        </aside>

        <main className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 p-6 pt-8 transition-all duration-300`}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Buyer Profile</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 mx-auto mb-3">{selectedBuyer.name?.[0]}</div>
                  <h2 className="font-bold text-gray-900">{selectedBuyer.name}</h2>
                  <p className="text-sm text-gray-500">{selectedBuyer.email}</p>
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${selectedBuyer.isSuspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{selectedBuyer.isSuspended ? 'Suspended' : 'Active'}</span>
                </div>
                {[['Phone', selectedBuyer.phone], ['Location', selectedBuyer.location], ['Joined', new Date(selectedBuyer.createdAt).toLocaleDateString()]].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-gray-50 text-sm">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-medium text-gray-900">{v}</span>
                  </div>
                ))}
                {selectedBuyer.buyerProfile?.shippingAddresses?.[0] && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                    <p className="text-xs font-medium text-blue-600 mb-1">Default Address</p>
                    <p className="text-sm text-blue-900">{selectedBuyer.buyerProfile.shippingAddresses[0].address}, {selectedBuyer.buyerProfile.shippingAddresses[0].city}</p>
                  </div>
                )}
                <div className="flex space-x-2 mt-4">
                  <button onClick={() => handleSuspendUser(selectedBuyer._id)} className={`flex-1 py-2 text-xs rounded-xl ${selectedBuyer.isSuspended ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>{selectedBuyer.isSuspended ? 'Unsuspend' : 'Suspend'}</button>
                  <button onClick={() => handleLoginAs(selectedBuyer)} className="flex-1 py-2 text-xs bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center space-x-1"><FiLogIn className="h-3 w-3" /><span>Login As</span></button>
                </div>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Orders ({buyerOrderList.length})</h2>
                {buyerOrderList.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">
                    <FiShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>No orders placed yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {buyerOrderList.map(order => (
                      <div key={order._id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{order.orderId}</p>
                          <p className="text-xs text-gray-500">→ {order.artisan?.name} · {new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-gray-900">LKR {order.totalAmount?.toLocaleString()}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.orderStatus] || 'bg-gray-100 text-gray-600'}`}>{order.orderStatus?.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <h2 className="text-lg font-bold text-gray-900 mt-6 mb-4">Reviews</h2>
                <div className="bg-white rounded-2xl shadow-sm p-6 text-center text-gray-400 text-sm">
                  Reviews submitted by this buyer will appear here.
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // ─── Main Admin Dashboard ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} min-h-screen bg-gradient-to-b from-indigo-900 to-indigo-800 text-white flex-shrink-0 fixed left-0 top-0 z-20 transition-all duration-300`}>
        <div className="p-4 flex items-center justify-between border-b border-indigo-700">
          {sidebarOpen && <h1 className="text-xl font-bold">⚙️ Admin</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-indigo-700 rounded-lg ml-auto"><FiMenu className="h-5 w-5" /></button>
        </div>
        {sidebarOpen && (
          <div className="p-4 border-b border-indigo-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold">{user?.name?.[0] || 'A'}</div>
              <div><p className="font-medium text-sm">{user?.name}</p><p className="text-xs text-indigo-300">Administrator</p></div>
            </div>
          </div>
        )}
        <nav className="p-4 space-y-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center ${sidebarOpen ? 'space-x-3 px-4' : 'justify-center px-0'} py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.id ? 'bg-white/20 text-white' : 'text-indigo-200 hover:bg-white/10 hover:text-white'}`}>
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
          <button onClick={() => window.open('/', '_blank')} className={`w-full flex items-center ${sidebarOpen ? 'space-x-3 px-4' : 'justify-center px-0'} py-3 rounded-xl text-sm font-medium text-indigo-200 hover:bg-white/10 hover:text-white`}>
            <FiHome className="h-4 w-4 flex-shrink-0" />{sidebarOpen && <span>Visit Site</span>}
          </button>
          <div className="border-t border-indigo-700 pt-2 mt-4">
            <button onClick={() => { logout(); navigate('/login'); }} className={`w-full flex items-center ${sidebarOpen ? 'space-x-3 px-4' : 'justify-center px-0'} py-3 rounded-xl text-sm font-medium text-red-300 hover:bg-red-900/30`}>
              <FiLogOut className="h-4 w-4 flex-shrink-0" />{sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </nav>
      </aside>

      <main className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 p-6 pt-8 transition-all duration-300 min-h-screen`}>

        {/* Overview */}
        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-between items-center mb-8">
              <div><h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1><p className="text-gray-500">Platform overview and analytics</p></div>
              <button onClick={fetchAll} className="flex items-center space-x-2 px-4 py-2 bg-white rounded-xl shadow-sm hover:shadow-md text-gray-600">
                <FiRefreshCw className="h-4 w-4" /><span>Refresh</span>
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Total Users', value: stats.users?.total || 0, sub: `${stats.users?.artisans || 0} artisans, ${stats.users?.buyers || 0} buyers`, icon: FiUsers, color: 'from-blue-500 to-blue-600' },
                { label: 'Products', value: stats.products?.total || 0, sub: `${stats.products?.active || 0} active`, icon: FiPackage, color: 'from-purple-500 to-purple-600' },
                { label: 'Orders', value: stats.orders?.total || 0, sub: `${stats.orders?.pending || 0} pending`, icon: FiShoppingBag, color: 'from-orange-500 to-orange-600' },
                { label: 'Total Revenue', value: `LKR ${((stats.orders?.revenue || 0) / 1000).toFixed(1)}K`, sub: 'Delivered orders only', icon: RevenueIcon, color: 'from-green-500 to-emerald-600' },
              ].map((s, i) => (
                <motion.div key={i} whileHover={{ y: -4 }} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4`}><s.icon className="h-6 w-6 text-white" /></div>
                  <div className="text-3xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-sm font-medium text-gray-700 mt-1">{s.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
                </motion.div>
              ))}
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Pending Artisan Verification</h2>
              {users.filter(u => u.role === 'artisan' && !u.isVerified).length === 0 ? (
                <div className="text-center py-8 text-gray-400"><FiCheckCircle className="h-10 w-10 mx-auto mb-2 text-green-400" /><p className="text-sm">All artisans verified!</p></div>
              ) : (
                <div className="space-y-3">
                  {users.filter(u => u.role === 'artisan' && !u.isVerified).map(u => (
                    <div key={u._id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
                      <div><p className="font-medium text-sm text-gray-900">{u.name}</p><p className="text-xs text-gray-500">{u.email} · {u.artisanProfile?.businessName}</p></div>
                      <button onClick={() => handleVerifyArtisan(u._id)} disabled={actionLoading === u._id} className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50">Verify</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Buyers — each is a clickable button */}
        {activeTab === 'buyers' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Buyers Management</h1>
              <div className="flex space-x-2">
                <button onClick={() => setBuyerViewMode('grid')} className={`p-2 rounded-lg ${buyerViewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-gray-400'}`}><FiGrid /></button>
                <button onClick={() => setBuyerViewMode('list')} className={`p-2 rounded-lg ${buyerViewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-gray-400'}`}><FiList /></button>
              </div>
            </div>
            <div className="mb-4 relative max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search buyers..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-indigo-400 outline-none text-sm bg-white" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {users.filter(u => u.role === 'buyer' && (!searchTerm || u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()))).map(u => (
                <motion.button key={u._id} whileHover={{ y: -2, scale: 1.01 }} onClick={() => setSelectedBuyer(u)}
                  className="bg-white rounded-2xl shadow-sm p-5 text-left hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-indigo-100">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-600">{u.name?.[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>
                    <FiEye className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isSuspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{u.isSuspended ? 'Suspended' : 'Active'}</span>
                    <span className="text-xs text-gray-400">{orders.filter(o => (o.buyer?._id || o.buyer?.id) === u._id).length} orders</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Artisans — each is a clickable button */}
        {activeTab === 'artisans' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Artisans Management</h1>
              <div className="flex space-x-2">
                <button onClick={() => setArtisanViewMode('grid')} className={`p-2 rounded-lg ${artisanViewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-gray-400'}`}><FiGrid /></button>
                <button onClick={() => setArtisanViewMode('list')} className={`p-2 rounded-lg ${artisanViewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-gray-400'}`}><FiList /></button>
              </div>
            </div>
            <div className="mb-4 relative max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search artisans..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-indigo-400 outline-none text-sm bg-white" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {users.filter(u => u.role === 'artisan' && (!searchTerm || u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()))).map(u => (
                <motion.button key={u._id} whileHover={{ y: -2, scale: 1.01 }} onClick={() => openArtisanDetail(u)}
                  className="bg-white rounded-2xl shadow-sm p-5 text-left hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-amber-100">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-xl font-bold text-amber-600">{u.name?.[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">{u.artisanProfile?.businessName || u.email}</p>
                    </div>
                    <FiEye className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isSuspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{u.isSuspended ? 'Suspended' : 'Active'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isVerified ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{u.isVerified ? '✓ Verified' : 'Pending'}</span>
                  </div>
                  {u.artisanProfile?.stats && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="bg-gray-50 p-2 rounded-lg text-center">
                        <p className="text-[10px] text-gray-500 uppercase">Revenue</p>
                        <p className="text-xs font-bold text-gray-900">LKR {(u.artisanProfile.stats.totalRevenue || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg text-center">
                        <p className="text-[10px] text-gray-500 uppercase">Orders</p>
                        <p className="text-xs font-bold text-gray-900">{u.artisanProfile.stats.totalOrders || 0}</p>
                      </div>
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Products */}
        {activeTab === 'products' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Products Management</h1>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <div className="relative max-w-md"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" /><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search products..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-indigo-400 outline-none text-sm" /></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50"><tr>{['Product', 'Artisan', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.filter(p => !searchTerm || p.name?.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><div className="flex items-center space-x-3"><img src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1565193564382-fb8bb0b9e5b4?w=50'} className="w-10 h-10 rounded-lg object-cover" alt="" /><p className="font-medium text-sm text-gray-900 max-w-[150px] truncate">{product.name}</p></div></td>
                        <td className="px-4 py-3 text-sm text-gray-600">{product.artisan?.name || 'N/A'}</td>
                        <td className="px-4 py-3"><span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs capitalize">{product.category}</span></td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">LKR {product.price?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{product.stock}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{product.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td className="px-4 py-3"><div className="flex items-center space-x-2">
                          <button onClick={() => handleToggleProduct(product._id, product.isActive)} className={`px-3 py-1 text-xs rounded-lg font-medium ${product.isActive ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>{product.isActive ? 'Deactivate' : 'Activate'}</button>
                          <button onClick={() => handleDeleteProduct(product._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 className="h-3.5 w-3.5" /></button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {selectedModal && (
          <OrderModal order={selectedModal.data} onClose={() => setSelectedModal(null)} statusColors={statusColors} onUpdateStatus={handleUpdateOrderStatus} onRefund={handleRefund} />
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Reusable Order Table ──────────────────────────────────────────────────────
const OrderTable = ({ orders, statusColors, onViewOrder }) => {
  if (!orders || orders.length === 0) return (
    <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">
      <FiShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-30" />
      <p>No orders found</p>
    </div>
  );
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50"><tr>{['Order ID', 'Buyer', 'Amount', 'Status', 'Date', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map(order => (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{order.orderId}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{order.buyer?.name}</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">LKR {order.totalAmount?.toLocaleString()}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.orderStatus] || 'bg-gray-100 text-gray-600'}`}>{order.orderStatus?.replace(/_/g, ' ')}</span></td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3"><button onClick={() => onViewOrder(order)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><FiEye className="h-3.5 w-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Order Modal ───────────────────────────────────────────────────────────────
const OrderModal = ({ order, onClose, statusColors, onUpdateStatus, onRefund }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
      <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
        <h2 className="text-lg font-bold text-gray-900">Order Details</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><FiX /></button>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[['Order ID', order.orderId], ['Amount', `LKR ${order.totalAmount?.toLocaleString()}`], ['Buyer', order.buyer?.name], ['Artisan', order.artisan?.name], ['Status', order.orderStatus?.replace(/_/g, ' ')], ['Payment', order.paymentStatus], ['Date', new Date(order.createdAt).toLocaleString()]].map(([k, v]) => (
            <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium text-gray-900 text-sm">{v}</p></div>
          ))}
        </div>
        <div className="border-t pt-4">
          <p className="text-xs font-medium text-gray-600 mb-3 uppercase tracking-wider">Order Items</p>
          <div className="space-y-3">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-3 bg-gray-50 p-2 rounded-xl">
                <img src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded-lg object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{item.product?.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity} × LKR {item.price?.toLocaleString()}</p>
                </div>
                <p className="text-sm font-bold text-gray-900">LKR {item.totalPrice?.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2 uppercase">Update Status</p>
          <select onChange={e => { onUpdateStatus(order._id, e.target.value); onClose(); }} defaultValue="" className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-400 outline-none bg-white text-sm">
            <option value="" disabled>Select new status...</option>
            {['pending', 'confirmed', 'processing', 'order ready', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        {order.paymentStatus !== 'refunded' && (
          <button onClick={() => { onRefund(order._id); onClose(); }} className="w-full py-2.5 bg-red-50 text-red-600 text-sm rounded-xl hover:bg-red-100">Process Refund</button>
        )}
      </div>
    </motion.div>
  </motion.div>
);

export default AdminDashboard;
