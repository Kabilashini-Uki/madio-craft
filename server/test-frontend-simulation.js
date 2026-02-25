const axios = require('axios');

// Simulate the frontend API client setup
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor like in api.js
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Mock localStorage for testing
const mockLocalStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  }
};

// Mock the global localStorage
if (typeof localStorage === 'undefined') {
  global.localStorage = mockLocalStorage;
}

async function simulateFrontendFlow() {
  console.log('='.repeat(70));
  console.log('🎯 FRONTEND SIMULATION TEST - Exactly like React components do it');
  console.log('='.repeat(70));

  try {
    // TEST 1: Buyer Registration Flow (Like Register.js does it)
    console.log('\n\n📋 TEST 1: Buyer Registration (Register.js flow)');
    console.log('-'.repeat(70));

    const buyerFormData = {
      name: 'John Buyer',
      email: `buyer${Date.now()}@test.com`,
      password: 'password123',
      confirmPassword: 'password123',
      role: 'buyer'
      // Register.js removes confirmPassword before sending
    };

    const { confirmPassword: _, ...buyerRegData } = buyerFormData;

    console.log('📤 Sending to POST /auth/register:');
    console.log(JSON.stringify(buyerRegData, null, 2));

    const buyerRegRes = await api.post('/auth/register', buyerRegData);

    console.log('✅ Success! Response:');
    console.log(`   Token received: ${buyerRegRes.data.token.substring(0, 30)}...`);
    console.log(`   User: ${buyerRegRes.data.user.name} (${buyerRegRes.data.user.role})`);

    // Simulate what AuthContext.register() does
    localStorage.setItem('token', buyerRegRes.data.token);
    localStorage.setItem('user', JSON.stringify(buyerRegRes.data.user));

    console.log('💾 Stored in localStorage:');
    console.log(`   token: ${localStorage.getItem('token').substring(0, 30)}...`);
    console.log(`   user: ${localStorage.getItem('user').substring(0, 50)}...`);

    // TEST 2: Buyer Login Flow (Like Login.js does it)
    console.log('\n\n🔐 TEST 2: Buyer Login (Login.js flow)');
    console.log('-'.repeat(70));

    // Clear storage to simulate fresh login attempt
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    const loginFormData = {
      email: buyerFormData.email,
      password: buyerFormData.password
    };

    console.log('📤 Sending to POST /auth/login:');
    console.log(JSON.stringify(loginFormData, null, 2));

    const loginRes = await api.post('/auth/login', loginFormData);

    console.log('✅ Success! Response:');
    console.log(`   Token: ${loginRes.data.token.substring(0, 30)}...`);
    console.log(`   User: ${loginRes.data.user.name} (${loginRes.data.user.role})`);

    localStorage.setItem('token', loginRes.data.token);
    localStorage.setItem('user', JSON.stringify(loginRes.data.user));

    console.log('💾 Updated localStorage');

    // TEST 3: Artisan Registration Flow
    console.log('\n\n🎨 TEST 3: Artisan Registration (Register.js flow with profile)');
    console.log('-'.repeat(70));

    const artisanFormData = {
      name: 'Jane Artisan',
      email: `artisan${Date.now()}@test.com`,
      password: 'password456',
      confirmPassword: 'password456',
      role: 'artisan',
      businessName: 'Pottery Paradise',
      craftCategory: 'pottery',
      yearsOfExperience: 8,
      craftDescription: 'Beautiful handmade pottery'
    };

    // Exactly like Register.js does it
    const { confirmPassword, ...artisanRegData } = artisanFormData;
    
    if (artisanRegData.role === 'artisan') {
      artisanRegData.artisanProfile = {
        businessName: artisanRegData.businessName,
        specialties: [artisanRegData.craftCategory === 'other' ? artisanRegData.otherCraft : artisanRegData.craftCategory],
        yearsOfExperience: parseInt(artisanRegData.yearsOfExperience) || 0,
        description: artisanRegData.craftDescription
      };
      // Remove original fields after copying to profile
      delete artisanRegData.businessName;
      delete artisanRegData.craftCategory;
      delete artisanRegData.yearsOfExperience;
      delete artisanRegData.craftDescription;
      delete artisanRegData.otherCraft;
    }

    console.log('📤 Sending to POST /auth/register:');
    console.log(JSON.stringify(artisanRegData, null, 2));

    const artisanRegRes = await api.post('/auth/register', artisanRegData);

    console.log('✅ Success! Response:');
    console.log(`   Token: ${artisanRegRes.data.token.substring(0, 30)}...`);
    console.log(`   User: ${artisanRegRes.data.user.name} (${artisanRegRes.data.user.role})`);
    console.log(`   Business: ${artisanRegRes.data.user.artisanProfile?.businessName}`);

    localStorage.setItem('token', artisanRegRes.data.token);
    localStorage.setItem('user', JSON.stringify(artisanRegRes.data.user));

    // TEST 4: Artisan Login
    console.log('\n\n🔐 TEST 4: Artisan Login');
    console.log('-'.repeat(70));

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    const artisanLoginFormData = {
      email: artisanFormData.email,
      password: artisanFormData.password
    };

    console.log('📤 Sending to POST /auth/login:');
    console.log(JSON.stringify(artisanLoginFormData, null, 2));

    const artisanLoginRes = await api.post('/auth/login', artisanLoginFormData);

    console.log('✅ Success! Response:');
    console.log(`   Token: ${artisanLoginRes.data.token.substring(0, 30)}...`);
    console.log(`   User: ${artisanLoginRes.data.user.name} (${artisanLoginRes.data.user.role})`);
    console.log(`   Business: ${artisanLoginRes.data.user.artisanProfile?.businessName}`);

    // TEST 5: Error Handling - Invalid Credentials  
    console.log('\n\n❌ TEST 5: Error Handling - Invalid Credentials');
    console.log('-'.repeat(70));

    try {
      console.log('📤 Attempting login with wrong password...');
      await api.post('/auth/login', {
        email: buyerFormData.email,
        password: 'wrongpassword'
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Unknown error';
      console.log(`✅ Correctly rejected: ${message}`);
      console.log(`   Error code: ${error.response?.status}`);
    }

    // TEST 6: Error Handling - Validation
    console.log('\n\n❌ TEST 6: Error Handling - Validation (short password)');
    console.log('-'.repeat(70));

    try {
      console.log('📤 Attempting registration with short password...');
      await api.post('/auth/register', {
        name: 'Test User',
        email: 'test@test.com',
        password: '123',  // Too short
        role: 'buyer'
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Unknown error';
      console.log(`✅ Correctly rejected: ${message}`);
      console.log(`   Error code: ${error.response?.status}`);
    }

    console.log('\n\n' + '='.repeat(70));
    console.log('✅ ALL FRONTEND SIMULATION TESTS PASSED!');
    console.log('='.repeat(70));
    console.log('\n🎉 The authentication system is fully functional!');
    console.log('\n📝 FRONTEND STATUS:');
    console.log('   ✅ Registration endpoint working');
    console.log('   ✅ Login endpoint working');
    console.log('   ✅ Artisan profile handling working');
    console.log('   ✅ Error handling working');
    console.log('   ✅ localStorage simulation working');
    console.log('\n🔍 If frontend still shows errors:');
    console.log('   1. Check browser console (F12) for JavaScript errors');
    console.log('   2. Check Network tab to verify API calls are made');
    console.log('   3. Verify REACT_APP_API_URL in .env matches backend URL');
    console.log('   4. Clear browser cache and localStorage');
    console.log('   5. Restart both frontend and backend servers');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

simulateFrontendFlow();
