// components/ProductCard.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiEye, FiStar } from 'react-icons/fi';

const ProductCard = ({ product, viewMode = 'grid', index = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
      >
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="md:w-1/3 relative overflow-hidden">
            <Link to={`/products/${product._id}`}>
              <div className="relative h-64 md:h-full">
                <img
                  src={product.images?.[0]?.url || 'https://via.placeholder.com/600x800?text=Handcrafted'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </Link>
            
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isLiked 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-red-500 hover:text-white'
              }`}
            >
              <FiHeart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Content */}
          <div className="md:w-2/3 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Link to={`/products/${product._id}`}>
                    <h3 className="text-xl font-semibold text-gray-900 hover:text-primary transition-colors mb-2">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-gray-600">by {product.artisan?.name}</p>
                </div>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {product.category}
                </span>
              </div>

              <p className="text-gray-600 mb-4 line-clamp-2">
                {product.description}
              </p>

              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  <div className="flex text-yellow-400 mr-2">
                    {[...Array(5)].map((_, i) => (
                      <FiStar
                        key={i}
                        className={`h-4 w-4 ${i < Math.floor(product.ratings?.average || 0) ? 'fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    ({product.ratings?.count || 0})
                  </span>
                </div>
                {product.isCustomizable && (
                  <span className="text-sm text-primary bg-primary/10 px-3 py-1 rounded-full">
                    Customizable
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <span className="text-2xl font-bold text-gray-900">Rs{product.price}</span>
                {product.stock <= 5 && (
                  <p className="text-xs text-red-500 mt-1">Only {product.stock} left!</p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-3 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-full transition-colors">
                  <FiShoppingCart className="h-5 w-5" />
                </button>
                <Link
                  to={`/products/${product._id}`}
                  className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-full text-sm font-medium transition-all hover:shadow-lg"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid View (default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Image Container */}
      <div className="relative overflow-hidden">
        <Link to={`/products/${product._id}`}>
          <div className="relative h-72">
            <img
              src={product.images?.[0]?.url || 'https://via.placeholder.com/600x800?text=Handcrafted'}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        </Link>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 20 }}
          transition={{ duration: 0.3 }}
          className="absolute top-4 right-4 flex flex-col space-y-2"
        >
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
              isLiked 
                ? 'bg-red-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-red-500 hover:text-white'
            }`}
          >
            <FiHeart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          <Link
            to={`/products/${product._id}`}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-700 hover:bg-primary hover:text-white shadow-lg transition-colors"
          >
            <FiEye className="h-5 w-5" />
          </Link>
        </motion.div>

        {/* Category Badge */}
        {product.category && (
          <span className="absolute bottom-4 left-4 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-900 shadow-lg">
            {product.category}
          </span>
        )}

        {/* Customizable Badge */}
        {product.isCustomizable && (
          <span className="absolute top-4 left-4 px-4 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full text-xs font-semibold shadow-lg">
            ✨ Customizable
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="p-5">
        {/* Artisan Info */}
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
            <img
              src={product.artisan?.avatar?.url || 'https://via.placeholder.com/32'}
              alt={product.artisan?.name}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-sm text-gray-600 hover:text-primary transition-colors">
            {product.artisan?.name}
          </span>
        </div>

        {/* Product Name */}
        <Link to={`/products/${product._id}`}>
          <h3 className="text-lg font-semibold text-gray-900 hover:text-primary transition-colors mb-2 line-clamp-1">
            {product.name}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.description}
        </p>

        {/* Rating */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex items-center">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  className={`h-4 w-4 ${i < Math.floor(product.ratings?.average || 0) ? 'fill-current' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600 ml-2">
              ({product.ratings?.count || 0})
            </span>
          </div>
        </div>

        {/* Price and Actions */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900">Rs{product.price}</span>
            {product.stock <= 5 && (
              <p className="text-xs text-red-500 font-semibold mt-1">Only {product.stock} left!</p>
            )}
          </div>

          <button className="p-3 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-full transition-colors">
            <FiShoppingCart className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;