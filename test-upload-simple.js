// Simple test script for image upload API
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';

// Create a simple 1x1 pixel PNG for testing
const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const testImageBuffer = Buffer.from(testImageBase64, 'base64');

let adminToken = '';

// Step 1: Login as admin
function loginAdmin() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: 'admin@ruralbowl.com',
      password: 'admin123'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.token) {
            adminToken = result.token;
            console.log('✓ Admin logged in successfully');
            console.log(`  User: ${result.user.name} (${result.user.role})`);
            resolve(result);
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

// Step 2: Upload test image
function uploadTestImage() {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    
    // Build multipart form data
    const formData = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="image"; filename="test-image.png"',
      'Content-Type: image/png',
      '',
      testImageBuffer.toString('binary'),
      `--${boundary}--`
    ].join('\r\n');

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/upload/image',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(formData)
      }
    };

    console.log('\n✓ Uploading test image to Cloudinary...');

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          
          if (result.success) {
            console.log('✓ Image uploaded successfully!');
            console.log(`  URL: ${result.image.url}`);
            console.log(`  Public ID: ${result.image.publicId}`);
            if (result.image.thumbnail) {
              console.log(`  Thumbnail: ${result.image.thumbnail}`);
            }
            resolve(result);
          } else {
            console.log('✗ Upload failed:', result.message);
            if (result.message && result.message.includes('Cloudinary')) {
              console.log('\n⚠ Make sure Cloudinary credentials in .env are correct');
            }
            reject(new Error(result.message));
          }
        } catch (e) {
          console.log('✗ Response parsing error:', e.message);
          console.log('  Raw response:', body);
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.log('✗ Request error:', e.message);
      reject(e);
    });

    req.write(formData, 'binary');
    req.end();
  });
}

// Check if server is running
function checkServer() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/api/products', (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Main test
(async () => {
  console.log('\n═══════════════════════════════════════════');
  console.log('  Image Upload API Test - Rural Bowl');
  console.log('═══════════════════════════════════════════\n');

  // Check server
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('✗ Server is not running on http://localhost:5000');
    console.log('  Please start: cd server && npm start');
    process.exit(1);
  }
  console.log('✓ Server is running\n');

  try {
    // Login
    console.log('Step 1: Admin Login');
    await loginAdmin();

    // Upload
    console.log('\nStep 2: Image Upload');
    await uploadTestImage();

    console.log('\n═══════════════════════════════════════════');
    console.log('  ✅ ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════');
    console.log('\nCloudinary is configured correctly!');
    console.log('You can now use the admin dashboard to upload images.\n');

  } catch (error) {
    console.log('\n═══════════════════════════════════════════');
    console.log('  ❌ TEST FAILED');
    console.log('═══════════════════════════════════════════');
    console.log('\nError:', error.message);
    console.log('\nPlease check:');
    console.log('1. Cloudinary credentials in server/.env');
    console.log('2. Server is running (npm start in server/)');
    console.log('3. Internet connection (for Cloudinary)');
    process.exit(1);
  }
})();
