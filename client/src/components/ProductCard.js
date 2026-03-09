import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiEye, FiMapPin } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ProductCustomizationModal from './ProductCustomizationModal';

// Animated customization icon — palette + resize (color & size)
const CustomizeIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="3" fill={active ? 'currentColor' : 'none'} />
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2 0-.56-.2-1.08-.53-1.47a.75.75 0 01.53-1.28H16c3.31 0 6-2.69 6-6C22 6.48 17.52 2 12 2z" />
    <circle cx="7" cy="12" r="1.2" fill="currentColor" />
    <circle cx="9.5" cy="7" r="1.2" fill="currentColor" />
    <circle cx="14.5" cy="7" r="1.2" fill="currentColor" />
    <circle cx="17" cy="12" r="1.2" fill="currentColor" />
  </svg>
);

const LOCATIONS = ['Eravur', 'Marudhamunai', 'Valaichenai', 'Ottamavadi', 'Kaatankudy'];

const ProductCard = ({ product, viewMode = 'grid', index = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [custPulse, setCustPulse] = useState(false);

  const { addToCart, isInWishlist, addToWishlist, removeFromWishlist } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const inWishlist = isInWishlist(product._id);
  const canOrder = isAuthenticated && user?.role === 'buyer';
  const artisanLocation = product.artisan?.location || '';

  const handleAddToCart = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to add items to cart'); navigate('/login'); return; }
    if (!canOrder) { toast.error('Artisans and admins cannot place orders'); return; }
    setAddingToCart(true);
    await addToCart(product, null, 1);
    setAddingToCart(false);
  };

  const handleBuyNow = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to purchase'); navigate('/login'); return; }
    if (!canOrder) { toast.error('Artisans and admins cannot place orders'); return; }
    setBuyingNow(true);
    const success = await addToCart(product, null, 1);
    setBuyingNow(false);
    if (success !== false) navigate('/cart');
  };

  const handleWishlistToggle = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to add items to wishlist'); navigate('/login'); return; }
    if (inWishlist) await removeFromWishlist(product._id);
    else await addToWishlist(product);
  };

  const handleCustomizationClick = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to customize'); navigate('/login'); return; }
    setCustPulse(true);
    setTimeout(() => setCustPulse(false), 600);
    setShowCustomization(true);
  };

  const stockBadge = () => {
    if (product.stock === 0) return <span className="text-xs font-semibold text-red-500">Out of stock</span>;
    if (product.stock <= 5) return <span className="text-xs font-semibold text-orange-500">Only {product.stock} left</span>;
    return <span className="text-xs text-green-600 font-medium">In stock ({product.stock})</span>;
  };

  if (viewMode === 'list') {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
          onClick={() => navigate(`/products/${product._id || product.id}`)}
        >
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 relative overflow-hidden">
              <div className="relative h-64 md:h-full">
                <img src={product.images?.[0]?.url} alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <button onClick={handleWishlistToggle}
                className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${inWishlist ? 'bg-red-500 text-white' : 'bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-red-500 hover:text-white'}`}>
                <FiHeart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
              </button>
            </div>
            <div className="md:w-2/3 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 hover:text-primary transition-colors mb-1">{product.name}</h3>
                    <p className="text-gray-600 text-sm">by {product.artisan?.name}</p>
                    {artisanLocation && (
                      <div className="flex items-center mt-1 text-gray-400">
                        <FiMapPin className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs">{artisanLocation}</span>
                      </div>
                    )}
                  </div>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium capitalize">{product.category}</span>
                </div>
                <p className="text-gray-600 mb-3 line-clamp-2 text-sm">{product.description}</p>
                {product.isCustomizable && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-violet-700 bg-violet-50 px-3 py-1 rounded-full mb-3">
                    <CustomizeIcon active /> Customizable
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <span className="text-2xl font-bold text-gray-900">Rs. {product.price}</span>
                  <div className="mt-1">{stockBadge()}</div>
                </div>
                <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                  {product.isCustomizable && (
                    <motion.button onClick={handleCustomizationClick}
                      animate={custPulse ? { scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] } : {}}
                      className="p-3 rounded-full bg-violet-50 hover:bg-violet-600 text-violet-600 hover:text-white transition-colors"
                      title="Customize color & size">
                      <CustomizeIcon />
                    </motion.button>
                  )}
                  <button onClick={handleAddToCart} disabled={addingToCart || product.stock === 0}
                    className={`p-3 rounded-full transition-colors ${product.stock === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary/10 hover:bg-primary text-primary hover:text-white'}`}>
                    {addingToCart ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" /> : <FiShoppingCart className="h-5 w-5" />}
                  </button>
                  <button onClick={handleBuyNow} disabled={buyingNow || product.stock === 0}
                    className={`px-4 py-3 rounded-full text-sm font-medium transition-all border-2 ${product.stock === 0 ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-primary text-primary hover:bg-primary hover:text-white'}`}>
                    {buyingNow ? '...' : 'Buy Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        {showCustomization && <ProductCustomizationModal product={product} onClose={() => setShowCustomization(false)} />}
      </>
    );
  }

  // Grid View
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onHoverStart={() => setIsHovered(true)} onHoverEnd={() => setIsHovered(false)}
        className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
        onClick={() => navigate(`/products/${product._id || product.id}`)}
      >
        {/* Image */}
        <div className="relative overflow-hidden">
          <div className="relative h-64">
            <img src={product.images?.[0]?.url || 'https://via.placeholder.com/600x800?text=Handcrafted'}
              alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 20 }}
            transition={{ duration: 0.3 }}
            className="absolute top-4 right-4 flex flex-col space-y-2"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={handleWishlistToggle}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${inWishlist ? 'bg-red-500 text-white' : 'bg-white text-gray-700 hover:bg-red-500 hover:text-white'}`}>
              <FiHeart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
            </button>
            <Link to={`/products/${product._id || product.id}`} onClick={e => e.stopPropagation()}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-700 hover:bg-primary hover:text-white shadow-lg transition-colors">
              <FiEye className="h-5 w-5" />
            </Link>
            {product.isCustomizable && (
              <motion.button onClick={handleCustomizationClick}
                animate={custPulse ? { scale: [1, 1.4, 1], rotate: [0, 20, -20, 0] } : {}}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-violet-600 hover:bg-violet-600 hover:text-white shadow-lg transition-colors"
                title="Customize color & size">
                <CustomizeIcon />
              </motion.button>
            )}
          </motion.div>

          {/* Category badge */}
          {product.category && (
            <span className="absolute bottom-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-900 shadow-lg capitalize">
              {product.category}
            </span>
          )}

          {/* Customizable badge — animated color pulse */}
          {product.isCustomizable && (
            <motion.span
              animate={{ backgroundColor: ['#7c3aed', '#2563eb', '#db2777', '#7c3aed'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="absolute top-4 left-4 px-3 py-1.5 text-white rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5"
            >
              <CustomizeIcon active /> Customizable
            </motion.span>
          )}

          {product.stock === 0 && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white font-semibold text-lg">
              Out of Stock
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-5">
          {/* Artisan + Location */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                <img src={product.artisan?.avatar?.url || `https://ui-avatars.com/api/?name=${product.artisan?.name || 'A'}&background=8B4513&color=fff&size=28`}
                  alt={product.artisan?.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-sm text-gray-600 truncate">{product.artisan?.name}</span>
            </div>
            {artisanLocation && (
              <div className="flex items-center text-gray-400 flex-shrink-0">
                <FiMapPin className="h-3.5 w-3.5 mr-0.5" />
                <span className="text-xs">{artisanLocation}</span>
              </div>
            )}
          </div>

          <h3 className="text-base font-semibold text-gray-900 hover:text-primary transition-colors mb-1 line-clamp-1">{product.name}</h3>
          <p className="text-gray-500 text-sm mb-3 line-clamp-2">{product.description}</p>

          {/* Stock */}
          <div className="mb-3">{stockBadge()}</div>

          {/* Price & actions */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xl font-bold text-gray-900">Rs. {product.price?.toLocaleString()}</span>
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              {product.isCustomizable && (
                <motion.button onClick={handleCustomizationClick}
                  animate={custPulse ? { scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] } : {}}
                  whileHover={{ scale: 1.1 }}
                  className="p-2.5 rounded-full bg-violet-50 hover:bg-violet-600 text-violet-600 hover:text-white transition-colors"
                  title="Customize color & size">
                  <CustomizeIcon />
                </motion.button>
              )}
              <button onClick={handleAddToCart} disabled={addingToCart || product.stock === 0}
                className={`p-2.5 rounded-full transition-colors ${product.stock === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary/10 hover:bg-primary text-primary hover:text-white'}`}>
                {addingToCart ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" /> : <FiShoppingCart className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div onClick={e => e.stopPropagation()}>
            <button onClick={handleBuyNow} disabled={buyingNow || product.stock === 0}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${product.stock === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark text-white hover:shadow-lg'}`}>
              {buyingNow ? 'Processing...' : 'Buy Now'}
            </button>
          </div>
        </div>
      </motion.div>

      {showCustomization && <ProductCustomizationModal product={product} onClose={() => setShowCustomization(false)} />}
    </>
  );
};

export default ProductCard;
