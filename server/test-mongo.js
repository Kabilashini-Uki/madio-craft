const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB Atlas connection...');
console.log('Connection string:', process.env.MONGO_URI ? 'Set' : 'Not set');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB Atlas connected successfully!');
  console.log('Database:', mongoose.connection.name);
  console.log('Host:', mongoose.connection.host);
  process.exit(0);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('\nTroubleshooting steps:');
  console.log('1. Check your MongoDB Atlas connection string in .env file');
  console.log('2. Make sure your IP is whitelisted in MongoDB Atlas');
  console.log('3. Check your username and password');
  console.log('4. Verify your cluster is running in MongoDB Atlas');
  process.exit(1);
});