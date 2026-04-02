import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiMapPin, FiPackage, FiShield, FiAward, FiCheck
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

      } catch {
        toast.error('Failed to load artisan');
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
  const description = artisan.bio || '';
  const specialties = artisan.artisanProfile?.specialties || [];
  const reviews = artisan.fullArtisanData?.reviews || [];
  const experience = artisan.artisanProfile?.yearsOfExperience || 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-4">

      <div className="max-w-6xl mx-auto">

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 mb-6">
          <FiArrowLeft /> Back
        </button>

        {/* HERO */}
        <div className="bg-white rounded-2xl shadow overflow-hidden mb-8">

          {/* Cover */}
          <div className="relative h-56">
            <img src={coverUrl} className="w-full h-full object-cover" />
            <div className="absolute bottom-4 left-6 flex items-center gap-4 text-white">

              {avatarUrl ? (
                <img src={avatarUrl} className="w-20 h-20 rounded-xl border-4 border-white object-cover" />
              ) : (
                <div className="w-20 h-20 bg-primary rounded-xl flex items-center justify-center text-2xl">
                  {artisan.name?.[0]}
                </div>
              )}

              <div>
                <h1 className="text-xl font-bold">{bizName}</h1>
                <p className="text-sm">by {artisan.name}</p>
                <p className="text-xs flex items-center gap-1">
                  <FiMapPin /> {artisan.location}
                </p>
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
                <div className="grid grid-cols-3 gap-4 text-center">

                  <div className="bg-gray-50 p-4 rounded-xl">
                    <FiPackage className="mx-auto mb-1 text-primary" />
                    <p className="font-bold">{products.length}</p>
                    <p className="text-xs text-gray-500">Products</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl">
                    <FiAward className="mx-auto mb-1 text-amber-600" />
                    <p className="font-bold">{experience}y</p>
                    <p className="text-xs text-gray-500">Experience</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl">
                    <FiShield className="mx-auto mb-1 text-green-600" />
                    <p className="font-bold">{artisan.isVerified ? 'Yes' : 'No'}</p>
                    <p className="text-xs text-gray-500">Verified</p>
                  </div>

                </div>

                <hr />

                {/* Specialties */}
                {specialties.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {specialties.map((s, i) => (
                        <span key={i} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">
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
                    <h3 className="font-semibold mb-3">Customer Reviews</h3>

                    <div className="space-y-3">
                      {reviews.slice(0, 3).map((r, i) => (
                        <div key={i} className="bg-gray-50 p-4 rounded-xl">
                          <p className="font-semibold text-sm">{r.buyerName}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {r.comment}
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
              <div className="bg-gray-100 rounded-2xl p-6 space-y-4">

                <h3 className="font-bold">Artisan Info</h3>

                <div className="flex items-center gap-2 text-sm">
                  <FiMapPin /> {artisan.location}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <FiPackage /> {products.length} products
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <FiAward /> {experience} years experience
                </div>

                {artisan.isVerified && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <FiCheck /> Verified Artisan
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>

        {/* PRODUCTS */}
        <div>
          <h2 className="text-xl font-bold mb-4">
            Products by {bizName} ({products.length})
          </h2>

          {products.length === 0 ? (
            <p className="text-gray-500">No products available</p>
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