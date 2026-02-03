import React from 'react';
import { FaBox, FaShoppingBag, FaHeart, FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';

const Dashboard = () => {
  const stats = [
    { label: 'Total Orders', value: '12', icon: <FaShoppingBag />, color: 'bg-blue-100 text-blue-600' },
    { label: 'Wishlist', value: '8', icon: <FaHeart />, color: 'bg-red-100 text-red-600' },
    { label: 'Products', value: '24', icon: <FaBox />, color: 'bg-green-100 text-green-600' },
    { label: 'Profile Views', value: '156', icon: <FaUser />, color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-primary-dark mb-8">Dashboard</h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-primary-dark mb-4">Recent Orders</h2>
              <div className="space-y-4">
                {[1, 2, 3].map((order) => (
                  <div key={order} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="font-semibold">Order #ORD{1000 + order}</p>
                      <p className="text-sm text-gray-600">Placed on Jan {order + 10}, 2024</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">₹{2500 + order * 500}</p>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        Delivered
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-primary-dark mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 hover:bg-primary-light rounded-lg transition-colors">
                  <FaBox className="h-5 w-5 text-primary" />
                  <span>Add New Product</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 hover:bg-primary-light rounded-lg transition-colors">
                  <FaCog className="h-5 w-5 text-primary" />
                  <span>Account Settings</span>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 hover:bg-red-50 rounded-lg transition-colors text-red-600">
                  <FaSignOutAlt className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Profile Summary */}
            <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Profile Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Member Since</span>
                  <span className="font-semibold">Jan 2024</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Spent</span>
                  <span className="font-semibold">₹12,500</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed Orders</span>
                  <span className="font-semibold">8</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;