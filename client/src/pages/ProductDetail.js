// src/pages/ProductDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaStar, FaHeart, FaShoppingCart, FaTruck, FaShieldAlt, FaArrowLeft } from 'react-icons/fa';
import { FiMessageCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ProductCustomizationModal from '../components/ProductCustomizationModal';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotif } from '../context/NotifContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart, isInWishlist, addToWishlist, removeFromWishlist } = useCart();
  const { isCustomizationApproved, getCustomizationData } = useNotif();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [showCustomization, setShowCustomization] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  const inWishlist = product ? isInWishlist(product._id) : false;
  const custApproved = product ? isCustomizationApproved(product._id) : false;
  const approvedData = product ? getCustomizationData(product._id) : null;

  const fetchProduct = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${id}`);
      const prod = response.data.product || response.data;
      setProduct(prod);
    } catch (error) {
      console.error('Failed to load product:', error);
      toast.error('Failed to load product');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchProduct();
  }, [id, fetchProduct]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error('Please login'); navigate('/login'); return; }
    setAddingToCart(true);
    try {
      // If customization is approved, use that data
      const customizationData = custApproved ? {
        color: approvedData.color,
        size: approvedData.size,
        notes: approvedData.notes,
        customPrice: approvedData.customizationPrice
      } : null;

      await addToCart(product, customizationData, quantity);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error(error?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) { toast.error('Please login'); navigate('/login'); return; }
    setBuyingNow(true);
    try {
      const customizationData = custApproved ? {
        color: approvedData.color,
        size: approvedData.size,
        notes: approvedData.notes,
        customPrice: approvedData.customizationPrice
      } : null;

      const success = await addToCart(product, customizationData, quantity);
      if (success) navigate('/cart');
    } catch (error) {
      toast.error(error?.message || 'Failed');
    } finally {
      setBuyingNow(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) { toast.error('Please login'); navigate('/login'); return; }
    if (inWishlist) await removeFromWishlist(product._id);
    else await addToWishlist(product);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-700 border-t-transparent"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-700">Product not found</h2>
        <button onClick={() => navigate('/products')} className="mt-4 text-amber-700 hover:underline">
          ← Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-gray-600 hover:text-amber-700 mb-6">
          <FaArrowLeft /><span>Back</span>
        </button>

        {/* FIXED: Two-column layout with proper alignment */}
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left Column - Product Images */}
          <div className="lg:w-1/2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
              <img
                src={product.images?.[activeImage]?.url || product.images?.[0]?.url || 'https://via.placeholder.com/600'}
                alt={product.name}
                className="w-full h-96 object-cover"
              />
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-4 overflow-x-auto">
                {product.images.map((img, index) => (
                  <button key={index}
                    onClick={() => setActiveImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${activeImage === index ? 'border-amber-700' : 'border-transparent'
                      }`}>
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Details */}
          <div className="lg:w-1/2 space-y-6">
            {/* Category Breadcrumb */}
            <div className="text-sm text-gray-600">
              <span className="cursor-pointer hover:text-amber-700" onClick={() => navigate('/')}>Home</span>
              <span className="mx-2">/</span>
              <span className="cursor-pointer hover:text-amber-700" onClick={() => navigate('/products')}>Products</span>
              <span className="mx-2">/</span>
              <span className="text-amber-700 font-semibold capitalize">{product.category}</span>
            </div>

            {/* Product Name */}
            <h1 className="text-4xl font-serif font-bold text-gray-900">{product.name}</h1>

            {/* Artisan Info */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                <img
                  src={product.artisan?.avatar?.url || 'https://via.placeholder.com/48'}
                  alt={product.artisan?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-semibold">By {product.artisan?.name || 'Artisan'}</p>
                <p className="text-sm text-gray-600">{product.artisan?.location}</p>
              </div>
            </div>

            {/* Rating & Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className={i < Math.floor(product.ratings?.average || 0) ? 'fill-current' : 'text-gray-300'} />
                  ))}
                </div>
                <span className="font-semibold">{product.ratings?.average?.toFixed(1) || '0.0'}</span>
                <span className="text-gray-500">({product.ratings?.count || 0} reviews)</span>
              </div>

              <button onClick={handleWishlistToggle} className="text-gray-500 hover:text-red-500">
                <FaHeart className={`h-6 w-6 ${inWishlist ? 'fill-current text-red-500' : ''}`} />
              </button>
            </div>

            {/* Stock Status */}
            <div className={`font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {product.stock === 0 ? 'Out of Stock' : `In Stock (${product.stock} available)`}
            </div>

            {/* Price */}
            <div className="text-5xl font-bold text-amber-700 py-4">
              Rs. {product.price?.toLocaleString()}
            </div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="flex items-center space-x-4">
                <label className="font-semibold">Quantity:</label>
                <div className="flex items-center border-2 border-gray-200 rounded-full">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center text-xl hover:bg-gray-100 rounded-l-full">
                    −
                  </button>
                  <span className="w-16 text-center text-xl font-bold">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-10 h-10 flex items-center justify-center text-xl hover:bg-gray-100 rounded-r-full">
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons - Properly aligned */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || product.stock === 0}
                className="flex-1 py-4 bg-amber-700 text-white rounded-xl font-semibold hover:bg-amber-800 disabled:opacity-50 flex items-center justify-center space-x-2">
                <FaShoppingCart />
                <span>{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={buyingNow || product.stock === 0}
                className={`flex-1 py-4 text-white rounded-xl font-semibold transition-all shadow-md ${custApproved ? 'bg-green-600 hover:bg-green-700 ring-4 ring-green-100' : 'bg-gray-900 hover:bg-gray-800'
                  } disabled:opacity-50`}>
                {buyingNow ? 'Processing...' : custApproved ? '🛒 Buy Customised' : 'Buy Now'}
              </button>

              {product.isCustomizable && product.stock > 0 && (
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.error('Please login to request customization');
                      navigate('/login', { state: { from: `/products/${product._id}` } });
                      return;
                    }
                    setShowCustomization(true);
                  }}
                  className="py-4 px-6 border-2 border-amber-700 text-amber-700 rounded-xl font-semibold hover:bg-amber-50 flex items-center justify-center space-x-2">
                  <FiMessageCircle />
                  <span>Customize</span>
                </button>
              )}
            </div>

            {/* Description */}
            <div className="pt-6 border-t">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Product Description</h3>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="bg-amber-100 p-3 rounded-full">
                    <FaTruck className="text-amber-700" />
                  </div>
                  <div>
                    <p className="font-semibold">Free Shipping</p>
                    <p className="text-sm text-gray-600">On orders over Rs. 999</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="bg-amber-100 p-3 rounded-full">
                    <FaShieldAlt className="text-amber-700" />
                  </div>
                  <div>
                    <p className="font-semibold">Secure Payment</p>
                    <p className="text-sm text-gray-600">100% satisfaction guarantee</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {product.ratings?.reviews?.length > 0 && (
          <div className="mt-16 pt-8 border-t">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Customer Reviews</h2>
            <div className="space-y-6">
              {product.ratings.reviews.map((review, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                      {review.user?.name?.[0] || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-semibold">{review.user?.name || 'Customer'}</span>
                        <span className="text-sm text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex text-yellow-400 mt-2">
                        {[...Array(5)].map((_, j) => (
                          <FaStar key={j} className={j < review.rating ? 'fill-current' : 'text-gray-300'} />
                        ))}
                      </div>
                      <p className="text-gray-600 mt-2">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Customization Modal */}
      {showCustomization && (
        <ProductCustomizationModal
          product={product}
          onClose={() => setShowCustomization(false)}
        />
      )}
    </div>
  );
};

export default ProductDetail;