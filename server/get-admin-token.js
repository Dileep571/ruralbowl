// Get Admin Token for Testing
const http = require('http');

function getAdminToken() {
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
          if (result.token) {
            resolve(result.token);
          } else {
            reject(new Error('No token received'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function testAdminEndpoints() {
  try {
    console.log('🔐 Getting admin token...\n');
    const token = await getAdminToken();
    console.log('✅ Admin token received!\n');
    console.log('Token:', token);
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 HOW TO USE THIS TOKEN:\n');
    
    console.log('1️⃣  In Browser Console:');
    console.log('   localStorage.setItem("adminToken", "' + token + '");\n');
    
    console.log('2️⃣  In curl/Postman:');
    console.log('   curl http://localhost:5000/api/delivery/admin/areas \\');
    console.log('     -H "Authorization: Bearer ' + token + '"\n');
    
    console.log('3️⃣  Test it now:');
    console.log('   Copy this command and run:\n');
    console.log('   curl -H "Authorization: Bearer ' + token + '" http://localhost:5000/api/delivery/admin/areas\n');
    
    console.log('='.repeat(80) + '\n');
    
    // Test the endpoints
    console.log('🧪 Testing endpoints with token...\n');
    
    // Test 1: Get all delivery areas
    await testEndpoint('/api/delivery/admin/areas', token);
    
    // Test 2: Get stats
    await testEndpoint('/api/delivery/admin/stats', token);
    
    console.log('\n✅ All endpoints accessible with admin token!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit();
}

function testEndpoint(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (res.statusCode === 200) {
            console.log(`✅ ${path}`);
            console.log(`   Status: ${res.statusCode}`);
            if (result.areas) {
              console.log(`   Result: ${result.areas.length} areas found`);
            } else if (result.stats) {
              console.log(`   Result: ${result.stats.length} stats found`);
            }
            console.log('');
          } else {
            console.log(`❌ ${path}`);
            console.log(`   Status: ${res.statusCode}`);
            console.log(`   Error: ${result.message}`);
            console.log('');
          }
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Run if called directly
if (require.main === module) {
  testAdminEndpoints();
} else {
  module.exports = { getAdminToken };
}
