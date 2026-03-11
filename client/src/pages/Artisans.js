// pages/Artisans.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  FiArrowRight,
  FiPackage,
  FiX,
  FiClock
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';


const Artisans = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [selectedArtisan, setSelectedArtisan] = useState(null);
  const [showArtisanModal, setShowArtisanModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const [modalProducts, setModalProducts] = useState([]);
  const [loadingModalProducts, setLoadingModalProducts] = useState(false);


  // Fetch artisans
  useEffect(() => {
    let mounted = true;
    const fetchArtisans = async () => {
      try {
        setLoading(true);
        const params = { page: 1, limit: 100 };
        if (searchTerm) params.search = searchTerm;
        
        const res = await api.get('/artisans', { params });
        if (!mounted) return;
        
        setArtisans(res.data.artisans || []);
      } catch (error) {
        console.error('Failed to load artisans', error);
        toast.error('Failed to load artisans');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchArtisans();
    return () => { mounted = false; };
  }, [searchTerm]);

  const handleViewArtisan = async (artisan) => {
    setSelectedArtisan(artisan);
    setShowArtisanModal(true);
    setLoadingModalProducts(true);
    try {
      const res = await api.get(`/products?artisan=${artisan._id}&limit=6`);
      setModalProducts(res.data.products || []);
    } catch { setModalProducts([]); }
    finally { setLoadingModalProducts(false); }
  };

  const handleContact = (artisanId) => {
    setShowArtisanModal(false);
    navigate(`/artisans/${artisanId}`);
  };



  const categories = ['all', 'pottery', 'woodwork', 'jewelry', 'metalwork', 'textiles', 'glass'];
  const locations = ['all', 'Eravur', 'Marudhamunai', 'Valaichenai', 'Ottamavadi', 'Kaatankudy'];

  // Filter artisans
  const filteredArtisans = artisans.filter(artisan => {
    const matchesCategory = selectedCategory === 'all' || 
      (artisan.craftCategory || '').toLowerCase() === selectedCategory.toLowerCase() ||
      (artisan.artisanProfile?.specialties || artisan.specialties || []).some(s => s.toLowerCase().includes(selectedCategory.toLowerCase()));
    
    const artisanLoc = (artisan.location || artisan.artisanProfile?.location || '').toLowerCase();
    const matchesLocation = selectedLocation === 'all' || artisanLoc === selectedLocation.toLowerCase();
    
    return matchesCategory && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://media.istockphoto.com/id/2157382378/photo/group-of-diverse-people-stacking-hands-in-the-middle.jpg')] bg-cover bg-center opacity-10"></div>
        </div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm mb-6 border border-white/20">
              👥 Meet the Makers
            </span>
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 leading-tight">
              Master Artisans of 
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent"> Sri Lanka</span>
            </h1>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Connect directly with skilled craftspeople who pour their heart and heritage into every creation.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative">
                <FiSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search artisans by name, craft, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-12"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Categories */}
            <div className="flex-1">
              <div className="flex items-center mb-3">
                <FiFilter className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Filter by Category</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium capitalize transition-all ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category === 'all' ? 'All Crafts' : category}
                  </button>
                ))}
              </div>
            </div>

            {/* Locations */}
            <div className="flex-1">
              <div className="flex items-center mb-3">
                <FiMapPin className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Filter by Location</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {locations.map(location => (
                  <button
                    key={location}
                    onClick={() => setSelectedLocation(location)}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium capitalize transition-all ${
                      selectedLocation === location
                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {location === 'all' ? 'All Locations' : location}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-8">
          <p className="text-gray-600">
            <span className="font-semibold text-gray-900 text-lg">{filteredArtisans.length}</span> artisans found
          </p>
        </div>

        {/* Artisans Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-600 border-t-transparent"></div>
          </div>
        ) : filteredArtisans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white rounded-3xl"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No artisans found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters or search criteria</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedLocation('all');
              }}
              className="px-6 py-3 bg-amber-600 text-white rounded-full hover:bg-amber-700 transition-colors"
            >
              Clear All Filters
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArtisans.map((artisan, index) => (
              <motion.div
                key={artisan._id || index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                {/* Cover Image */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={artisan.coverImage?.url || artisan.coverImage || artisan.backgroundImage?.url || 'https://images.pexels.com/photos/18633243/pexels-photo-18633243.jpeg'}
                    alt={artisan.businessName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* Profile Image */}
                  <div className="absolute -bottom-12 left-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-2xl border-4 border-white overflow-hidden shadow-xl bg-white">
                        <img
                          src={artisan.profileImage?.url || artisan.profileImage || artisan.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(artisan.name||'A')}&background=8B4513&color=fff&size=128`}
                          alt={artisan.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {artisan.isVerified && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center border-2 border-white">
                          <FiShield className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category Badge */}
                  <span className="absolute top-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-900 shadow-lg capitalize">
                    {artisan.craftCategory || 'Artisan'}
                  </span>
                </div>

                {/* Content */}
                <div className="pt-16 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-amber-700 transition-colors">
                        {artisan.name}
                      </h3>
                      <p className="text-amber-700 font-medium">{artisan.businessName}</p>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <FiHeart className="h-5 w-5" />
                    </button>
                  </div>

                  <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                    {artisan.bio || artisan.description || 'Skilled artisan creating beautiful handcrafted products.'}
                  </p>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center text-gray-600">
                      <FiMapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm font-medium">{artisan.location || 'Location not set'}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FiAward className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm">{artisan.experience || 0} years</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FiStar className="h-4 w-4 mr-2 text-yellow-400" />
                      <span className="text-sm font-semibold">{artisan.rating || 0}</span>
                      <span className="text-xs text-gray-500 ml-1">({artisan.reviewCount || 0})</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FiPackage className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm">{artisan.productCount || 0} products</span>
                    </div>
                  </div>

                  {/* Specialties */}
                  {artisan.specialties && artisan.specialties.length > 0 && (
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-2">
                        {artisan.specialties.slice(0, 3).map((specialty, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium"
                          >
                            {specialty}
                          </span>
                        ))}
                        {artisan.specialties.length > 3 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            +{artisan.specialties.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center text-gray-500">
                      <FiMapPin className="h-4 w-4 mr-1 text-amber-600" />
                      <span className="text-sm font-medium">{artisan.location || artisan.artisanProfile?.location || 'Location not set'}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewArtisan(artisan)}
                        className="px-5 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center space-x-2"
                      >
                        <span>View Details</span>
                        <FiChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* View All Artisans Button */}
        {filteredArtisans.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-12"
          >
            <button
              onClick={() => navigate('/artisans/all')}
              className="group px-8 py-4 bg-amber-600 text-white rounded-full font-semibold hover:bg-amber-700 transition-all inline-flex items-center space-x-2"
            >
              <span>View All Artisans</span>
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-sm text-gray-500 mt-4">
              Discover more skilled artisans and their unique creations
            </p>
          </motion.div>
        )}
      </div>

      {/* Artisan Detail Modal */}
      <AnimatePresence>
        {showArtisanModal && selectedArtisan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setShowArtisanModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header with Cover Image */}
              <div className="relative h-48 bg-gradient-to-r from-amber-600 to-amber-800">
                <img 
                  src={selectedArtisan.coverImage?.url || selectedArtisan.coverImage || selectedArtisan.backgroundImage?.url || 'https://images.pexels.com/photos/18633243/pexels-photo-18633243.jpeg'}
                  alt={selectedArtisan.name}
                  className="w-full h-full object-cover opacity-50"
                />
                <button
                  onClick={() => setShowArtisanModal(false)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
                
                {/* Profile Image */}
                <div className="absolute -bottom-16 left-8">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-2xl border-4 border-white overflow-hidden shadow-xl bg-white">
                      <img
                        src={selectedArtisan.profileImage?.url || selectedArtisan.profileImage || selectedArtisan.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedArtisan.name||'A')}&background=8B4513&color=fff&size=128`}
                        alt={selectedArtisan.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {selectedArtisan.isVerified && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center border-2 border-white">
                        <FiShield className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="pt-20 p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedArtisan.name}</h2>
                  <p className="text-amber-700 font-medium text-lg">{selectedArtisan.businessName}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-amber-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-amber-700">{selectedArtisan.experience || 0}</div>
                    <div className="text-xs text-gray-600">Years</div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-amber-700">{selectedArtisan.productCount || 0}</div>
                    <div className="text-xs text-gray-600">Products</div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center text-2xl font-bold text-amber-700">
                      {selectedArtisan.rating || 0}
                      <FiStar className="h-4 w-4 ml-1 fill-current" />
                    </div>
                    <div className="text-xs text-gray-600">({selectedArtisan.reviewCount || 0} reviews)</div>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center text-gray-600 mb-4">
                  <FiMapPin className="h-5 w-5 mr-2 text-amber-600" />
                  <span>{selectedArtisan.location || 'Location not specified'}</span>
                </div>

                {/* Bio */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {selectedArtisan.bio || selectedArtisan.description || 'Skilled artisan creating beautiful handcrafted products with passion and dedication.'}
                  </p>
                </div>

                {/* Specialties */}
                {selectedArtisan.specialties && selectedArtisan.specialties.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedArtisan.specialties.map((spec, idx) => (
                        <span key={idx} className="px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products Preview */}
                {selectedArtisan.products && selectedArtisan.products.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Recent Products</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedArtisan.products.slice(0, 3).map((product, idx) => (
                        <div key={idx} className="relative group cursor-pointer" onClick={() => navigate(`/products/${product._id}`)}>
                          <img
                            src={product.images?.[0]?.url || 'https://via.placeholder.com/100'}
                            alt={product.name}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-medium">View</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons - only View Profile */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowArtisanModal(false);
                      navigate(`/artisans/${selectedArtisan._id}`);
                    }}
                    className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-colors text-sm flex items-center justify-center gap-1.5"
                  >
                    <FiUsers className="h-4 w-4" />
                    <span>View Profile</span>
                  </button>
                </div>


                {/* Artisan's Products */}
                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 mb-3">Products by {selectedArtisan.name}</h3>
                  {loadingModalProducts ? (
                    <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-600 border-t-transparent" /></div>
                  ) : modalProducts.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No products available</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {modalProducts.map((prod) => (
                        <div key={prod._id} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                          <div className="relative h-24 cursor-pointer" onClick={() => { setShowArtisanModal(false); navigate(`/products/${prod._id}`); }}>
                            <img src={prod.images?.[0]?.url || 'https://via.placeholder.com/200'} alt={prod.name}
                              className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-semibold text-gray-900 truncate">{prod.name}</p>
                            <p className="text-xs text-amber-700 font-bold">Rs. {prod.price?.toLocaleString()}</p>
                            <button
                              onClick={() => { setShowArtisanModal(false); navigate(`/products/${prod._id}`); }}
                              className="w-full mt-1.5 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors"
                            >
                              Buy Now
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>


              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Artisans;