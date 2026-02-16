// components/Navbar.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  FiChevronDown,
  FiHome,
  FiGrid,
  FiUsers,
  FiLayers,
  FiShield
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ user, setUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);

  // Get current path for active link highlighting
  const currentPath = location.pathname;

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

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

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

  // Navigation items with paths and icons
  const navItems = [
    { path: '/', label: 'Home', icon: <FiHome className="h-4 w-4" /> },
    { path: '/products', label: 'Products', icon: <FiGrid className="h-4 w-4" /> },
    { path: '/artisans', label: 'Artisans', icon: <FiUsers className="h-4 w-4" /> },
    { path: '/categories', label: 'Categories', icon: <FiLayers className="h-4 w-4" /> }
  ];

  // Check if a path is active (handles nested routes)
  const isActive = (path) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  // Glass effect classes based on scroll state
  const glassClasses = isScrolled
    ? 'bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20'
    : 'bg-black/20 backdrop-blur-sm border-b border-white/10';

  const textColor = isScrolled ? 'text-gray-700' : 'text-white';
  const textColorMuted = isScrolled ? 'text-gray-500' : 'text-white/70';
  const borderColor = isScrolled ? 'border-gray-200' : 'border-white/20';
  const hoverBg = isScrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10';

  return (
    <>
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${glassClasses}`}
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
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center">
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
              {navItems.map((item) => (
                <NavLink 
                  key={item.path}
                  to={item.path} 
                  isScrolled={isScrolled}
                  isActive={isActive(item.path)}
                >
                  <span className="flex items-center space-x-1">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                </NavLink>
              ))}
              
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative group">
                <input
                  type="text"
                  placeholder="Search treasures..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-64 py-2.5 pl-11 pr-4 rounded-full text-sm transition-all duration-300 ${
                    isScrolled
                      ? 'bg-gray-100/80 backdrop-blur-sm border border-gray-200 focus:bg-white/90 focus:ring-2 focus:ring-primary/20'
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
                  isScrolled ? 'text-gray-700 hover:text-primary' : 'text-white/90 hover:text-white'
                }`}>
                  <FiHeart className="h-5 w-5" />
                </button>
                
                <button 
                  onClick={() => navigate('/cart')}
                  className={`relative transition-colors ${
                    isScrolled ? 'text-gray-700 hover:text-primary' : 'text-white/90 hover:text-white'
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
                      className={`flex items-center space-x-2 group p-1.5 rounded-full transition-all ${
                        isScrolled 
                          ? 'hover:bg-gray-100/80 backdrop-blur-sm' 
                          : 'hover:bg-white/10'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-semibold shadow-lg">
                        {user.name?.charAt(0) || 'U'}
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
                          className="absolute right-0 mt-3 w-64 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden"
                        >
                          <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-primary/5 to-transparent">
                            <p className="font-semibold text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            {user.role === 'admin' && (
                              <span className="inline-flex items-center mt-2 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                                <FiShield className="h-3 w-3 mr-1" />
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="p-2">
                            <MenuItem 
                              to="/dashboard" 
                              icon={<FiPackage />} 
                              onClick={() => setShowUserMenu(false)}
                              isActive={isActive('/dashboard')}
                            >
                              Dashboard
                            </MenuItem>
                            <MenuItem 
                              to="/profile" 
                              icon={<FiUser />} 
                              onClick={() => setShowUserMenu(false)}
                              isActive={isActive('/profile')}
                            >
                              Profile
                            </MenuItem>
                            <MenuItem 
                              to="/settings" 
                              icon={<FiSettings />} 
                              onClick={() => setShowUserMenu(false)}
                              isActive={isActive('/settings')}
                            >
                              Settings
                            </MenuItem>
                            
                            {/* Admin link - only show for admin users */}
                            {user.role === 'admin' && (
                              <MenuItem 
                                to="/admin" 
                                icon={<FiShield />} 
                                onClick={() => setShowUserMenu(false)}
                                isActive={isActive('/admin')}
                              >
                                Admin Panel
                              </MenuItem>
                            )}
                            
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50/80 backdrop-blur-sm rounded-xl transition-colors"
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
                      className={`px-5 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-sm ${
                        isScrolled
                          ? isActive('/login')
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'text-gray-700 hover:bg-gray-100/80 border border-transparent hover:border-gray-200'
                          : isActive('/login')
                            ? 'bg-white/20 text-white border border-white/30'
                            : 'text-white/90 hover:bg-white/10 border border-transparent hover:border-white/20'
                      }`}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className={`px-5 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-sm ${
                        isActive('/register')
                          ? isScrolled
                            ? 'bg-primary text-white shadow-lg ring-2 ring-primary/20'
                            : 'bg-white text-primary shadow-lg'
                          : 'bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-lg hover:-translate-y-0.5'
                      }`}
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
              className={`md:hidden p-2 rounded-lg transition-colors backdrop-blur-sm ${
                isScrolled 
                  ? 'text-gray-700 hover:bg-gray-100/80 border border-gray-200' 
                  : 'text-white hover:bg-white/10 border border-white/20'
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
            className="fixed inset-x-0 top-20 z-40 md:hidden"
          >
            <div className="mx-4 bg-white/90 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/20 overflow-hidden">
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  {navItems.map((item) => (
                    <MobileLink 
                      key={item.path}
                      to={item.path} 
                      onClick={() => setIsOpen(false)}
                      isActive={isActive(item.path)}
                    >
                      <span className="flex items-center space-x-3">
                        <span className={isActive(item.path) ? 'text-primary' : 'text-gray-500'}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </span>
                    </MobileLink>
                  ))}
                </div>
                
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    placeholder="Search treasures..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-3 pl-11 pr-4 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <FiSearch className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                </form>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200/50">
                  {user ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-semibold shadow-lg">
                        {user.name?.charAt(0) || 'U'}
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
                        className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium text-center transition-all backdrop-blur-sm border ${
                          isActive('/login')
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50/80'
                        }`}
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setIsOpen(false)}
                        className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium text-center transition-all ${
                          isActive('/register')
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-gradient-to-r from-primary to-primary-dark text-white'
                        }`}
                      >
                        Join Free
                      </Link>
                    </div>
                  )}
                </div>

                {/* Mobile user menu items when logged in */}
                {user && (
                  <div className="pt-4 border-t border-gray-200/50 space-y-2">
                    <MobileLink 
                      to="/dashboard" 
                      onClick={() => setIsOpen(false)}
                      isActive={isActive('/dashboard')}
                    >
                      <span className="flex items-center space-x-3">
                        <FiPackage className={isActive('/dashboard') ? 'text-primary' : 'text-gray-500'} />
                        <span>Dashboard</span>
                      </span>
                    </MobileLink>
                    <MobileLink 
                      to="/profile" 
                      onClick={() => setIsOpen(false)}
                      isActive={isActive('/profile')}
                    >
                      <span className="flex items-center space-x-3">
                        <FiUser className={isActive('/profile') ? 'text-primary' : 'text-gray-500'} />
                        <span>Profile</span>
                      </span>
                    </MobileLink>
                    <MobileLink 
                      to="/settings" 
                      onClick={() => setIsOpen(false)}
                      isActive={isActive('/settings')}
                    >
                      <span className="flex items-center space-x-3">
                        <FiSettings className={isActive('/settings') ? 'text-primary' : 'text-gray-500'} />
                        <span>Settings</span>
                      </span>
                    </MobileLink>
                    
                    {/* Admin mobile link */}
                    {user.role === 'admin' && (
                      <MobileLink 
                        to="/admin" 
                        onClick={() => setIsOpen(false)}
                        isActive={isActive('/admin')}
                      >
                        <span className="flex items-center space-x-3">
                          <FiShield className={isActive('/admin') ? 'text-primary' : 'text-gray-500'} />
                          <span>Admin Panel</span>
                        </span>
                      </MobileLink>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50/80 backdrop-blur-sm rounded-xl transition-colors"
                    >
                      <FiLogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
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

// Enhanced NavLink with glass effect and active state
const NavLink = ({ to, children, isScrolled, isActive }) => (
  <Link
    to={to}
    className={`text-sm font-medium transition-all relative group px-3 py-2 rounded-full ${
      isScrolled 
        ? isActive 
          ? 'text-primary bg-primary/10 backdrop-blur-sm' 
          : 'text-gray-700 hover:text-primary hover:bg-gray-100/80 backdrop-blur-sm'
        : isActive 
          ? 'text-white bg-white/20 backdrop-blur-sm' 
          : 'text-white/90 hover:text-white hover:bg-white/10 backdrop-blur-sm'
    }`}
  >
    {children}
    {isActive && (
      <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></span>
    )}
  </Link>
);

// Enhanced MobileLink with glass effect and active state
const MobileLink = ({ to, children, onClick, isActive }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`block py-3 px-4 rounded-xl transition-colors backdrop-blur-sm ${
      isActive 
        ? 'bg-primary/10 text-primary font-medium border border-primary/20' 
        : 'text-gray-700 hover:bg-gray-50/80 border border-transparent hover:border-gray-200'
    }`}
  >
    {children}
  </Link>
);

// Enhanced MenuItem with glass effect and active state
const MenuItem = ({ to, icon, children, onClick, isActive }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center space-x-3 px-4 py-3 text-sm rounded-xl transition-colors backdrop-blur-sm ${
      isActive 
        ? 'bg-primary/10 text-primary border border-primary/20' 
        : 'text-gray-700 hover:bg-gray-50/80 border border-transparent hover:border-gray-200'
    }`}
  >
    <span className={isActive ? 'text-primary' : 'text-gray-500'}>
      {icon}
    </span>
    <span>{children}</span>
  </Link>
);

export default Navbar;