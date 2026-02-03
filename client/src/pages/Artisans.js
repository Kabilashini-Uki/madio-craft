import React, { useState } from 'react';
import { FaStar, FaMapMarkerAlt, FaTools, FaUser } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Artisans = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const artisans = [
    {
      id: 1,
      name: 'Priya Sharma',
      business: 'Clay Creations',
      specialty: 'Pottery',
      location: 'Jaipur, Rajasthan',
      rating: 4.8,
      reviews: 128,
      experience: '8 years',
      description: 'Specializing in traditional Indian pottery with modern designs.',
      image: 'https://via.placeholder.com/200'
    },
    {
      id: 2,
      name: 'Raj Kumar',
      business: 'Wood Wonders',
      specialty: 'Woodwork',
      location: 'Chennai, Tamil Nadu',
      rating: 4.9,
      reviews: 215,
      experience: '12 years',
      description: 'Master craftsman creating intricate wooden carvings and furniture.',
      image: 'https://via.placeholder.com/200'
    },
    {
      id: 3,
      name: 'Ananya Patel',
      business: 'Silver Symphony',
      specialty: 'Jewelry',
      location: 'Ahmedabad, Gujarat',
      rating: 4.7,
      reviews: 189,
      experience: '6 years',
      description: 'Handcrafted silver jewelry with traditional Gujarati motifs.',
      image: 'https://via.placeholder.com/200'
    },
    {
      id: 4,
      name: 'Suresh Reddy',
      business: 'Metal Masters',
      specialty: 'Metalwork',
      location: 'Hyderabad, Telangana',
      rating: 4.6,
      reviews: 142,
      experience: '15 years',
      description: 'Expert in brass and copper metal crafting.',
      image: 'https://via.placeholder.com/200'
    },
    {
      id: 5,
      name: 'Meera Singh',
      business: 'Textile Tales',
      specialty: 'Textiles',
      location: 'Varanasi, Uttar Pradesh',
      rating: 4.9,
      reviews: 256,
      experience: '20 years',
      description: 'Handloom textiles and Banarasi silk expert.',
      image: 'https://via.placeholder.com/200'
    },
    {
      id: 6,
      name: 'Arjun Nair',
      business: 'Glass Gallery',
      specialty: 'Glass Art',
      location: 'Firozabad, Uttar Pradesh',
      rating: 4.5,
      reviews: 98,
      experience: '10 years',
      description: 'Creating beautiful glass artifacts and decorations.',
      image: 'https://via.placeholder.com/200'
    },
  ];

  const categories = ['all', 'pottery', 'woodwork', 'jewelry', 'metalwork', 'textiles', 'glass'];

  const filteredArtisans = artisans.filter(artisan => {
    const matchesSearch = artisan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artisan.business.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artisan.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || artisan.specialty.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/90 to-primary-dark/90 text-white py-16 mb-8">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif font-bold mb-4"
          >
            Meet Our Artisans
          </motion.h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Discover the talented creators behind every masterpiece. Each artisan brings unique skills and traditions.
          </p>
          
          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search artisans by name, specialty, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-primary-light"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Categories */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full capitalize transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'All Artisans' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Artisans Grid */}
        {filteredArtisans.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No artisans found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArtisans.map(artisan => (
              <motion.div
                key={artisan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                {/* Artisan Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={artisan.image}
                    alt={artisan.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="font-semibold text-primary">{artisan.specialty}</span>
                  </div>
                </div>

                {/* Artisan Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-primary-dark">{artisan.name}</h3>
                      <p className="text-gray-600">{artisan.business}</p>
                    </div>
                    <button className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-semibold transition-colors">
                      View Profile
                    </button>
                  </div>

                  <p className="text-gray-700 mb-6 line-clamp-2">{artisan.description}</p>

                  {/* Details */}
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600">
                      <FaMapMarkerAlt className="h-4 w-4 mr-2" />
                      <span>{artisan.location}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FaTools className="h-4 w-4 mr-2" />
                      <span>{artisan.experience} experience</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FaUser className="h-4 w-4 mr-2" />
                      <span>{artisan.reviews} reviews</span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <div className="flex items-center space-x-2">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={`h-5 w-5 ${i < Math.floor(artisan.rating) ? 'fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span className="font-bold">{artisan.rating}</span>
                    </div>
                    <span className="text-sm text-gray-600">View Products →</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-16 bg-gradient-to-r from-primary-light to-primary-light/50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-primary-dark mb-6">Our Artisan Community</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-3xl font-bold text-primary-dark">200+</div>
              <div className="text-gray-700">Artisans</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-dark">50+</div>
              <div className="text-gray-700">Cities</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-dark">15+</div>
              <div className="text-gray-700">Traditional Crafts</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-dark">4.8</div>
              <div className="text-gray-700">Average Rating</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-bold text-primary-dark mb-4">Become an Artisan</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join our community of skilled artisans and showcase your craft to thousands of customers worldwide.
          </p>
          <button className="btn-primary">Apply Now</button>
        </div>
      </div>
    </div>
  );
};

export default Artisans;