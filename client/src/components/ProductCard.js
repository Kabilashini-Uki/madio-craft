import React from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaHeart, FaShoppingCart } from 'react-icons/fa';
import { motion } from 'framer-motion';

const ProductCard = ({ product }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-primary/10"
    >
      {/* Product Image */}
      <Link to={`/products/${product._id}`}>
        <div className="relative h-64 overflow-hidden group">
          <img
            src={product.images?.[0]?.url || '/api/placeholder/400/400'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {product.isCustomizable && (
            <span className="absolute top-3 left-3 bg-primary/90 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
              Customizable
            </span>
          )}
          <div className="absolute top-3 right-3 flex flex-col space-y-2">
            <button className="bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors">
              <FaHeart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-5">
        {/* Artisan Info */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/20">
            <img
              src={product.artisan?.avatar?.url || '/api/placeholder/40/40'}
              alt={product.artisan?.name}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-sm text-gray-600">{product.artisan?.name}</span>
        </div>

        {/* Product Name */}
        <Link to={`/products/${product._id}`}>
          <h3 className="text-lg font-semibold text-primary-dark hover:text-primary transition-colors mb-2 line-clamp-1">
            {product.name}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>

        {/* Rating */}
        <div className="flex items-center space-x-1 mb-4">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                className={`h-4 w-4 ${i < Math.floor(product.ratings?.average || 0) ? 'fill-current' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            ({product.ratings?.count || 0})
          </span>
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-primary">₹{product.price}</span>
            {product.stock <= 10 && (
              <p className="text-xs text-red-600 font-semibold">Only {product.stock} left!</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button className="bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-full transition-colors">
              <FaShoppingCart className="h-5 w-5" />
            </button>
            
            {product.isCustomizable && (
              <Link to={`/customize/${product._id}`}>
                <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors">
                  Customize
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;