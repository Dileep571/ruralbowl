// Test admin login
const http = require('http');

function testAdminLogin() {
  const data = JSON.stringify({
    username: 'admin',
    password: 'admin123'
  });

  console.log('Testing Admin Login...\n');
  console.log('Request:');
  console.log('  URL: http://localhost:5000/api/admin/login');
  console.log('  Method: POST');
  console.log('  Body:', { username: 'admin', password: 'admin123' });
  console.log('\n');

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
    
    console.log(`Response Status: ${res.statusCode} ${res.statusMessage}`);
    console.log('Response Headers:', res.headers);
    console.log('');
    
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log('Response Body:');
      try {
        const result = JSON.parse(body);
        console.log(JSON.stringify(result, null, 2));
        
        if (result.token) {
          console.log('\n✅ LOGIN SUCCESSFUL!');
          console.log('Admin user:', result.user);
        } else {
          console.log('\n❌ LOGIN FAILED');
          console.log('Message:', result.message);
        }
      } catch (e) {
        console.log(body);
        console.log('\n❌ Invalid JSON response');
      }
    });
  });

  req.on('error', (e) => {
    console.log('❌ Connection Error:', e.message);
    console.log('\nPossible issues:');
    console.log('- Server not running on port 5000');
    console.log('- Check if backend is started: cd server && node src/server.js');
  });

  req.write(data);
  req.end();
}

// Check if server is running first
const checkReq = http.get('http://localhost:5000/api/health', (res) => {
  console.log('✓ Server is running on port 5000\n');
  testAdminLogin();
});

checkReq.on('error', () => {
  console.log('❌ Server is NOT running on port 5000');
  console.log('\nPlease start the backend server:');
  console.log('  cd server');
  console.log('  node src/server.js');
  console.log('\nThen run this test again.');
  process.exit(1);
});

checkReq.setTimeout(2000, () => {
  checkReq.destroy();
  console.log('❌ Server connection timeout');
  process.exit(1);
});
