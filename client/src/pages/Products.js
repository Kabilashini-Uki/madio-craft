// pages/Products.js
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiFilter, 
  FiX, 
  FiChevronDown, 
  FiGrid, 
  FiList,
  FiStar,
  FiHeart 
} from 'react-icons/fi';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    priceRange: '',
    sort: 'newest',
    material: '',
    artisanLocation: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    fetchProducts();
  }, [filters, searchQuery]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filters.category) params.append('category', filters.category);
      if (filters.priceRange) params.append('priceRange', filters.priceRange);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.material) params.append('material', filters.material);
      if (filters.artisanLocation) params.append('location', filters.artisanLocation);

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/products?${params}`);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'jewelry', name: 'Jewelry', count: 45 },
    { id: 'pottery', name: 'Pottery', count: 32 },
    { id: 'textiles', name: 'Textiles', count: 28 },
    { id: 'woodwork', name: 'Woodwork', count: 36 },
    { id: 'metalwork', name: 'Metalwork', count: 24 },
    { id: 'glass', name: 'Glass Art', count: 19 },
  ];

  const priceRanges = [
    { id: '0-999', label: 'Under ₹1,000' },
    { id: '1000-2999', label: '₹1,000 - ₹2,999' },
    { id: '3000-4999', label: '₹3,000 - ₹4,999' },
    { id: '5000-9999', label: '₹5,000 - ₹9,999' },
    { id: '10000+', label: '₹10,000 & Above' },
  ];

  const materials = [
    'Silver', 'Gold', 'Brass', 'Copper', 'Wood', 'Ceramic', 'Cotton', 'Silk'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-950 text-white py-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full filter blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/20 rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">
              {searchQuery ? `Search: "${searchQuery}"` : 'Handcrafted Collection'}
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Discover unique pieces crafted with passion, skill, and generations of tradition
            </p>
            
            {/* Search Bar */}
            <form className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search by product, artisan, or category..."
                defaultValue={searchQuery}
                onChange={(e) => setSearchParams({ search: e.target.value })}
                className="w-full px-6 py-4 pl-14 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <FiFilter className="absolute left-5 top-4 h-5 w-5 text-gray-400" />
            </form>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filter Sidebar - Desktop */}
          <motion.aside 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block lg:w-1/4"
          >
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button 
                  onClick={() => setFilters({
                    category: '', priceRange: '', sort: 'newest', material: '', artisanLocation: ''
                  })}
                  className="text-sm text-primary hover:text-primary-dark font-medium"
                >
                  Clear all
                </button>
              </div>

              {/* Categories */}
              <div className="mb-8">
                <h3 className="font-medium text-gray-900 mb-4">Categories</h3>
                <div className="space-y-3">
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="category"
                          value={cat.id}
                          checked={filters.category === cat.id}
                          onChange={(e) => setFilters({...filters, category: e.target.value})}
                          className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <span className="text-gray-700 group-hover:text-primary transition-colors">
                          {cat.name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{cat.count}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-8">
                <h3 className="font-medium text-gray-900 mb-4">Price Range</h3>
                <div className="space-y-3">
                  {priceRanges.map((range) => (
                    <label key={range.id} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="priceRange"
                        value={range.id}
                        checked={filters.priceRange === range.id}
                        onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
                        className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <span className="text-gray-700">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Materials */}
              <div className="mb-8">
                <h3 className="font-medium text-gray-900 mb-4">Materials</h3>
                <div className="flex flex-wrap gap-2">
                  {materials.map((material) => (
                    <button
                      key={material}
                      onClick={() => setFilters({...filters, material: filters.material === material ? '' : material})}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        filters.material === material
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {material}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Sort By</h3>
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters({...filters, sort: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="newest">Newest First</option>
                  <option value="-price">Price: High to Low</option>
                  <option value="price">Price: Low to High</option>
                  <option value="-ratings.average">Top Rated</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>
          </motion.aside>

          {/* Products Grid */}
          <div className="lg:w-3/4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center space-x-2 px-4 py-2 bg-white rounded-xl shadow-sm text-gray-700"
                >
                  <FiFilter className="h-4 w-4" />
                  <span>Filters</span>
                </button>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-primary text-white' 
                        : 'bg-white text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <FiGrid className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-primary text-white' 
                        : 'bg-white text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <FiList className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">{products.length}</span> products found
              </p>
            </div>

            {/* Mobile Filter Sidebar */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 lg:hidden"
                >
                  <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)}></div>
                  <motion.div
                    initial={{ x: -300 }}
                    animate={{ x: 0 }}
                    exit={{ x: -300 }}
                    className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                        <button
                          onClick={() => setShowFilters(false)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <FiX className="h-5 w-5" />
                        </button>
                      </div>
                      {/* Mobile filter content - same as desktop */}
                      <div className="space-y-8">
                        {/* Copy filter sections from desktop */}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Products Display */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="spinner"></div>
              </div>
            ) : products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 bg-white rounded-3xl"
              >
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters or search terms</p>
                <button
                  onClick={() => setFilters({
                    category: '', priceRange: '', sort: 'newest', material: '', artisanLocation: ''
                  })}
                  className="px-6 py-3 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
                >
                  Clear All Filters
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={`grid ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6' 
                    : 'grid-cols-1 gap-4'
                }`}
              >
                {products.map((product, index) => (
                  <ProductCard 
                    key={product._id} 
                    product={product} 
                    viewMode={viewMode}
                    index={index}
                  />
                ))}
              </motion.div>
            )}

            {/* Pagination */}
            {products.length > 0 && (
              <div className="mt-12 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-white text-gray-700 hover:bg-primary hover:text-white transition-colors">
                    1
                  </button>
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-white text-gray-700 hover:bg-primary hover:text-white transition-colors">
                    2
                  </button>
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-white text-gray-700 hover:bg-primary hover:text-white transition-colors">
                    3
                  </button>
                  <span className="px-2 text-gray-500">...</span>
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-white text-gray-700 hover:bg-primary hover:text-white transition-colors">
                    8
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;