// pages/Products.js
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiX, FiGrid, FiList, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

const PRODUCTS_PER_PAGE = 9;
const LOCATIONS = ['Eravur', 'Marudhamunai', 'Valaichenai', 'Ottamavadi', 'Kaatankudy'];

const Products = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    category: '',
    priceRange: '',
    sort: 'newest',
    artisanLocation: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const [categoriesState, setCategoriesState] = useState([
    { id: 'jewelry', name: 'Jewelry', totalStock: 0, productCount: 0 },
    { id: 'pottery', name: 'Pottery', totalStock: 0, productCount: 0 },
    { id: 'textiles', name: 'Textiles', totalStock: 0, productCount: 0 },
    { id: 'woodwork', name: 'Woodwork', totalStock: 0, productCount: 0 },
    { id: 'metalwork', name: 'Metalwork', totalStock: 0, productCount: 0 },
    { id: 'glass', name: 'Glass Art', totalStock: 0, productCount: 0 },
  ]);



  useEffect(() => {
    fetchProducts();
    fetchCategoryCounts();
  }, [filters, searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [filters, searchQuery]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { limit: 200 }; // fetch all, paginate client-side
      if (searchQuery) params.search = searchQuery;
      if (filters.category) params.category = filters.category;
      if (filters.artisanLocation) params.location = filters.artisanLocation;

      const response = await api.get('/products', { params });
      let prods = response.data.products || response.data || [];

      // Client-side price range filter
      if (filters.priceRange) {
        const [minStr, maxStr] = filters.priceRange.split('-');
        const min = Number(minStr);
        const max = maxStr === '+' ? Infinity : Number(maxStr);
        prods = prods.filter(p => p.price >= min && p.price <= max);
      }

      // Client-side sort
      if (filters.sort === '-price') prods = [...prods].sort((a, b) => b.price - a.price);
      else if (filters.sort === 'price') prods = [...prods].sort((a, b) => a.price - b.price);
      else if (filters.sort === '-ratings.average') prods = [...prods].sort((a, b) => (b.ratings?.average || 0) - (a.ratings?.average || 0));
      else if (filters.sort === 'newest') prods = [...prods].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setAllProducts(prods);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryCounts = async () => {
    try {
      const res = await api.get('/products/counts');
      const data = res.data;
      if (data.success && data.counts) {
        setCategoriesState(prev => prev.map(c => ({
          ...c,
          totalStock: data.counts[c.id]?.totalStock || 0,
          productCount: data.counts[c.id]?.productCount || 0
        })));
      }
    } catch (err) { /* silent */ }
  };

  const priceRanges = [
    { id: '0-999', label: 'Under Rs 1,000' },
    { id: '1000-2999', label: 'Rs 1,000 – Rs 2,999' },
    { id: '3000-4999', label: 'Rs 3,000 – Rs 4,999' },
    { id: '5000-9999', label: 'Rs 5,000 – Rs 9,999' },
    { id: '10000-+', label: 'Rs 10,000 & Above' },
  ];

  // Pagination
  const totalProducts = allProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PER_PAGE));
  const paginatedProducts = allProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

  const clearFilters = () => {
    setFilters({ category: '', priceRange: '', sort: 'newest' });
    setSearchParams({});
  };

  const FilterSidebar = () => (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="font-medium text-gray-900 mb-4">Categories</h3>
        <div className="space-y-3">
          {categoriesState.map((cat) => (
            <label key={cat.id} className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center space-x-3">
                <input type="radio" name="category" value={cat.id}
                  checked={filters.category === cat.id}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-4 h-4 text-primary border-gray-300 focus:ring-primary" />
                <span className="text-gray-700 group-hover:text-primary transition-colors capitalize">{cat.name}</span>
              </div>
              <span className="text-sm text-gray-500">{cat.totalStock}</span>
            </label>
          ))}
          {filters.category && (
            <button onClick={() => setFilters({ ...filters, category: '' })}
              className="text-xs text-red-500 hover:underline mt-1">Clear category</button>
          )}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-medium text-gray-900 mb-4">Price Range</h3>
        <div className="space-y-3">
          {priceRanges.map((range) => (
            <label key={range.id} className="flex items-center space-x-3 cursor-pointer">
              <input type="radio" name="priceRange" value={range.id}
                checked={filters.priceRange === range.id}
                onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                className="w-4 h-4 text-primary border-gray-300 focus:ring-primary" />
              <span className="text-gray-700">{range.label}</span>
            </label>
          ))}
          {filters.priceRange && (
            <button onClick={() => setFilters({ ...filters, priceRange: '' })}
              className="text-xs text-red-500 hover:underline mt-1">Clear price</button>
          )}
        </div>
      </div>

      {/* Location */}
      <div>
        <h3 className="font-medium text-gray-900 mb-4">Location</h3>
        <div className="space-y-3">
          {LOCATIONS.map((loc) => (
            <label key={loc} className="flex items-center space-x-3 cursor-pointer">
              <input type="radio" name="artisanLocation" value={loc}
                checked={filters.artisanLocation === loc}
                onChange={(e) => setFilters({ ...filters, artisanLocation: e.target.value })}
                className="w-4 h-4 text-primary border-gray-300 focus:ring-primary" />
              <span className="text-gray-700">{loc}</span>
            </label>
          ))}
          {filters.artisanLocation && (
            <button onClick={() => setFilters({ ...filters, artisanLocation: '' })}
              className="text-xs text-red-500 hover:underline mt-1">Clear location</button>
          )}
        </div>
      </div>

      {/* Sort By */}
      <div>
        <h3 className="font-medium text-gray-900 mb-4">Sort By</h3>
        <select value={filters.sort}
          onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="newest">Newest First</option>
          <option value="-price">Price: High to Low</option>
          <option value="price">Price: Low to High</option>
          <option value="-ratings.average">Top Rated</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-950 text-white py-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full filter blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/20 rounded-full filter blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">
              {searchQuery ? `Search: "${searchQuery}"` : 'Handcrafted Collection'}
            </h1>
            <p className="text-xl text-gray-300 mb-8">Discover unique pieces crafted with passion, skill, and generations of tradition</p>
            <form className="relative max-w-2xl mx-auto">
              <input type="text" placeholder="Search by product, artisan, or category..."
                defaultValue={searchQuery}
                onChange={(e) => setSearchParams({ search: e.target.value })}
                className="w-full px-6 py-4 pl-14 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary" />
              <FiFilter className="absolute left-5 top-4 h-5 w-5 text-gray-400" />
            </form>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filter Sidebar - Desktop */}
          <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block lg:w-1/4">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button onClick={clearFilters} className="text-sm text-primary hover:text-primary-dark font-medium">Clear all</button>
              </div>
              <FilterSidebar />
            </div>
          </motion.aside>

          {/* Products Grid */}
          <div className="lg:w-3/4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                <button onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center space-x-2 px-4 py-2 bg-white rounded-xl shadow-sm text-gray-700">
                  <FiFilter className="h-4 w-4" /><span>Filters</span>
                </button>
                <div className="flex items-center space-x-2">
                  <button onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>
                    <FiGrid className="h-5 w-5" />
                  </button>
                  <button onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>
                    <FiList className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">{totalProducts}</span> products found
              </p>
            </div>

            {/* Mobile Filter Sidebar */}
            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 lg:hidden">
                  <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)}></div>
                  <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
                    className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                        <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                          <FiX className="h-5 w-5" />
                        </button>
                      </div>
                      <FilterSidebar />
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Products Display */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
              </div>
            ) : paginatedProducts.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 bg-white rounded-3xl">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters or search terms</p>
                <button onClick={clearFilters}
                  className="px-6 py-3 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors">
                  Clear All Filters
                </button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
                className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6' : 'grid-cols-1 gap-4'}`}>
                {paginatedProducts.map((product, index) => (
                  <ProductCard key={product._id} product={product} viewMode={viewMode} index={index} />
                ))}
              </motion.div>
            )}

            {/* Pagination - only show if more than 1 page */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-white text-gray-700 hover:bg-primary hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
                  <FiChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors shadow-sm font-medium ${currentPage === page ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-primary hover:text-white'
                      }`}>
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-white text-gray-700 hover:bg-primary hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
                  <FiChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
