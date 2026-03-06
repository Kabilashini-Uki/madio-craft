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
  FiUsers,
  FiMessageCircle
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ProductCard from '../components/ProductCard';
import api from '../services/api';

const ArtisanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [artisan, setArtisan] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  useEffect(() => {
    const fetchArtisan = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/artisans/${id}`);
        const data = res.data.artisan;
        setArtisan(data);
        setProducts(data.products || []);
      } catch (e) {
        console.error('Failed to load artisan:', e);
        toast.error('Failed to load artisan details');
      } finally {
        setLoading(false);
      }
    };
    fetchArtisan();
  }, [id]);

  const handleContact = () => {
    if (!user) {
      toast.error('Please login to contact artisan');
      navigate('/login');
      return;
    }
    setShowChatModal(true);
  };

  const handleSendCustomizationMessage = async () => {
    if (!chatMessage.trim()) return;
    setSendingChat(true);
    try {
      const res = await api.post('/chat/rooms', { 
        artisanId: id, 
        initialMessage: chatMessage 
      });
      if (res.data.success || res.data.room) {
        toast.success('Message sent! The artisan will respond soon.');
        setChatMessage('');
        setShowChatModal(false);
        const roomId = res.data.room?._id || res.data.roomId;
        if (roomId) navigate(`/chat/${roomId}`);
      }
    } catch (e) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSendingChat(false);
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
  }

  const coverImage = artisan.coverImage || artisan.fullArtisanData?.coverImage?.url || 'https://images.pexels.com/photos/18633243/pexels-photo-18633243.jpeg';
  const profileImage = artisan.profileImage || artisan.avatar?.url;
  const businessName = artisan.businessName || artisan.name;
  const description = artisan.bio || artisan.description || '';
  const rating = artisan.rating || artisan.ratings?.average || 0;
  const reviewCount = artisan.reviewCount || 0;
  const awards = artisan.awards || artisan.fullArtisanData?.awards || [];
  const reviews = artisan.fullArtisanData?.reviews || [];

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
            {/* <img
              src={coverImage}
              alt={businessName}
              className="w-full h-full object-cover"
            /> */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            
            {/* Profile Image and Basic Info */}
            <div className="absolute bottom-6 left-6 flex items-end space-x-6">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={artisan.name}
                  className="w-24 h-24 rounded-2xl border-4 border-white shadow-xl object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-xl bg-primary flex items-center justify-center text-white text-3xl font-bold">
                  {artisan.name?.[0]}
                </div>
              )}
              <div className="text-white">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold">{businessName}</h1>
                  {artisan.isVerified && (
                    <FiShield className="h-6 w-6 text-blue-400" title="Verified Artisan" />
                  )}
                </div>
                <p className="text-lg opacity-90">by {artisan.name}</p>
                {artisan.location && (
                  <p className="text-sm opacity-75 flex items-center mt-1">
                    <FiMapPin className="mr-1" /> {artisan.location}
                  </p>
                )}
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
                  {description || 'Passionate artisan creating beautiful handcrafted products with years of experience.'}
                </p>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <FiStar className="h-5 w-5 text-yellow-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{rating.toFixed(1)}</p>
                    <p className="text-xs text-gray-500">{reviewCount} reviews</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <FiPackage className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                    <p className="text-xs text-gray-500">Products</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <FiUsers className="h-5 w-5 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{artisan.experience || 0}y</p>
                    <p className="text-xs text-gray-500">Experience</p>
                  </div>
                </div>

                {/* Awards */}
                {awards.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <FiAward className="mr-2 text-yellow-500" />
                      Awards & Recognition
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {awards.map((award, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm"
                        >
                          🏆 {award.title || award}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews */}
                {reviews.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3 flex items-center">
                      <FiStar className="mr-2 text-yellow-400" />
                      Customer Reviews
                    </h3>
                    <div className="space-y-4">
                      {reviews.slice(0, 5).map((r, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                              {r.buyerName?.[0] || 'B'}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{r.buyerName}</p>
                              <div className="flex">
                                {[1,2,3,4,5].map(s => (
                                  <FiStar key={s} className={`h-3 w-3 ${s <= r.rating ? 'fill-current text-yellow-400' : 'text-gray-300'}`} />
                                ))}
                              </div>
                            </div>
                            {r.isVerifiedPurchase && (
                              <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Verified</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{r.comment}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
                        </div>
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
                      <span className="text-sm">{rating.toFixed(1)} average rating</span>
                    </div>
                  </div>

                  <button
                    onClick={handleContact}
                    className="w-full px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all flex items-center justify-center space-x-2"
                  >
                    <FiMessageCircle className="h-5 w-5" />
                    <span>Customization Chat</span>
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
            Products by {businessName} ({products.length})
          </h2>
          
          {products.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl">
              <p className="text-gray-500">No products in this shop yet.</p>
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

      {/* Customization Chat Modal */}
      {showChatModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowChatModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-xl font-bold mb-2">💬 Customization Chat</h3>
            <p className="text-gray-500 text-sm mb-4">
              Send a message to {businessName} about a custom order or inquiry.
            </p>
            <textarea
              value={chatMessage}
              onChange={e => setChatMessage(e.target.value)}
              placeholder="Describe your customization request, preferred size, color, material, etc..."
              rows={4}
              className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowChatModal(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendCustomizationMessage}
                disabled={sendingChat || !chatMessage.trim()}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark disabled:opacity-50"
              >
                {sendingChat ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ArtisanDetail;
