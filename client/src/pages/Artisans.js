// src/pages/Artisans.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMapPin, FiStar, FiAward, FiPackage, FiShield, FiMessageCircle } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const Artisans = () => {
  const navigate = useNavigate();
  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtisans();
  }, []);

  const fetchArtisans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/artisans?limit=100');
      const artisansData = res.data.artisans || [];
      
      // Fetch additional details for each artisan
      const enrichedArtisans = await Promise.all(
        artisansData.map(async (artisan) => {
          try {
            const detailRes = await api.get(`/artisans/${artisan._id}`);
            const fullData = detailRes.data.artisan;
            return {
              ...artisan,
              products: fullData.products || [],
              fullArtisanData: fullData.fullArtisanData || {},
              reviews: fullData.fullArtisanData?.reviews || [],
            };
          } catch (err) {
            console.error(`Failed to fetch details for artisan ${artisan._id}:`, err);
            return artisan;
          }
        })
      );
      
      setArtisans(enrichedArtisans);
    } catch (error) {
      console.error('Failed to load artisans', error);
      toast.error('Failed to load artisans');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#723d46] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-serif font-bold text-gray-900 mb-4">Our Artisans</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Meet the skilled craftspeople behind every unique creation
          </p>
        </div>

        {/* Artisans Grid */}
        {artisans.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No artisans found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {artisans.map((artisan, index) => (
              <motion.div
                key={artisan._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow h-full flex flex-col"
              >
                {/* Cover Image Section */}
                <div className="relative h-48 bg-gradient-to-r from-[#723d46] to-[#5a2f36]">
                  {artisan.coverImage?.url && (
                    <img
                      src={artisan.coverImage.url}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Profile Avatar - Positioned Absolutely */}
                  <div className="absolute -bottom-16 left-6">
                    {artisan.avatar?.url ? (
                      <img
                        src={artisan.avatar.url}
                        alt={artisan.name}
                        className="w-32 h-32 rounded-2xl border-4 border-white object-cover shadow-lg"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-2xl border-4 border-white bg-[#f5e6e8] flex items-center justify-center text-5xl font-bold text-[#723d46] shadow-lg">
                        {artisan.name?.[0]?.toUpperCase()}
                      </div>
                    )}

                    {artisan.isVerified && (
                      <div className="absolute -top-2 -right-2 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                        <FiShield className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Section */}
                <div className="pt-20 px-6 pb-6 flex-1 flex flex-col">
                  {/* Name and Business */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{artisan.name}</h3>
                  <p className="text-[#723d46] font-semibold text-lg">
                    {artisan.artisanProfile?.businessName || 'Artisan'}
                  </p>
                  
                  {/* Tagline */}
                  {artisan.artisanProfile?.tagline && (
                    <p className="text-gray-600 text-sm mb-3 italic">"{artisan.artisanProfile.tagline}"</p>
                  )}

                  {/* Location */}
                  {artisan.location && (
                    <div className="flex items-center text-gray-600 mb-3">
                      <FiMapPin className="h-4 w-4 mr-2 text-[#723d46] flex-shrink-0" />
                      <span className="text-sm">{artisan.location}</span>
                    </div>
                  )}

                  {/* Phone */}
                  {artisan.phone && (
                    <div className="flex items-center text-gray-600 mb-3">
                      <span className="text-sm">📞 {artisan.phone}</span>
                    </div>
                  )}

                  {/* Description */}
                  {artisan.artisanProfile?.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {artisan.artisanProfile.description}
                    </p>
                  )}

                  {/* Specialties */}
                  {artisan.artisanProfile?.specialties?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {artisan.artisanProfile.specialties.slice(0, 3).map((spec, i) => (
                        <span key={i} className="px-2 py-1 bg-[#f5e6e8] text-[#723d46] text-xs rounded-full font-medium">
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-2 mb-4 py-3 border-t border-b border-gray-200">
                    <div className="text-center">
                      <div className="flex items-center justify-center text-[#723d46] mb-1">
                        <FiAward className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-semibold text-gray-900">
                        {artisan.artisanProfile?.yearsOfExperience || 0}y
                      </p>
                      <p className="text-xs text-gray-500">Exp</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center text-[#723d46] mb-1">
                        <FiPackage className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-semibold text-gray-900">
                        {artisan.products?.length || 0}
                      </p>
                      <p className="text-xs text-gray-500">Products</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center text-[#723d46] mb-1">
                        <FiStar className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-semibold text-gray-900">
                        {artisan.artisanProfile?.ratings?.average?.toFixed(1) || '0.0'}
                      </p>
                      <p className="text-xs text-gray-500">Rating</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center text-[#723d46] mb-1">
                        <FiMessageCircle className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-semibold text-gray-900">
                        {artisan.reviews?.length || 0}
                      </p>
                      <p className="text-xs text-gray-500">Reviews</p>
                    </div>
                  </div>

                  {/* Spacer to push button to bottom */}
                  <div className="flex-grow"></div>

                  {/* View Shop Button - Changed to #723d46 */}
                  <button
                    onClick={() => navigate(`/artisans/${artisan._id}/shop`)}
                    className="w-full px-4 py-3 bg-[#723d46] text-white rounded-xl font-semibold hover:bg-[#5a2f36] transition-all mt-4"
                  >
                    View Shop
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Artisans;