// pages/Artisans.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiMapPin, 
  FiStar, 
  FiAward, 
  FiUsers, 
  FiSearch,
  FiFilter,
  FiChevronRight,
  FiHeart,
  FiMail,
  FiShield
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const Artisans = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');

  const artisans = [
    {
      id: 1,
      _id: '1',
      name: 'Priya Sharma',
      business: 'Clay Creations',
      specialty: 'pottery',
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
    },
    {
      id: 2,
      _id: '2',
      name: 'Raj Kumar',
      business: 'Wood Wonders',
      specialty: 'woodwork',
      location: 'Chennai, Tamil Nadu',
      rating: 4.9,
      reviews: 215,
      experience: '12 years',
      description: 'Master craftsman creating intricate wooden carvings and furniture. His family has been in this craft for over 50 years.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      coverImage: 'https://images.pexels.com/photos/31193512/pexels-photo-31193512.jpeg',
      products: 78,
      followers: 5600,
      verified: true,
      awards: ['Woodcraft Excellence Award', 'Southern Craft Biennale']
    },
    {
      id: 3,
      _id: '3',
      name: 'Ananya Patel',
      business: 'Silver Symphony',
      specialty: 'jewelry',
      location: 'Ahmedabad, Gujarat',
      rating: 4.7,
      reviews: 189,
      experience: '6 years',
      description: 'Handcrafted silver jewelry with traditional Gujarati motifs. Each piece tells a story of heritage and artistry.',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      coverImage: 'https://images.pexels.com/photos/4741622/pexels-photo-4741622.jpeg',
      products: 112,
      followers: 8900,
      verified: true,
      awards: ['Emerging Artisan Award 2024']
    },
    {
      id: 4,
      _id: '4',
      name: 'Suresh Reddy',
      business: 'Metal Masters',
      specialty: 'metalwork',
      location: 'Hyderabad, Telangana',
      rating: 4.6,
      reviews: 142,
      experience: '15 years',
      description: 'Expert in brass and copper metal crafting. Known for his intricate Bidri work and contemporary designs.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      coverImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGEzQe0I3xuy7yG6K4K6sXQVK5N6rycfAi0A&s',
      products: 67,
      followers: 3400,
      verified: true,
      awards: ['Metal Craft Excellence Award']
    },
    {
      id: 5,
      _id: '5',
      name: 'Meera Singh',
      business: 'Textile Tales',
      specialty: 'textiles',
      location: 'Varanasi, Uttar Pradesh',
      rating: 4.9,
      reviews: 256,
      experience: '20 years',
      description: 'Handloom textiles and Banarasi silk expert. Reviving ancient weaving techniques with modern applications.',
      image: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400',
      coverImage: 'https://images.pexels.com/photos/17043766/pexels-photo-17043766.jpeg',
      products: 156,
      followers: 12700,
      verified: true,
      awards: ['Padma Shri Nominee', 'Handloom Excellence Award']
    },
    {
      id: 6,
      _id: '6',
      name: 'Arjun Nair',
      business: 'Glass Gallery',
      specialty: 'glass',
      location: 'Firozabad, Uttar Pradesh',
      rating: 4.5,
      reviews: 98,
      experience: '10 years',
      description: 'Creating beautiful glass artifacts and decorations. Specializes in stained glass and contemporary glass sculptures.',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
      coverImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbt4_gHLnnBkLZfLBi2iu9NyP7PFM3--Z2kA&s',
      products: 34,
      followers: 1800,
      verified: false,
      awards: []
    },
  ];

  const handleViewShop = (artisanId) => {
    navigate(`/artisans/${artisanId}`);
  };

  const handleContact = (artisanId) => {
    if (!localStorage.getItem('token')) {
      toast.error('Please login to contact artisans');
      navigate('/login');
      return;
    }
    navigate(`/chat/${artisanId}`);
  };

  const categories = ['all', 'pottery', 'woodwork', 'jewelry', 'metalwork', 'textiles', 'glass'];
  const locations = ['all', 'Rajasthan', 'Tamil Nadu', 'Gujarat', 'Telangana', 'Uttar Pradesh'];

  const filteredArtisans = artisans.filter(artisan => {
    const matchesSearch = artisan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artisan.business.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artisan.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         artisan.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || artisan.specialty.toLowerCase() === selectedCategory;
    const matchesLocation = selectedLocation === 'all' || artisan.location.includes(selectedLocation);
    return matchesSearch && matchesCategory && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://media.istockphoto.com/id/2157382378/photo/group-of-diverse-people-stacking-hands-in-the-middle.jpg?s=612x612&w=0&k=20&c=-XuqsHcI8nMAXOYAaZzdPsHZeOttDzitvnqX2b4VD-I=')] bg-cover bg-center opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-black/5"></div>
        </div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm mb-6 border border-white/20">
              👥 Meet the Makers
            </span>
            <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 leading-tight">
              Master Artisans of 
              <span className="bg-gradient-to-r from-primary-light to-primary bg-clip-text text-transparent"> SriLanka</span>
            </h1>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Connect directly with skilled craftspeople who pour their heart and heritage into every creation.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative">
                <FiSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search artisans by name, craft, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats Bar */}
        <div className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: '500+', label: 'Active Artisans', icon: <FiUsers /> },
                { value: '25+', label: 'Craft Categories', icon: <FiAward /> },
                { value: '50k+', label: 'Products Made', icon: <FiHeart /> },
                { value: '4.8', label: 'Average Rating', icon: <FiStar /> },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400 flex items-center justify-center">
                    <span className="mr-2">{stat.icon}</span>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-12"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Categories */}
            <div className="flex-1">
              <div className="flex items-center mb-3">
                <FiFilter className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Filter by Category</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium capitalize transition-all ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category === 'all' ? 'All Crafts' : category}
                  </button>
                ))}
              </div>
            </div>

            {/* Locations */}
            <div className="flex-1">
              <div className="flex items-center mb-3">
                <FiMapPin className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Filter by Location</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {locations.map(location => (
                  <button
                    key={location}
                    onClick={() => setSelectedLocation(location)}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium capitalize transition-all ${
                      selectedLocation === location
                        ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {location === 'all' ? 'All Locations' : location}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-8">
          <p className="text-gray-600">
            <span className="font-semibold text-gray-900 text-lg">{filteredArtisans.length}</span> artisans found
          </p>
          <select className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent">
            <option>Most Popular</option>
            <option>Highest Rated</option>
            <option>Most Products</option>
            <option>Newest</option>
          </select>
        </div>

        {/* Artisans Grid */}
        {filteredArtisans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white rounded-3xl"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No artisans found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters or search criteria</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedLocation('all');
              }}
              className="px-6 py-3 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
            >
              Clear All Filters
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArtisans.map((artisan, index) => (
              <motion.div
                key={artisan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                {/* Cover Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={artisan.coverImage}
                    alt={artisan.business}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* Profile Image */}
                  <div className="absolute -bottom-12 left-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-2xl border-4 border-white overflow-hidden shadow-xl">
                        <img
                          src={artisan.image}
                          alt={artisan.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {artisan.verified && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center border-2 border-white">
                          <FiShield className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Specialty Badge */}
                  <span className="absolute top-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-900 shadow-lg">
                    {artisan.specialty}
                  </span>
                </div>

                {/* Content */}
                <div className="pt-16 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                        {artisan.name}
                      </h3>
                      <p className="text-primary font-medium">{artisan.business}</p>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <FiHeart className="h-5 w-5" />
                    </button>
                  </div>

                  <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                    {artisan.description}
                  </p>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center text-gray-600">
                      <FiMapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm">{artisan.location.split(',')[0]}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FiAward className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm">{artisan.experience}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FiStar className="h-4 w-4 mr-2 text-yellow-400" />
                      <span className="text-sm font-semibold">{artisan.rating}</span>
                      <span className="text-xs text-gray-500 ml-1">({artisan.reviews})</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FiUsers className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm">{artisan.followers.toLocaleString()} followers</span>
                    </div>
                  </div>

                  {/* Awards */}
                  {artisan.awards.length > 0 && (
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-2">
                        {artisan.awards.map((award, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium"
                          >
                            🏆 {award}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats & Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <span className="text-sm text-gray-500">Products</span>
                      <p className="text-lg font-bold text-gray-900">{artisan.products}+</p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleContact(artisan._id)}
                        className="p-3 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl transition-colors"
                      >
                        <FiMail className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleViewShop(artisan._id)}
                        className="px-5 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center space-x-2"
                      >
                        <span>View Shop</span>
                        <FiChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
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