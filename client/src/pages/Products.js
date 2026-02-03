import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { FaFilter, FaSearch, FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    sort: 'newest'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    fetchProducts();
  }, [filters, searchQuery]);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.sort) params.append('sort', filters.sort);

      const response = await axios.get(`http://localhost:5000/api/products?${params}`);
      setProducts(response.data.products || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const categories = ['jewelry', 'pottery', 'textiles', 'woodwork', 'metalwork', 'glass', 'other'];

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-primary/90 to-primary-dark/90 text-white py-16 mb-8 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif font-bold text-center mb-4"
          >
            Handcrafted Treasures
          </motion.h1>
          <p className="text-center text-xl text-white/90 mb-8">
            Discover unique pieces crafted with passion and skill
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for products, artisans, or categories..."
                defaultValue={searchQuery}
                onChange={(e) => setSearchParams({ search: e.target.value })}
                className="w-full px-6 py-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-primary-light"
              />
              <FaSearch className="absolute right-6 top-4 h-6 w-6 text-white/70" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <motion.aside 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}
          >
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-primary-dark">Filters</h2>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden text-gray-500 hover:text-primary"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Category</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setFilters({...filters, category: ''})}
                    className={`block w-full text-left px-3 py-2 rounded-lg ${!filters.category ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'}`}
                  >
                    All Categories
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilters({...filters, category: cat})}
                      className={`block w-full text-left px-3 py-2 rounded-lg capitalize ${filters.category === cat ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Price Range</h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Sort By</h3>
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters({...filters, sort: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="-price">Price: High to Low</option>
                  <option value="price">Price: Low to High</option>
                  <option value="-ratings.average">Top Rated</option>
                </select>
              </div>

              <button
                onClick={() => setFilters({
                  category: '',
                  minPrice: '',
                  maxPrice: '',
                  sort: 'newest'
                })}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </motion.aside>

          {/* Products Grid */}
          <div className="lg:w-3/4">
            {/* Mobile Filter Button */}
            <div className="lg:hidden flex justify-between items-center mb-6">
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg"
              >
                <FaFilter className="h-4 w-4" />
                <span>Filters</span>
              </button>
              <p className="text-gray-600">{products.length} products found</p>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-700 mb-2">No products found</h3>
                <p className="text-gray-600">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <>
                <div className="hidden lg:flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-primary-dark">
                    {searchQuery ? `Search results for "${searchQuery}"` : 'All Products'}
                  </h2>
                  <p className="text-gray-600">{products.length} products</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(product => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination would go here */}
                {products.length > 0 && (
                  <div className="mt-12 flex justify-center">
                    <div className="flex space-x-2">
                      <button className="px-4 py-2 bg-primary text-white rounded-lg">1</button>
                      <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">2</button>
                      <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">3</button>
                      <span className="px-4 py-2">...</span>
                      <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">Next</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;