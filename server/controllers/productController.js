// controllers/productController.js  — local disk storage (no Cloudinary)
import Product from '../models/Product.js';
import Artisan from '../models/Artisan.js';
import CustomizationRequest from '../models/CustomizationRequest.js';
import Notification from '../models/Notification.js';
import { fileToImageObj } from '../middleware/upload.js';

/** Coerce raw FormData strings into the types Mongoose expects */
const coerceProductFields = (body) => {
  const d = { ...body };
  if (d.price) d.price = Number(d.price);
  if (d.stock !== undefined) d.stock = Number(d.stock);
  // Boolean — FormData sends 'true' / 'false' as strings
  if (d.isCustomizable !== undefined)
    d.isCustomizable = d.isCustomizable === true || d.isCustomizable === 'true';
  return d;
};

export const createProduct = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const productData = { ...coerceProductFields(req.body), artisan: userId };

    productData.images = [];
    if (req.body.images) {
      try {
        let bodyImages = req.body.images;
        if (typeof bodyImages === 'string') {
          try { bodyImages = JSON.parse(bodyImages); } catch (_) { bodyImages = [bodyImages]; }
        }

        if (Array.isArray(bodyImages)) {
          bodyImages.forEach((img) => {
            const imgObj = typeof img === 'string' ? JSON.parse(img) : img;
            if (Array.isArray(imgObj)) {
              productData.images.push(...imgObj.map(i => ({
                public_id: i.public_id || '',
                url: i.url || '',
                isPrimary: false,
              })));
            } else {
              productData.images.push({
                public_id: imgObj.public_id || '',
                url: imgObj.url || '',
                isPrimary: false,
              });
            }
          });
        }
      } catch (_) { }
    }

    if (req.files?.length) {
      productData.images.push(...req.files.map((f) => ({
        ...fileToImageObj(req, f, 'products'),
        isPrimary: false,
      })));
    }

    if (productData.images.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload at least one image' });
    }

    if (productData.images.length > 0) {
      productData.images[0].isPrimary = true;
    }

    const product = await Product.create(productData);

    try {
      const artisan = await Artisan.findOne({ user: userId });
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

    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (artisan) filter.artisan = artisan;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const products = await Product.find(filter)
      .populate('artisan', 'name avatar location artisanProfile')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Fetch artisan profiles to get acceptCustomOrders flag
    const productsWithCustomStatus = await Promise.all(
      products.map(async (product) => {
        if (product.artisan?._id) {
          const artisanProfile = await Artisan.findOne({ user: product.artisan._id }, 'acceptCustomOrders');
          if (artisanProfile) {
            product.artisan.acceptCustomOrders = artisanProfile.acceptCustomOrders;
          }
        }
        return product;
      })
    );

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      products: productsWithCustomStatus,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('artisan', 'name avatar artisanProfile location')
      .populate('reviews.user', 'name avatar');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Fetch artisan profile to get acceptCustomOrders flag
    if (product.artisan?._id) {
      const artisanProfile = await Artisan.findOne({ user: product.artisan._id }, 'acceptCustomOrders');
      if (artisanProfile) {
        product.artisan = {
          ...product.artisan.toObject?.() || product.artisan,
          acceptCustomOrders: artisanProfile.acceptCustomOrders
        };
      }
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error('Get product error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Invalid product ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.artisan.toString() !== userId.toString()) return res.status(403).json({ message: 'Not authorized' });

    let updatedImages = [];
    if (req.body.images) {
      try {
        let bodyImages = req.body.images;
        if (typeof bodyImages === 'string') {
          try { bodyImages = JSON.parse(bodyImages); } catch (_) { bodyImages = [bodyImages]; }
        }

        if (Array.isArray(bodyImages)) {
          bodyImages.forEach((img) => {
            const imgObj = typeof img === 'string' ? JSON.parse(img) : img;
            if (Array.isArray(imgObj)) {
              updatedImages.push(...imgObj.map(i => ({
                public_id: i.public_id || '',
                url: i.url || '',
                isPrimary: false,
              })));
            } else {
              updatedImages.push({
                public_id: imgObj.public_id || '',
                url: imgObj.url || '',
                isPrimary: false,
              });
            }
          });
        }
      } catch (_) { }
    }

    if (req.files?.length) {
      updatedImages.push(...req.files.map(f => ({
        ...fileToImageObj(req, f, 'products'),
        isPrimary: false,
      })));
    }

    if (updatedImages.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one image is required' });
    }

    if (updatedImages.length > 0) {
      updatedImages[0].isPrimary = true;
    }
    product.images = updatedImages;

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
    const userId = req.user._id || req.user.id;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.artisan.toString() !== userId.toString() && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });

    product.isActive = false;
    await product.save();
    res.json({ success: true, message: 'Product deactivated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const getMyProducts = async (req, res) => {
  try {
    console.log(`📦 Fetching products for Artisan: ${req.user.id || req.user._id}`);
    const products = await Product.find({ artisan: req.user.id || req.user._id })
      .sort('-createdAt')
      .lean();
    console.log(`✅ Found ${products.length} products`);
    res.json({ success: true, products });
  } catch (error) {
    console.error('❌ Error in getMyProducts:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load products', error: error.message });
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

// ── CUSTOMIZATION REQUEST (Buyer -> Artisan) ──
// This function is triggered when a buyer wants to request a custom version of a product.
export const sendCustomizationRequest = async (req, res) => {
  try {
    console.log('Sending customization request for product:', req.params.id);
    const product = await Product.findById(req.params.id).populate('artisan', 'name _id avatar');
    if (!product) {
      console.warn('Product not found:', req.params.id);
      return res.status(404).json({ message: 'Product not found' });
    }
    console.log('Product artisan:', { id: product.artisan?._id, name: product.artisan?.name });
    if (!product.artisan?._id) {
      console.warn('No artisan assigned to product:', product._id);
      return res.status(400).json({ message: 'This product has no artisan assigned' });
    }

    // 2. Security check: An artisan cannot send a request for their own product.
    if (String(product.artisan._id) === String(req.user._id)) {
      return res.status(400).json({ message: "You can't send a customization request for your own product" });
    }

    // 3. Extract customization details from the request body.
    const { color, size, notes } = req.body;

    // 4. Create a readable summary message for the artisan.
    const parts = [];
    if (color) parts.push(`Colour: ${color}`);
    if (size) parts.push(`Size: ${size}`);
    if (notes) parts.push(`Notes: ${notes}`);
    const message = parts.length ? parts.join(' · ') : 'No specific options provided';

    // 5. Save the customization request to the database.
    const custReq = await CustomizationRequest.create({
      sender: req.user._id,
      senderName: req.user.name,
      senderAvatar: req.user.avatar?.url || '',
      product: product._id,
      productName: product.name,
      artisan: product.artisan._id,
      color: color || '',
      size: size || '',
      notes: notes || '',
      message,
      status: 'pending',
      timestamp: new Date(),
    });

    // 6. Notify the artisan via database and real-time socket.
    try {
      const socketPayload = {
        requestId: custReq._id,
        sender: { id: req.user._id, name: req.user.name, avatar: req.user.avatar?.url || '' },
        product: { id: product._id, name: product.name, image: product.images?.[0]?.url || '' },
        message, color: color || '', size: size || '', notes: notes || '',
        timestamp: custReq.timestamp, status: 'pending',
      };

      await Notification.create({
        user: product.artisan._id,
        userModel: 'User',
        type: 'customization-request',
        title: 'Customisation Request',
        body: `${req.user.name || 'A buyer'} wants to customise ${product.name}`,
        data: socketPayload
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user-${product.artisan._id}`).emit('customization-request', socketPayload);
      }
    } catch (e) {
      console.warn('Notification/Socket failed:', e.message);
    }

    res.status(201).json({
      success: true,
      message: 'Customization request sent to artisan',
      requestId: custReq._id
    });
  } catch (error) {
    console.error('Customization request error:', error);
    res.status(500).json({ message: 'Server error while sending request' });
  }
};

// ── CUSTOMIZATION RESPONSE (Artisan -> Buyer) ──
// This function is triggered when an artisan accepts or declines a customization request.
export const respondToCustomization = async (req, res) => {
  try {
    const { available, buyerId, requestId, customizationPrice } = req.body;
    const newStatus = available ? 'accepted' : 'rejected';
    const priceToSet = available && customizationPrice ? Number(customizationPrice) : 0;

    let custReq = null;
    if (requestId) {
      custReq = await CustomizationRequest.findById(requestId).populate('product');
    }

    if (!custReq && req.params.id) {
      // Fallback: find latest pending for this product/buyer
      custReq = await CustomizationRequest.findOne({
        product: req.params.id,
        sender: buyerId,
        status: 'pending'
      }).sort({ timestamp: -1 }).populate('product');
    }

    if (!custReq) return res.status(404).json({ message: 'Customization request not found' });

    // Update the request
    custReq.status = newStatus;
    custReq.respondedAt = new Date();
    if (priceToSet > 0) custReq.customizationPrice = priceToSet;
    await custReq.save();

    const actualBuyerId = String(buyerId || custReq.sender);
    const product = custReq.product;

    if (!product) {
      console.warn(`Product not found for customization request ${custReq._id}. Using productName from request.`);
    }

    // 4. Prepare the notification payload for the buyer.
    const socketPayload = {
      requestId: String(custReq._id),
      productId: product ? product._id : (custReq.product || ''),
      productName: product ? product.name : (custReq.productName || 'Product'),
      productImage: product && product.images && product.images.length > 0 ? product.images[0].url : '',
      artisan: { id: req.user._id, name: req.user.name },
      available,
      status: newStatus,
      timestamp: new Date(),
      customizationPrice: priceToSet,
      color: custReq.color || '',
      size: custReq.size || '',
      notes: custReq.notes || '',
    };

    try {
      // 5. Store the response as a notification in the buyer's bell.
      await Notification.create({
        user: custReq.sender,
        userModel: 'User',
        type: 'customization-response',
        title: available ? 'Customisation Accepted!' : 'Customisation Unavailable',
        body: available
          ? `Artisan accepted your request for ${product.name}. Price set: Rs. ${customizationPrice}`
          : `Artisan cannot fulfil your customisation for ${product.name}`,
        data: socketPayload
      });

      // 6. Notify the buyer in real-time via socket.
      const io = req.app.get('io');
      if (io) io.to(`user-${actualBuyerId}`).emit('customization-response', socketPayload);
    } catch (e) {
      console.warn('Response notification failed:', e.message);
    }

    res.json({
      success: true,
      available,
      status: newStatus,
      customizationPrice: priceToSet,
      message: available ? 'Customization accepted' : 'Customization unavailable'
    });
  } catch (error) {
    console.error('Customization response error:', error);
    res.status(500).json({ message: 'Server error while responding to request' });
  }
};

// GET /api/products/customization-requests  (artisan)
export const getCustomizationRequests = async (req, res) => {
  try {
    const { status, artisan } = req.query;
    const filter = {};
    if (req.user.role === 'admin') {
      if (artisan) filter.artisan = artisan;
    } else {
      filter.artisan = req.user._id;
    }
    if (status) filter.status = status;

    const requests = await CustomizationRequest.find(filter)
      .populate('sender', 'name avatar')
      .populate('product', 'name images price')
      .sort('-timestamp')
      .limit(100)
      .lean();

    res.json({ success: true, requests });
  } catch (error) {
    console.error('❌ Get customization requests error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load customization requests', error: error.message });
  }
};

// GET /api/products/my-customization-requests  (buyer)
export const getMyCustomizationRequests = async (req, res) => {
  try {
    const requests = await CustomizationRequest.find({ sender: req.user._id })
      .populate({
        path: 'product',
        select: 'name images price artisan category',
        populate: {
          path: 'artisan',
          select: 'name avatar artisanProfile'
        }
      })
      .sort('-timestamp')
      .limit(50)
      .lean();

    res.json({ success: true, requests });
  } catch (error) {
    console.error('❌ Get my customization requests error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load customization requests', error: error.message });
  }
};

export const getCustomizationRequest = async (req, res) => {
  try {
    const request = await CustomizationRequest.findById(req.params.id)
      .populate('sender', 'name avatar')
      .populate('product', 'name images price artisan category')
      .populate('artisan', 'name avatar');

    if (!request) return res.status(404).json({ message: 'Customization request not found' });

    const userId = String(req.user._id);
    const isSender = String(request.sender?._id || request.sender) === userId;
    const isArtisan = String(request.artisan?._id || request.artisan) === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isSender && !isArtisan && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this request' });
    }

    res.json({ success: true, request });
  } catch (error) {
    console.error('Get customization request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/products/categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/products/upload-images ──────────────────────────────
// Temporary image upload endpoint for frontend
export const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images provided' });
    }

    const images = req.files.map(f => ({
      ...fileToImageObj(req, f, 'products'),
      isPrimary: false,
    }));

    res.json({ success: true, images });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload images' });
  }
};