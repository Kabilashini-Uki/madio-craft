import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaStar, FaHeart, FaShoppingCart, FaShareAlt, FaTruck, FaShieldAlt, FaCheck, FaArrowLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ProductCustomization from '../components/ProductCustomization';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedTab, setSelectedTab] = useState('description');
  const [showCustomization, setShowCustomization] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/products/${id}`);
      setProduct(response.data.product);
      setLoading(false);
    } catch (error) {
      toast.error('Product not found');
      navigate('/products');
    }
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
    <div className="min-h-screen">
      {/* Back Button */}
      <div className="container mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-primary hover:text-primary-dark"
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
                src={product.images[activeImage]?.url || '/api/placeholder/600/600'}
                alt={product.name}
                className="w-full h-[500px] object-cover"
              />
            </motion.div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex space-x-4 overflow-x-auto py-4">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-4 transition-all ${
                      activeImage === index 
                        ? 'border-primary shadow-lg scale-105' 
                        : 'border-transparent hover:border-primary/30'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
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
              <span className="hover:text-primary cursor-pointer">Home</span>
              <span className="mx-2">/</span>
              <span className="hover:text-primary cursor-pointer capitalize">{product.category}</span>
              <span className="mx-2">/</span>
              <span className="text-primary-dark font-semibold">{product.name}</span>
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
                    />
                  </div>
                  <div>
                    <p className="font-semibold">By {product.artisan?.name}</p>
                    <p className="text-sm text-gray-600">{product.artisan?.artisanProfile?.businessName}</p>
                  </div>
                </div>
                <button className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-full font-semibold transition-colors">
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
                <span className="text-green-600 font-semibold">In Stock</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <button className="text-gray-500 hover:text-red-500">
                  <FaHeart className="h-6 w-6" />
                </button>
                <button className="text-gray-500 hover:text-primary">
                  <FaShareAlt className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-primary-light/20 to-primary-light/10 rounded-2xl p-8">
              <div className="flex items-baseline space-x-4 mb-6">
                <span className="text-5xl font-bold text-primary-dark">Rs{product.price}</span>
                {product.stock <= 10 && (
                  <span className="text-red-600 font-semibold bg-red-50 px-3 py-1 rounded-full">
                    Only {product.stock} left!
                  </span>
                )}
              </div>

              {/* Quantity */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Quantity</label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border-2 border-primary/20 rounded-full">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-12 h-12 flex items-center justify-center text-xl hover:bg-primary/10 rounded-l-full"
                    >
                      −
                    </button>
                    <span className="w-16 text-center text-xl font-bold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="w-12 h-12 flex items-center justify-center text-xl hover:bg-primary/10 rounded-r-full"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-gray-600">Max: {product.stock} units</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="bg-primary hover:bg-primary-dark text-white py-4 px-8 rounded-full font-bold text-lg transition-all hover:scale-[1.02] flex items-center justify-center space-x-3">
                  <FaShoppingCart className="h-6 w-6" />
                  <span>Add to Cart</span>
                </button>
                
                <button className="bg-primary-dark hover:bg-primary text-white py-4 px-8 rounded-full font-bold text-lg transition-all hover:scale-[1.02]">
                  Buy Now
                </button>
              </div>

              {product.isCustomizable && (
                <button className="w-full mt-4 bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white py-3 rounded-full font-semibold transition-colors">
                  ✨ Customize This Product
                </button>
              )}

              {product.isCustomizable && (
  <button
    onClick={() => setShowCustomization(true)}
    className="w-full mt-4 bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white py-3 rounded-full font-semibold transition-colors flex items-center justify-center space-x-2"
  >
    <FiMessageCircle className="h-5 w-5" />
    <span>✨ Customize with Artisan</span>
  </button>
)}
{/* Add customization modal */}
<ProductCustomization
  product={product}
  isOpen={showCustomization}
  onClose={() => setShowCustomization(false)}
/>
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
                    <p className="text-sm text-gray-600">On orders over Rs999</p>
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
                    <p className="text-sm text-gray-600">100% secure with Razorpay</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {['description', 'specifications', 'reviews', 'shipping'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`py-4 px-1 font-medium text-lg border-b-2 transition-colors ${
                    selectedTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            {selectedTab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-gray-700 text-lg leading-relaxed">{product.description}</p>
                {product.materials && product.materials.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-2xl font-bold text-primary-dark mb-4">Materials Used</h3>
                    <div className="flex flex-wrap gap-3">
                      {product.materials.map((material, index) => (
                        <span
                          key={index}
                          className="bg-primary/10 text-primary-dark px-4 py-2 rounded-full font-medium"
                        >
                          {material}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'reviews' && (
              <div className="space-y-6">
                {product.ratings?.reviews?.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-2xl font-bold text-gray-700 mb-2">No reviews yet</h3>
                    <p className="text-gray-600">Be the first to review this product!</p>
                  </div>
                ) : (
                  product.ratings?.reviews?.map((review, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={review.user?.avatar?.url || '/api/placeholder/40/40'}
                            alt={review.user?.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-bold">{review.user?.name}</p>
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <FaStar
                                  key={i}
                                  className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-gray-500 text-sm">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;