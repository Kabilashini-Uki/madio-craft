// utils/artisanHelpers.js
const Artisan = require('../models/Artisan');
const User = require('../models/User');
const Product = require('../models/Product');

// Create artisan profile from user registration
const createArtisanProfile = async (userId, artisanData) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const artisan = await Artisan.create({
      user: userId,
      businessName: artisanData.businessName || user.name + "'s Crafts",
      description: artisanData.description || '',
      craftCategory: artisanData.craftCategory || 'other',
      otherCraftCategory: artisanData.otherCraft || '',
      specialties: artisanData.specialties || [],
      yearsOfExperience: artisanData.yearsOfExperience || 0,
      address: {
        city: artisanData.city || '',
        state: artisanData.state || '',
        pincode: artisanData.pincode || ''
      },
      phone: artisanData.phone || user.phone || '',
      email: user.email,
      profileImage: user.avatar || { url: '' },
      tags: artisanData.specialties || []
    });

    // Update user role and link to artisan
    user.role = 'artisan';
    user.artisanProfile = {
      businessName: artisan.businessName,
      description: artisan.description,
      specialties: artisan.specialties,
      yearsOfExperience: artisan.yearsOfExperience
    };
    await user.save();

    return artisan;
  } catch (error) {
    console.error('Error creating artisan profile:', error);
    throw error;
  }
};

// Get public artisan profile
const getPublicArtisanProfile = async (artisanId) => {
  try {
    const artisan = await Artisan.findById(artisanId)
      .select('-bankDetails -verificationDocuments -aadharNumber -panNumber -gstNumber');

    if (!artisan) {
      throw new Error('Artisan not found');
    }

    // Get products
    const products = await Product.find({ 
      artisan: artisan.user,
      isActive: true 
    }).select('name price images category ratings');

    return {
      ...artisan.toObject(),
      products
    };
  } catch (error) {
    throw error;
  }
};

// Get artisan dashboard data
const getArtisanDashboard = async (userId) => {
  try {
    const artisan = await Artisan.findOne({ user: userId });
    if (!artisan) {
      throw new Error('Artisan profile not found');
    }

    await artisan.calculateStats();

    return artisan;
  } catch (error) {
    throw error;
  }
};

// Add review to artisan
const addArtisanReview = async (artisanId, reviewData) => {
  try {
    const artisan = await Artisan.findById(artisanId);
    if (!artisan) {
      throw new Error('Artisan not found');
    }

    artisan.reviews.push(reviewData);
    artisan.updateRating();
    await artisan.save();

    return artisan;
  } catch (error) {
    throw error;
  }
};

// Search artisans
const searchArtisans = async (filters = {}, page = 1, limit = 12) => {
  try {
    const query = { isActive: true, isVerified: true };
    
    // Search by text
    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    // Filter by category
    if (filters.category && filters.category !== 'all') {
      query.craftCategory = filters.category;
    }

    // Filter by location
    if (filters.location) {
      query['address.state'] = filters.location;
    }

    // Filter by rating
    if (filters.minRating) {
      query['ratings.average'] = { $gte: filters.minRating };
    }

    // Sort options
    let sort = {};
    if (filters.sort === 'rating') {
      sort = { 'ratings.average': -1 };
    } else if (filters.sort === 'newest') {
      sort = { joinedAt: -1 };
    } else if (filters.sort === 'popular') {
      sort = { 'stats.followerCount': -1 };
    } else {
      sort = { joinedAt: -1 };
    }

    const skip = (page - 1) * limit;

    const artisans = await Artisan.find(query)
      .select('businessName tagline description profileImage coverImage craftCategory address ratings stats isVerified specialties joinedAt')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Artisan.countDocuments(query);

    return {
      artisans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createArtisanProfile,
  getPublicArtisanProfile,
  getArtisanDashboard,
  addArtisanReview,
  searchArtisans
};