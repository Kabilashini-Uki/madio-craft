import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotif } from '../context/NotifContext';
import { 
  FiShoppingBag, FiMapPin, FiBriefcase, FiStar, FiHeart, 
  FiShare2, FiCamera, FiX, FiCheckCircle, FiPackage, 
  FiTruck, FiClock, FiAward, FiUsers, FiEye
} from 'react-icons/fi';
import api from '../services/api';

export default function ArtisanShop() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const { addToast } = useNotif();
  const navigate = useNavigate();
  const [artisan, setArtisan] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [coverImageUrl, setCoverImageUrl] = useState(null);
  const [showCoverUpload, setShowCoverUpload] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    setLoading(true);
    api.get(`/artisans/${id}/shop`)
      .then(res => {
        const data = res.data.artisan;
        if (!data) {
          console.error('No artisan data in response');
          return;
        }
        console.log('Artisan data:', data);
        setArtisan(data);
        const productList = data.products || [];
        setProducts(productList);
        
        // Extract unique categories
        const uniqueCats = [...new Set(productList.map(p => p.category).filter(Boolean))];
        setCategories(uniqueCats);
      })
      .catch((err) => {
        console.error('Error fetching artisan:', err);
        if (err.response?.status === 404) {
          console.error('Artisan not found - 404 error');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleBuyNow = async (product) => {
    if (!user) { navigate('/login'); return; }
    if (!['buyer', 'artisan'].includes(user.role)) { addToast('Not allowed to purchase', 'error'); return; }
    const result = await addToCart(product, null, 1);
    if (result !== false) navigate('/cart');
    else addToast(result?.message || 'Failed', 'error');
  };

  const handleAddToCart = async (product) => {
    if (!user) { navigate('/login'); return; }
    if (!['buyer', 'artisan'].includes(user.role)) { addToast('Not allowed to add to cart', 'error'); return; }
    await addToCart(product, null, 1);
  };

  const filteredProducts = activeFilter === 'all' 
    ? products 
    : products.filter(p => p.category === activeFilter);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-600 border-t-transparent mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Loading artisan shop...</p>
      </div>
    </div>
  );
  
  if (!artisan) return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Artisan Not Found</h2>
        <p className="text-gray-600">The artisan you're looking for doesn't exist or has been removed.</p>
      </div>
    </div>
  );

  const avatar = artisan.profileImage || artisan.avatar?.url;
  const experience = artisan.artisanProfile?.yearsOfExperience || 0;
  const totalSales = artisan.artisanProfile?.stats?.totalOrders || 0;
  const rating = artisan.rating || 4.5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100">
      {/* Cover Section */}
      <div className="relative h-80 lg:h-96 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 hover:scale-105"
          style={{ 
            backgroundImage: `url(${coverImageUrl || artisan.coverImage?.url || artisan.coverImage || 'https://images.pexels.com/photos/18633243/pexels-photo-18633243.jpeg'})` 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        {user && (String(user._id || user.id) === String(artisan._id || artisan.id)) && (
          <button
            onClick={() => setShowCoverUpload(true)}
            className="absolute top-6 right-6 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-xl 
                     hover:bg-black/70 transition-all flex items-center gap-2 shadow-lg"
          >
            <FiCamera className="w-4 h-4" />
            <span className="text-sm font-medium">Change Cover</span>
          </button>
        )}
      </div>

      {/* Cover Upload Modal */}
      <AnimatePresence>
        {showCoverUpload && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCoverUpload(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Upload Cover Photo</h3>
                <button onClick={() => setShowCoverUpload(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <label className="block w-full p-8 border-2 border-dashed border-amber-300 rounded-xl 
                              cursor-pointer hover:border-amber-500 transition text-center group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = async (ev) => {
                        setCoverImageUrl(ev.target.result);
                        setShowCoverUpload(false);
                        try {
                          const fd = new FormData();
                          fd.append('coverImage', file);
                          const resp = await api.post('/users/cover', fd, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          });
                          if (resp.data.success) {
                            addToast('Cover image updated successfully!', 'success');
                          } else {
                            addToast(resp.data.message || 'Failed to save cover', 'error');
                          }
                        } catch (err) {
                          console.error('Upload error:', err);
                          addToast('Failed to upload cover image', 'error');
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
                <div className="text-center">
                  <div className="text-4xl mb-2 group-hover:scale-110 transition">📸</div>
                  <p className="text-gray-600 font-medium">Click to upload</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF up to 5MB</p>
                </div>
              </label>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Profile Header Card */}
        <div className="relative -mt-20 mb-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 
                                flex items-center justify-center text-4xl font-bold text-white shadow-lg
                                border-4 border-white overflow-hidden">
                    {avatar ? (
                      <img src={avatar} alt={artisan.name} className="w-full h-full object-cover" />
                    ) : (
                      artisan.name?.[0]?.toUpperCase() || 'A'
                    )}
                  </div>
                  {artisan.isVerified && (
                    <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1 border-2 border-white">
                      <FiCheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Artisan Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-serif">
                      {artisan.artisanProfile?.businessName || artisan.name}
                    </h1>
                    {artisan.isVerified && (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <FiCheckCircle className="w-3 h-3" /> Verified Artisan
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">by {artisan.name}</p>
                  {artisan.location && (
                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                      <FiMapPin className="w-4 h-4" />
                      <span>{artisan.location}</span>
                    </div>
                  )}
                </div>

                {/* Share Button */}
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl 
                                 hover:bg-gray-50 transition text-gray-700">
                  <FiShare2 className="w-4 h-4" />
                  <span className="text-sm">Share</span>
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-[#723d46] mb-1">
                    <FiPackage className="w-5 h-5" />
                    <span className="text-2xl font-bold text-gray-900">{products?.length || 0}</span>
                  </div>
                  <p className="text-sm text-gray-500">Products</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-[#723d46] mb-1">
                    <FiBriefcase className="w-5 h-5" />
                    <span className="text-2xl font-bold text-gray-900">{experience}</span>
                  </div>
                  <p className="text-sm text-gray-500">Years Exp.</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-[#723d46] mb-1">
                    <FiShoppingBag className="w-5 h-5" />
                    <span className="text-2xl font-bold text-gray-900">{totalSales}</span>
                  </div>
                  <p className="text-sm text-gray-500">Orders Completed</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-[#723d46] mb-1">
                    <FiStar className="w-5 h-5 fill-current" />
                    <span className="text-2xl font-bold text-gray-900">{rating.toFixed(1)}</span>
                  </div>
                  <p className="text-sm text-gray-500">Rating</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        {(artisan.artisanProfile?.description || artisan.bio || artisan.description) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-0.5 bg-[#723d46] rounded-full" />
              <h2 className="text-xl font-bold text-gray-900 font-serif">About the Artisan</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              {artisan.artisanProfile?.description || artisan.bio || artisan.description}
            </p>
            {artisan.artisanProfile?.specialties?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {artisan.artisanProfile.specialties.map((specialty, idx) => (
                  <span key={idx} className="px-3 py-1 bg-[#f5e6e8] text-[#723d46] rounded-full text-xs font-medium">
                    {specialty}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Products Section */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 font-serif">Our Collection</h2>
              <p className="text-gray-500 text-sm mt-1">Handcrafted with love and tradition</p>
            </div>
            
            {/* Category Filters */}
            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                    ${activeFilter === 'all' 
                      ? 'bg-[#723d46] text-white shadow-md' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                >
                  All Products
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveFilter(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap capitalize
                      ${activeFilter === cat 
                        ? 'bg-[#723d46] text-white shadow-md' 
                        : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
              <p className="text-gray-500">Check back later for new creations!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ProductCard 
                    product={product}
                    onView={() => setSelectedProduct(product)}
                    onCart={() => handleAddToCart(product)}
                    onBuy={() => handleBuyNow(product)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        {artisan.fullArtisanData?.reviews?.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-12"
          >
            <div className="flex items-center gap-2 mb-6">
              <FiStar className="w-5 h-5 text-[#723d46] fill-current" />
              <h2 className="text-xl font-bold text-gray-900 font-serif">Customer Reviews</h2>
              <span className="text-sm text-gray-500">({artisan.fullArtisanData.reviews.length})</span>
            </div>
            <div className="space-y-4">
              {artisan.fullArtisanData.reviews.slice(0, 5).map((review, idx) => (
                <div key={idx} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#723d46] to-[#5a2f36] 
                                  flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {review.userName?.[0]?.toUpperCase() || 'B'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-gray-900">{review.userName}</span>
                        {review.isVerifiedPurchase && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <FiCheckCircle className="w-3 h-3" /> Verified Purchase
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductModal 
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Product Card Component
function ProductCard({ product, onView, onCart, onBuy }) {
  const [isHovered, setIsHovered] = useState(false);
  const mainImage = product.images?.find(i => i.isPrimary)?.url || product.images?.[0]?.url;
  
  return (
    <motion.div 
      className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer group"
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden h-64 bg-gradient-to-br from-[#f5e6e8] to-[#e8d4d8]">
        {mainImage ? (
          <img 
            src={mainImage} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            🏺
          </div>
        )}
        
        {/* Stock Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm
            ${product.stock === 0 ? 'bg-red-500 text-white' : 
              product.stock <= 5 ? 'bg-orange-500 text-white' : 
              'bg-green-500 text-white'}`}>
            {product.stock === 0 ? 'Out of Stock' : 
             product.stock <= 5 ? `Only ${product.stock} left` : 
             'In Stock'}
          </span>
        </div>

        {/* Category Badge */}
        {product.category && (
          <div className="absolute bottom-3 left-3">
            <span className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-white text-xs font-medium capitalize">
              {product.category}
            </span>
          </div>
        )}

        {/* Quick View Overlay */}
        <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300
          ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button 
            onClick={onView}
            className="px-4 py-2 bg-white rounded-xl text-gray-900 font-semibold text-sm transform transition 
                     hover:scale-105 flex items-center gap-2"
          >
            <FiEye className="w-4 h-4" />
            Quick View
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-2xl font-bold text-[#723d46] mb-3">
          Rs. {product.price?.toLocaleString()}
        </p>
        
        {product.stock > 0 ? (
          <div className="flex gap-2">
            <button 
              onClick={onCart}
              className="flex-1 px-3 py-2 border-2 border-[#723d46] rounded-xl text-[#723d46] font-semibold text-sm
                       hover:bg-[#f5e6e8] transition flex items-center justify-center gap-1"
            >
               Cart
            </button>
            <button 
              onClick={onBuy}
              className="flex-1 px-3 py-2 bg-[#723d46] rounded-xl text-white font-semibold text-sm
                       hover:bg-[#5a2f36] transition flex items-center justify-center gap-1"
            >
              Buy
            </button>
          </div>
        ) : (
          <button className="w-full px-3 py-2 bg-gray-200 rounded-xl text-gray-500 font-semibold text-sm cursor-not-allowed">
            Out of Stock
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Product Modal Component
function ProductModal({ product, onClose, onAddToCart, onBuyNow }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const images = product.images || [];
  const mainImage = images[selectedImage]?.url || images[0]?.url;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white
                     hover:bg-black/70 transition"
          >
            <FiX className="w-5 h-5" />
          </button>

          <div className="grid md:grid-cols-2 gap-6 p-6">
            {/* Images */}
            <div>
              <div className="rounded-xl overflow-hidden bg-gray-100 mb-3 h-80">
                <img 
                  src={mainImage || 'https://via.placeholder.com/400'} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition
                        ${selectedImage === idx ? 'border-amber-500' : 'border-transparent'}`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              {product.category && (
                <span className="inline-block px-3 py-1 bg-[#f5e6e8] text-[#723d46] rounded-full text-xs font-medium mb-3 capitalize">
                  {product.category}
                </span>
              )}
              <h2 className="text-2xl font-bold text-gray-900 mb-2 font-serif">{product.name}</h2>
              <p className="text-3xl font-bold text-[#723d46] mb-4">
                Rs. {product.price?.toLocaleString()}
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">{product.description}</p>
              
              {product.materials?.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Materials</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.materials.map((material, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 rounded-lg text-sm text-gray-600">
                        {material}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold
                  ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {product.stock > 0 ? (
                    <>
                      <FiCheckCircle className="w-4 h-4" />
                      <span>{product.stock} items in stock</span>
                    </>
                  ) : (
                    <span>Out of stock</span>
                  )}
                </div>
              </div>

              {product.stock > 0 && (
                <div className="flex gap-3">
                  <button 
                    onClick={() => { onAddToCart(product); onClose(); }}
                    className="flex-1 px-6 py-3 border-2 border-[#723d46] rounded-xl text-[#723d46] font-semibold
                             hover:bg-[#f5e6e8] transition flex items-center justify-center gap-2"
                  >
                    🛒 Add to Cart
                  </button>
                  <button 
                    onClick={() => { onBuyNow(product); }}
                    className="flex-1 px-6 py-3 bg-[#723d46] rounded-xl text-white font-semibold
                             hover:bg-[#5a2f36] transition flex items-center justify-center gap-2"
                  >
                    ⚡ Buy Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}