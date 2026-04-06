// src/pages/Products.js
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFilter, FiX } from 'react-icons/fi';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

const PRODUCTS_PER_PAGE = 9;

const Products = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    category: '',
    priceRange: '',
    sort: 'newest'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  // Categories from DB
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/products/categories');
        setCategories(res.data.categories || []);
      } catch (err) {
        console.error('Failed to load categories', err);
        setCategories([]);
      }
    };

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = { limit: 100 };
        if (searchQuery) params.search = searchQuery;
        if (filters.category) params.category = filters.category;

        const response = await api.get('/products', { params });
        
        let prods = [];
        if (response.data.success && response.data.products) {
          prods = response.data.products;
        } else if (Array.isArray(response.data)) {
          prods = response.data;
        } else if (response.data.products) {
          prods = response.data.products;
        }

        prods = prods.filter(p => p && p._id && p.name);

        if (filters.priceRange) {
          const [min, max] = filters.priceRange.split('-').map(Number);
          prods = prods.filter(p =>
            p.price >= min && (max === Infinity ? true : p.price <= max)
          );
        }

        if (filters.sort === '-price') prods.sort((a, b) => b.price - a.price);
        else if (filters.sort === 'price') prods.sort((a, b) => a.price - b.price);
        else if (filters.sort === 'newest') prods.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setAllProducts(prods);
      } catch (error) {
        console.error('Error fetching products:', error);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    fetchCategories();
  }, [filters, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

  const priceRanges = [
    { id: '0-999', label: 'Under Rs 1,000' },
    { id: '1000-2999', label: 'Rs 1,000 – Rs 2,999' },
    { id: '3000-4999', label: 'Rs 3,000 – Rs 4,999' },
    { id: '5000-9999', label: 'Rs 5,000 – Rs 9,999' },
    { id: '10000-999999', label: 'Rs 10,000 & Above' },
  ];

  const totalPages = Math.ceil(allProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = allProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const clearFilters = () => {
    setFilters({ category: '', priceRange: '', sort: 'newest' });
    setSearchParams({});
  };

  const FilterSidebar = () => (
    <div className="space-y-8">
      <div>
        <h3 className="font-medium text-gray-900 mb-4">Category</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input type="radio" name="category" value=""
              checked={!filters.category}
              onChange={() => setFilters({ ...filters, category: '' })}
              className="w-4 h-4 text-[#723d46]" />
            <span className="text-gray-700">All Categories</span>
          </label>
          {categories.map(cat => (
            <label key={cat} className="flex items-center space-x-3 cursor-pointer">
              <input type="radio" name="category" value={cat}
                checked={filters.category === cat}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-4 h-4 text-[#723d46]" />
              <span className="text-gray-700 capitalize">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-4">Price Range</h3>
        <div className="space-y-3">
          {priceRanges.map(range => (
            <label key={range.id} className="flex items-center space-x-3 cursor-pointer">
              <input type="radio" name="priceRange" value={range.id}
                checked={filters.priceRange === range.id}
                onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                className="w-4 h-4 text-[#723d46]" />
              <span className="text-gray-700">{range.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-4">Sort By</h3>
        <select value={filters.sort}
          onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#723d46] focus:outline-none">
          <option value="newest">Newest First</option>
          <option value="-price">Price: High to Low</option>
          <option value="price">Price: Low to High</option>
        </select>
      </div>

      {(filters.category || filters.priceRange) && (
        <button onClick={clearFilters}
          className="text-sm text-[#723d46] hover:underline">
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-serif font-bold mb-6">
            {searchQuery ? `Search: "${searchQuery}"` : 'Handcrafted Collection'}
          </h1>
          <p className="text-xl text-gray-300">Discover unique pieces crafted with passion</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block lg:w-1/4">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <FilterSidebar />
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-8">
              <button onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center space-x-2 px-4 py-2 bg-white rounded-xl shadow-sm">
                <FiFilter className="text-[#723d46]" /><span>Filters</span>
              </button>
              <p className="text-gray-600">{allProducts.length} products found</p>
            </div>

         

            {/* Product Name Header */}
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-serif font-bold text-gray-900">
                  {filters.category ? `${filters.category.charAt(0).toUpperCase() + filters.category.slice(1)} Products` : 'All Products'}
                </h2>
                {filters.category && (
                  <button 
                    onClick={() => setFilters({ ...filters, category: '' })}
                    className="text-sm text-[#723d46] hover:underline"
                  >
                    Clear Category
                  </button>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-1">
                Showing {paginatedProducts.length} of {allProducts.length} products
              </p>
            </div>

            {/* Mobile Filters */}
            {showFilters && (
              <div className="fixed inset-0 z-50 lg:hidden bg-black/50"
                onClick={() => setShowFilters(false)}>
                <div className="absolute left-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto"
                  onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold">Filters</h2>
                    <button onClick={() => setShowFilters(false)}>
                      <FiX className="text-gray-500" />
                    </button>
                  </div>
                  <FilterSidebar />
                </div>
              </div>
            )}

            {/* Products Grid */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#723d46] border-t-transparent" />
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                <p className="text-gray-600 mb-4">No products found</p>
                <button onClick={clearFilters}
                  className="px-6 py-3 bg-[#723d46] text-white rounded-full hover:bg-[#5a2f36] transition">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedProducts.map((product, index) => (
                  <ProductCard key={product._id} product={product} index={index} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12 space-x-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white rounded-lg shadow-sm disabled:opacity-50 hover:bg-gray-50 transition">
                  Previous
                </button>
                <span className="px-4 py-2 bg-[#723d46] text-white rounded-lg shadow-sm">
                  {currentPage} / {totalPages}
                </span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white rounded-lg shadow-sm disabled:opacity-50 hover:bg-gray-50 transition">
                  Next
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