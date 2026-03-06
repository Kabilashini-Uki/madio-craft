// routes/userRoutes.js
import { Router } from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

// PUT /api/users/profile
router.put('/profile', async (req, res) => {
  try {
    const { name, bio, location, phone, artisanProfile } = req.body;
    const update = { name, bio, location, phone };
    if (artisanProfile) {
      update['artisanProfile.businessName']      = artisanProfile.businessName;
      update['artisanProfile.description']       = artisanProfile.description;
      update['artisanProfile.specialties']       = artisanProfile.specialties;
      update['artisanProfile.yearsOfExperience'] = artisanProfile.yearsOfExperience;
      update['artisanProfile.socialLinks']       = artisanProfile.socialLinks;
    }
    const user = await User.findByIdAndUpdate(req.user.id, { $set: update }, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users/shipping-address
router.post('/shipping-address', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const addr = { ...req.body };
    if (req.body.setDefault) {
      user.buyerProfile.shippingAddresses.forEach(a => { a.isDefault = false; });
      addr.isDefault = true;
    }
    user.buyerProfile.shippingAddresses.push(addr);
    await user.save();
    res.json({ success: true, addresses: user.buyerProfile.shippingAddresses });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/users/shipping-address/:index
router.delete('/shipping-address/:index', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const idx = parseInt(req.params.index);
    user.buyerProfile.shippingAddresses.splice(idx, 1);
    await user.save();
    res.json({ success: true, addresses: user.buyerProfile.shippingAddresses });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id — public artisan profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
