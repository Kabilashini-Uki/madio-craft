// pages/AdminPanel.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiUsers, FiPackage, FiShoppingBag, FiDollarSign,
  FiUserCheck, FiUserX, FiCheckCircle, FiXCircle,
  FiAlertCircle, FiStar, FiClock, FiTrendingUp,
  FiSearch, FiFilter, FiEye, FiEdit2, FiTrash2,
  FiShield, FiAward, FiBarChart2, FiSettings,
  FiMessageCircle, FiHome, FiLogOut, FiMenu,
  FiDownload, FiUpload, FiMail, FiPhone,
  FiMapPin, FiCalendar, FiMoreVertical,
  FiPlus, FiRefreshCw, FiCreditCard,
  FiTruck, FiCheck, FiX, FiLogIn
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: { total: 0, artisans: 0, buyers: 0, newToday: 0 },
    products: { total: 0, active: 0, pending: 0, lowStock: 0 },
    orders: { total: 0, pending: 0, completed: 0, revenue: 0 },
    disputes: { total: 0, open: 0, resolved: 0 }
  });
  
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // Check if user is admin
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin') {
      toast.error('Access denied. Admin only.');
      navigate('/');
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch stats
      const statsRes = await axios.get(`${process.env.REACT_APP_API_URL}/admin/stats`, { headers });
      setStats(statsRes.data.stats);
      
      // Fetch users
      const usersRes = await axios.get(`${process.env.REACT_APP_API_URL}/admin/users`, { headers });
      setUsers(usersRes.data.users);
      
      // Fetch products
      const productsRes = await axios.get(`${process.env.REACT_APP_API_URL}/admin/products`, { headers });
      setProducts(productsRes.data.products);
      
      // Fetch orders
      const ordersRes = await axios.get(`${process.env.REACT_APP_API_URL}/admin/orders`, { headers });
      setOrders(ordersRes.data.orders);
      
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load dashboard data');
      
      // Mock data for demo
      setMockData();
    } finally {
      setLoading(false);
    }
  };

  const setMockData = () => {
    setStats({
      users: { total: 1250, artisans: 345, buyers: 905, newToday: 23 },
      products: { total: 4567, active: 4123, pending: 444, lowStock: 89 },
      orders: { total: 892, pending: 67, completed: 756, revenue: 458900 },
      disputes: { total: 12, open: 5, resolved: 7 }
    });
    
    setUsers([
      { _id: '1', name: 'John Doe', email: 'john@example.com', role: 'buyer', isVerified: true, createdAt: new Date() },
      { _id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'artisan', isVerified: false, artisanProfile: { businessName: 'Pottery Studio' }, createdAt: new Date() },
      { _id: '3', name: 'Admin User', email: 'admin@example.com', role: 'admin', isVerified: true, createdAt: new Date() }
    ]);
    
    setProducts([
      { _id: '1', name: 'Ceramic Vase', artisan: { name: 'Jane Smith' }, category: 'pottery', price: 1899, stock: 15, isActive: true, images: [] },
      { _id: '2', name: 'Wooden Bowl', artisan: { name: 'Raj Kumar' }, category: 'woodwork', price: 2499, stock: 3, isActive: true, images: [] }
    ]);
    
    setOrders([
      { _id: '1', orderId: 'ORD-001', buyer: { name: 'John Doe' }, artisan: { name: 'Jane Smith' }, finalAmount: 1899, orderStatus: 'pending', paymentInfo: { status: 'pending' }, createdAt: new Date() }
    ]);
  };

  // User Management Functions
  const verifyArtisan = async (userId) => {
    setActionLoading(true);
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/admin/users/${userId}/verify`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      setUsers(users.map(u => 
        u._id === userId ? { ...u, isVerified: true } : u
      ));
      toast.success('Artisan verified successfully');
    } catch (error) {
      toast.error('Failed to verify artisan');
    } finally {
      setActionLoading(false);
    }
  };

  const suspendUser = async (userId) => {
    setActionLoading(true);
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/admin/users/${userId}/suspend`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      setUsers(users.map(u => 
        u._id === userId ? { ...u, isSuspended: !u.isSuspended } : u
      ));
      toast.success('User status updated');
    } catch (error) {
      toast.error('Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    setActionLoading(true);
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/admin/users/${userId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      setUsers(users.filter(u => u._id !== userId));
      toast.success('User deleted');
    } catch (error) {
      toast.error('Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  // Product Management Functions
  const toggleProductStatus = async (productId, isActive) => {
    setActionLoading(true);
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/admin/products/${productId}/status`,
        { isActive: !isActive },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      setProducts(products.map(p => 
        p._id === productId ? { ...p, isActive: !isActive } : p
      ));
      toast.success(`Product ${!isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update product');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    setActionLoading(true);
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/admin/products/${productId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      setProducts(products.filter(p => p._id !== productId));
      toast.success('Product deleted');
    } catch (error) {
      toast.error('Failed to delete product');
    } finally {
      setActionLoading(false);
    }
  };

  // Order Management Functions
  const updateOrderStatus = async (orderId, status) => {
    setActionLoading(true);
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/admin/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      setOrders(orders.map(o => 
        o._id === orderId ? { ...o, orderStatus: status } : o
      ));
      toast.success(`Order status updated to ${status}`);
    } catch (error) {
      toast.error('Failed to update order');
    } finally {
      setActionLoading(false);
    }
  };

  const processRefund = async (orderId) => {
    if (!window.confirm('Process refund for this order?')) return;
    
    setActionLoading(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/admin/orders/${orderId}/refund`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      setOrders(orders.map(o => 
        o._id === orderId ? { ...o, paymentInfo: { ...o.paymentInfo, status: 'refunded' } } : o
      ));
      toast.success('Refund processed');
    } catch (error) {
      toast.error('Failed to process refund');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter functions
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'verified' && user.isVerified) ||
      (filterStatus === 'unverified' && !user.isVerified) ||
      (filterStatus === 'suspended' && user.isSuspended);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && product.isActive) ||
      (filterStatus === 'inactive' && !product.isActive);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ width: sidebarOpen ? 280 : 80 }}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="bg-gradient-to-b from-gray-900 to-gray-800 text-white fixed left-0 top-0 bottom-0 z-30 overflow-hidden shadow-2xl"
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-xl font-bold text-white">MC</span>
                </div>
                {sidebarOpen && (
                  <span className="text-xl font-serif font-bold text-white">
                    Admin Panel
                  </span>
                )}
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FiMenu className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-6">
            <div className="space-y-1 px-3">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: <FiHome /> },
                { id: 'users', label: 'Users', icon: <FiUsers />, count: stats.users.total },
                { id: 'artisans', label: 'Artisans', icon: <FiAward />, count: stats.users.artisans },
                { id: 'products', label: 'Products', icon: <FiPackage />, count: stats.products.total },
                { id: 'orders', label: 'Orders', icon: <FiShoppingBag />, count: stats.orders.total },
                { id: 'disputes', label: 'Disputes', icon: <FiAlertCircle />, count: stats.disputes.open },
                { id: 'settings', label: 'Settings', icon: <FiSettings /> }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    activeTab === item.id
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{item.icon}</span>
                    {sidebarOpen && <span className="font-medium">{item.label}</span>}
                  </div>
                  {sidebarOpen && item.count > 0 && (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      activeTab === item.id ? 'bg-white/20' : 'bg-gray-700'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* User Profile */}
          <div className="p-6 border-t border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-lg font-bold">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></div>
              </div>
              {sidebarOpen && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                    <p className="text-xs text-gray-400">Administrator</p>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                    title="Logout"
                  >
                    <FiLogOut className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all ${sidebarOpen ? 'ml-72' : 'ml-20'} p-8`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-900 capitalize">
              {activeTab} Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-white rounded-xl shadow-sm hover:shadow flex items-center space-x-2"
          >
            <FiRefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Users"
                value={stats.users.total}
                icon={<FiUsers />}
                color="bg-blue-500"
                subValue={`${stats.users.artisans} Artisans, ${stats.users.buyers} Buyers`}
                change={stats.users.newToday}
              />
              <StatCard
                title="Total Products"
                value={stats.products.total}
                icon={<FiPackage />}
                color="bg-green-500"
                subValue={`${stats.products.active} Active, ${stats.products.pending} Pending`}
                warning={stats.products.lowStock}
              />
              <StatCard
                title="Total Orders"
                value={stats.orders.total}
                icon={<FiShoppingBag />}
                color="bg-purple-500"
                subValue={`${stats.orders.completed} Completed, ${stats.orders.pending} Pending`}
                amount={stats.orders.revenue}
              />
              <StatCard
                title="Disputes"
                value={stats.disputes.total}
                icon={<FiAlertCircle />}
                color="bg-red-500"
                subValue={`${stats.disputes.open} Open, ${stats.disputes.resolved} Resolved`}
              />
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiShoppingBag className="mr-2 text-primary" />
                Recent Orders
              </h3>
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FiShoppingBag className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">#{order.orderId?.slice(-8)}</p>
                        <p className="text-xs text-gray-500">
                          {order.buyer?.name} • Rs{order.finalAmount}
                        </p>
                      </div>
                    </div>
                    <OrderStatusBadge status={order.orderStatus} />
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setActiveTab('orders')}
                className="w-full mt-4 px-4 py-2 text-primary hover:bg-primary/5 rounded-xl transition-colors text-sm font-medium"
              >
                View All Orders →
              </button>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
                  />
                </div>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Roles</option>
                  <option value="buyer">Buyers</option>
                  <option value="artisan">Artisans</option>
                  <option value="admin">Admins</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Status</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={user.avatar?.url || 'https://via.placeholder.com/40'}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-6 py-4">
                        <UserStatusBadge user={user} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <UserActions
                          user={user}
                          onVerify={verifyArtisan}
                          onSuspend={suspendUser}
                          onDelete={deleteUser}
                          loading={actionLoading}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Products</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onToggle={toggleProductStatus}
                  onDelete={deleteProduct}
                  loading={actionLoading}
                />
              ))}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Artisan</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">#{order.orderId?.slice(-8)}</p>
                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">{order.buyer?.name}</td>
                      <td className="px-6 py-4">{order.artisan?.name}</td>
                      <td className="px-6 py-4 font-medium">Rs{order.finalAmount}</td>
                      <td className="px-6 py-4">
                        <OrderStatusSelect
                          value={order.orderStatus}
                          onChange={(status) => updateOrderStatus(order._id, status)}
                          disabled={actionLoading}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <PaymentStatusBadge status={order.paymentInfo?.status} />
                      </td>
                      <td className="px-6 py-4">
                        {order.paymentInfo?.status === 'completed' && (
                          <button
                            onClick={() => processRefund(order._id)}
                            disabled={actionLoading}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="Process Refund"
                          >
                            <FiCreditCard className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Helper Components
const StatCard = ({ title, value, icon, color, subValue, change, warning, amount }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white`}>
        {icon}
      </div>
      {change > 0 && (
        <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
          +{change} today
        </span>
      )}
      {warning > 0 && (
        <span className="text-sm font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
          {warning} low stock
        </span>
      )}
    </div>
    <p className="text-sm text-gray-600 mb-1">{title}</p>
    <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
    {subValue && <p className="text-xs text-gray-500 mt-2">{subValue}</p>}
    {amount && <p className="text-xs text-green-600 mt-2">Revenue: Rs{amount.toLocaleString()}</p>}
  </div>
);

const RoleBadge = ({ role }) => {
  const styles = {
    admin: 'bg-purple-100 text-purple-700',
    artisan: 'bg-primary/10 text-primary',
    buyer: 'bg-blue-100 text-blue-700'
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[role] || styles.buyer}`}>
      {role}
    </span>
  );
};

const UserStatusBadge = ({ user }) => (
  <div className="flex flex-col space-y-1">
    {user.isVerified && (
      <span className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">
        <FiCheckCircle className="mr-1" /> Verified
      </span>
    )}
    {user.isSuspended && (
      <span className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs">
        <FiXCircle className="mr-1" /> Suspended
      </span>
    )}
    {!user.isVerified && !user.isSuspended && (
      <span className="flex items-center text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs">
        <FiClock className="mr-1" /> Pending
      </span>
    )}
  </div>
);

const UserActions = ({ user, onVerify, onSuspend, onDelete, loading }) => (
  <div className="flex items-center space-x-2">
    {user.role === 'artisan' && !user.isVerified && (
      <button
        onClick={() => onVerify(user._id)}
        disabled={loading}
        className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
        title="Verify Artisan"
      >
        <FiCheckCircle className="h-4 w-4" />
      </button>
    )}
    <button
      onClick={() => onSuspend(user._id)}
      disabled={loading}
      className={`p-2 rounded-lg ${user.isSuspended ? 'text-green-600 hover:bg-green-50' : 'text-orange-600 hover:bg-orange-50'} disabled:opacity-50`}
      title={user.isSuspended ? 'Unsuspend' : 'Suspend'}
    >
      {user.isSuspended ? <FiUserCheck className="h-4 w-4" /> : <FiUserX className="h-4 w-4" />}
    </button>
    <button
      onClick={() => onDelete(user._id)}
      disabled={loading}
      className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
      title="Delete User"
    >
      <FiTrash2 className="h-4 w-4" />
    </button>
  </div>
);

const ProductCard = ({ product, onToggle, onDelete, loading }) => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
    <div className="relative h-48">
      <img
        src={product.images?.[0]?.url || 'https://via.placeholder.com/400'}
        alt={product.name}
        className="w-full h-full object-cover"
      />
      <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${
        product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}>
        {product.isActive ? 'Active' : 'Inactive'}
      </span>
      {product.stock <= 5 && (
        <span className="absolute top-4 left-4 px-3 py-1 bg-red-500 text-white rounded-full text-xs">
          Low Stock: {product.stock}
        </span>
      )}
    </div>
    <div className="p-6">
      <h3 className="font-semibold text-gray-900">{product.name}</h3>
      <p className="text-sm text-gray-500">by {product.artisan?.name}</p>
      <div className="mt-2">
        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs">
          {product.category}
        </span>
      </div>
      <p className="text-lg font-bold text-gray-900 mt-4">Rs{product.price}</p>
      <p className="text-xs text-gray-500">Stock: {product.stock}</p>
      
      <div className="flex justify-end space-x-2 mt-4">
        <button
          onClick={() => onToggle(product._id, product.isActive)}
          disabled={loading}
          className={`p-2 rounded-lg ${
            product.isActive 
              ? 'text-orange-600 hover:bg-orange-50' 
              : 'text-green-600 hover:bg-green-50'
          } disabled:opacity-50`}
        >
          {product.isActive ? <FiXCircle className="h-4 w-4" /> : <FiCheckCircle className="h-4 w-4" />}
        </button>
        <button
          onClick={() => onDelete(product._id)}
          disabled={loading}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
        >
          <FiTrash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
);

const OrderStatusBadge = ({ status }) => {
  const styles = {
    delivered: 'bg-green-100 text-green-700',
    shipped: 'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    pending: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700'
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
};

const OrderStatusSelect = ({ value, onChange, disabled }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    className={`px-3 py-1 rounded-full text-xs font-medium border-0 ${
      value === 'delivered' ? 'bg-green-100 text-green-700' :
      value === 'shipped' ? 'bg-blue-100 text-blue-700' :
      value === 'processing' ? 'bg-purple-100 text-purple-700' :
      value === 'pending' ? 'bg-yellow-100 text-yellow-700' :
      'bg-red-100 text-red-700'
    }`}
  >
    <option value="pending">Pending</option>
    <option value="processing">Processing</option>
    <option value="shipped">Shipped</option>
    <option value="delivered">Delivered</option>
    <option value="cancelled">Cancelled</option>
  </select>
);

const PaymentStatusBadge = ({ status }) => {
  const styles = {
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    refunded: 'bg-purple-100 text-purple-700',
    failed: 'bg-red-100 text-red-700'
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
};

export default AdminDashboard;