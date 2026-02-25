const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

async function testAuth() {
  try {
    console.log('🧪 Testing Registration...\n');
    
    const regRes = await api.post('/auth/register', {
      name: 'Test User',
      email: 'test@madiocraft.com',
      password: 'testpass123',
      role: 'buyer'
    });
    
    console.log('✅ Registration Success:');
    console.log(JSON.stringify(regRes.data, null, 2));
    console.log('\n---\n');
    
    console.log('🧪 Testing Login with registered credentials...\n');
    
    const loginRes = await api.post('/auth/login', {
      email: 'test@madiocraft.com',
      password: 'testpass123'
    });
    
    console.log('✅ Login Success:');
    console.log(JSON.stringify(loginRes.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
  }
}

testAuth();
