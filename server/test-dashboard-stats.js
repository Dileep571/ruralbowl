const http = require('http');

async function testAdminLogin() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      username: 'ruralbowl',
      password: 'Ruralbowl@2025'
    });

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result.token);
        } catch (e) {
          reject(new Error('Failed to parse response'));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function testDashboardStats(token) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/dashboard/stats',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function run() {
  try {
    console.log('🧪 Testing Dashboard Stats API\n');
    console.log('='.repeat(60));
    
    console.log('\n1️⃣ Admin Login...');
    const token = await testAdminLogin();
    
    if (!token) {
      console.log('❌ Failed: No token received');
      process.exit(1);
    }
    
    console.log('✅ Login successful');
    console.log(`Token: ${token.substring(0, 30)}...`);
    
    console.log('\n2️⃣ Getting Dashboard Stats...');
    const result = await testDashboardStats(token);
    
    console.log(`Status: ${result.status}`);
    
    if (result.status === 200) {
      console.log('\n✅ Dashboard stats retrieved successfully!\n');
      console.log('Stats:');
      console.log(JSON.stringify(result.body, null, 2));
    } else {
      console.log('\n❌ Failed to get dashboard stats');
      console.log('Response:', result.body);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test complete\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

run();
