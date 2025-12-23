const BASE_URL = 'http://localhost:5000/api';

async function testAllEndpoints() {
  console.log('🧪 Testing All API Endpoints\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test PUBLIC endpoints (should work without auth)
  console.log('🌍 PUBLIC ENDPOINTS (No Auth Required):\n');
  
  const publicTests = [
    { name: 'Health Check', url: '/health', method: 'GET' },
    { name: 'Products List', url: '/products', method: 'GET' },
    { name: 'Categories', url: '/products/categories', method: 'GET' },
    { name: 'Single Product', url: '/products/1', method: 'GET' },
    { name: 'Subscription Plans', url: '/subscriptions/plans', method: 'GET' },
  ];

  for (const test of publicTests) {
    try {
      const response = await fetch(`${BASE_URL}${test.url}`);
      const status = response.status;
      
      if (status === 200) {
        const data = await response.json();
        console.log(`✅ ${test.name.padEnd(25)} → ${status} OK (${Array.isArray(data) ? data.length + ' items' : typeof data})`);
      } else {
        console.log(`❌ ${test.name.padEnd(25)} → ${status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name.padEnd(25)} → ERROR: ${error.message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🔒 PROTECTED ENDPOINTS (Auth Required):\n');

  // First, login to get token
  let token = null;
  try {
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@gmail.com',
        password: 'test123'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      token = loginData.token;
      console.log(`🔑 Login successful! Token obtained.\n`);
    } else {
      console.log(`❌ Login failed. Cannot test protected endpoints.\n`);
      return;
    }
  } catch (error) {
    console.log(`❌ Login error: ${error.message}\n`);
    return;
  }

  // Test PROTECTED endpoints (require auth)
  const protectedTests = [
    { name: 'Cart (Get)', url: '/cart', method: 'GET' },
    { name: 'Orders (List)', url: '/orders', method: 'GET' },
    { name: 'My Subscriptions', url: '/subscriptions', method: 'GET' },
    { name: 'Wallet Balance', url: '/wallet/balance', method: 'GET' },
    { name: 'Dashboard Stats', url: '/dashboard/stats', method: 'GET' },
    { name: 'Wishlist', url: '/wishlist', method: 'GET' },
  ];

  for (const test of protectedTests) {
    try {
      const response = await fetch(`${BASE_URL}${test.url}`, {
        method: test.method,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const status = response.status;
      
      if (status === 200) {
        const data = await response.json();
        const info = Array.isArray(data) ? `${data.length} items` : 
                     data.items ? `${data.items.length} items` : 
                     typeof data;
        console.log(`✅ ${test.name.padEnd(25)} → ${status} OK (${info})`);
      } else if (status === 401) {
        console.log(`❌ ${test.name.padEnd(25)} → ${status} UNAUTHORIZED ⚠️`);
      } else {
        const errorData = await response.json();
        console.log(`⚠️  ${test.name.padEnd(25)} → ${status} (${errorData.message || response.statusText})`);
      }
    } catch (error) {
      console.log(`❌ ${test.name.padEnd(25)} → ERROR: ${error.message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 SUMMARY:\n');
  console.log('PUBLIC endpoints: Should work without login');
  console.log('PROTECTED endpoints: Require login token\n');
  console.log('💡 To fix 401 errors:');
  console.log('   1. Login first: POST /api/auth/login');
  console.log('   2. Get token from response');
  console.log('   3. Add header: Authorization: Bearer <token>');
  console.log('   4. Token expires in 7 days\n');
}

testAllEndpoints();
