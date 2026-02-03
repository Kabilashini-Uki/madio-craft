const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Artisan
exports.createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      artisan: req.user.id
    };

    // Handle images if uploaded
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => ({
        public_id: file.public_id,
        url: file.path
      }));
    }

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all products with filters
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      artisan,
      search,
      page = 1,
      limit = 12,
      sort = '-createdAt'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (artisan) filter.artisan = artisan;
    
    // Search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const products = await Product.find(filter)
      .populate('artisan', 'name avatar artisanProfile.businessName')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('artisan', 'name avatar artisanProfile artisanProfile.ratings')
      .populate('ratings.reviews.user', 'name avatar');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Artisan
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is the artisan
    if (product.artisan.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Handle images if uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        public_id: file.public_id,
        url: file.path
      }));
      product.images = [...product.images, ...newImages];
    }

    // Update other fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'images') {
        product[key] = req.body[key];
      }
    });

    await product.save();

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Artisan
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is the artisan
    if (product.artisan.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    product.isActive = false;
    await product.save();

    res.json({
      success: true,
      message: 'Product deactivated successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add review to product
// @route   POST /api/products/:id/reviews
// @access  Private/Buyer
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user has purchased this product
    const hasPurchased = true; // Implement purchase check logic

    if (!hasPurchased) {
      return res.status(400).json({ message: 'You must purchase this product to review it' });
    }

    // Check if already reviewed
    const alreadyReviewed = product.ratings.reviews.find(
      review => review.user.toString() === req.user.id
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Product already reviewed' });
    }

    const review = {
      user: req.user.id,
      rating: Number(rating),
      comment
    };

    product.ratings.reviews.push(review);
    product.ratings.count = product.ratings.reviews.length;
    product.ratings.average = 
      product.ratings.reviews.reduce((acc, item) => item.rating + acc, 0) / 
      product.ratings.reviews.length;

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};