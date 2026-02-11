// components/Navbar.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiSearch, 
  FiShoppingCart, 
  FiHeart, 
  FiUser, 
  FiMenu, 
  FiX,
  FiLogOut,
  FiSettings,
  FiPackage,
  FiChevronDown
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ user, setUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${searchQuery}`);
      setSearchQuery('');
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
    setShowUserMenu(false);
  };

  return (
    <>
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'bg-white/90 backdrop-blur-xl shadow-lg' 
            : 'bg-gradient-to-b from-black/20 to-transparent'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dark rounded-xl rotate-6"></div>
                <div className="absolute inset-0 bg-white rounded-xl flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">MC</span>
                </div>
              </div>
              <span className={`text-xl font-serif font-bold transition-colors ${
                isScrolled ? 'text-primary-dark' : 'text-white'
              }`}>
                MadioCraft
              </span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <NavLink to="/" isScrolled={isScrolled}>Home</NavLink>
              <NavLink to="/products" isScrolled={isScrolled}>Products</NavLink>
              <NavLink to="/artisans" isScrolled={isScrolled}>Artisans</NavLink>
              <NavLink to="/categories" isScrolled={isScrolled}>Categories</NavLink>
              
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative group">
                <input
                  type="text"
                  placeholder="Search treasures..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-64 py-2.5 pl-11 pr-4 rounded-full text-sm transition-all duration-300 ${
                    isScrolled
                      ? 'bg-gray-100 border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20'
                      : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/70 focus:bg-white/20'
                  }`}
                />
                <FiSearch className={`absolute left-4 top-3 h-4 w-4 ${
                  isScrolled ? 'text-gray-400' : 'text-white/70'
                }`} />
              </form>

              {/* User Actions */}
              <div className="flex items-center space-x-6">
                <button className={`relative transition-colors ${
                  isScrolled ? 'text-gray-700 hover:text-primary' : 'text-white hover:text-primary-light'
                }`}>
                  <FiHeart className="h-5 w-5" />
                </button>
                
                <button 
                  onClick={() => navigate('/cart')}
                  className={`relative transition-colors ${
                    isScrolled ? 'text-gray-700 hover:text-primary' : 'text-white hover:text-primary-light'
                  }`}
                >
                  <FiShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-primary to-primary-dark text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                    3
                  </span>
                </button>

                {user ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 group"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0)}
                      </div>
                      <FiChevronDown className={`h-4 w-4 transition-transform ${
                        showUserMenu ? 'rotate-180' : ''
                      } ${isScrolled ? 'text-gray-700' : 'text-white'}`} />
                    </button>

                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                        >
                          <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
                            <p className="font-semibold text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                          <div className="p-2">
                            <MenuItem to="/dashboard" icon={<FiPackage />} onClick={() => setShowUserMenu(false)}>
                              Dashboard
                            </MenuItem>
                            <MenuItem to="/profile" icon={<FiUser />} onClick={() => setShowUserMenu(false)}>
                              Profile
                            </MenuItem>
                            <MenuItem to="/settings" icon={<FiSettings />} onClick={() => setShowUserMenu(false)}>
                              Settings
                            </MenuItem>
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            >
                              <FiLogOut className="h-4 w-4" />
                              <span>Logout</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Link
                      to="/login"
                      className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                        isScrolled
                          ? 'text-gray-700 hover:text-primary hover:bg-gray-100'
                          : 'text-white hover:bg-white/20'
                      }`}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="px-5 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full text-sm font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                      Join Free
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ${
                isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
              }`}
            >
              {isOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-x-0 top-20 z-40 bg-white shadow-2xl rounded-b-3xl overflow-hidden md:hidden"
          >
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <MobileLink to="/" onClick={() => setIsOpen(false)}>Home</MobileLink>
                <MobileLink to="/products" onClick={() => setIsOpen(false)}>Products</MobileLink>
                <MobileLink to="/artisans" onClick={() => setIsOpen(false)}>Artisans</MobileLink>
                <MobileLink to="/categories" onClick={() => setIsOpen(false)}>Categories</MobileLink>
              </div>
              
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search treasures..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-3 pl-11 pr-4 bg-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
                />
                <FiSearch className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
              </form>

              <div className="flex items-center justify-between pt-4 border-t">
                {user ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-3 w-full">
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium text-center hover:bg-gray-50"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium text-center"
                    >
                      Join Free
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Helper Components
const NavLink = ({ to, children, isScrolled }) => (
  <Link
    to={to}
    className={`text-sm font-medium transition-colors hover:text-primary relative group ${
      isScrolled ? 'text-gray-700' : 'text-white'
    }`}
  >
    {children}
    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary-dark transition-all group-hover:w-full"></span>
  </Link>
);

const MobileLink = ({ to, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="block py-3 px-4 text-gray-700 hover:bg-primary/5 rounded-xl transition-colors"
  >
    {children}
  </Link>
);

const MenuItem = ({ to, icon, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
  >
    <span className="text-gray-500">{icon}</span>
    <span>{children}</span>
  </Link>
);

export default Navbar;