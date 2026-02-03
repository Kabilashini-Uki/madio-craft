import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaSearch, FaHeart, FaStore } from 'react-icons/fa';
import { GiHamburgerMenu } from 'react-icons/gi';
import { motion } from 'framer-motion';

const Navbar = ({ user }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${searchQuery}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="bg-gradient-to-r from-primary-dark to-primary shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">MC</span>
            </div>
            <span className="text-xl font-bold text-white font-serif">MadioCraft</span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-white hover:text-primary-light transition-colors">
              Home
            </Link>
            <Link to="/products" className="text-white hover:text-primary-light transition-colors">
              Products
            </Link>
            <Link to="/artisans" className="text-white hover:text-primary-light transition-colors">
              Artisans
            </Link>
            <Link to="/categories" className="text-white hover:text-primary-light transition-colors">
              Categories
            </Link>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/10 backdrop-blur-sm text-white placeholder-white/70 rounded-full py-2 px-4 pl-10 w-64 focus:outline-none focus:ring-2 focus:ring-primary-light border border-white/20"
              />
              <FaSearch className="absolute left-3 top-2.5 h-5 w-5 text-white/70" />
            </form>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              <button className="relative text-white hover:text-primary-light">
                <FaHeart className="h-6 w-6" />
              </button>
              
              <button className="relative text-white hover:text-primary-light">
                <FaShoppingCart className="h-6 w-6" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </button>

              {user ? (
                <Link to="/dashboard" className="flex items-center space-x-2 text-white hover:text-primary-light">
                  <FaUser className="h-6 w-6" />
                  <span>{user.name.split(' ')[0]}</span>
                </Link>
              ) : (
                <Link to="/login" className="bg-white text-primary px-6 py-2 rounded-full font-semibold hover:bg-primary-light transition-colors">
                  Login
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white"
          >
            <GiHamburgerMenu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden py-4 border-t border-white/20"
          >
            <div className="flex flex-col space-y-4">
              <Link to="/" className="text-white hover:text-primary-light">Home</Link>
              <Link to="/products" className="text-white hover:text-primary-light">Products</Link>
              <Link to="/artisans" className="text-white hover:text-primary-light">Artisans</Link>
              
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 text-white rounded-full py-2 px-4 pl-10 focus:outline-none"
                />
                <FaSearch className="absolute left-3 top-2.5 h-5 w-5 text-white/70" />
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;