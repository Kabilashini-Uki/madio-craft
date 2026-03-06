import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiEye, FiStar, FiTool } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ProductCustomizationModal from './ProductCustomizationModal';

const StarRating = ({ rating, count }) => (
  <div className="flex items-center space-x-1">
    {[...Array(5)].map((_, i) => (
      <FiStar
        key={i}
        className={`h-3.5 w-3.5 ${i < Math.floor(rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ))}
    <span className="text-xs text-gray-500 ml-1">({count || 0})</span>
  </div>
);

const ProductCard = ({ product, viewMode = 'grid', index = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);

  const { addToCart, isInWishlist, addToWishlist, removeFromWishlist } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const inWishlist = isInWishlist(product._id);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to add items to cart'); navigate('/login'); return; }
    setAddingToCart(true);
    await addToCart(product, null, 1);
    setAddingToCart(false);
  };

  const handleBuyNow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to purchase'); navigate('/login'); return; }
    setBuyingNow(true);
    const success = await addToCart(product, null, 1);
    setBuyingNow(false);
    if (success !== false) navigate('/cart');
  };

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to add items to wishlist'); navigate('/login'); return; }
    if (inWishlist) await removeFromWishlist(product._id);
    else await addToWishlist(product);
  };

  const handleCardClick = () => {
    navigate(`/products/${product._id || product.id}`);
  };

  const handleCustomizationClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to customize'); navigate('/login'); return; }
    setShowCustomization(true);
  };

  if (viewMode === 'list') {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
          onClick={handleCardClick}
        >
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 relative overflow-hidden">
              <div className="relative h-64 md:h-full">
                <img
                  src={product.images?.[0]?.url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <button onClick={handleWishlistToggle}
                className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${inWishlist ? 'bg-red-500 text-white' : 'bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-red-500 hover:text-white'}`}>
                <FiHeart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
              </button>
            </div>
            <div className="md:w-2/3 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 hover:text-primary transition-colors mb-2">{product.name}</h3>
                    <p className="text-gray-600">by {product.artisan?.name}</p>
                  </div>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium capitalize">{product.category}</span>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                <div className="flex items-center space-x-4 mb-4">
                  <StarRating rating={product.ratings?.average} count={product.ratings?.count} />
                  {product.isCustomizable && (
                    <span className="text-sm text-primary bg-primary/10 px-3 py-1 rounded-full">Customizable</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <span className="text-2xl font-bold text-gray-900">Rs. {product.price}</span>
                  {product.stock <= 5 && product.stock > 0 && <p className="text-xs text-red-500 mt-1">Only {product.stock} left!</p>}
                  {product.stock === 0 && <p className="text-xs text-red-500 mt-1">Out of stock</p>}
                </div>
                <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                  {product.isCustomizable && (
                    <button onClick={handleCustomizationClick}
                      className="p-3 rounded-full bg-purple-50 hover:bg-purple-600 text-purple-600 hover:text-white transition-colors"
                      title="Customize">
                      <FiTool className="h-5 w-5" />
                    </button>
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
        {showCustomization && (
          <ProductCustomizationModal product={product} onClose={() => setShowCustomization(false)} />
        )}
      </>
    );
  }

  // Grid View
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Image Container */}
        <div className="relative overflow-hidden">
          <div className="relative h-72">
            <img
              src={product.images?.[0]?.url || 'https://via.placeholder.com/600x800?text=Handcrafted'}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>

          {/* Quick Actions */}
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
              <button onClick={handleCustomizationClick}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-purple-600 hover:bg-purple-600 hover:text-white shadow-lg transition-colors"
                title="Customize this product">
                <FiTool className="h-5 w-5" />
              </button>
            )}
          </motion.div>

          {/* Category Badge */}
          {product.category && (
            <span className="absolute bottom-4 left-4 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-900 shadow-lg capitalize">
              {product.category}
            </span>
          )}

          {/* Customizable Badge */}
          {product.isCustomizable && (
            <span className="absolute top-4 left-4 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
              <FiTool className="h-3 w-3" /> Customizable
            </span>
          )}

          {product.stock === 0 && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white font-semibold text-lg">
              Out of Stock
            </span>
          )}
        </div>

        {/* Product Info */}
        <div className="p-5">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
              <img src={product.artisan?.avatar?.url || `https://ui-avatars.com/api/?name=${product.artisan?.name || 'A'}&background=8B4513&color=fff&size=32`}
                alt={product.artisan?.name} className="w-full h-full object-cover" />
            </div>
            <span className="text-sm text-gray-600">{product.artisan?.name}</span>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 hover:text-primary transition-colors mb-2 line-clamp-1">
            {product.name}
          </h3>

          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

          <div className="mb-3">
            <StarRating rating={product.ratings?.average} count={product.ratings?.count} />
          </div>

          {/* Price and Actions */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-2xl font-bold text-gray-900">Rs. {product.price}</span>
              {product.stock <= 5 && product.stock > 0 && (
                <p className="text-xs text-red-500 font-semibold mt-1">Only {product.stock} left!</p>
              )}
            </div>
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              {product.isCustomizable && (
                <button onClick={handleCustomizationClick}
                  className="p-2.5 rounded-full bg-purple-50 hover:bg-purple-600 text-purple-600 hover:text-white transition-colors"
                  title="Customize">
                  <FiTool className="h-4 w-4" />
                </button>
              )}
              <button onClick={handleAddToCart} disabled={addingToCart || product.stock === 0}
                className={`p-2.5 rounded-full transition-colors ${product.stock === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary/10 hover:bg-primary text-primary hover:text-white'}`}>
                {addingToCart ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" /> : <FiShoppingCart className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Buy Now Button */}
          <div onClick={e => e.stopPropagation()}>
            <button onClick={handleBuyNow} disabled={buyingNow || product.stock === 0}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${product.stock === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark text-white hover:shadow-lg'}`}>
              {buyingNow ? 'Processing...' : 'Buy Now'}
            </button>
          </div>
        </div>
      </motion.div>

      {showCustomization && (
        <ProductCustomizationModal product={product} onClose={() => setShowCustomization(false)} />
      )}
    </>
  );
};

export default ProductCard;
