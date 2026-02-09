const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Create test artisan
    const artisan = await User.create({
      name: 'Test Artisan',
      email: 'artisan@test.com',
      password: 'password123',
      role: 'artisan',
      artisanProfile: {
        businessName: 'Test Crafts',
        description: 'A test artisan account',
        specialties: ['Pottery', 'Jewelry']
      }
    });
    
    // Create test product
    await Product.create({
      artisan: artisan._id,
      name: 'Handmade Ceramic Mug',
      description: 'Beautiful handmade ceramic mug',
      price: 1200,
      category: 'pottery',
      stock: 10,
      isCustomizable: true
    });
    
    console.log('✅ Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();