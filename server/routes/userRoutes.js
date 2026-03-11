// routes/userRoutes.js  — local disk storage (no Cloudinary)
import { Router } from 'express';
import path       from 'path';
import { fileURLToPath } from 'url';
import User       from '../models/User.js';
import Artisan    from '../models/Artisan.js';
import { isBatticaloa } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import multer      from 'multer';
import fs          from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

// Ensure folders exist
['avatars', 'covers'].forEach(sub =>
  fs.mkdirSync(path.join(UPLOADS_ROOT, sub), { recursive: true })
);

const diskEngine = (folder) =>
  multer.diskStorage({
    destination: (_req, _file, cb) =>
      cb(null, path.join(UPLOADS_ROOT, folder)),
    filename: (_req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase() || '.jpg';
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, name);
    },
  });

const imgFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

const uploadAvatarMw = multer({ storage: diskEngine('avatars'), fileFilter: imgFilter, limits: { fileSize: 5 * 1024 * 1024 } }).single('avatar');
const uploadCoverMw  = multer({ storage: diskEngine('covers'),  fileFilter: imgFilter, limits: { fileSize: 8 * 1024 * 1024 } }).fields([{name:'coverImage',maxCount:1},{name:'cover',maxCount:1}]);

const toImageObj = (req, file, subfolder) => {
  const host = `${req.protocol}://${req.get('host')}`;
  return {
    url:       `${host}/uploads/${subfolder}/${file.filename}`,
    public_id: `${subfolder}/${file.filename}`,
  };
};

const router = Router();
router.use(protect);

// ── PUT /api/users/profile ────────────────────────────────────────
router.put('/profile', async (req, res) => {
  try {
    const { name, bio, location, phone, artisanProfile } = req.body;

    // Batticaloa-only location validation
    if (location && !isBatticaloa(location)) {
      return res.status(400).json({
        message: 'This application is only available for Batticaloa District users. Please enter a valid Batticaloa location.',
        batticaloa_only: true,
      });
    }

    const update = {};
    if (name     !== undefined) update.name     = name;
    if (bio      !== undefined) update.bio      = bio;
    if (phone    !== undefined) update.phone    = phone;
    if (location !== undefined) update.location = location;

    if (artisanProfile) {
      update['artisanProfile.businessName']      = artisanProfile.businessName;
      update['artisanProfile.description']       = artisanProfile.description;
      update['artisanProfile.specialties']       = artisanProfile.specialties;
      update['artisanProfile.yearsOfExperience'] = artisanProfile.yearsOfExperience;
      update['artisanProfile.socialLinks']       = artisanProfile.socialLinks;
    }

    const user = await User.findByIdAndUpdate(req.user.id, { $set: update }, { new: true }).select('-password');

    // Also sync location to the Artisan profile document
    if (location !== undefined) {
      await Artisan.findOneAndUpdate({ user: req.user.id }, { $set: { location } });
    }

    res.json({ success: true, user });
  } catch (e) {
    console.error('Profile update error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/users/avatar ────────────────────────────────────────
router.post('/avatar', (req, res) => {
  uploadAvatarMw(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message || 'Upload error' });
    if (!req.file) return res.status(400).json({ message: 'No image file received. Field name must be "avatar".' });

    try {
      const { url, public_id } = toImageObj(req, req.file, 'avatars');
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: { 'avatar.url': url, 'avatar.public_id': public_id } },
        { new: true }
      ).select('-password');
      res.json({ success: true, url, avatar: { url, public_id }, user });
    } catch (e) {
      console.error('Avatar upload error:', e);
      res.status(500).json({ message: 'Upload failed: ' + e.message });
    }
  });
});

// ── POST /api/users/cover ─────────────────────────────────────────
router.post('/cover', (req, res) => {
  uploadCoverMw(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message || 'Upload error' });
    const file = (req.files?.coverImage?.[0]) || (req.files?.cover?.[0]);
    if (!file) return res.status(400).json({ message: 'No image file received. Field name must be "coverImage" or "cover".' });

    try {
      const { url, public_id } = toImageObj(req, file, 'covers');
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: { 'coverImage.url': url, 'coverImage.public_id': public_id } },
        { new: true }
      ).select('-password');
      res.json({ success: true, url, coverImage: { url, public_id }, user });
    } catch (e) {
      console.error('Cover upload error:', e);
      res.status(500).json({ message: 'Upload failed: ' + e.message });
    }
  });
});

// ── POST /api/users/shipping-address ─────────────────────────────
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

// ── DELETE /api/users/shipping-address/:index ─────────────────────
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

// ── GET /api/users/:id ────────────────────────────────────────────
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
