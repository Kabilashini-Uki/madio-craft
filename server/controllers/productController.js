// controllers/productController.js  — local disk storage (no Cloudinary)
import Product              from '../models/Product.js';
import Artisan              from '../models/Artisan.js';
import CustomizationRequest from '../models/CustomizationRequest.js';
import { fileToImageObj }   from '../middleware/upload.js';

/** Coerce raw FormData strings into the types Mongoose expects */
const coerceProductFields = (body) => {
  const d = { ...body };
  if (d.price)          d.price          = Number(d.price);
  if (d.stock !== undefined) d.stock     = Number(d.stock);
  // Boolean — FormData sends 'true' / 'false' as strings
  if (d.isCustomizable !== undefined)
    d.isCustomizable = d.isCustomizable === true || d.isCustomizable === 'true';
  // Arrays — frontend sends comma-separated strings or JSON arrays
  ['materials', 'tags'].forEach(key => {
    if (d[key] !== undefined) {
      if (Array.isArray(d[key])) {
        d[key] = d[key].flatMap(v => v.split(',').map(s => s.trim()).filter(Boolean));
      } else if (typeof d[key] === 'string') {
        try { d[key] = JSON.parse(d[key]); }
        catch (_) { d[key] = d[key].split(',').map(s => s.trim()).filter(Boolean); }
      }
    }
  });
  return d;
};

export const createProduct = async (req, res) => {
  try {
    const productData = { ...coerceProductFields(req.body), artisan: req.user.id };

    if (req.files?.length) {
      // New files uploaded to disk — build image objects
      productData.images = req.files.map((f, i) => ({
        ...fileToImageObj(req, f, 'products'),
        isPrimary: i === 0,
      }));
    } else if (req.body.images) {
      // JSON array of kept images passed as a string
      try {
        const bodyImages = typeof req.body.images === 'string'
          ? JSON.parse(req.body.images)
          : req.body.images;
        if (Array.isArray(bodyImages) && bodyImages.length > 0)
          productData.images = bodyImages.map((img, i) => ({
            public_id: img.public_id || '',
            url:       img.url       || '',
            isPrimary: i === 0,
          }));
      } catch (_) {}
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
    const products = await Product.find(filter).populate('artisan', 'name avatar location artisanProfile').sort(sort).skip(skip).limit(Number(limit));
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

    if (req.files?.length) {
      // Append newly uploaded images
      const newImages = req.files.map(f => ({
        ...fileToImageObj(req, f, 'products'),
        isPrimary: false,
      }));
      product.images = [...product.images, ...newImages];
    } else if (req.body.images) {
      try {
        const bodyImages = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
        if (Array.isArray(bodyImages) && bodyImages.length > 0) {
          product.images = bodyImages.map((img, i) => ({
            public_id: img.public_id || '',
            url:       img.url       || '',
            isPrimary: !!img.isPrimary,
          }));
        }
      } catch (_) {}
    }

    const coerced = coerceProductFields(req.body);
    Object.keys(coerced).forEach((key) => {
      if (key !== 'images') product[key] = coerced[key];
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

// POST /api/products/:id/customization-request
export const sendCustomizationRequest = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('artisan', 'name _id avatar');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (!product.artisan?._id) return res.status(400).json({ message: 'This product has no artisan assigned' });
    // Prevent artisan from sending a request to themselves
    if (String(product.artisan._id) === String(req.user._id)) {
      return res.status(400).json({ message: "You can't send a customization request for your own product" });
    }

    const { color, size, notes } = req.body;

    const parts = [];
    if (color) parts.push(`Colour: ${color}`);
    if (size)  parts.push(`Size: ${size}`);
    if (notes) parts.push(`Notes: ${notes}`);
    const message = parts.length ? parts.join(' · ') : 'No specific options provided';

    const custReq = await CustomizationRequest.create({
      sender:       req.user._id,
      senderName:   req.user.name,
      senderAvatar: req.user.avatar?.url || '',
      product:      product._id,
      productName:  product.name,
      artisan:      product.artisan._id,
      color:        color || '',
      size:         size  || '',
      notes:        notes || '',
      message,
      status:    'pending',
      timestamp: new Date(),
    });

    const socketPayload = {
      requestId: custReq._id,
      sender: { id: req.user._id, name: req.user.name, avatar: req.user.avatar?.url || '' },
      product: { id: product._id, name: product.name, image: product.images?.[0]?.url || '' },
      message, color: color || '', size: size || '', notes: notes || '',
      timestamp: custReq.timestamp, status: 'pending',
    };

    try {
      const io = req.app.get('io');
      if (io) io.to(`user-${product.artisan._id}`).emit('customization-request', socketPayload);
    } catch (e) { console.warn('Socket customization notify failed:', e.message); }

    res.json({ success: true, message: 'Customization request sent to artisan', requestId: custReq._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/products/:id/customization-response
export const respondToCustomization = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const { available, buyerId, requestId, customizationPrice } = req.body;
    const newStatus = available ? 'accepted' : 'rejected';
    const priceToSet = available && customizationPrice ? Number(customizationPrice) : 0;

    let custReq = null;
    const updateFields = { status: newStatus, respondedAt: new Date() };
    if (priceToSet > 0) updateFields.customizationPrice = priceToSet;

    if (requestId) {
      custReq = await CustomizationRequest.findByIdAndUpdate(
        requestId, updateFields, { new: true }
      );
    } else {
      custReq = await CustomizationRequest.findOneAndUpdate(
        { product: product._id, sender: buyerId, status: 'pending' },
        updateFields,
        { new: true, sort: { timestamp: -1 } }
      );
    }

    const socketPayload = {
      requestId:          String(custReq?._id || requestId || ''),
      productId:          product._id,
      productName:        product.name,
      productImage:       product.images?.[0]?.url || '',
      artisan:            { id: req.user._id, name: req.user.name },
      available,          status: newStatus, timestamp: new Date(),
      customizationPrice: priceToSet,
      color:              custReq?.color || '',
      size:               custReq?.size  || '',
      notes:              custReq?.notes || '',
    };

    try {
      const io = req.app.get('io');
      if (io) io.to(`user-${buyerId}`).emit('customization-response', socketPayload);
    } catch (e) { console.warn('Socket customization response failed:', e.message); }

    res.json({ success: true, available, status: newStatus, customizationPrice: priceToSet, message: available ? 'Customization accepted' : 'Customization unavailable' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/products/customization-requests  (artisan)
export const getCustomizationRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { artisan: req.user._id };
    if (status) filter.status = status;

    const requests = await CustomizationRequest.find(filter)
      .populate('sender',  'name avatar')
      .populate('product', 'name images price')
      .sort('-timestamp')
      .limit(100);

    res.json({ success: true, requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/products/my-customization-requests  (buyer)
export const getMyCustomizationRequests = async (req, res) => {
  try {
    const requests = await CustomizationRequest.find({ sender: req.user._id })
      .populate('product', 'name images price artisan')
      .sort('-timestamp')
      .limit(50);

    res.json({ success: true, requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};