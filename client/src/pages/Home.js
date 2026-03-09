// pages/Home.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiArrowRight, 
  FiStar, 
  FiShield, 
  FiTruck, 
  FiHeart,
  FiAward,
  FiTrendingUp,
  FiUsers
} from 'react-icons/fi';
import api from '../services/api';
import ProductCard from '../components/ProductCard'; // ADD THIS IMPORT

const Home = () => {
  const [products, setProducts] = useState([]);
  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [artisanCount, setArtisanCount] = useState(0);
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, artisansRes, countRes] = await Promise.all([
        api.get('/products?limit=200'),
        api.get('/artisans?limit=4'),
        api.get('/artisans?limit=1000')
      ]);
      const prods = productsRes.data.products || [];
      const sorted = [...prods].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setProducts(sorted.slice(0, 6));

      setArtisans(artisansRes.data.artisans || []);
      const total = countRes.data.total || countRes.data.artisans?.length || 0;
      setArtisanCount(total);

      // Build dynamic categories from real products (most recently added)
      const categoryMap = {};
      // sort by newest first so first image encountered = most recent product's image
      [...prods].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(p => {
        const cat = (p.category || 'other').toLowerCase();
        if (!categoryMap[cat]) {
          categoryMap[cat] = {
            name: cat.charAt(0).toUpperCase() + cat.slice(1),
            image: p.images?.[0]?.url || `https://images.pexels.com/photos/18633243/pexels-photo-18633243.jpeg`,
            count: 0
          };
        }
        categoryMap[cat].count += 1;
      });
      const cats = Object.values(categoryMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);
      setDynamicCategories(cats);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <FiAward className="h-6 w-6" />,
      title: 'Authentic Craftsmanship',
      description: 'Every piece is handcrafted by skilled artisans using traditional techniques'
    },
    {
      icon: <FiShield className="h-6 w-6" />,
      title: 'Secure Payments',
      description: '100% secure transactions with industry-standard encryption'
    },
    {
      icon: <FiTruck className="h-6 w-6" />,
      title: 'Free Shipping',
      description: 'Enjoy free shipping on all orders above Rs. 999'
    },
    {
      icon: <FiHeart className="h-6 w-6" />,
      title: 'Support Artisans',
      description: 'Directly support traditional crafts and artisan communities'
    }
  ];

  const staticCategories = [
    { name: 'Pottery', image: 'https://images.pexels.com/photos/18633243/pexels-photo-18633243.jpeg', count: 0 },
    { name: 'Textiles', image: 'https://images.pexels.com/photos/17043766/pexels-photo-17043766.jpeg', count: 0 },
    { name: 'Jewelry', image: 'https://images.pexels.com/photos/4741622/pexels-photo-4741622.jpeg', count: 0 },
    { name: 'Woodwork', image: 'https://images.pexels.com/photos/31193512/pexels-photo-31193512.jpeg', count: 0 },
  ];
  const categories = dynamicCategories.length > 0 ? dynamicCategories : staticCategories;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40 z-10"></div>
          <img 
            src="https://media.istockphoto.com/id/639487044/photo/hands-of-a-potter-creating-an-earthen-jar.jpg?s=612x612&w=0&k=20&c=gCVqR1YvUT6qZhazjpNNGzlpgh_sQQJNzXNsh0ZZEh0=" 
            alt="Artisan at work"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="container mx-auto px-4 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <br />
            <span className="inline-block px-2 py-2 bg-white/2 backdrop-blur-sm rounded-full text-white text-sm mt-6 border border-white/20">
              ✨ Handcrafted with Love
            </span>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight">
              Discover the Art of 
              <span className="bg-gradient-to-r from-primary-light to-primary bg-clip-text text-transparent"> Traditional</span><br />
              Craftsmanship
            </h1>
            <p className="text-xl text-gray-200 mb-8 leading-relaxed">
              Connect directly with Batticaloa finest artisans and bring home unique, 
              handcrafted treasures that tell a story.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/products')}
                className="group px-8 py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-semibold flex items-center justify-center space-x-2 hover:shadow-2xl transition-all"
              >
                <span>Explore Collection</span>
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/artisans')}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-full font-semibold border border-white/30 hover:bg-white/20 transition-all"
              >
                Meet Artisans
              </motion.button>
            </div>

          </motion.div>
        </div>

        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2"></div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Why Choose Us</span>
            <h2 className="text-4xl font-serif font-bold text-gray-900 mt-4 mb-6">
              Experience the Art of Handmade
            </h2>
            <p className="text-xl text-gray-600">
              We connect you with authentic craftsmanship while ensuring a seamless shopping experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <div className="text-primary group-hover:text-white transition-colors">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">Featured Collection</span>
              <h2 className="text-4xl font-serif font-bold text-gray-900 mt-4">
                Trending Treasures
              </h2>
            </motion.div>
            
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              onClick={() => navigate('/products')}
              className="group mt-4 md:mt-0 flex items-center space-x-2 text-primary font-semibold hover:text-primary-dark"
            >
              <span>View All Products</span>
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product, index) => (
                <ProductCard key={product._id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Shop by</span>
            <h2 className="text-4xl font-serif font-bold text-gray-900 mt-4 mb-6">
              Explore Categories
            </h2>
            <p className="text-xl text-gray-600">
              Discover unique pieces across various traditional crafts
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
                onClick={() => navigate(`/products?category=${category.name.toLowerCase()}`)}
                className="group relative h-96 rounded-3xl overflow-hidden cursor-pointer"
              >
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-serif font-bold mb-2">{category.name}</h3>
                  <p className="text-sm text-white/80 mb-4">{category.count > 0 ? `${category.count} items` : 'Shop now'}</p>
                  <span className="inline-flex items-center space-x-2 text-sm font-semibold group-hover:space-x-3 transition-all">
                    <span>Shop Now</span>
                    <FiArrowRight />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Artisan Spotlight */}
      <section className="py-24 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">Meet the Makers</span>
              <h2 className="text-4xl font-serif font-bold text-gray-900 mt-4 mb-6">
                Behind Every Masterpiece is a Master Artisan
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Our artisans carry forward generations of knowledge, preserving traditional 
                techniques while creating contemporary pieces that speak to modern sensibilities.
              </p>
              
              <div className="space-y-4 mb-8">
                {[
                  'Authentic traditional techniques passed down through generations',
                  'Fair wages and sustainable working conditions',
                  'Unique, one-of-a-kind pieces made with passion',
                  'Direct connection between artisan and buyer'
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <FiStar className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/artisans')}
                className="group px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-full font-semibold flex items-center space-x-2 transition-all"
              >
                <span>Meet Our Artisans</span>
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.pexels.com/photos/8066090/pexels-photo-8066090.jpeg" 
                  alt="Artisan at work"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>
              
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-6 max-w-xs">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center">
                    <FiUsers className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{artisanCount > 0 ? artisanCount + '+' : '0'}</div>
                    <div className="text-sm text-gray-600">Skilled Artisans</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-primary-light font-semibold text-sm uppercase tracking-wider">Join the Movement</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mt-4 mb-6">
                Become Part of Our Artisan Community
              </h2>
              <p className="text-xl text-gray-300 mb-10">
                Whether you're an artisan looking to showcase your work or a buyer seeking unique treasures, 
                MadioCraft is your platform.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/register')}
                  className="px-8 py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-semibold hover:shadow-2xl hover:-translate-y-1 transition-all"
                >
                  Start Selling
                </button>
                <button
                  onClick={() => navigate('/products')}
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-full font-semibold border border-white/30 hover:bg-white/20 transition-all"
                >
                  Start Shopping
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;