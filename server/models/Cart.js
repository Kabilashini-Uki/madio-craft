const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  customization: {
    options: [{
      name: {
        type: String,
        default: ''
      },
      value: {
        type: String,
        default: ''
      },
      priceAdjustment: {
        type: Number,
        default: 0
      }
    }],
    notes: {
      type: String,
      default: ''
    },
    referenceImages: [{
      public_id: {
        type: String,
        default: ''
      },
      url: {
        type: String,
        default: ''
      }
    }],
    dimensions: {
      width: {
        type: Number,
        default: 0
      },
      height: {
        type: Number,
        default: 0
      },
      depth: {
        type: Number,
        default: 0
      }
    },
    color: {
      type: String,
      default: ''
    },
    material: {
      type: String,
      default: ''
    },
    deadline: {
      type: Date,
      default: null
    }
  },
  price: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  coupon: {
    code: {
      type: String,
      default: null
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: null
    },
    value: {
      type: Number,
      default: 0
    },
    appliedAt: {
      type: Date,
      default: null
    }
  },
  subtotal: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  shipping: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Update totals before save
cartSchema.pre('save', function(next) {
  this.subtotal = this.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  this.tax = this.subtotal * 0.18; // 18% GST
  this.shipping = this.subtotal > 999 ? 0 : 99;
  
  // Calculate discount based on coupon type
  let discount = 0;
  if (this.coupon && this.coupon.value) {
    if (this.coupon.type === 'percentage') {
      discount = this.subtotal * (this.coupon.value / 100);
    } else if (this.coupon.type === 'fixed') {
      discount = this.coupon.value;
    }
  }
  this.discount = discount;
  
  this.total = this.subtotal + this.tax + this.shipping - this.discount;
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Cart', cartSchema);
