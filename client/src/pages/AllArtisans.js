// pages/AllArtisans.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPackage } from 'react-icons/fi';
import { 
  FiMapPin, 
  FiStar, 
  FiAward, 
  FiUsers, 
  FiSearch,
  FiFilter,
  FiChevronRight,
  FiHeart,
  FiMail,
  FiTool,
  FiShield,
  FiArrowLeft
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';

const AllArtisans = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state for artisan details/products
  const [showArtisanModal, setShowArtisanModal] = useState(false);
  const [selectedArtisan, setSelectedArtisan] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleViewShop = (artisanId) => navigate(`/artisans/${artisanId}`);

  const handleContact = (artisanId) => {
    if (!localStorage.getItem('token')) {
      toast.error('Please login to contact artisans');
      navigate('/login');
      return;
    }
    navigate(`/chat/${artisanId}`);
  };

  const categories = ['all', 'pottery', 'woodwork', 'jewelry', 'metalwork', 'textiles', 'glass', 'other'];
  const locations = ['all', 'Eravur', 'Marudhamunai', 'Valaichenai', 'Ottamavadi', 'Kaatankudy'];

  useEffect(() => {
    let mounted = true;
    const fetchArtisans = async () => {
      try {
        setLoading(true);
        const params = { page: 1, limit: 100 };
        if (searchTerm) params.search = searchTerm;
        if (selectedCategory && selectedCategory !== 'all') params.category = selectedCategory;
        if (selectedLocation && selectedLocation !== 'all') params.location = selectedLocation;

        const res = await api.get('/artisans/search', { params });
        if (!mounted) return;
        const raw = res.data.artisans || res.data.artisans || [];
        const normalized = raw.map(a => ({
          _id: a._id || a.id,
          name: a.businessName || a.name || (a.user && a.user.name) || 'Unknown',
          business: a.businessName || a.tagline || '',
          specialty: a.craftCategory || (a.specialties && a.specialties[0]) || 'other',
          location: `${a.address?.city || ''}${a.address?.state ? ', ' + a.address.state : ''}`.trim(),
          rating: a.ratings?.average || a.rating || 0,
          reviews: a.ratings?.count || a.reviews || 0,
          description: a.description || a.tagline || '',
          image: a.profileImage?.url || a.profileImage || a.avatar?.url || '',
          products: a.stats?.totalProducts || a.totalProducts || 0,
          followers: a.stats?.followerCount || a.followers || 0,
          verified: a.isVerified || a.verified || false,
          awards: a.awards || []
        }));
        setArtisans(normalized);
      } catch (error) {
        console.error('Failed to load artisans', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchArtisans();
    return () => { mounted = false; };
  }, [searchTerm, selectedCategory, selectedLocation]);

  const filteredArtisans = artisans.filter(artisan => {
    const matchesSearch = (artisan.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (artisan.business || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (artisan.specialty || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || (artisan.specialty || '').toLowerCase() === selectedCategory;
    const matchesLocation = selectedLocation === 'all' || (artisan.location || '').includes(selectedLocation);
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const openArtisan = async (artisanId) => {
    try {
      const res = await api.get(`/artisans/${artisanId}`);
      const data = res.data.artisan || res.data;
      setSelectedArtisan(data);
      setShowArtisanModal(true);
    } catch (err) {
      console.error('Failed to load artisan details', err);
      toast.error('Failed to load artisan details');
    }
  };

  const closeArtisan = () => { setShowArtisanModal(false); setSelectedArtisan(null); };

  const openProduct = async (productId) => {
    try {
      const res = await api.get(`/products/${productId}`);
      const prod = res.data.product || res.data;

      // normalize product shape for the UI
      const normalized = {
        _id: prod._id || prod.id,
        name: prod.name || prod.title || 'Untitled Product',
        description: prod.description || prod.summary || '',
        price: Number(prod.price) || 0,
        images: prod.images || prod.photos || [],
        stock: prod.stock || prod.quantity || 0,
        artisan: prod.artisan || prod.seller || prod.owner || null,
        category: prod.category || prod.craftCategory || 'other',
        sku: prod.sku || prod._id || prod.id,
        ...prod
      };

      setSelectedProduct(normalized);
      setShowProductModal(true);
    } catch (err) {
      console.error('Failed to load product', err);
      toast.error('Failed to load product details');
    }
  };

  const closeProduct = () => { setShowProductModal(false); setSelectedProduct(null); };

  // Quick buy handler: store intent and navigate to checkout with productId
  const handleBuyNow = (product) => {
    try {
      // store the product id & default quantity for checkout flow
      localStorage.setItem('buyNowProduct', JSON.stringify({ productId: product._id, quantity: 1 }));
      // navigate to checkout page with query param so checkout can load the product
      navigate(`/checkout?productId=${product._id}`);
      // close modals
      closeProduct();
      closeArtisan();
    } catch (err) {
      console.error('Buy now failed', err);
      toast.error('Unable to start checkout');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/artisans')}
          className="flex items-center space-x-2 text-gray-600 hover:text-primary mb-6 transition-colors"
        >
          <FiArrowLeft className="h-5 w-5" />
          <span>Back to Featured Artisans</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">
            All Artisans
          </h1>
          <p className="text-gray-600">
            Discover {filteredArtisans.length} skilled artisans and their unique creations
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search artisans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex-1 min-w-[200px]">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Categories</option>
              {categories.slice(1).map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Locations</option>
              {locations.slice(1).map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-gray-600 mb-6">
          <span className="font-semibold text-gray-900">{filteredArtisans.length}</span> artisans found
        </p>

        {/* All Artisans Grid */}
        {filteredArtisans.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No artisans found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters or search criteria</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedLocation('all');
              }}
              className="px-6 py-3 bg-primary text-white rounded-full hover:bg-primary-dark"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArtisans.map((artisan, index) => (
              <motion.div
                key={artisan._id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all overflow-hidden"
              >
                {/* Artisan button card */}
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={artisan.image}
                      alt={artisan.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900">{artisan.name}</h3>
                      <p className="text-primary text-sm">{artisan.business}</p>
                      <div className="flex items-center mt-1">
                        <FiStar className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium ml-1">{artisan.rating}</span>
                        <span className="text-xs text-gray-500 ml-1">({artisan.reviews})</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {artisan.description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <FiMapPin className="h-4 w-4 mr-1" />
                      {artisan.location.split(',')[0]}
                    </div>
                    <div className="flex items-center">
                      <FiPackage className="h-4 w-4 mr-1" />
                      {artisan.products} products
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => openArtisan(artisan._id)}
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark text-sm font-medium"
                    >
                      Open Artisan
                    </button>
                    <button
                      onClick={() => handleContact(artisan._id)}
                      className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white"
                    >
                      <FiMail className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Artisan Modal */}
        {showArtisanModal && selectedArtisan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-2xl w-full max-w-3xl p-6 overflow-y-auto max-h-[80vh]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedArtisan.businessName || selectedArtisan.name}</h2>
                  <p className="text-sm text-gray-500">{selectedArtisan.address?.city ? `${selectedArtisan.address.city}, ${selectedArtisan.address.state}` : selectedArtisan.location || ''}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={closeArtisan} className="px-3 py-1 bg-gray-100 rounded-lg">Close</button>
                </div>
              </div>

              <p className="text-gray-600 mb-4">{selectedArtisan.description || selectedArtisan.tagline}</p>

              <h3 className="font-semibold mb-2">Products</h3>
              {selectedArtisan.products && selectedArtisan.products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedArtisan.products.map(p => (
                    <button key={p._id} onClick={() => openProduct(p._id)} className="text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center space-x-3">
                        <img src={p.images?.[0]?.url || ''} alt={p.name} className="w-12 h-12 rounded-md object-cover" />
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-gray-500">Rs{p.price}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">No products yet</div>
              )}
            </div>
          </div>
        )}

        {/* Product Modal */}
        {showProductModal && selectedProduct && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-2xl w-full max-w-xl p-6 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{selectedProduct.name}</h2>
                <button onClick={closeProduct} className="px-3 py-1 bg-gray-100 rounded-lg">Close</button>
              </div>

              <div className="mb-4">
                <img src={selectedProduct.images?.[0]?.url || selectedProduct.images?.[0] || ''} alt={selectedProduct.name} className="w-full h-56 object-cover rounded-lg mb-3" />

                <p className="text-gray-700 mb-2">{selectedProduct.description}</p>

                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold">Rs{Number(selectedProduct.price).toLocaleString()}</div>
                  <div className="text-sm text-gray-500">{selectedProduct.stock > 0 ? `${selectedProduct.stock} in stock` : 'Out of stock'}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                  <div><span className="font-medium">Category:</span> {selectedProduct.category}</div>
                  <div><span className="font-medium">SKU:</span> {selectedProduct.sku}</div>
                  <div className="col-span-2"><span className="font-medium">Artisan:</span> {selectedProduct.artisan?.businessName || selectedProduct.artisan?.name || selectedProduct.artisan?.user?.name || 'Unknown'}</div>
                </div>

                <p className="text-xs text-gray-400">Payment and purchase will be processed in Rs. Click Buy Now to proceed to secure checkout.</p>
              </div>

              <div className="flex space-x-2">
                {selectedProduct.stock > 0 ? (
                  <button onClick={() => handleBuyNow(selectedProduct)} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg">Buy Now</button>
                ) : (
                  <button disabled className="flex-1 px-4 py-2 bg-gray-200 text-gray-500 rounded-lg">Out of Stock</button>
                )}

                <button onClick={() => { closeProduct(); navigate(`/products/${selectedProduct._id}`); }} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg">View Page</button>

                <button onClick={() => { closeProduct(); }} className="flex-1 px-4 py-2 border rounded-lg">Close</button>
              </div>
            </div>
          </div>
        )}
       </div>
     </div>
   );
 };
 
 export default AllArtisans;