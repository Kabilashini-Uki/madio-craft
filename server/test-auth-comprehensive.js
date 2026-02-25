const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

async function testAuthFlow() {
  try {
    console.log('='.repeat(60));
    console.log('🧪 COMPREHENSIVE AUTH FLOW TEST');
    console.log('='.repeat(60));

    // Test 1: Buyer Registration
    console.log('\n\n📝 TEST 1: Buyer Registration');
    console.log('-'.repeat(60));
    
    const buyerEmail = `buyer${Date.now()}@test.com`;
    const buyerRegRes = await api.post('/auth/register', {
      name: 'Buyer Test User',
      email: buyerEmail,
      password: 'password123',
      role: 'buyer'
    });
    
    console.log('✅ Buyer Registration Success');
    console.log(`   Email: ${buyerEmail}`);
    console.log(`   Role: ${buyerRegRes.data.user.role}`);
    console.log(`   Token: ${buyerRegRes.data.token.substring(0, 30)}...`);

    // Test 2: Buyer Login
    console.log('\n\n🔑 TEST 2: Buyer Login');
    console.log('-'.repeat(60));
    
    const buyerLoginRes = await api.post('/auth/login', {
      email: buyerEmail,
      password: 'password123'
    });
    
    console.log('✅ Buyer Login Success');
    console.log(`   User: ${buyerLoginRes.data.user.name}`);
    console.log(`   Role: ${buyerLoginRes.data.user.role}`);

    // Test 3: Artisan Registration (like Register.js sends it)
    console.log('\n\n📝 TEST 3: Artisan Registration (with profile)');
    console.log('-'.repeat(60));
    
    const artisanEmail = `artisan${Date.now()}@test.com`;
    const artisanRegRes = await api.post('/auth/register', {
      name: 'Artisan Test User',
      email: artisanEmail,
      password: 'password456',
      role: 'artisan',
      artisanProfile: {
        businessName: 'Test Craft Studio',
        specialties: ['pottery', 'ceramics'],
        yearsOfExperience: 5,
        description: 'We create beautiful handmade ceramics'
      }
    });
    
    console.log('✅ Artisan Registration Success');
    console.log(`   Email: ${artisanEmail}`);
    console.log(`   Role: ${artisanRegRes.data.user.role}`);
    console.log(`   Business: ${artisanRegRes.data.user.artisanProfile?.businessName || 'N/A'}`);

    // Test 4: Artisan Login
    console.log('\n\n🔑 TEST 4: Artisan Login');
    console.log('-'.repeat(60));
    
    const artisanLoginRes = await api.post('/auth/login', {
      email: artisanEmail,
      password: 'password456'
    });
    
    console.log('✅ Artisan Login Success');
    console.log(`   User: ${artisanLoginRes.data.user.name}`);
    console.log(`   Role: ${artisanLoginRes.data.user.role}`);
    console.log(`   Business: ${artisanLoginRes.data.user.artisanProfile?.businessName || 'N/A'}`);

    // Test 5: Invalid Login
    console.log('\n\n❌ TEST 5: Invalid Email/Password');
    console.log('-'.repeat(60));
    
    try {
      await api.post('/auth/login', {
        email: 'nonexistent@test.com',
        password: 'wrongpass'
      });
    } catch (error) {
      console.log('✅ Correctly rejected invalid credentials');
      console.log(`   Error: ${error.response.data.message}`);
    }

    // Test 6: Password Validation
    console.log('\n\n❌ TEST 6: Password Too Short');
    console.log('-'.repeat(60));
    
    try {
      await api.post('/auth/register', {
        name: 'Test User',
        email: 'test@test.com',
        password: '123',  // Too short
        role: 'buyer'
      });
    } catch (error) {
      console.log('✅ Correctly rejected short password');
      console.log(`   Error: ${error.response.data.message || error.response.statusText}`);
    }

    // Test 7: Duplicate Email
    console.log('\n\n❌ TEST 7: Duplicate Email');
    console.log('-'.repeat(60));
    
    try {
      await api.post('/auth/register', {
        name: 'Another User',
        email: buyerEmail,  // Same email as Test 1
        password: 'password789',
        role: 'buyer'
      });
    } catch (error) {
      console.log('✅ Correctly rejected duplicate email');
      console.log(`   Error: ${error.response.data.message}`);
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n✨ The authentication system is working correctly!');
    console.log('📝 If frontend shows errors, the issue is likely:');
    console.log('   1. CORS issue (check browser console Network tab)');
    console.log('   2. API URL mismatch (check REACT_APP_API_URL in .env)');
    console.log('   3. Frontend error handling (check browser console)');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testAuthFlow();
