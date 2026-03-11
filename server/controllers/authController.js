// controllers/authController.js
import jwt     from 'jsonwebtoken';
import User    from '../models/User.js';
import Artisan from '../models/Artisan.js';

const MAX_LOGIN_ATTEMPTS = 3;
const LOCK_DURATION_MS   = 60 * 60 * 1000; // 1 hour

// Batticaloa district locations
const BATTICALOA_LOCATIONS = [
  'batticaloa', 'eravur', 'marudhamunai', 'valaichenai', 'ottamavadi',
  'kaatankudy', 'kaluwanchikudy', 'paddippalai', 'thiraimadu',
  'chenkalady', 'kattankudy',
];

export const isBatticaloa = (loc) => {
  if (!loc) return true;
  const l = loc.trim().toLowerCase();
  return BATTICALOA_LOCATIONS.some(b => l.includes(b));
};

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

export const register = async (req, res) => {
  try {
    const { name, email, password, role, artisanProfile, location } = req.body;

    if (!name?.trim() || !email?.trim() || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    // Batticaloa-only check
    if (location && !isBatticaloa(location)) {
      return res.status(400).json({
        message: 'This application is only available for users in Batticaloa District.',
        batticaloa_only: true,
      });
    }

    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'buyer',
    };
    if (location) userData.location = location;

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

    let createdArtisan = null;
    if (role === 'artisan' && artisanProfile) {
      try {
        createdArtisan = await Artisan.create({
          user:              user._id,
          businessName:      artisanProfile.businessName || `${name}'s Crafts`,
          description:       artisanProfile.description  || '',
          specialties:       artisanProfile.specialties  || [],
          yearsOfExperience: artisanProfile.yearsOfExperience || 0,
          location:          location || '',
        });
      } catch (e) {
        console.error('Failed to create artisan profile:', e);
      }
    }

    try {
      const io = req.app?.get?.('io');
      if (io) {
        io.emit('new-user-registered', {
          name: user.name, email: user.email, role: user.role,
          userId: user._id, createdAt: user.createdAt,
        });
      }
    } catch (_) {}

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token:   generateToken(user._id),
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, avatar: user.avatar, artisanProfile: user.artisanProfile,
      },
      ...(createdArtisan && { artisan: createdArtisan }),
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map(e => e.message).join(', ') });
    }
    if (error.code === 11000) return res.status(400).json({ message: 'Email already in use' });
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const now = new Date();

    // Check if account is locked
    if (user.loginLockedUntil && user.loginLockedUntil > now) {
      const minutesLeft = Math.ceil((user.loginLockedUntil - now) / 60000);
      return res.status(429).json({
        message: `Too many failed login attempts. Please wait ${minutesLeft} minute(s) before trying again.`,
        locked: true,
        lockedUntil: user.loginLockedUntil,
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.loginLockedUntil = new Date(now.getTime() + LOCK_DURATION_MS);
        user.loginAttempts    = 0;
        await user.save();
        return res.status(429).json({
          message: 'Too many failed login attempts. Your account is locked for 1 hour.',
          locked: true,
          lockedUntil: user.loginLockedUntil,
        });
      }
      await user.save();
      const remaining = MAX_LOGIN_ATTEMPTS - user.loginAttempts;
      return res.status(401).json({
        message: `Invalid credentials. ${remaining} attempt(s) remaining before lockout.`,
      });
    }

    // Successful — reset counters
    if (user.loginAttempts > 0 || user.loginLockedUntil) {
      user.loginAttempts    = 0;
      user.loginLockedUntil = null;
      await user.save();
    }

    let artisanData = null;
    if (user.role === 'artisan') artisanData = await Artisan.findOne({ user: user._id });

    res.json({
      success: true,
      token:   generateToken(user._id),
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, avatar: user.avatar, artisanProfile: user.artisanProfile,
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
    const user = await User.findById(req.user.id).select('-password -loginAttempts -loginLockedUntil');
    if (!user) return res.status(404).json({ message: 'User not found' });

    let artisanData = null;
    if (user.role === 'artisan') artisanData = await Artisan.findOne({ user: user._id });

    res.json({
      success: true,
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, avatar: user.avatar, bio: user.bio,
        location: user.location, phone: user.phone,
        artisanProfile: user.artisanProfile, buyerProfile: user.buyerProfile,
        isVerified: user.isVerified, createdAt: user.createdAt,
        ...(artisanData && { artisan: artisanData }),
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    res.json({ exists: !!user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const validateLocation = async (req, res) => {
  const { location } = req.body;
  const valid = isBatticaloa(location);
  res.json({
    valid,
    message: valid
      ? 'Location accepted'
      : 'This application is only available for Batticaloa District users.',
  });
};

export const switchRole = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isOriginalBuyer = user.role === 'buyer' && !user.originalRole;
    if (isOriginalBuyer) return res.status(400).json({ message: 'Already a buyer account' });

    const { mode } = req.body;
    const originalRole = user.originalRole || user.role;

    let activeRole;
    if (mode === 'buyer') {
      activeRole = 'buyer';
      if (!user.originalRole) {
        await User.findByIdAndUpdate(user._id, { originalRole: user.role, activeRole: 'buyer' });
      } else {
        await User.findByIdAndUpdate(user._id, { activeRole: 'buyer' });
      }
    } else {
      activeRole = originalRole;
      await User.findByIdAndUpdate(user._id, { activeRole: originalRole });
    }

    const updated = await User.findById(user._id).select('-password');
    const token   = generateToken(user._id);
    res.json({
      success: true, token,
      user: {
        id: updated._id, name: updated.name, email: updated.email,
        role: activeRole, originalRole: updated.originalRole || updated.role,
        avatar: updated.avatar, artisanProfile: updated.artisanProfile,
        activeRole: updated.activeRole,
      },
    });
  } catch (error) {
    console.error('Switch role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
