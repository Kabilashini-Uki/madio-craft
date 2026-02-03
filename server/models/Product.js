const mongoose = require('mongoose');

const customizationOptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'color', 'size', 'material', 'upload'],
    required: true
  },
  options: [{
    type: String
  }],
  required: {
    type: Boolean,
    default: false
  },
  priceAdjustment: {
    type: Number,
    default: 0
  }
});

const productSchema = new mongoose.Schema({
  artisan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['jewelry', 'pottery', 'textiles', 'woodwork', 'metalwork', 'glass', 'other']
  },
  images: [{
    public_id: {
      type: String,
      default: ''
    },
    url: {
      type: String,
      default: ''
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  customizationOptions: [customizationOptionSchema],
  materials: [{
    type: String
  }],
  dimensions: {
    height: {
      type: Number,
      default: 0
    },
    width: {
      type: Number,
      default: 0
    },
    depth: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      default: 'cm'
    }
  },
  stock: {
    type: Number,
    default: 1
  },
  isCustomizable: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  ratings: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    },
    reviews: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        default: ''
      },
      images: [{
        public_id: {
          type: String,
          default: ''
        },
        url: {
          type: String,
          default: ''
        }
      }],
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  tags: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);