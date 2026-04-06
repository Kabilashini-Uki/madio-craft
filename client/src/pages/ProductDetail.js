// src/pages/ProductDetail.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiHeart, FiShoppingCart, FiShoppingBag, FiEdit3, 
  FiMapPin, FiCheckCircle, FiTruck, FiShield,
  FiMinus, FiPlus, FiArrowLeft, FiPackage
} from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCustomizationModal from '../components/ProductCustomizationModal';

// Product Card for Artisan's Other Products
const RelatedProductCard = ({ product, onProductClick }) => {
  const { isAuthenticated, user } = useAuth();
  const { addToCart, isInWishlist, addToWishlist, removeFromWishlist } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);

  const isOwnProduct = isAuthenticated && user && String(user?.id || user?._id) === String(product.artisan?._id || product.artisan);
  const inWishlist = isInWishlist(product._id);

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login'); return; }
    if (isOwnProduct) { toast.error("You can't order your own product"); return; }
    if (product.stock === 0) { toast.error('Out of stock'); return; }
    
    setAddingToCart(true);
    try {
      await addToCart(product, null, 1);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login'); return; }
    if (inWishlist) {
      await removeFromWishlist(product._id);
    } else {
      await addToWishlist(product);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={() => onProductClick(product._id)}
      className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all"
    >
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={product.images?.[0]?.url || 'https://via.placeholder.com/200'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-bold text-white ${
          product.stock === 0 ? 'bg-red-500' : product.stock <= 5 ? 'bg-orange-500' : 'bg-green-500'
        }`}>
          {product.stock === 0 ? 'Out' : product.stock <= 5 ? `${product.stock}` : 'In Stock'}
        </div>
        <button
          onClick={handleWishlist}
          className={`absolute top-2 left-2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center transition ${
            inWishlist ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
          }`}
        >
          <FiHeart size={14} fill={inWishlist ? '#ef4444' : 'none'} />
        </button>
      </div>
      <div className="p-3">
        <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">{product.name}</h4>
        <p className="text-[#723d46] font-bold text-lg mt-1">Rs. {product.price?.toLocaleString()}</p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleAddToCart}
            disabled={addingToCart || isOwnProduct || product.stock === 0}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
              isOwnProduct || product.stock === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#f5e6e8] text-[#723d46] hover:bg-[#e8d4d8]'
            }`}
          >
            <FiShoppingCart size={12} /> Cart
          </button>
          {product.isCustomizable && !isOwnProduct && product.stock > 0 && product.artisan?.acceptCustomOrders !== false && (
            <span className="px-2 py-1.5 bg-[#f5e6e8] text-[#723d46] rounded-lg text-xs flex items-center gap-1">
              <FiEdit3 size={10} /> Custom
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { addToCart, isInWishlist, addToWishlist, removeFromWishlist } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [showCustom, setShowCustom] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  const inWishlist = product ? isInWishlist(product._id) : false;
  const isOwnProduct = isAuthenticated && user && product && (
    String(product.artisan?._id || product.artisan) === String(user?.id || user?._id)
  );

  // Fetch product
  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products/${id}`);
      let prod = null;
      if (res.data.success && res.data.product) {
        prod = res.data.product;
      } else if (res.data.product) {
        prod = res.data.product;
      } else if (res.data._id) {
        prod = res.data;
      }

      if (!prod || !prod._id) throw new Error('Invalid product data');
      setProduct(prod);
      
      // Fetch related products from same artisan
      if (prod.artisan?._id || prod.artisan) {
        await fetchRelatedProducts(prod.artisan?._id || prod.artisan, prod._id);
      }
    } catch (err) {
      console.error('Failed to load product:', err);
      toast.error('Product not found');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchRelatedProducts = async (artisanId, currentProductId) => {
    try {
      setLoadingRelated(true);
      const res = await api.get(`/products?artisan=${artisanId}&limit=6`);
      let products = [];
      if (res.data.success && res.data.products) {
        products = res.data.products;
      } else if (Array.isArray(res.data)) {
        products = res.data;
      } else if (res.data.products) {
        products = res.data.products;
      }
      // Filter out current product
      const filtered = products.filter(p => p._id !== currentProductId).slice(0, 4);
      setRelatedProducts(filtered);
    } catch (error) {
      console.error('Failed to fetch related products:', error);
    } finally {
      setLoadingRelated(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Handle ?customize=true
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('customize') === 'true' && product && !isOwnProduct) {
      setShowCustom(true);
    }
  }, [location.search, product, isOwnProduct]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login');
      navigate('/login');
      return;
    }
    if (isOwnProduct) {
      toast.error("You can't order your own product");
      return;
    }
    if (product.stock === 0) {
      toast.error('Out of stock');
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(product, null, quantity);
      toast.success('Added to cart!');
    } catch {
      toast.error('Failed to add');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error('Please login');
      navigate('/login');
      return;
    }
    if (isOwnProduct) {
      toast.error("You can't order your own product");
      return;
    }
    if (product.stock === 0) {
      toast.error('Out of stock');
      return;
    }

    setBuyingNow(true);
    try {
      await addToCart(product, null, quantity);
      navigate('/checkout');
    } catch {
      toast.error('Failed to proceed');
    } finally {
      setBuyingNow(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please login');
      navigate('/login');
      return;
    }
    if (inWishlist) {
      await removeFromWishlist(product._id);
      toast.success('Removed from wishlist');
    } else {
      await addToWishlist(product);
      toast.success('Added to wishlist');
    }
  };

  const openCustomize = () => {
    if (!isAuthenticated) {
      toast.error('Please login to customise');
      navigate('/login');
      return;
    }
    if (isOwnProduct) {
      toast.error("You can't customise your own product");
      return;
    }
    setShowCustom(true);
  };

  const handleViewShop = () => {
    navigate(`/artisans/${product.artisan?._id || product.artisan}`);
  };

  const handleRelatedProductClick = (productId) => {
    navigate(`/products/${productId}`);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-[#723d46] border-t-transparent"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
          <button onClick={() => navigate('/products')} className="px-6 py-3 bg-[#723d46] text-white rounded-xl">
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-[#723d46] mb-6 transition-colors"
        >
          <FiArrowLeft size={18} /> Back
        </button>

        {/* Product Main Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8">
            {/* Left - Images */}
            <div>
              <div className="bg-gray-100 rounded-xl overflow-hidden aspect-square">
                <img
                  src={product.images?.[activeImage]?.url || product.images?.[0]?.url || 'https://via.placeholder.com/500'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {product.images?.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                        activeImage === i ? 'border-[#723d46]' : 'border-gray-200 hover:border-[#723d46]'
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right - Details */}
            <div>
              {/* Category */}
              {product.category && (
                <span className="inline-block px-3 py-1 bg-[#f5e6e8] text-[#723d46] rounded-full text-xs font-medium uppercase tracking-wider mb-3">
                  {product.category}
                </span>
              )}

              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

              {/* Artisan Info with Shop Link */}
              <button
                onClick={handleViewShop}
                className="flex items-center gap-2 text-[#723d46] hover:underline mb-4"
              >
                <span>by {product.artisan?.name || 'Artisan'}</span>
                {product.artisan?.location && (
                  <span className="flex items-center gap-1 text-gray-500 text-sm">
                    <FiMapPin size={12} /> {product.artisan.location}
                  </span>
                )}
              </button>

              {/* Price */}
              <p className="text-4xl font-bold text-[#723d46] mb-4">
                Rs. {product.price?.toLocaleString()}
              </p>

              {/* Stock Status */}
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4 ${
                product.stock === 0 ? 'bg-red-100 text-red-700' :
                product.stock <= 5 ? 'bg-orange-100 text-orange-700' :
                'bg-green-100 text-green-700'
              }`}>
                {product.stock === 0 ? (
                  <>Out of Stock</>
                ) : product.stock <= 5 ? (
                  <>Only {product.stock} left in stock</>
                ) : (
                  <><FiCheckCircle size={14} /> In Stock ({product.stock} available)</>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>

              {/* Customization Badge - Changed from purple to #723d46 */}
              {product.isCustomizable && !isOwnProduct && product.stock > 0 && (
                <div className="flex items-center gap-3 p-3 bg-[#f5e6e8] rounded-xl mb-6">
                  <FiEdit3 className="text-[#723d46] text-xl" />
                  <div>
                    <p className="font-semibold text-[#723d46]">Customization Available</p>
                    <p className="text-sm text-[#723d46]/70">You can request custom colors, sizes, or special notes</p>
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              {product.stock > 0 && !isOwnProduct && (
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-gray-700 font-medium">Quantity:</span>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-l-xl"
                    >
                      <FiMinus size={16} />
                    </button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-r-xl"
                    >
                      <FiPlus size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button
                  onClick={handleAddToCart}
                  disabled={isOwnProduct || product.stock === 0 || addingToCart}
                  className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all ${
                    isOwnProduct || product.stock === 0 || addingToCart
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-[#f5e6e8] text-[#723d46] hover:bg-[#e8d4d8]'
                  }`}
                >
                  {addingToCart ? (
                    <div className="w-5 h-5 border-2 border-[#723d46] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiShoppingCart size={18} />
                  )}
                  {isOwnProduct ? 'Your Product' : addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={isOwnProduct || product.stock === 0 || buyingNow}
                  className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all ${
                    isOwnProduct || product.stock === 0 || buyingNow
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-[#723d46] text-white hover:bg-[#5a2f36]'
                  }`}
                >
                  {buyingNow ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiShoppingBag size={18} />
                  )}
                  {isOwnProduct ? 'Your Product' : buyingNow ? 'Processing...' : 'Buy Now'}
                </button>

                <button
                  onClick={handleWishlistToggle}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    inWishlist ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <FiHeart size={20} fill={inWishlist ? '#ef4444' : 'none'} />
                </button>
              </div>

              {/* Customization Button - Changed from purple to #723d46 */}
              {product.isCustomizable && !isOwnProduct && product.stock > 0 && product.artisan?.acceptCustomOrders !== false && (
                <button
                  onClick={openCustomize}
                  className="w-full py-3 rounded-xl border-2 border-[#723d46] text-[#723d46] font-semibold flex items-center justify-center gap-2 hover:bg-[#f5e6e8] transition-all mb-4"
                >
                  <FiEdit3 size={16} />
                  Request Customization
                </button>
              )}

              {/* View Shop Button */}
              <button
                onClick={handleViewShop}
                className="w-full py-3 rounded-xl border-2 border-[#723d46] bg-[#723d46] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#5a2f36] transition-all"
              >
                <FiPackage size={16} />
                View Artisan's Shop
              </button>

              {/* Shipping Info */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <FiTruck size={16} />
                    <span>Free Shipping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiShield size={16} />
                    <span>Secure Payment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* More Products from this Artisan */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                More from {product.artisan?.name || 'this Artisan'}
              </h2>
              <button
                onClick={handleViewShop}
                className="text-[#723d46] hover:underline text-sm font-medium"
              >
                View All →
              </button>
            </div>

            {loadingRelated ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#723d46] border-t-transparent" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map(relatedProduct => (
                  <RelatedProductCard
                    key={relatedProduct._id}
                    product={relatedProduct}
                    onProductClick={handleRelatedProductClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customization Modal */}
      {showCustom && (
        <ProductCustomizationModal product={product} onClose={() => setShowCustom(false)} />
      )}
    </div>
  );
};

export default ProductDetail;