// controllers/artisanController.js
import User from '../models/User.js';
import Artisan from '../models/Artisan.js';
import Product from '../models/Product.js';

export const getArtisans = async (req, res) => {
    try {
        const { search, category, location, page = 1, limit = 12 } = req.query;
        const filter = { role: 'artisan' };

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { 'artisanProfile.businessName': { $regex: search, $options: 'i' } },
                { bio: { $regex: search, $options: 'i' } }
            ];
        }

        if (category && category !== 'all') {
            filter['artisanProfile.specialties'] = category;
        }

        if (location && location !== 'all') {
            filter.location = { $regex: location, $options: 'i' };
        }

        const skip = (page - 1) * limit;
        const artisans = await User.find(filter)
            .select('-password')
            .skip(skip)
            .limit(Number(limit));

        const total = await User.countDocuments(filter);

        res.json({
            success: true,
            artisans,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get artisans error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getArtisan = async (req, res) => {
    try {
        const artisanUser = await User.findById(req.params.id).select('-password');
        if (!artisanUser || artisanUser.role !== 'artisan') {
            return res.status(404).json({ message: 'Artisan not found' });
        }

        const artisanData = await Artisan.findOne({ user: artisanUser._id });
        const products = await Product.find({ artisan: artisanUser._id, isActive: true });

        res.json({
            success: true,
            artisan: {
                ...artisanUser.toObject(),
                fullArtisanData: artisanData,
                products
            }
        });
    } catch (error) {
        console.error('Get artisan error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
