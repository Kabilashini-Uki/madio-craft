// pages/ProductDetail.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  FaStar,
  FaHeart,
  FaShoppingCart,
  FaShareAlt,
  FaTruck,
  FaShieldAlt,
  FaCheck,
  FaArrowLeft,
  FaRegHeart
} from 'react-icons/fa';
import { FiMessageCircle, FiStar } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ProductCustomization from '../components/ProductCustomization';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToCart, isInWishlist, addToWishlist, removeFromWishlist } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [showCustomization, setShowCustomization] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  // Check if product is in wishlist
  const inWishlist = product ? isInWishlist(product._id) : false;

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      console.log('Fetching product with ID:', id); // Debug log

      const response = await api.get(`/products/${id}`);
      console.log('Product API response:', response.data); // Debug log

      // Handle different response structures
      const prod = response.data.product || response.data;

      if (!prod || !prod._id) {
        console.error('Invalid product data received:', prod);
        toast.error('Product not found');
        navigate('/products');
        return;
      }

      // Normalize product data
      const normalized = {
        _id: prod._id || prod.id,
        name: prod.name || prod.title || 'Untitled Product',
        description: prod.description || prod.summary || '',
        price: Number(prod.price) || 0,
        images: Array.isArray(prod.images) ? prod.images :
          (prod.photos ? prod.photos :
            (prod.image ? [{ url: prod.image }] : [])),
        stock: Number(prod.stock) || 0,
        ratings: prod.ratings || { average: 0, count: 0, reviews: [] },
        materials: Array.isArray(prod.materials) ? prod.materials :
          (prod.materials ? [prod.materials] : []),
        isCustomizable: !!prod.isCustomizable,
        category: prod.category || 'other',
        artisan: prod.artisan || prod.seller || {},
        createdAt: prod.createdAt || new Date().toISOString(),
        ...prod
      };

      console.log('Normalized product:', normalized); // Debug log
      setProduct(normalized);

    } catch (error) {
      console.error('Failed to load product:', error);

      if (error.response) {
        console.error('Error response:', error.response.data);
        if (error.response.status === 404) {
          toast.error('Product not found');
          navigate('/products');
        } else {
          toast.error(error.response.data?.message || 'Failed to load product details');
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        toast.error('Cannot connect to server. Please check your connection.');
      } else {
        toast.error('Failed to load product details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(product, null, quantity);
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error(error?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }

    setBuyingNow(true);
    try {
      const success = await addToCart(product, null, quantity);
      if (success) {
        navigate('/cart');
      }
    } catch (error) {
      console.error('Buy now error:', error);
      toast.error(error?.message || 'Failed to add to cart');
    } finally {
      setBuyingNow(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      navigate('/login');
      return;
    }

    if (inWishlist) {
      await removeFromWishlist(product._id);
    } else {
      await addToWishlist(product);
    }
  };

  const handleCustomizeClick = () => {
    if (!isAuthenticated) {
      toast.error('Please login to customize products');
      navigate('/login');
      return;
    }
    setShowCustomization(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-700">Product not found</h2>
        <button
          onClick={() => navigate('/products')}
          className="mt-4 text-primary hover:underline"
        >
          ← Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="container mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-primary hover:text-primary-dark transition-colors"
        >
          <FaArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>
      </div>

      <div className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            {/* Main Image */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6"
            >
              <img
                src={product.images[activeImage]?.url || product.images[0]?.url || '/api/placeholder/600/600'}
                alt={product.name}
                className="w-full h-[500px] object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/600x600?text=Product+Image';
                }}
              />
            </motion.div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-4 overflow-x-auto py-4">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-4 transition-all ${activeImage === index
                        ? 'border-primary shadow-lg scale-105'
                        : 'border-transparent hover:border-primary/30'
                      }`}
                  >
                    <img
                      src={img.url}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/80?text=Image';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            {/* Breadcrumb */}
            <div className="text-sm text-gray-600">
              <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/')}>Home</span>
              <span className="mx-2">/</span>
              <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/products')}>Products</span>
              <span className="mx-2">/</span>
              <span className="text-primary-dark font-semibold capitalize">{product.category}</span>
            </div>

            {/* Title and Artisan */}
            <div>
              <h1 className="text-4xl font-serif font-bold text-primary-dark mb-4">
                {product.name}
              </h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30">
                    <img
                      src={product.artisan?.avatar?.url || '/api/placeholder/48/48'}
                      alt={product.artisan?.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/48?text=A';
                      }}
                    />
                  </div>
                  <div>
                    <p className="font-semibold">By {product.artisan?.name || 'Artisan'}</p>
                    <p className="text-sm text-gray-600">{product.artisan?.artisanProfile?.businessName}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/artisans/${product.artisan?._id}`)}
                  className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-full font-semibold transition-colors"
                >
                  Contact Artisan
                </button>
              </div>
            </div>

            {/* Rating and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={`h-5 w-5 ${i < Math.floor(product.ratings?.average || 0) ? 'fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">
                    {product.ratings?.average?.toFixed(1) || '0.0'}
                  </span>
                  <span className="text-gray-500">
                    ({product.ratings?.count || 0} reviews)
                  </span>
                </div>
                <span className="text-gray-400">•</span>
                <span className={`font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleWishlistToggle}
                  className={`text-gray-500 hover:text-red-500 transition-colors ${inWishlist ? 'text-red-500' : ''}`}
                >
                  {inWishlist ? (
                    <FaHeart className="h-6 w-6 fill-current" />
                  ) : (
                    <FaRegHeart className="h-6 w-6" />
                  )}
                </button>
                <button className="text-gray-500 hover:text-primary">
                  <FaShareAlt className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-primary-light/20 to-primary-light/10 rounded-2xl p-8">
              <div className="flex items-baseline space-x-4 mb-6">
                <span className="text-5xl font-bold text-primary-dark">Rs {product.price?.toLocaleString()}</span>
                {product.stock <= 10 && product.stock > 0 && (
                  <span className="text-red-600 font-semibold bg-red-50 px-3 py-1 rounded-full">
                    Only {product.stock} left!
                  </span>
                )}
              </div>

              {/* Quantity */}
              {product.stock > 0 && (
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Quantity</label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center border-2 border-primary/20 rounded-full">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-12 h-12 flex items-center justify-center text-xl hover:bg-primary/10 rounded-l-full transition-colors"
                        disabled={quantity <= 1}
                      >
                        −
                      </button>
                      <span className="w-16 text-center text-xl font-bold">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        className="w-12 h-12 flex items-center justify-center text-xl hover:bg-primary/10 rounded-r-full transition-colors"
                        disabled={quantity >= product.stock}
                      >
                        +
                      </button>
                    </div>
                    <span className="text-gray-600">Max: {product.stock} units</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {product.stock > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="bg-primary hover:bg-primary-dark text-white py-4 px-8 rounded-full font-bold text-lg transition-all hover:scale-[1.02] flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingToCart ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <FaShoppingCart className="h-6 w-6" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={buyingNow}
                    className="bg-primary-dark hover:bg-primary text-white py-4 px-8 rounded-full font-bold text-lg transition-all hover:scale-[1.02] flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {buyingNow ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <span>Buy Now</span>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-300 text-gray-600 py-4 px-8 rounded-full font-bold text-lg cursor-not-allowed"
                >
                  Out of Stock
                </button>
              )}

              {product.isCustomizable && product.stock > 0 && (
                <button
                  onClick={handleCustomizeClick}
                  className="w-full mt-4 bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white py-3 rounded-full font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <FiMessageCircle className="h-5 w-5" />
                  <span>✨ Customize with Artisan</span>
                </button>
              )}
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-primary/10">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <FaTruck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Free Shipping</p>
                    <p className="text-sm text-gray-600">On orders over Rs. 999</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-primary/10">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <FaShieldAlt className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Secure Payment</p>
                    <p className="text-sm text-gray-600">100% Satisfaction Guarantee</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-primary/10">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <FaCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Quality Assurance</p>
                    <p className="text-sm text-gray-600">Reviewed by Experts</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Reviews Section */}
      {product.ratings?.reviews && product.ratings.reviews.length > 0 && (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif font-bold text-gray-900">Customer Reviews</h2>
              <div className="flex items-center gap-3">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className={`h-5 w-5 ${i < Math.floor(product.ratings?.average || 0) ? 'fill-current' : 'text-gray-300'}`} />
                  ))}
                </div>
                <span className="text-xl font-bold">{product.ratings?.average?.toFixed(1)}</span>
                <span className="text-gray-500">({product.ratings?.count} reviews)</span>
              </div>
            </div>
            <div className="space-y-6">
              {product.ratings.reviews.map((review, i) => (
                <div key={i} className="border-b pb-6 last:border-0">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {review.user?.name?.[0] || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-900">{review.user?.name || 'Customer'}</span>
                        <span className="text-sm text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex text-yellow-400 mb-2">
                        {[...Array(5)].map((_, j) => (
                          <FiStar key={j} className={`h-4 w-4 ${j < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      {review.comment && <p className="text-gray-600 text-sm">{review.comment}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Customization Modal */}
      {showCustomization && (
        <ProductCustomization
          product={product}
          isOpen={showCustomization}
          onClose={() => setShowCustomization(false)}
        />
      )}
    </div>
  );
};

export default ProductDetail;