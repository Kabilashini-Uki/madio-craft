// pages/Categories.js
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiArrowRight, 
  FiHeart, 
  FiShoppingBag, 
  FiAward,
  FiTrendingUp,
  FiUsers 
} from 'react-icons/fi';

const Categories = () => {
  const categories = [
    {
      id: 'jewelry',
      name: 'Jewelry',
      description: 'Handcrafted necklaces, earrings, bracelets, and rings',
      icon: '💎',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600',
      color: 'from-purple-500 to-pink-500',
      count: '2,345 items',
      artisans: 156,
      trending: true
    },
    {
      id: 'pottery',
      name: 'Pottery',
      description: 'Ceramic vases, mugs, plates, and decorative items',
      icon: '🏺',
      image: 'https://images.unsplash.com/photo-1565193564382-fb8bb0b9e5b4?w=600',
      color: 'from-orange-500 to-red-500',
      count: '1,892 items',
      artisans: 98,
      trending: true
    },
    {
      id: 'textiles',
      name: 'Textiles',
      description: 'Handwoven fabrics, embroidered textiles, and tapestries',
      icon: '🧵',
      image: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=600',
      color: 'from-blue-500 to-cyan-500',
      count: '2,178 items',
      artisans: 203,
      trending: false
    },
    {
      id: 'woodwork',
      name: 'Woodwork',
      description: 'Carved furniture, decorative items, and kitchenware',
      icon: '🪵',
      image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600',
      color: 'from-green-500 to-emerald-500',
      count: '1,567 items',
      artisans: 134,
      trending: true
    },
    {
      id: 'metalwork',
      name: 'Metalwork',
      description: 'Brass and copper artifacts, sculptures, and utensils',
      icon: '⚒️',
      image: 'https://images.unsplash.com/photo-1602023039926-7f5d5f1e1b3f?w=600',
      color: 'from-yellow-500 to-amber-500',
      count: '1,234 items',
      artisans: 87,
      trending: false
    },
    {
      id: 'glass',
      name: 'Glass Art',
      description: 'Stained glass, blown glass, and glass sculptures',
      icon: '🥂',
      image: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=600',
      color: 'from-cyan-500 to-blue-500',
      count: '876 items',
      artisans: 45,
      trending: false
    },
    {
      id: 'leather',
      name: 'Leather Goods',
      description: 'Hand-stitched bags, wallets, and accessories',
      icon: '👝',
      image: 'https://images.unsplash.com/photo-1624096104992-9b4fa3a279dd?w=600',
      color: 'from-brown-500 to-amber-800',
      count: '945 items',
      artisans: 67,
      trending: true
    },
    {
      id: 'paper',
      name: 'Paper Crafts',
      description: 'Handmade paper, journals, and decorative items',
      icon: '📜',
      image: 'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=600',
      color: 'from-gray-500 to-slate-600',
      count: '678 items',
      artisans: 34,
      trending: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-950 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1565193564382-fb8bb0b9e5b4?w=1600')] bg-cover bg-center opacity-5"></div>
        </div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm mb-6 border border-white/20">
              🎨 Explore Our Collections
            </span>
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">
              Handcrafted by 
              <span className="bg-gradient-to-r from-primary-light to-primary bg-clip-text text-transparent"> Tradition</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Discover unique pieces across 8+ categories, each telling a story of heritage and craftsmanship
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Category Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {[
            { icon: <FiShoppingBag />, value: '10k+', label: 'Products' },
            { icon: <FiUsers />, value: '824', label: 'Artisans' },
            { icon: <FiAward />, value: '8', label: 'Categories' },
            { icon: <FiTrendingUp />, value: '50k+', label: 'Happy Customers' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl shadow-sm p-6 text-center"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <div className="text-primary text-xl">{stat.icon}</div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative"
            >
              <Link to={`/products?category=${category.id}`}>
                <div className="relative h-96 rounded-3xl overflow-hidden">
                  {/* Image */}
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    {/* Icon */}
                    <div className="text-4xl mb-3">{category.icon}</div>
                    
                    {/* Title */}
                    <h3 className="text-2xl font-serif font-bold mb-2 group-hover:text-primary-light transition-colors">
                      {category.name}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-sm text-gray-200 mb-4 line-clamp-2">
                      {category.description}
                    </p>
                    
                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm">
                      <span>{category.count}</span>
                      <span className="flex items-center">
                        {category.artisans} artisans
                      </span>
                    </div>
                    
                    {/* Trending Badge */}
                    {category.trending && (
                      <span className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-xs font-semibold">
                        🔥 Trending
                      </span>
                    )}
                    
                    {/* Explore Link */}
                    <div className="mt-6 flex items-center text-white group-hover:text-primary-light transition-colors">
                      <span className="text-sm font-semibold">Explore Collection</span>
                      <FiArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Featured Categories Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 bg-gradient-to-br from-gray-900 to-gray-950 rounded-3xl p-12 relative overflow-hidden"
        >
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/20 rounded-full filter blur-3xl"></div>
          </div>
          
          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">
                Can't Find What You're Looking For?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Our artisans accept custom orders. Describe your vision, and we'll bring it to life.
              </p>
              <button className="px-8 py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-semibold hover:shadow-2xl transform hover:-translate-y-1 transition-all flex items-center space-x-2">
                <span>Request Custom Order</span>
                <FiArrowRight />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {categories.slice(0, 4).map((cat) => (
                <div key={cat.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <div className="text-white font-semibold">{cat.name}</div>
                  <div className="text-sm text-gray-300">{cat.artisans} artisans</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Categories;