// src/pages/ProductDetail.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { FaHeart } from 'react-icons/fa';
import { FiEdit3 } from 'react-icons/fi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCustomizationModal from '../components/ProductCustomizationModal';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { isAuthenticated, user } = useAuth();
  const { addToCart, isInWishlist, addToWishlist, removeFromWishlist } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [showCustom, setShowCustom] = useState(false);
  const [custBounce, setCustBounce] = useState(false);
  const location = useLocation();

  const inWishlist = product ? isInWishlist(product._id) : false;
  const isOwner = isAuthenticated && user && product && (product.artisan === user.id || product.artisan?._id === user.id);

  // Fetch product
  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products/${id}`);

      // Handle different response structures
      let prod = null;
      if (res.data.success && res.data.product) {
        prod = res.data.product;
      } else if (res.data.product) {
        prod = res.data.product;
      } else if (res.data._id) {
        prod = res.data;
      }

      if (!prod || !prod._id) {
        throw new Error('Invalid product data');
      }

      setProduct(prod);
    } catch (err) {
      console.error('Failed to load product:', err);
      toast.error('Product not found');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handle ?customize=true
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('customize') === 'true') {
      setShowCustom(true);
    }
  }, [location.search]);

  // Add to cart
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login');
      navigate('/login');
      return;
    }

    try {
      await addToCart(product, null, quantity);
      toast.success('Added to cart!');
    } catch {
      toast.error('Failed');
    }
  };

  // Buy now
  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error('Please login');
      navigate('/login');
      return;
    }

    try {
      const success = await addToCart(product, null, quantity);
      if (success) navigate('/cart');
    } catch {
      toast.error('Failed');
    }
  };

  // Wishlist
  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please login');
      navigate('/login');
      return;
    }

    if (inWishlist) await removeFromWishlist(product._id);
    else await addToWishlist(product);
  };

  const openCustomize = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isAuthenticated) { toast.error('Please login to customise'); navigate('/login'); return; }
    if (isOwner) { toast.error("You can't customise your own product", { icon: '🚫' }); return; }

    setCustBounce(true);
    setTimeout(() => setCustBounce(false), 500);
    setShowCustom(true);
  };

  // Loading
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-14 w-14 border-4 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // No product
  if (!product) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-xl font-bold">Product not found</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-24 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* LEFT — IMAGE */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow overflow-hidden aspect-square">
            <img
              src={
                product.images?.[activeImage]?.url ||
                product.images?.[0]?.url ||
                'https://via.placeholder.com/600'
              }
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <img
                  key={i}
                  src={img.url}
                  alt="Thumbnail"
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 object-cover rounded cursor-pointer border-2 ${activeImage === i
                    ? 'border-amber-700'
                    : 'border-gray-200'
                    }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — CARD */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-5">

          {/* Name */}
          <h1 className="text-2xl font-bold text-gray-900">
            {product.name}
          </h1>

          {/* Price */}
          <p className="text-3xl font-bold text-amber-700">
            Rs. {product.price?.toLocaleString()}
          </p>



          {/* Description */}
          <p className="text-gray-600">
            {product.description}
          </p>

          {/* Quantity */}
          {product.stock > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setQuantity(Math.max(1, quantity - 1))
                }
                className="px-3 py-1 bg-gray-200 rounded"
              >
                -
              </button>

              <span className="font-semibold">{quantity}</span>

              <button
                onClick={() =>
                  setQuantity(Math.min(product.stock, quantity + 1))
                }
                className="px-3 py-1 bg-gray-200 rounded"
              >
                +
              </button>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={isOwner}
              className={`flex-1 py-3 rounded-xl font-semibold ${isOwner ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-amber-700 text-white'}`}
            >
              {isOwner ? 'Your Product' : 'Add to Cart'}
            </button>

            <button
              onClick={handleBuyNow}
              disabled={isOwner}
              className={`flex-1 py-3 rounded-xl font-semibold ${isOwner ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-black text-white'}`}
            >
              {isOwner ? 'Your Product' : 'Buy Now'}
            </button>
          </div>

          <motion.button
            onClick={openCustomize}
            animate={custBounce ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isOwner}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isOwner
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-200'
              }`}
          >
            <FiEdit3 className="text-xl" />
            {isOwner ? 'Customisation Disabled' : 'Customise this Product'}
          </motion.button>

          {/* Wishlist */}
          <button
            onClick={handleWishlistToggle}
            className="flex items-center gap-2 text-gray-500"
          >
            <FaHeart className={inWishlist ? 'text-red-500' : ''} />
            {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
          </button>

        </div>
      </div>

      {showCustom && (
        <ProductCustomizationModal product={product} onClose={() => setShowCustom(false)} />
      )}
    </div>
  );
};

export default ProductDetail;