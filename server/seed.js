const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Product.deleteMany({});
    await User.deleteMany({ role: 'artisan' }); // Clear only artisans to avoid deleting admins
    
    // Create artisans
    console.log('👨‍🎨 Creating artisans...');
    
    // Create sample artisans
    const sampleArtisans = [
      {
        name: 'Priya Sharma',
        email: 'priya@artisant.com',
        password: 'priya123',
        role: 'artisan',
        isVerified: true,
        artisanProfile: {
          businessName: 'Clay Creations',
          description: 'Specializing in traditional Indian pottery with modern designs',
          specialties: ['Pottery', 'Ceramics'],
          yearsOfExperience: 8
        }
      },
      {
        name: 'Raj Kumar',
        email: 'raj@example.com',
        password: 'password123',
        role: 'artisan',
        isVerified: true,
        artisanProfile: {
          businessName: 'Wood Wonders',
          description: 'Master craftsman creating intricate wooden carvings',
          specialties: ['Woodwork', 'Carvings'],
          yearsOfExperience: 12
        }
      },
      {
        name: 'Ananya Patel',
        email: 'ananya@example.com',
        password: 'password123',
        role: 'artisan',
        isVerified: true,
        artisanProfile: {
          businessName: 'Silver Symphony',
          description: 'Handcrafted silver jewelry with traditional motifs',
          specialties: ['Jewelry', 'Silver Work'],
          yearsOfExperience: 6
        }
      },
      {
        name: 'Suresh Reddy',
        email: 'suresh@example.com',
        password: 'password123',
        role: 'artisan',
        isVerified: true,
        artisanProfile: {
          businessName: 'Metal Masters',
          description: 'Expert in brass and copper metal crafting',
          specialties: ['Metalwork', 'Brass'],
          yearsOfExperience: 15
        }
      },
      {
        name: 'Meera Singh',
        email: 'meera@example.com',
        password: 'password123',
        role: 'artisan',
        isVerified: true,
        artisanProfile: {
          businessName: 'Textile Tales',
          description: 'Handloom textiles and traditional weaving',
          specialties: ['Textiles', 'Weaving'],
          yearsOfExperience: 20
        }
      },

      
    ];
    
    const artisans = await User.create(sampleArtisans);
    console.log(`✅ Created ${artisans.length} artisans`);

    // Check if artisans were created
    if (!artisans || artisans.length === 0) {
      throw new Error('No artisans were created');
    }

    // Sample products data
    const products = [
      // Pottery Products - Priya Sharma (index 0)
      {
        artisan: artisans[0]._id,
        name: 'Handcrafted Ceramic Vase',
        description: 'Beautiful handcrafted ceramic vase with traditional Indian motifs.',
        price: 1899,
        category: 'pottery',
        stock: 15,
        isCustomizable: true,
        isActive: true,
        materials: ['Ceramic', 'Clay', 'Natural Glaze'],
        tags: ['vase', 'ceramic', 'home decor', 'traditional'],
        images: [{
          url: 'https://images.unsplash.com/photo-1565193564382-fb8bb0b9e5b4?w=800',
          isPrimary: true
        }]
      },
      {
        artisan: artisans[0]._id,
        name: 'Traditional Clay Bowl Set',
        description: 'Set of 4 handmade clay bowls with natural finish.',
        price: 2499,
        category: 'pottery',
        stock: 8,
        isCustomizable: true,
        isActive: true,
        materials: ['Clay', 'Natural Dyes'],
        tags: ['bowl set', 'clay', 'kitchen', 'traditional'],
        images: [{
          url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800',
          isPrimary: true
        }]
      },

      // Woodwork Products - Raj Kumar (index 1)
      {
        artisan: artisans[1]._id,
        name: 'Hand-carved Wooden Elephant',
        description: 'Intricately carved wooden elephant figurine.',
        price: 3499,
        category: 'woodwork',
        stock: 12,
        isCustomizable: true,
        isActive: true,
        materials: ['Teak Wood', 'Natural Polish'],
        tags: ['figurine', 'elephant', 'carving', 'decor'],
        images: [{
          url: 'https://images.unsplash.com/photo-1565193564382-fb8bb0b9e5b4?w=800',
          isPrimary: true
        }]
      },
      {
        artisan: artisans[1]._id,
        name: 'Decorative Wall Panel',
        description: 'Hand-carved wooden wall panel with floral patterns.',
        price: 5499,
        category: 'woodwork',
        stock: 5,
        isCustomizable: true,
        isActive: true,
        materials: ['Rosewood', 'Natural Finish'],
        tags: ['wall art', 'panel', 'carving', 'decor'],
        images: [{
          url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800',
          isPrimary: true
        }]
      },

      // Jewelry Products - Ananya Patel (index 2)
      {
        artisan: artisans[2]._id,
        name: 'Silver Filigree Earrings',
        description: 'Handcrafted silver filigree earrings with traditional design.',
        price: 2450,
        category: 'jewelry',
        stock: 25,
        isCustomizable: true,
        isActive: true,
        materials: ['Silver (92.5%)'],
        tags: ['earrings', 'silver', 'filigree', 'traditional'],
        images: [{
          url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
          isPrimary: true
        }]
      },
      {
        artisan: artisans[2]._id,
        name: 'Gold Plated Necklace Set',
        description: 'Elegant gold-plated necklace set with matching earrings.',
        price: 5999,
        category: 'jewelry',
        stock: 10,
        isCustomizable: false,
        isActive: true,
        materials: ['Gold Plated', 'Copper Base'],
        tags: ['necklace', 'set', 'gold', 'bridal'],
        images: [{
          url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
          isPrimary: true
        }]
      },

      // Metalwork Products - Suresh Reddy (index 3)
      {
        artisan: artisans[3]._id,
        name: 'Brass Decorative Lamp',
        description: 'Handcrafted brass lamp with intricate perforations.',
        price: 4299,
        category: 'metalwork',
        stock: 7,
        isCustomizable: true,
        isActive: true,
        materials: ['Brass'],
        tags: ['lamp', 'brass', 'lighting', 'decor'],
        images: [{
          url: 'https://images.unsplash.com/photo-1565193564382-fb8bb0b9e5b4?w=800',
          isPrimary: true
        }]
      },
      {
        artisan: artisans[3]._id,
        name: 'Copper Water Pitcher',
        description: 'Traditional copper pitcher for water storage.',
        price: 1899,
        category: 'metalwork',
        stock: 20,
        isCustomizable: false,
        isActive: true,
        materials: ['Copper'],
        tags: ['pitcher', 'copper', 'kitchen', 'traditional'],
        images: [{
          url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800',
          isPrimary: true
        }]
      },

      // Textiles Products - Meera Singh (index 4)
      {
        artisan: artisans[4]._id,
        name: 'Handwoven Silk Saree',
        description: 'Authentic Banarasi silk saree with gold zari work.',
        price: 12999,
        category: 'textiles',
        stock: 5,
        isCustomizable: true,
        isActive: true,
        materials: ['Silk', 'Zari'],
        tags: ['saree', 'silk', 'banarasi', 'traditional'],
        images: [{
          url: 'https://images.unsplash.com/photo-1565193564382-fb8bb0b9e5b4?w=800',
          isPrimary: true
        }]
      },
      {
        artisan: artisans[4]._id,
        name: 'Cotton Kantha Stitch Throw',
        description: 'Hand-stitched Kantha throw made from soft cotton.',
        price: 3999,
        category: 'textiles',
        stock: 15,
        isCustomizable: true,
        isActive: true,
        materials: ['Cotton', 'Thread'],
        tags: ['throw', 'kantha', 'blanket', 'home'],
        images: [{
          url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800',
          isPrimary: true
        }]
      }
    ];

    // Insert products
    console.log(`📦 Creating ${products.length} sample products...`);
    await Product.insertMany(products);
    
    console.log('✅ Products seeded successfully');
    
    // Log statistics
    const totalProducts = await Product.countDocuments();
    const byCategory = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    console.log('\n📊 Database Statistics:');
    console.log(`Total Products: ${totalProducts}`);
    console.log('Products by category:');
    byCategory.forEach(cat => {
      console.log(`  - ${cat._id}: ${cat.count}`);
    });
    
    console.log('\n✅ Database seeding completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();