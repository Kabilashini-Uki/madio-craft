// controllers/productController.js
import Product from '../models/Product.js';
import Artisan from '../models/Artisan.js';

export const createProduct = async (req, res) => {
  try {
    const productData = { ...req.body, artisan: req.user.id };
    if (productData.price) productData.price = Number(productData.price);
    if (productData.stock) productData.stock = Number(productData.stock);

    if (req.body.images) {
      try {
        const bodyImages = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
        if (Array.isArray(bodyImages) && bodyImages.length > 0) {
          productData.images = bodyImages.map((img) => ({ public_id: img.public_id || '', url: img.url || img.path || img.secure_url || '', isPrimary: !!img.isPrimary }));
        }
      } catch (_) { /* fall through to files */ }
    }

    if ((!productData.images || !productData.images.length) && req.files?.length) {
      productData.images = req.files.map((f, i) => ({ public_id: f.filename || f.public_id || '', url: f.path || f.secure_url || '', isPrimary: i === 0 }));
    }

    const product = await Product.create(productData);

    try {
      const artisan = await Artisan.findOne({ user: req.user.id });
      if (artisan) {
        artisan.stats = artisan.stats || {};
        artisan.stats.totalProducts = (artisan.stats.totalProducts || 0) + 1;
        await artisan.save();
      }
    } catch (e) { console.warn('Failed to update artisan stats', e); }

    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, artisan, search, page = 1, limit = 12, sort = '-createdAt' } = req.query;
    const filter = { isActive: true };

    if (category)             filter.category = category;
    if (minPrice || maxPrice) { filter.price = {}; if (minPrice) filter.price.$gte = Number(minPrice); if (maxPrice) filter.price.$lte = Number(maxPrice); }
    if (artisan)              filter.artisan = artisan;
    if (search)               filter.$or = [{ name: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }, { tags: { $regex: search, $options: 'i' } }];

    const skip     = (page - 1) * limit;
    const products = await Product.find(filter).populate('artisan', 'name avatar artisanProfile.businessName').sort(sort).skip(skip).limit(Number(limit));
    const total    = await Product.countDocuments(filter);

    res.json({ success: true, products, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('artisan', 'name avatar artisanProfile location')
      .populate('ratings.reviews.user', 'name avatar');

    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ success: true, product });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') return res.status(404).json({ message: 'Product not found' });
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.artisan.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    if (req.body.images) {
      try {
        const bodyImages = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
        if (Array.isArray(bodyImages) && bodyImages.length > 0) {
          const parsed = bodyImages.map((img) => ({ public_id: img.public_id || '', url: img.url || img.path || img.secure_url || '', isPrimary: !!img.isPrimary }));
          product.images = [...product.images, ...parsed];
        }
      } catch (_) { /* ignore */ }
    }

    if (req.files?.length) {
      const newImages = req.files.map((f) => ({ public_id: f.filename || '', url: f.path || '', isPrimary: false }));
      product.images = [...product.images, ...newImages];
    }

    Object.keys(req.body).forEach((key) => {
      if (key !== 'images') product[key] = ['price', 'stock'].includes(key) ? Number(req.body[key]) : req.body[key];
    });

    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.artisan.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    product.isActive = false;
    await product.save();
    res.json({ success: true, message: 'Product deactivated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const alreadyReviewed = product.ratings.reviews.find((r) => r.user.toString() === req.user.id);
    if (alreadyReviewed) return res.status(400).json({ message: 'Product already reviewed' });

    product.ratings.reviews.push({ user: req.user.id, rating: Number(rating), comment });
    product.ratings.count   = product.ratings.reviews.length;
    product.ratings.average = product.ratings.reviews.reduce((acc, r) => acc + r.rating, 0) / product.ratings.reviews.length;

    await product.save();
    res.status(201).json({ success: true, message: 'Review added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ artisan: req.user.id }).sort('-createdAt');
    res.json({ success: true, products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const reduceStockOnOrder = async (orderItems) => {
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
  }
};

export const getCategoryCounts = async (req, res) => {
  try {
    const agg = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', totalStock: { $sum: '$stock' }, productCount: { $sum: 1 } } },
    ]);
    const counts = agg.reduce((acc, cur) => { acc[cur._id] = { totalStock: cur.totalStock, productCount: cur.productCount }; return acc; }, {});
    res.json({ success: true, counts });
  } catch (error) {
    console.error('Failed to aggregate category counts', error);
    res.status(500).json({ message: 'Server error' });
  }
};
