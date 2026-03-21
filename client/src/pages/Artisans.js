// src/pages/Artisans.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMapPin, FiStar, FiAward, FiPackage, FiShield } from 'react-icons/fi';
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
      setArtisans(res.data.artisans || []);
    } catch (error) {
      console.error('Failed to load artisans', error);
      toast.error('Failed to load artisans');
    } finally {
      setLoading(false);
    }
  };

  // Calculate years of experience
  const getYearsExperience = (artisan) => {
    if (artisan.yearsOfExperience) return artisan.yearsOfExperience;
    if (artisan.startYear) return new Date().getFullYear() - artisan.startYear;
    return 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-700 border-t-transparent"></div>
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
                onClick={() => navigate(`/artisans/${artisan._id}/shop`)}
                className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
              >
                {/* FIXED: Background Image */}
                <div className="relative h-40 bg-gradient-to-r from-amber-700 to-amber-800">
                  {artisan.coverImage?.url && (
                    <img
                      src={artisan.coverImage.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* FIXED: Profile Image */}
                  <div className="absolute -bottom-12 left-6">
                    {artisan.avatar?.url ? (
                      <img
                        src={artisan.avatar.url}
                        alt={artisan.name}
                        className="w-24 h-24 rounded-2xl border-4 border-white object-cover shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl border-4 border-white bg-amber-200 flex items-center justify-center text-3xl font-bold text-amber-800 shadow-lg">
                        {artisan.name?.[0]?.toUpperCase()}
                      </div>
                    )}

                    {artisan.isVerified && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                        <FiShield className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="pt-16 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{artisan.name}</h3>
                  <p className="text-amber-700 font-medium mb-4">
                    {artisan.artisanProfile?.businessName || ''}
                  </p>

                  {/* FIXED: Location - only once */}
                  {artisan.location && (
                    <div className="flex items-center text-gray-600 mb-3">
                      <FiMapPin className="h-4 w-4 mr-2 text-amber-700" />
                      <span className="text-sm">{artisan.location}</span>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center text-amber-700 mb-1">
                        <FiAward className="h-4 w-4" />
                      </div>
                      {/* FIXED: Years Experience */}
                      <p className="text-sm font-semibold">{getYearsExperience(artisan)} yrs</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center text-amber-700 mb-1">
                        <FiPackage className="h-4 w-4" />
                      </div>
                      {/* FIXED: Product Count */}
                      <p className="text-sm font-semibold">{artisan.productCount || 0}</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center text-amber-700 mb-1">
                        <FiStar className="h-4 w-4" />
                      </div>
                      {/* FIXED: Rating */}
                      <p className="text-sm font-semibold">
                        {artisan.ratings?.average?.toFixed(1) || '0.0'}
                      </p>
                    </div>
                  </div>

                  {/* Specialties */}
                  {artisan.artisanProfile?.specialties?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {artisan.artisanProfile.specialties.slice(0, 3).map((spec, i) => (
                        <span key={i} className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-full">
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
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