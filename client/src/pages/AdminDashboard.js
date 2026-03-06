// src/pages/AdminDashboard.js - Complete Admin Panel
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUsers, FiPackage, FiShoppingBag,
  FiCheckCircle, FiSearch, FiEye, FiTrash2,
  FiHome, FiLogOut, FiMenu,
  FiRefreshCw, FiX,
  FiAward, FiTrendingUp,
  FiGrid, FiList,
  FiBarChart2, FiLogIn
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user, logout, updateUser } = useAuth();
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
  const [artisanStatsModal, setArtisanStatsModal] = useState(null);
  const [artisanStats, setArtisanStats] = useState(null);
  const [loadingArtisanStats, setLoadingArtisanStats] = useState(false);
  const [artisanViewMode, setArtisanViewMode] = useState('grid');
  const [buyerViewMode, setBuyerViewMode] = useState('grid');

  useEffect(() => { fetchAll(); }, []);

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
    if (!window.confirm(`Login as ${targetUser.name} (${targetUser.role})?\nThis will replace your current session. You can restore by logging in as admin again.`)) return;
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

  const openArtisanStats = async (artisan) => {
    setArtisanStatsModal(artisan);
    setLoadingArtisanStats(true);
    try {
      const res = await api.get(`/admin/artisans/${artisan._id}/stats`);
      setArtisanStats(res.data.stats);
    } catch (e) { toast.error('Failed to load artisan stats'); }
    finally { setLoadingArtisanStats(false); }
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
    { id: 'orders', label: 'Orders', icon: FiShoppingBag },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto mb-4" />
        <p className="text-gray-500">Loading admin panel...</p>
      </div>
    </div>
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
                { label: 'Total Revenue', value: `LKR ${((stats.orders?.revenue || 0) / 1000).toFixed(1)}K`, sub: 'Delivered orders', icon: FiTrendingUp, color: 'from-green-500 to-emerald-600' },
              ].map((s, i) => (
                <motion.div key={i} whileHover={{ y: -4 }} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4`}><s.icon className="h-6 w-6 text-white" /></div>
                  <div className="text-3xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-sm font-medium text-gray-700 mt-1">{s.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
                </motion.div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Orders</h2>
                <div className="space-y-3">
                  {orders.slice(0, 6).map(order => (
                    <div key={order._id} className="flex items-center justify-between">
                      <div><p className="font-medium text-sm text-gray-900">{order.orderId}</p><p className="text-xs text-gray-500">{order.buyer?.name} → {order.artisan?.name}</p></div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-gray-900">LKR {order.totalAmount?.toLocaleString()}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.orderStatus] || 'bg-gray-100 text-gray-600'}`}>{order.orderStatus?.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Pending Verification</h2>
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
            </div>
          </motion.div>
        )}

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
            {buyerViewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {users.filter(u => u.role === 'buyer' && (!searchTerm || u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()))).map(u => (
                  <UserCard key={u._id} u={u} role="buyer" onView={() => setSelectedModal({ type: 'user', data: u })} onSuspend={() => handleSuspendUser(u._id)} onDelete={() => handleDeleteUser(u._id)} onLoginAs={() => handleLoginAs(u)} actionLoading={actionLoading} />
                ))}
              </div>
            ) : (
              <UserTable users={users.filter(u => u.role === 'buyer')} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onView={u => setSelectedModal({ type: 'user', data: u })} onSuspend={handleSuspendUser} onDelete={handleDeleteUser} onLoginAs={handleLoginAs} actionLoading={actionLoading} role="buyer" />
            )}
          </motion.div>
        )}

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
            {artisanViewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {users.filter(u => u.role === 'artisan' && (!searchTerm || u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()))).map(u => (
                  <UserCard key={u._id} u={u} role="artisan" onView={() => setSelectedModal({ type: 'user', data: u })} onViewStats={() => openArtisanStats(u)} onVerify={() => handleVerifyArtisan(u._id)} onSuspend={() => handleSuspendUser(u._id)} onDelete={() => handleDeleteUser(u._id)} onLoginAs={() => handleLoginAs(u)} actionLoading={actionLoading} />
                ))}
              </div>
            ) : (
              <UserTable users={users.filter(u => u.role === 'artisan')} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onView={u => setSelectedModal({ type: 'user', data: u })} onVerify={handleVerifyArtisan} onSuspend={handleSuspendUser} onDelete={handleDeleteUser} onLoginAs={handleLoginAs} onViewStats={openArtisanStats} actionLoading={actionLoading} role="artisan" />
            )}
          </motion.div>
        )}

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

        {activeTab === 'orders' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders Management</h1>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b"><div className="relative max-w-md"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" /><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search orders..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-indigo-400 outline-none text-sm" /></div></div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50"><tr>{['Order ID', 'Buyer', 'Artisan', 'Amount', 'Payment', 'Status', 'Date', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.filter(o => !searchTerm || o.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) || o.buyer?.name?.toLowerCase().includes(searchTerm.toLowerCase())).map(order => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{order.orderId}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.buyer?.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.artisan?.name}</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">LKR {order.totalAmount?.toLocaleString()}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${order.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' : order.paymentStatus === 'refunded' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.paymentStatus || 'pending'}</span></td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.orderStatus] || 'bg-gray-100 text-gray-600'}`}>{order.orderStatus?.replace(/_/g, ' ')}</span></td>
                        <td className="px-4 py-3 text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3"><div className="flex items-center space-x-2">
                          <button onClick={() => setSelectedModal({ type: 'order', data: order })} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><FiEye className="h-3.5 w-3.5" /></button>
                          {order.paymentStatus !== 'refunded' && <button onClick={() => handleRefund(order._id)} className="px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg">Refund</button>}
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setSelectedModal(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
                <h2 className="text-lg font-bold text-gray-900">{selectedModal.type === 'user' ? 'User Details' : 'Order Details'}</h2>
                <button onClick={() => setSelectedModal(null)} className="p-2 hover:bg-gray-100 rounded-full"><FiX /></button>
              </div>
              <div className="p-6">
                {selectedModal.type === 'user' && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">{selectedModal.data.name?.[0]}</div>
                      <div>
                        <p className="text-xl font-bold text-gray-900">{selectedModal.data.name}</p>
                        <p className="text-gray-500 text-sm">{selectedModal.data.email}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selectedModal.data.role === 'artisan' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{selectedModal.data.role}</span>
                      </div>
                    </div>
                    {[['Phone', selectedModal.data.phone], ['Location', selectedModal.data.location], ['Joined', new Date(selectedModal.data.createdAt).toLocaleDateString()], ['Status', selectedModal.data.isSuspended ? '⛔ Suspended' : '✅ Active'], ['Verified', selectedModal.data.isVerified ? '✅ Yes' : '❌ No']].map(([k, v]) => v && (
                      <div key={k} className="flex justify-between py-2 border-b"><span className="text-sm text-gray-500">{k}</span><span className="text-sm font-medium text-gray-900">{v}</span></div>
                    ))}
                    {selectedModal.data.role === 'artisan' && selectedModal.data.artisanProfile?.businessName && (
                      <div className="mt-4 p-4 bg-amber-50 rounded-xl">
                        <p className="font-semibold text-amber-900">{selectedModal.data.artisanProfile.businessName}</p>
                        <p className="text-sm text-amber-700 mt-1">{selectedModal.data.artisanProfile.description}</p>
                      </div>
                    )}
                    {selectedModal.data.role === 'buyer' && selectedModal.data.buyerProfile?.shippingAddresses?.[0] && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                        <p className="text-xs font-medium text-blue-600 mb-2 font-mono uppercase tracking-wider">Default Shipping Address</p>
                        <p className="text-sm text-blue-900 font-bold">{selectedModal.data.buyerProfile.shippingAddresses[0].name}</p>
                        <p className="text-sm text-blue-800">{selectedModal.data.buyerProfile.shippingAddresses[0].address}</p>
                        <p className="text-sm text-blue-800">{selectedModal.data.buyerProfile.shippingAddresses[0].city}, {selectedModal.data.buyerProfile.shippingAddresses[0].state}</p>
                      </div>
                    )}
                    {selectedModal.data.role !== 'admin' && (
                      <button onClick={() => { setSelectedModal(null); handleLoginAs(selectedModal.data); }} className="w-full mt-4 flex items-center justify-center space-x-2 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium">
                        <FiLogIn className="h-4 w-4" /><span>Login as {selectedModal.data.name}</span>
                      </button>
                    )}
                  </div>
                )}
                {selectedModal.type === 'order' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {[['Order ID', selectedModal.data.orderId], ['Amount', `LKR ${selectedModal.data.totalAmount?.toLocaleString()}`], ['Buyer', selectedModal.data.buyer?.name], ['Artisan', selectedModal.data.artisan?.name], ['Status', selectedModal.data.orderStatus?.replace(/_/g, ' ')], ['Payment', selectedModal.data.paymentStatus], ['Date', new Date(selectedModal.data.createdAt).toLocaleString()]].map(([k, v]) => (
                        <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium text-gray-900 text-sm">{v}</p></div>
                      ))}
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-xs font-medium text-gray-600 mb-3 font-mono uppercase tracking-wider">Order Items</p>
                      <div className="space-y-3">
                        {selectedModal.data.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center space-x-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
                            <img src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded-lg object-cover" alt="" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">{item.product?.name}</p>
                              <p className="text-xs text-gray-500">Qty: {item.quantity} × LKR {item.price?.toLocaleString()}</p>
                              {item.customization?.options?.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {item.customization.options.map((opt, oidx) => (
                                    <span key={oidx} className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">{opt.name}: {opt.value}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="text-sm font-bold text-gray-900">LKR {item.totalPrice?.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedModal.data.shippingAddress && (
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-xs font-medium text-gray-600 mb-2">SHIPPING ADDRESS</p>
                        <p className="text-sm text-gray-900">{selectedModal.data.shippingAddress.name}</p>
                        <p className="text-sm text-gray-600">{selectedModal.data.shippingAddress.address}</p>
                        <p className="text-sm text-gray-600">{selectedModal.data.shippingAddress.city}, {selectedModal.data.shippingAddress.district}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">UPDATE STATUS</p>
                      <select onChange={e => { handleUpdateOrderStatus(selectedModal.data._id, e.target.value); setSelectedModal(null); }} defaultValue="" className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-400 outline-none bg-white text-sm">
                        <option value="" disabled>Select new status...</option>
                        {['pending', 'confirmed', 'processing', 'order ready', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {artisanStatsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setArtisanStatsModal(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
                <div><h2 className="text-lg font-bold text-gray-900">{artisanStatsModal.name} — Financial Board</h2><p className="text-xs text-gray-500">{artisanStatsModal.artisanProfile?.businessName}</p></div>
                <button onClick={() => setArtisanStatsModal(null)} className="p-2 hover:bg-gray-100 rounded-full"><FiX /></button>
              </div>
              <div className="p-6">
                {loadingArtisanStats ? (
                  <div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mx-auto mb-3" /><p className="text-gray-500 text-sm">Loading stats...</p></div>
                ) : artisanStats ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[{ label: 'Total Orders', value: artisanStats.total, color: 'bg-blue-50 text-blue-700' }, { label: 'Delivered', value: artisanStats.delivered, color: 'bg-green-50 text-green-700' }, { label: 'Cancelled', value: artisanStats.cancelled, color: 'bg-red-50 text-red-700' }, { label: 'Pending', value: artisanStats.pending, color: 'bg-yellow-50 text-yellow-700' }].map(s => (
                        <div key={s.label} className={`${s.color} rounded-xl p-4 text-center`}><p className="text-2xl font-bold">{s.value}</p><p className="text-xs mt-1 opacity-80">{s.label}</p></div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-emerald-50 rounded-xl p-4"><p className="text-xs text-emerald-600 font-medium">Total Revenue</p><p className="text-xl font-bold text-emerald-800">LKR {artisanStats.revenue?.toLocaleString()}</p></div>
                      <div className="bg-purple-50 rounded-xl p-4"><p className="text-xs text-purple-600 font-medium">Platform Commission (10%)</p><p className="text-xl font-bold text-purple-800">LKR {artisanStats.commission?.toLocaleString()}</p></div>
                    </div>
                    {artisanStats.monthly?.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center justify-between">
                          <span>Monthly Breakdown</span>
                          <span className="text-xs font-normal text-gray-400 font-mono">FINANCIAL RECORDS</span>
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50"><tr>{['Month', 'Orders', 'Qty', 'Revenue (LKR)', 'Commission (LKR)'].map(h => <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500">{h}</th>)}</tr></thead>
                            <tbody className="divide-y divide-gray-100">
                              {artisanStats.monthly.map(m => (
                                <tr key={m.month} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 font-medium text-gray-900">{m.month}</td>
                                  <td className="px-3 py-2 text-gray-600">{m.count}</td>
                                  <td className="px-3 py-2 text-gray-600">{m.quantity}</td>
                                  <td className="px-3 py-2 text-gray-900 font-bold">{m.revenue?.toLocaleString()}</td>
                                  <td className="px-3 py-2 text-purple-700 font-medium">{m.commission?.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {artisanStats.products?.length > 0 && (
                      <div className="mt-8">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
                          <span>Products List</span>
                          <span className="text-xs font-normal text-gray-400 font-mono italic">FETCHED FROM STORE</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {artisanStats.products.map(p => (
                            <div key={p._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <img src={p.images?.[0]?.url || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded-lg object-cover" alt="" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{p.category}</p>
                                <div className="flex items-center mt-1 space-x-2 text-xs">
                                  <span className="text-indigo-600 font-bold">LKR {p.price?.toLocaleString()}</span>
                                  <span className="text-gray-400">·</span>
                                  <span className={p.stock > 10 ? 'text-green-600' : 'text-orange-600'}>{p.stock} in stock</span>
                                </div>
                              </div>
                              <span className={`w-2 h-2 rounded-full ${p.isActive ? 'bg-green-500' : 'bg-gray-300'}`} title={p.isActive ? 'Active' : 'Inactive'} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : <p className="text-center text-gray-500 py-8">No data available</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const UserCard = ({ u, role, onView, onViewStats, onVerify, onSuspend, onDelete, onLoginAs, actionLoading }) => (
  <div className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow">
    <div className="flex items-center space-x-3 mb-3">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${role === 'artisan' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>{u.name?.[0]}</div>
      <div className="flex-1 min-w-0"><p className="font-semibold text-gray-900 truncate">{u.name}</p><p className="text-xs text-gray-500 truncate">{role === 'artisan' ? (u.artisanProfile?.businessName || u.email) : u.email}</p></div>
    </div>
    <div className="flex flex-wrap gap-1 mb-2">
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isSuspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{u.isSuspended ? 'Suspended' : 'Active'}</span>
      {role === 'artisan' && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isVerified ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{u.isVerified ? '✓ Verified' : 'Pending'}</span>}
    </div>
    {role === 'artisan' && u.artisanProfile?.stats && (
      <div className="grid grid-cols-2 gap-2 my-1">
        <div className="bg-gray-50 p-2 rounded-lg text-center">
          <p className="text-[10px] text-gray-500 uppercase">Rev.</p>
          <p className="text-xs font-bold text-gray-900">LKR {u.artisanProfile.stats.totalRevenue?.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 p-2 rounded-lg text-center">
          <p className="text-[10px] text-gray-500 uppercase">Orders</p>
          <p className="text-xs font-bold text-gray-900">{u.artisanProfile.stats.totalOrders || 0}</p>
        </div>
      </div>
    )}
    {u.location && <p className="text-xs text-gray-400 mb-2">📍 {u.location}</p>}
    <div className="flex items-center flex-wrap gap-1 mt-3">
      <button onClick={onView} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="View"><FiEye className="h-3.5 w-3.5" /></button>
      {role === 'artisan' && onViewStats && <button onClick={onViewStats} className="p-1.5 text-purple-500 hover:bg-purple-50 rounded-lg" title="Stats"><FiBarChart2 className="h-3.5 w-3.5" /></button>}
      {role === 'artisan' && !u.isVerified && <button onClick={onVerify} disabled={actionLoading === u._id} className="px-2 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded-lg disabled:opacity-50">Verify</button>}
      <button onClick={onSuspend} disabled={actionLoading === u._id} className={`px-2 py-1 text-xs rounded-lg ${u.isSuspended ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>{u.isSuspended ? 'Unsuspend' : 'Suspend'}</button>
      <button onClick={onLoginAs} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg" title="Login as"><FiLogIn className="h-3.5 w-3.5" /></button>
      <button onClick={onDelete} disabled={actionLoading === u._id} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 className="h-3.5 w-3.5" /></button>
    </div>
  </div>
);

const UserTable = ({ users, searchTerm, setSearchTerm, onView, onVerify, onSuspend, onDelete, onLoginAs, onViewStats, actionLoading, role }) => {
  const filtered = users.filter(u => !searchTerm || u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="relative max-w-md flex-1"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" /><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={`Search ${role}s...`} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-indigo-400 outline-none text-sm" /></div>
        <span className="ml-4 text-sm text-gray-500">{filtered.length} {role}s</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50"><tr>{['Name', 'Email', 'Location', role === 'artisan' ? 'Revenue' : 'Joined', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(u => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">{u.name?.[0]}</div><p className="font-medium text-sm text-gray-900">{u.name}</p></div></td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{u.location || '—'}</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-700">{role === 'artisan' ? `LKR ${u.artisanProfile?.stats?.totalRevenue?.toLocaleString() || 0}` : new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium"><div className="flex flex-col space-y-1"><span className={`px-2 py-0.5 rounded-full text-xs w-fit font-medium ${u.isSuspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{u.isSuspended ? 'Suspended' : 'Active'}</span>{role === 'artisan' && <span className={`px-2 py-0.5 rounded-full text-xs w-fit font-medium ${u.isVerified ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{u.isVerified ? 'Verified' : 'Pending'}</span>}</div></td>
                <td className="px-4 py-3"><div className="flex items-center space-x-2">
                  <button onClick={() => onView(u)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><FiEye className="h-3.5 w-3.5" /></button>
                  {role === 'artisan' && onViewStats && <button onClick={() => onViewStats(u)} className="p-1.5 text-purple-500 hover:bg-purple-50 rounded-lg" title="Stats"><FiBarChart2 className="h-3.5 w-3.5" /></button>}
                  {role === 'artisan' && !u.isVerified && <button onClick={() => onVerify(u._id)} disabled={actionLoading === u._id} className="px-2 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded-lg disabled:opacity-50">Verify</button>}
                  <button onClick={() => onSuspend(u._id)} disabled={actionLoading === u._id} className={`px-2 py-1 text-xs rounded-lg ${u.isSuspended ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'}`}>{u.isSuspended ? 'Unsuspend' : 'Suspend'}</button>
                  {onLoginAs && <button onClick={() => onLoginAs(u)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg" title="Login as"><FiLogIn className="h-3.5 w-3.5" /></button>}
                  <button onClick={() => onDelete(u._id)} disabled={actionLoading === u._id} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 className="h-3.5 w-3.5" /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-400">No {role}s found</div>}
      </div>
    </div>
  );
};

export default AdminDashboard;
