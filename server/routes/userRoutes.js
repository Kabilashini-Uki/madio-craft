const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Mock controller functions - you'll need to implement these
const userController = {
  getProfile: async (req, res) => {
    try {
      const user = req.user;
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  updateProfile: async (req, res) => {
    try {
      const { name, bio, location, phone } = req.body;
      const user = req.user;
      
      if (name) user.name = name;
      if (bio) user.bio = bio;
      if (location) user.location = location;
      if (phone) user.phone = phone;
      
      await user.save();
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  updateAvatar: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const user = req.user;
      user.avatar = {
        public_id: req.file.public_id,
        url: req.file.path
      };
      
      await user.save();
      res.json({ success: true, avatar: user.avatar });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  getArtisans: async (req, res) => {
    try {
      const User = require('../models/User');
      const artisans = await User.find({ role: 'artisan' })
        .select('name avatar artisanProfile ratings')
        .limit(parseInt(req.query.limit) || 10);
      
      res.json({ success: true, users: artisans });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

// Routes
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.post('/avatar', protect, upload.single('avatar'), userController.updateAvatar);
router.get('/artisans', userController.getArtisans);

module.exports = router;