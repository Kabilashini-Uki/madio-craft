import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiMapPin, FiPackage, FiShield, FiAward, FiCheck, FiPhone
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

  useEffect(() => {
    const fetchArtisan = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/artisans/${id}`);
        const data = res.data.artisan;

        if (!data) {
          toast.error('Artisan not found');
          navigate('/artisans');
          return;
        }

        setArtisan(data);

        setProducts((data.products || []).map(p => ({
          ...p,
          artisan: {
            _id: data._id,
            name: data.name,
            avatar: data.avatar,
            location: data.location,
          }
        })));

      } catch (error) {
        console.error('Fetch artisan error:', error);
        toast.error(error.response?.data?.message || 'Failed to load artisan');
        navigate('/artisans');
      } finally {
        setLoading(false);
      }
    };

    fetchArtisan();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-14 w-14 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!artisan) return null;

  const coverUrl = artisan.coverImage?.url || 'https://via.placeholder.com/800';
  const avatarUrl = artisan.avatar?.url;
  const bizName = artisan.artisanProfile?.businessName || artisan.name;
  const description = artisan.artisanProfile?.description || artisan.bio || '';
  const specialties = artisan.artisanProfile?.specialties || [];
  const reviews = artisan.fullArtisanData?.reviews || [];
  const experience = artisan.artisanProfile?.yearsOfExperience || 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-4">

      <div className="max-w-6xl mx-auto">

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 mb-6 hover:text-gray-700">
          <FiArrowLeft /> Back
        </button>

        {/* HERO */}
        <div className="bg-white rounded-2xl shadow overflow-hidden mb-8">

          {/* Cover */}
          <div className="relative h-56 bg-gradient-to-r from-amber-700 to-amber-800">
            <img src={coverUrl} className="w-full h-full object-cover" alt="Cover" />
            <div className="absolute bottom-4 left-6 flex items-center gap-4">

              {avatarUrl ? (
                <img src={avatarUrl} className="w-24 h-24 rounded-xl border-4 border-white object-cover shadow-lg" alt={artisan.name} />
              ) : (
                <div className="w-24 h-24 bg-amber-400 rounded-xl flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                  {artisan.name?.[0]}
                </div>
              )}

              <div className="text-white">
                <h1 className="text-2xl font-bold">{bizName}</h1>
                {artisan.artisanProfile?.tagline && (
                  <p className="text-sm opacity-90 italic">"{artisan.artisanProfile.tagline}"</p>
                )}
                <p className="text-sm opacity-90">by {artisan.name}</p>
                {artisan.location && (
                  <p className="text-xs flex items-center gap-1 opacity-90">
                    <FiMapPin className="h-3 w-3" /> {artisan.location}
                  </p>
                )}
              </div>

            </div>
          </div>

          {/* CONTENT */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* LEFT — DETAILS CARD */}
            <div className="lg:col-span-2">

              <div className="bg-white border rounded-2xl shadow p-6 space-y-6">

                {/* About */}
                <div>
                  <h2 className="font-bold text-lg mb-2">About Artisan</h2>
                  <p className="text-gray-600 text-sm">
                    {description || 'Passionate artisan creating handcrafted products.'}
                  </p>
                </div>

                <hr />

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 text-center">

                  <div className="bg-gray-50 p-4 rounded-xl">
                    <FiPackage className="mx-auto mb-1 text-amber-600 h-5 w-5" />
                    <p className="font-bold text-lg">{products.length}</p>
                    <p className="text-xs text-gray-500">Products</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl">
                    <FiAward className="mx-auto mb-1 text-amber-600 h-5 w-5" />
                    <p className="font-bold text-lg">{experience}y</p>
                    <p className="text-xs text-gray-500">Experience</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl">
                    <FiShield className="mx-auto mb-1 text-green-600 h-5 w-5" />
                    <p className="font-bold text-lg">{artisan.isVerified ? '✓' : '—'}</p>
                    <p className="text-xs text-gray-500">Verified</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl">
                    <FiCheck className="mx-auto mb-1 text-blue-600 h-5 w-5" />
                    <p className="font-bold text-lg">{reviews.length}</p>
                    <p className="text-xs text-gray-500">Reviews</p>
                  </div>

                </div>

                <hr />

                {/* Specialties */}
                {specialties.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {specialties.map((s, i) => (
                        <span key={i} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {reviews.length > 0 && <hr />}

                {/* Reviews */}
                {reviews.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Customer Reviews ({reviews.length})</h3>

                    <div className="space-y-3">
                      {reviews.slice(0, 3).map((r, i) => (
                        <div key={i} className="bg-gray-50 p-4 rounded-xl">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-semibold text-sm">{r.userName || 'Customer'}</p>
                            <div className="flex text-yellow-400">
                              {[...Array(r.rating || 0)].map((_, j) => (
                                <span key={j}>★</span>
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mb-2">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {r.review || r.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* RIGHT — INFO CARD */}
            <div>
              <div className="bg-amber-50 rounded-2xl p-6 space-y-4 border border-amber-200">

                <h3 className="font-bold text-lg text-gray-900">Artisan Info</h3>

                {artisan.location && (
                  <div className="flex items-start gap-3">
                    <FiMapPin className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Location</p>
                      <p className="text-sm text-gray-900">{artisan.location}</p>
                    </div>
                  </div>
                )}

                {artisan.phone && (
                  <div className="flex items-start gap-3">
                    <FiPhone className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Phone</p>
                      <p className="text-sm text-gray-900">{artisan.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <FiPackage className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Products</p>
                    <p className="text-sm text-gray-900">{products.length} available</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FiAward className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Experience</p>
                    <p className="text-sm text-gray-900">{experience} years</p>
                  </div>
                </div>

                {artisan.isVerified && (
                  <div className="flex items-start gap-3 pt-2 border-t border-amber-200">
                    <FiShield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Verification</p>
                      <p className="text-sm text-green-700 font-medium">✓ Verified Artisan</p>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>

        {/* PRODUCTS */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">
            Products by {bizName} ({products.length})
          </h2>

          {products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl">
              <FiPackage className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No products available yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p, i) => (
                <ProductCard key={p._id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ArtisanDetail;