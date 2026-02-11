// pages/Dashboard.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiPackage, 
  FiShoppingBag, 
  FiHeart, 
  FiUser, 
  FiSettings, 
  FiLogOut,
  FiDollarSign,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiTruck,
  FiHome,
  FiStar,
  FiMessageCircle,
  FiBell,
  FiEdit,
  FiPlus
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

const Dashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { 
      label: 'Total Orders', 
      value: '24', 
      change: '+12%', 
      icon: <FiShoppingBag />, 
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    { 
      label: 'Revenue', 
      value: '₹45,699', 
      change: '+23%', 
      icon: <FiDollarSign />, 
      color: 'from-green-500 to-green-600',
      bg: 'bg-green-50',
      textColor: 'text-green-600'
    },
    { 
      label: 'Wishlist', 
      value: '12', 
      change: '+5%', 
      icon: <FiHeart />, 
      color: 'from-red-500 to-red-600',
      bg: 'bg-red-50',
      textColor: 'text-red-600'
    },
    { 
      label: 'Products', 
      value: '8', 
      change: '+2', 
      icon: <FiPackage />, 
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
  ];

  const recentOrders = [
    { id: 'ORD-2024-001', date: 'Feb 10, 2024', total: 2499, status: 'Delivered', items: 2 },
    { id: 'ORD-2024-002', date: 'Feb 8, 2024', total: 3899, status: 'Shipped', items: 1 },
    { id: 'ORD-2024-003', date: 'Feb 5, 2024', total: 1299, status: 'Processing', items: 3 },
    { id: 'ORD-2024-004', date: 'Feb 3, 2024', total: 5299, status: 'Confirmed', items: 2 },
  ];

  const wishlistItems = [
    { id: 1, name: 'Handcrafted Ceramic Vase', price: 1899, artisan: 'Clay Creations', image: 'https://images.unsplash.com/photo-1565193564382-fb8bb0b9e5b4?w=200' },
    { id: 2, name: 'Silver Filigree Earrings', price: 2450, artisan: 'Silver Smith', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=200' },
  ];

  const activities = [
    { id: 1, action: 'Order placed', orderId: 'ORD-2024-005', time: '2 hours ago', status: 'success' },
    { id: 2, action: 'Product reviewed', product: 'Wooden Bowl Set', time: '1 day ago', status: 'info' },
    { id: 3, action: 'Wishlist updated', time: '2 days ago', status: 'info' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2">
              Welcome back, {user?.name?.split(' ')[0] || 'Artisan'}!
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your shop today.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mt-4 md:mt-0 flex items-center space-x-3"
          >
            <button className="relative p-2 text-gray-600 hover:text-primary hover:bg-white rounded-lg transition-colors">
              <FiBell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 text-gray-600 hover:text-primary hover:bg-white rounded-lg transition-colors">
              <FiMessageCircle className="h-5 w-5" />
            </button>
            <Link
              to="/settings"
              className="px-4 py-2 bg-white text-gray-700 rounded-xl hover:shadow-md transition-all flex items-center space-x-2"
            >
              <FiSettings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                  <div className={`${stat.textColor} text-xl`}>{stat.icon}</div>
                </div>
                <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {stat.change}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Recent Orders & Wishlist */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Orders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <FiShoppingBag className="h-5 w-5 mr-2 text-primary" />
                  Recent Orders
                </h2>
                <Link to="/orders" className="text-primary hover:text-primary-dark text-sm font-medium flex items-center">
                  View All
                  <FiTrendingUp className="h-4 w-4 ml-1" />
                </Link>
              </div>

              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                        <FiPackage className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{order.id}</p>
                        <p className="text-sm text-gray-500">{order.date} • {order.items} items</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹{order.total}</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium
                        ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : ''}
                        ${order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' : ''}
                        ${order.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${order.status === 'Confirmed' ? 'bg-purple-100 text-purple-700' : ''}
                      `}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Wishlist */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <FiHeart className="h-5 w-5 mr-2 text-red-500" />
                  My Wishlist
                </h2>
                <Link to="/wishlist" className="text-primary hover:text-primary-dark text-sm font-medium">
                  View All
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {wishlistItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm mb-1">{item.name}</p>
                      <p className="text-xs text-gray-500 mb-2">{item.artisan}</p>
                      <p className="font-bold text-primary">₹{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Profile & Activity */}
          <div className="space-y-8">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl shadow-xl p-6 text-white"
            >
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-2xl font-bold">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">{user?.name || 'Artisan User'}</h3>
                  <p className="text-gray-300 text-sm flex items-center">
                    <FiUser className="h-3 w-3 mr-1" />
                    {user?.role === 'artisan' ? 'Artisan Seller' : 'Premium Buyer'}
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Member since</span>
                  <span className="font-semibold">Jan 2024</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total orders</span>
                  <span className="font-semibold">24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total spent</span>
                  <span className="font-semibold">₹45,699</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Reviews</span>
                  <span className="font-semibold">12</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button className="flex-1 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors text-sm font-medium">
                  Edit Profile
                </button>
                <button className="px-4 py-2 bg-primary rounded-xl hover:bg-primary-dark transition-colors text-sm font-medium">
                  Upgrade
                </button>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-sm p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <FiClock className="h-5 w-5 mr-2 text-primary" />
                Recent Activity
              </h2>

              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                      ${activity.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}
                    `}>
                      {activity.status === 'success' ? <FiCheckCircle className="h-4 w-4" /> : <FiClock className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-6 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium">
                View All Activity
              </button>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-sm p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button className="p-4 bg-gray-50 rounded-xl hover:bg-primary hover:text-white transition-colors group">
                  <FiPlus className="h-5 w-5 mx-auto mb-2 text-gray-600 group-hover:text-white" />
                  <span className="text-xs font-medium text-gray-700 group-hover:text-white">Add Product</span>
                </button>
                <button className="p-4 bg-gray-50 rounded-xl hover:bg-primary hover:text-white transition-colors group">
                  <FiEdit className="h-5 w-5 mx-auto mb-2 text-gray-600 group-hover:text-white" />
                  <span className="text-xs font-medium text-gray-700 group-hover:text-white">Edit Profile</span>
                </button>
                <button className="p-4 bg-gray-50 rounded-xl hover:bg-primary hover:text-white transition-colors group">
                  <FiPackage className="h-5 w-5 mx-auto mb-2 text-gray-600 group-hover:text-white" />
                  <span className="text-xs font-medium text-gray-700 group-hover:text-white">Track Order</span>
                </button>
                <button className="p-4 bg-gray-50 rounded-xl hover:bg-primary hover:text-white transition-colors group">
                  <FiStar className="h-5 w-5 mx-auto mb-2 text-gray-600 group-hover:text-white" />
                  <span className="text-xs font-medium text-gray-700 group-hover:text-white">Write Review</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;