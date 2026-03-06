// controllers/authController.js
import jwt     from 'jsonwebtoken';
import User    from '../models/User.js';
import Artisan from '../models/Artisan.js';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

export const register = async (req, res) => {
  try {
    const { name, email, password, role, artisanProfile } = req.body;
    console.log('Register attempt:', { name, email, role });

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const userData = { name, email, password, role: role || 'buyer' };

    if (role === 'artisan' && artisanProfile) {
      userData.artisanProfile = {
        businessName:      artisanProfile.businessName || `${name}'s Crafts`,
        description:       artisanProfile.description  || '',
        specialties:       artisanProfile.specialties  || [],
        yearsOfExperience: artisanProfile.yearsOfExperience || 0,
        socialLinks:       { instagram: '', facebook: '', website: '' },
      };
    }

    const user = await User.create(userData);
    console.log('User created:', user._id);

    let createdArtisan = null;
    if (role === 'artisan' && artisanProfile) {
      try {
        createdArtisan = await Artisan.create({
          user:              user._id,
          businessName:      artisanProfile.businessName || `${name}'s Crafts`,
          description:       artisanProfile.description  || '',
          specialties:       artisanProfile.specialties  || [],
          yearsOfExperience: artisanProfile.yearsOfExperience || 0,
        });
        console.log('Artisan profile created:', createdArtisan._id);
      } catch (e) {
        console.error('Failed to create artisan profile:', e);
      }
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token:   generateToken(user._id),
      user: {
        id:             user._id,
        name:           user.name,
        email:          user.email,
        role:           user.role,
        avatar:         user.avatar,
        artisanProfile: user.artisanProfile,
      },
      ...(createdArtisan && { artisan: createdArtisan }),
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map((e) => e.message).join(', ') });
    }
    if (error.code === 11000) return res.status(400).json({ message: 'Email already in use' });
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    let artisanData = null;
    if (user.role === 'artisan') artisanData = await Artisan.findOne({ user: user._id });

    res.json({
      success: true,
      token:   generateToken(user._id),
      user: {
        id:             user._id,
        name:           user.name,
        email:          user.email,
        role:           user.role,
        avatar:         user.avatar,
        artisanProfile: user.artisanProfile,
        ...(artisanData && { artisan: artisanData }),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    let artisanData = null;
    if (user.role === 'artisan') artisanData = await Artisan.findOne({ user: user._id });

    res.json({
      success: true,
      user: {
        id:             user._id,
        name:           user.name,
        email:          user.email,
        role:           user.role,
        avatar:         user.avatar,
        bio:            user.bio,
        location:       user.location,
        phone:          user.phone,
        artisanProfile: user.artisanProfile,
        buyerProfile:   user.buyerProfile,
        isVerified:     user.isVerified,
        createdAt:      user.createdAt,
        ...(artisanData && { artisan: artisanData }),
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
