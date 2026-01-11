const http = require('http');

// Test function
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
        try {
          const result = {
            status: res.statusCode,
            body: body
          };
          resolve(result);
        } catch (e) {
          resolve({ status: res.statusCode, body: body, error: e.message });
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request error: ${error.message}`));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing RuralBowl APIs\n');
  console.log('='.repeat(80));
  
  // Test 1: Health check
  console.log('\n1️⃣ Testing Health Check');
  try {
    const health = await testAPI('/api/health');
    console.log(`   Status: ${health.status}`);
    console.log(`   Response: ${health.body}`);
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }
  
  // Test 2: Admin Login
  console.log('\n2️⃣ Testing Admin Login');
  let adminToken = null;
  try {
    const admin = await testAPI('/api/admin/login', 'POST', {
      username: 'ruralbowl',
      password: 'Ruralbowl@2025'
    });
    console.log(`   Status: ${admin.status}`);
    console.log(`   Response: ${admin.body.substring(0, 200)}...`);
    
    if (admin.status === 200) {
      const parsed = JSON.parse(admin.body);
      adminToken = parsed.token;
      console.log(`   ✅ Token received: ${adminToken.substring(0, 20)}...`);
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }
  
  // Test 3: User Login (should fail with invalid credentials)
  console.log('\n3️⃣ Testing User Login (with invalid credentials)');
  try {
    const user = await testAPI('/api/auth/login', 'POST', {
      email: 'test@test.com',
      password: 'wrongpass'
    });
    console.log(`   Status: ${user.status}`);
    console.log(`   Response: ${user.body}`);
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }
  
  // Test 4: Check if users exist
  console.log('\n4️⃣ Checking database for users');
  try {
    const db = require('./src/config/database');
    const result = await db.query('SELECT id, email, name, role FROM users LIMIT 5');
    console.log(`   Found ${result.rows.length} users:`);
    result.rows.forEach(u => {
      console.log(`      - ${u.email} (${u.role}) [ID: ${u.id}]`);
    });
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }
  
  // Test 5: Admin Stats (if we have token)
  if (adminToken) {
    console.log('\n5️⃣ Testing Admin Stats');
    try {
      const stats = await testAPI('/api/admin/dashboard/stats', 'GET', null, adminToken);
      console.log(`   Status: ${stats.status}`);
      console.log(`   Response: ${stats.body.substring(0, 500)}`);
    } catch (e) {
      console.log(`   ❌ Error: ${e.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Tests complete\n');
  process.exit(0);
}

runTests();
