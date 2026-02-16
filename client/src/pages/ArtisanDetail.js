// src/pages/ArtisanDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiArrowLeft, 
  FiMail, 
  FiMapPin, 
  FiStar, 
  FiPackage,
  FiShield,
  FiAward,
  FiUsers
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useSecureChat } from '../context/SecureChatContext';
import toast from 'react-hot-toast';
import ProductCard from '../components/ProductCard';

const ArtisanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createCustomizationRoom } = useSecureChat();
  
  const [artisan, setArtisan] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockArtisan = {
        _id: id,
        name: 'Priya Sharma',
        business: 'Clay Creations',
        specialty: 'Pottery',
        location: 'Jaipur, Rajasthan',
        rating: 4.8,
        reviews: 128,
        experience: '8 years',
        description: 'Specializing in traditional Indian pottery with modern designs. Her work blends centuries-old techniques with contemporary aesthetics.',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        coverImage: 'https://images.pexels.com/photos/18633243/pexels-photo-18633243.jpeg',
        products: 45,
        followers: 2300,
        verified: true,
        awards: ['National Craft Award 2023', 'Jaipur Heritage Award']
      };
      
      const mockProducts = [
        {
          _id: 'p1',
          name: 'Handcrafted Ceramic Vase',
          price: 1899,
          artisan: mockArtisan,
          images: [{ url: 'https://images.unsplash.com/photo-1565193564382-fb8bb0b9e5b4?w=400' }],
          category: 'pottery',
          description: 'Beautiful handcrafted ceramic vase with traditional designs',
          stock: 10,
          isCustomizable: true
        },
        {
          _id: 'p2',
          name: 'Traditional Clay Bowl Set',
          price: 2499,
          artisan: mockArtisan,
          images: [{ url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400' }],
          category: 'pottery',
          description: 'Set of 3 handmade clay bowls with natural finish',
          stock: 5,
          isCustomizable: true
        },
        {
          _id: 'p3',
          name: 'Decorative Wall Plate',
          price: 1299,
          artisan: mockArtisan,
          images: [{ url: 'https://images.unsplash.com/photo-1578749559198-99e8c1e4d54a?w=400' }],
          category: 'pottery',
          description: 'Hand-painted decorative wall plate with traditional motifs',
          stock: 8,
          isCustomizable: false
        }
      ];
      
      setArtisan(mockArtisan);
      setProducts(mockProducts);
      setLoading(false);
    }, 1000);
  }, [id]);

  const handleContact = async () => {
    if (!user) {
      toast.error('Please login to contact artisan');
      navigate('/login');
      return;
    }

    // Create a customization room for general inquiry
    const room = await createCustomizationRoom(
      artisan._id,
      null,
      { type: 'inquiry' }
    );

    if (room) {
      navigate(`/chat/${room._id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading artisan details...</p>
        </div>
      </div>
    );
  }

  if (!artisan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Artisan not found</h2>
          <button
            onClick={() => navigate('/artisans')}
            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark"
          >
            Back to Artisans
          </button>
        </div>
      </div>
    );

    // In ArtisanDetail.js, update the handleContact function
const handleContact = async () => {
  if (!user) {
    toast.error('Please login to contact artisan');
    navigate('/login');
    return;
  }

  try {
    // Create a customization room for general inquiry
    const room = await createCustomizationRoom(
      artisan._id,
      null, // No specific product
      { 
        type: 'inquiry',
        message: 'Initial contact from artisan page'
      }
    );

    if (room) {
      toast.success('Chat room created!');
      navigate(`/chat/${room._id}`);
    }
  } catch (error) {
    console.error('Failed to create room:', error);
    toast.error('Failed to start chat. Please try again.');
  }
};
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-primary mb-6 transition-colors"
        >
          <FiArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>

        {/* Artisan Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8"
        >
          {/* Cover Image */}
          <div className="relative h-64">
            <img
              src={artisan.coverImage}
              alt={artisan.business}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            
            {/* Profile Image and Basic Info */}
            <div className="absolute bottom-6 left-6 flex items-end space-x-6">
              <img
                src={artisan.image}
                alt={artisan.name}
                className="w-24 h-24 rounded-2xl border-4 border-white shadow-xl"
              />
              <div className="text-white">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold">{artisan.name}</h1>
                  {artisan.verified && (
                    <FiShield className="h-6 w-6 text-blue-400" title="Verified Artisan" />
                  )}
                </div>
                <p className="text-lg opacity-90">{artisan.business}</p>
                <p className="text-sm opacity-75 flex items-center mt-1">
                  <FiMapPin className="mr-1" /> {artisan.location}
                </p>
              </div>
            </div>
          </div>

          {/* Artisan Details */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - About */}
              <div className="lg:col-span-2">
                <h2 className="text-xl font-semibold mb-4">About</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {artisan.description}
                </p>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <FiStar className="h-5 w-5 text-yellow-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{artisan.rating}</p>
                    <p className="text-xs text-gray-500">{artisan.reviews} reviews</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <FiPackage className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{artisan.products}</p>
                    <p className="text-xs text-gray-500">Products</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <FiUsers className="h-5 w-5 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{artisan.followers}</p>
                    <p className="text-xs text-gray-500">Followers</p>
                  </div>
                </div>

                {/* Awards */}
                {artisan.awards && artisan.awards.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <FiAward className="mr-2 text-yellow-500" />
                      Awards & Recognition
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {artisan.awards.map((award, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm"
                        >
                          🏆 {award}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Contact */}
              <div>
                <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
                  <h3 className="font-semibold mb-4">Contact Artisan</h3>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center text-gray-600">
                      <FiMail className="mr-3 text-primary" />
                      <span className="text-sm">Direct messaging</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FiPackage className="mr-3 text-primary" />
                      <span className="text-sm">Custom orders welcome</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FiStar className="mr-3 text-yellow-400" />
                      <span className="text-sm">4.8 average rating</span>
                    </div>
                  </div>

                  <button
                    onClick={handleContact}
                    className="w-full px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all flex items-center justify-center space-x-2"
                  >
                    <FiMail className="h-5 w-5" />
                    <span>Send Message</span>
                  </button>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    Messages are end-to-end encrypted
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Products Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">
            Products by {artisan.name}
          </h2>
          
          {products.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl">
              <p className="text-gray-500">No products yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => (
                <ProductCard key={product._id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtisanDetail;