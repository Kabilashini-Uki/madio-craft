import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiShoppingCart, FiUser, FiMenu, FiX, FiLogOut,
  FiSettings, FiPackage, FiHeart, FiChevronDown, FiRefreshCw
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import NotificationBell from './NotificationBell';
import toast from 'react-hot-toast'; // Add this import

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSwitchRole = async () => {
    try {
      const isInBuyerMode = user?.activeRole === 'buyer' || (user?.originalRole && user?.role === 'buyer');
      const mode = isInBuyerMode ? 'original' : 'buyer';
      const res = await api.post('/auth/switch-role', { mode });
      if (res.data.success) {
        const updated = { ...res.data.user };
        localStorage.setItem('user', JSON.stringify(updated));
        localStorage.setItem('token', res.data.token);
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error('Switch role failed:', err);
      toast.error('Could not switch role. Please try again.'); // Fixed toast usage
    }
  };

  const effectiveRole = user?.activeRole || user?.role;
  const canSwitchRole = user && (
    ['artisan', 'admin'].includes(user.role) ||
    ['artisan', 'admin'].includes(user.originalRole || '')
  );
  const isInBuyerMode = effectiveRole === 'buyer' && (user?.originalRole || user?.role !== 'buyer');
  const switchLabel = isInBuyerMode
    ? `Switch back to ${user.originalRole || user.role}`
    : 'Switch to Buyer mode';

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Products', href: '/products' },
    { label: 'Artisans', href: '/artisans' },
  ];

  const isActive = (href) => location.pathname === href;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-lg' : 'bg-white/95 backdrop-blur-sm'
      }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-xl font-serif font-bold text-gray-900">MadioCraft</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map(link => (
              <Link key={link.href} to={link.href}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${isActive(link.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                  }`}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            {/* Cart — show for buyers and buyer-mode users */}
            {user && effectiveRole === 'buyer' && (
              <Link to="/cart" className="relative p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-xl transition-colors">
                <FiShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Notification Bell — visible to all logged-in users */}
            {user && <NotificationBell />}

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                    {user.avatar?.url ? (
                      <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-semibold text-sm">{user.name?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <span className="hidden lg:block text-sm font-medium text-gray-700">{user.name?.split(' ')[0]}</span>
                  <FiChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full capitalize">{user.activeRole === 'buyer' && user.originalRole ? `${user.originalRole} (buyer mode)` : user.role}</span>
                      </div>
                      <div className="py-1">
                        <Link to="/dashboard" className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                          <FiUser className="h-4 w-4" /><span>Dashboard</span>
                        </Link>
                        {/* Show orders/cart only in buyer mode or for actual buyers */}
                        {(effectiveRole === 'buyer') && (
                          <Link to="/dashboard" className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                            <FiPackage className="h-4 w-4" /><span>My Orders</span>
                          </Link>
                        )}
                        {(effectiveRole === 'buyer') && (
                          <Link to="/cart" className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                            <FiHeart className="h-4 w-4" /><span>Wishlist</span>
                          </Link>
                        )}
                        {/* Admin panel — only in artisan/admin mode (not buyer mode) */}
                        {(user.role === 'admin' || user.originalRole === 'admin') && !isInBuyerMode && (
                          <Link to="/admin" className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                            <FiSettings className="h-4 w-4" /><span>Admin Panel</span>
                          </Link>
                        )}
                      </div>
                      {canSwitchRole && (
                        <div className="border-t border-gray-100 pt-1">
                          <button onClick={handleSwitchRole}
                            className="flex items-center space-x-3 px-4 py-2.5 text-blue-600 hover:bg-blue-50 w-full transition-colors">
                            <FiRefreshCw className="h-4 w-4" />
                            <span>{switchLabel}</span>
                          </button>
                        </div>
                      )}
                      <div className="border-t border-gray-100 pt-1">
                        <button onClick={handleLogout}
                          className="flex items-center space-x-3 px-4 py-2.5 text-red-600 hover:bg-red-50 w-full transition-colors">
                          <FiLogOut className="h-4 w-4" /><span>Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login"
                  className="px-4 py-2 text-gray-700 font-medium hover:text-primary transition-colors">
                  Login
                </Link>
                <Link to="/register"
                  className="px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              {mobileMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden pb-4 border-t border-gray-100 mt-2"
            >
              <div className="pt-4 space-y-1">
                {navLinks.map(link => (
                  <Link key={link.href} to={link.href}
                    className={`block px-4 py-3 rounded-xl font-medium transition-colors ${isActive(link.href) ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'
                      }`}>
                    {link.label}
                  </Link>
                ))}
                {!user && (
                  <div className="pt-2 space-y-2">
                    <Link to="/login" className="block w-full text-center py-3 border-2 border-gray-300 rounded-xl font-medium text-gray-700">Login</Link>
                    <Link to="/register" className="block w-full text-center py-3 bg-primary text-white rounded-xl font-medium">Sign Up</Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;