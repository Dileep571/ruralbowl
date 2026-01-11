// Quick API Test Script
const http = require('http');

async function testAPI(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      const dataStr = JSON.stringify(data);
      options.headers['Content-Length'] = dataStr.length;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: body
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  try {
    console.log('\n✅ Testing APIs\n');
    console.log('='.repeat(60));
    
    // Test Admin Login
    console.log('\n1️⃣  Admin Login');
    const adminResult = await testAPI('/api/admin/login', 'POST', {
      username: 'ruralbowl',
      password: 'Ruralbowl@2025'
    });
    console.log(`Status: ${adminResult.status}`);
    const adminData = JSON.parse(adminResult.body);
    console.log(`Message: ${adminData.message}`);
    console.log(`Token: ${adminData.token ? adminData.token.substring(0, 30) + '...' : 'NOT FOUND'}`);
    
    if (adminData.token) {
      // Test Admin Stats
      console.log('\n2️⃣  Admin Dashboard Stats');
      const stats = await testAPI('/api/admin/dashboard/stats', 'GET', null, adminData.token);
      console.log(`Status: ${stats.status}`);
      if (stats.status === 200) {
        const statsData = JSON.parse(stats.body);
        console.log(`✅ Got stats: Users=${statsData.totalUsers}, Orders=${statsData.totalOrders}`);
      } else {
        console.log(`Body: ${stats.body}`);
      }
    }
    
    // Test User Login (should fail - no user)
    console.log('\n3️⃣  User Login (should fail)');
    const userResult = await testAPI('/api/auth/login', 'POST', {
      email: 'test@gmail.com',
      password: 'wrongpassword'
    });
    console.log(`Status: ${userResult.status}`);
    console.log(`Response: ${userResult.body}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Tests complete\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
  
  process.exit(0);
}

runTests();
