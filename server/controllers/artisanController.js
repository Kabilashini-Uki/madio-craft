
import User from '../models/User.js';
import Artisan from '../models/Artisan.js';
import Product from '../models/Product.js';

export const getArtisans = async (req, res) => {
    try {
        const { search, category, location, page = 1, limit = 12 } = req.query;

        // Base filter: either currently an artisan OR switched from artisan (buyer mode)
        const baseFilter = {
            $or: [
                { role: 'artisan' },
                { originalRole: 'artisan' }
            ]
        };

        let filter = { ...baseFilter };
        const additionalFilters = [];

        if (search) {
            additionalFilters.push({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { 'artisanProfile.businessName': { $regex: search, $options: 'i' } },
                    { bio: { $regex: search, $options: 'i' } }
                ]
            });
        }

        if (category && category !== 'all') {
            additionalFilters.push({ 'artisanProfile.specialties': category });
        }

        if (location && location !== 'all') {
            additionalFilters.push({ location: { $regex: location, $options: 'i' } });
        }

        if (additionalFilters.length > 0) {
            filter = {
                $and: [baseFilter, ...additionalFilters]
            };
        }

        const skip = (page - 1) * limit;
        const artisans = await User.find(filter)
            .select('-password -loginAttempts -loginLockedUntil')
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

export const getArtisanShop = async (req, res) => {
    try {
        const artisanUser = await User.findById(req.params.id).select('-password');
        console.log('Artisan user found:', artisanUser ? artisanUser.name : 'null');
        
        if (!artisanUser) {
            console.log('User not found');
            return res.status(404).json({ message: 'Artisan not found' });
        }

        // Check if user has products (they might be an artisan)
        const products = await Product.find({ artisan: artisanUser._id, isActive: true });
        
        if (products.length === 0 && artisanUser.role !== 'artisan' && artisanUser.originalRole !== 'artisan') {
            console.log('User is not an artisan and has no products');
            return res.status(404).json({ message: 'Artisan not found' });
        }

        const artisanData = await Artisan.findOne({ user: artisanUser._id });
        console.log('Products found:', products.length);

        res.json({
            success: true,
            artisan: {
                ...artisanUser.toObject(),
                fullArtisanData: artisanData,
                products
            }
        });
    } catch (error) {
        console.error('Get artisan shop error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getArtisan = async (req, res) => {
    try {
        const artisanUser = await User.findById(req.params.id).select('-password');
        console.log('Artisan user found:', artisanUser ? artisanUser.name : 'null');
        console.log('Role:', artisanUser?.role, 'OriginalRole:', artisanUser?.originalRole);
        
        if (!artisanUser) {
            console.log('User not found');
            return res.status(404).json({ message: 'Artisan not found' });
        }

        // Allow role='artisan' OR originalRole='artisan' (buyer-mode switch)
        // Also allow if user has products (they might be an artisan)
        const isArtisan = (
            artisanUser.role === 'artisan' ||
            artisanUser.originalRole === 'artisan'
        );
        
        if (!isArtisan) {
            console.log('User is not an artisan');
            return res.status(404).json({ message: 'Artisan not found' });
        }

        const artisanData = await Artisan.findOne({ user: artisanUser._id });
        const products = await Product.find({ artisan: artisanUser._id, isActive: true });
        console.log('Products found:', products.length);

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
