// Enhanced test with better error logging
const http = require('http');

let adminToken = '';

function loginAdmin() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: 'admin@ruralbowl.com',
      password: 'admin123'
    });

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        const result = JSON.parse(body);
        if (result.token) {
          adminToken = result.token;
          console.log('✓ Admin logged in\n');
          resolve(result);
        } else {
          reject(new Error('No token'));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function testUploadEndpoint() {
  return new Promise((resolve, reject) => {
    // Test with actual multipart form data using Buffer
    const boundary = '----Boundary' + Date.now();
    const nl = '\r\n';
    
    // Simple 1x1 red pixel PNG
    const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64');
    
    const bodyParts = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="image"; filename="test.png"',
      'Content-Type: image/png',
      '',
      ''
    ].join(nl);
    
    const endBoundary = nl + `--${boundary}--` + nl;
    
    const bodyBuffer = Buffer.concat([
      Buffer.from(bodyParts, 'utf8'),
      pngData,
      Buffer.from(endBoundary, 'utf8')
    ]);

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/upload/image',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuffer.length
      }
    }, (res) => {
      let body = '';
      
      console.log(`Response Status: ${res.statusCode}`);
      console.log('Response Headers:', res.headers);
      
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('\nResponse Body:', body);
        
        try {
          const result = JSON.parse(body);
          
          if (result.success) {
            console.log('\n✅ SUCCESS!');
            console.log('Image URL:', result.image.url);
            console.log('Public ID:', result.image.publicId);
            resolve(result);
          } else {
            console.log('\n❌ FAILED:', result.message);
            if (result.error) console.log('Error:', result.error);
            reject(new Error(result.message));
          }
        } catch (e) {
          console.log('\n❌ JSON Parse Error:', e.message);
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.log('❌ Request Error:', e.message);
      reject(e);
    });

    console.log('Sending multipart form data...');
    console.log('Boundary:', boundary);
    console.log('Content Length:', bodyBuffer.length);
    
    req.write(bodyBuffer);
    req.end();
  });
}

(async () => {
  console.log('═══════════════════════════════════════════');
  console.log('  Cloudinary Upload Test (Detailed)');
  console.log('═══════════════════════════════════════════\n');

  try {
    console.log('Step 1: Login as Admin');
    await loginAdmin();

    console.log('Step 2: Upload Test Image');
    await testUploadEndpoint();

    console.log('\n═══════════════════════════════════════════');
    console.log('  ✅ TEST PASSED - Cloudinary is working!');
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.log('\n═══════════════════════════════════════════');
    console.log('  ❌ TEST FAILED');
    console.log('═══════════════════════════════════════════');
    console.log('\nError:', error.message);
    console.log('\nCheck server console for detailed errors.\n');
    process.exit(1);
  }
})();
