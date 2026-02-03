import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaGem, FaMugHot, FaTshirt, FaTree, FaHammer, FaGlassCheers } from 'react-icons/fa';

const Categories = () => {
  const categories = [
    {
      id: 'jewelry',
      name: 'Jewelry',
      description: 'Handcrafted necklaces, earrings, bracelets, and rings',
      icon: <FaGem className="h-12 w-12" />,
      color: 'from-purple-500 to-pink-500',
      count: '45 products'
    },
    {
      id: 'pottery',
      name: 'Pottery',
      description: 'Ceramic vases, mugs, plates, and decorative items',
      icon: <FaMugHot className="h-12 w-12" />,
      color: 'from-orange-500 to-red-500',
      count: '32 products'
    },
    {
      id: 'textiles',
      name: 'Textiles',
      description: 'Handwoven fabrics, embroidered textiles, and tapestries',
      icon: <FaTshirt className="h-12 w-12" />,
      color: 'from-blue-500 to-cyan-500',
      count: '28 products'
    },
    {
      id: 'woodwork',
      name: 'Woodwork',
      description: 'Carved furniture, decorative items, and kitchenware',
      icon: <FaTree className="h-12 w-12" />,
      color: 'from-green-500 to-emerald-500',
      count: '36 products'
    },
    {
      id: 'metalwork',
      name: 'Metalwork',
      description: 'Brass and copper artifacts, sculptures, and utensils',
      icon: <FaHammer className="h-12 w-12" />,
      color: 'from-yellow-500 to-amber-500',
      count: '24 products'
    },
    {
      id: 'glass',
      name: 'Glass Art',
      description: 'Stained glass, blown glass, and glass sculptures',
      icon: <FaGlassCheers className="h-12 w-12" />,
      color: 'from-cyan-500 to-blue-500',
      count: '19 products'
    },
    {
      id: 'leather',
      name: 'Leather Goods',
      description: 'Hand-stitched bags, wallets, and accessories',
      icon: '🥾',
      color: 'from-brown-500 to-amber-900',
      count: '22 products'
    },
    {
      id: 'paper',
      name: 'Paper Crafts',
      description: 'Handmade paper, journals, and decorative items',
      icon: '📜',
      color: 'from-gray-500 to-blue-gray-500',
      count: '15 products'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/90 to-primary-dark/90 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif font-bold mb-4"
          >
            Explore Categories
          </motion.h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Discover handmade treasures across various craft categories. Each piece tells a story of tradition and craftsmanship.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
            >
              <Link
                to={`/products?category=${category.id}`}
                className="block h-full"
              >
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 h-full group">
                  {/* Icon Section */}
                  <div className={`h-32 bg-gradient-to-r ${category.color} flex items-center justify-center`}>
                    <div className="text-white">
                      {typeof category.icon === 'string' ? (
                        <span className="text-5xl">{category.icon}</span>
                      ) : (
                        category.icon
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-primary-dark mb-2">{category.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-primary">{category.count}</span>
                      <span className="text-primary group-hover:translate-x-2 transition-transform">
                        Explore →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Featured Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-serif font-bold text-center text-primary-dark mb-8">
            Why Choose Handmade?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-8 shadow-lg text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-xl font-bold text-primary-dark mb-3">Unique Pieces</h3>
              <p className="text-gray-600">
                Each handmade item is unique, carrying the artisan's personal touch and creative expression.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-8 shadow-lg text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌱</span>
              </div>
              <h3 className="text-xl font-bold text-primary-dark mb-3">Sustainable</h3>
              <p className="text-gray-600">
                Handmade crafts often use sustainable materials and traditional, eco-friendly techniques.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-8 shadow-lg text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">❤️</span>
              </div>
              <h3 className="text-xl font-bold text-primary-dark mb-3">Support Artisans</h3>
              <p className="text-gray-600">
                Your purchase directly supports artisans and helps preserve traditional crafts and skills.
              </p>
            </motion.div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-primary-light to-primary-light/50 rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-primary-dark mb-4">
              Can't Find What You're Looking For?
            </h2>
            <p className="text-gray-700 mb-8 max-w-2xl mx-auto">
              Many of our artisans accept custom orders. Contact them directly to create your perfect piece.
            </p>
            <button className="btn-primary">Contact an Artisan</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;