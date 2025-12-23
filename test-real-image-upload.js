// Test upload with real local image
const http = require('http');
const fs = require('fs');
const path = require('path');

let adminToken = '';

// Login as admin
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
          console.log('✓ Admin logged in successfully');
          console.log(`  User: ${result.user.name} (${result.user.email})\n`);
          resolve(result);
        } else {
          reject(new Error('No token received'));
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Login request error:', err.message);
      reject(err);
    });
    req.write(data);
    req.end();
  });
}

// Upload real image file
function uploadRealImage(imagePath) {
  return new Promise((resolve, reject) => {
    const boundary = '----Boundary' + Date.now();
    const nl = '\r\n';
    
    // Read the actual image file
    const imageBuffer = fs.readFileSync(imagePath);
    const filename = path.basename(imagePath);
    const mimetype = filename.endsWith('.png') ? 'image/png' : 
                     filename.endsWith('.jpg') || filename.endsWith('.jpeg') ? 'image/jpeg' : 
                     'image/webp';
    
    console.log(`📤 Uploading: ${filename}`);
    console.log(`   Size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`   Type: ${mimetype}`);
    console.log(`   Path: ${imagePath}\n`);
    
    const bodyParts = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="image"; filename="${filename}"`,
      `Content-Type: ${mimetype}`,
      '',
      ''
    ].join(nl);
    
    const endBoundary = nl + `--${boundary}--` + nl;
    
    const bodyBuffer = Buffer.concat([
      Buffer.from(bodyParts, 'utf8'),
      imageBuffer,
      Buffer.from(endBoundary, 'utf8')
    ]);

    console.log('🌐 Sending to Cloudinary via backend API...\n');

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
      
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`Response Status: ${res.statusCode}\n`);
        
        try {
          const result = JSON.parse(body);
          
          if (result.success) {
            console.log('════════════════════════════════════════════════');
            console.log('  ✅ IMAGE UPLOADED SUCCESSFULLY!');
            console.log('════════════════════════════════════════════════\n');
            console.log('📸 Image Details:');
            console.log(`   URL: ${result.image.url}`);
            console.log(`   Public ID: ${result.image.publicId}`);
            if (result.image.thumbnail) {
              console.log(`   Thumbnail: ${result.image.thumbnail}`);
            }
            console.log('\n💡 You can now use this URL in your products!\n');
            resolve(result);
          } else {
            console.log('════════════════════════════════════════════════');
            console.log('  ❌ UPLOAD FAILED');
            console.log('════════════════════════════════════════════════\n');
            console.log('Error:', result.message);
            if (result.error) console.log('Details:', result.error);
            reject(new Error(result.message));
          }
        } catch (e) {
          console.log('❌ JSON Parse Error:', e.message);
          console.log('Raw Response:', body);
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.log('❌ Request Error:', e.message);
      reject(e);
    });

    req.write(bodyBuffer);
    req.end();
  });
}

// Main test
(async () => {
  console.log('\n════════════════════════════════════════════════');
  console.log('  🎨 Cloudinary Image Upload Test');
  console.log('  Real Image Upload to Cloudinary');
  console.log('════════════════════════════════════════════════\n');

  try {
    // Step 1: Login
    console.log('Step 1: Admin Authentication');
    await loginAdmin();

    // Step 2: Choose an image to upload
    const imagePath = path.join(__dirname, 'web/public/images/vegetables/tomatoes-1.jpg');
    
    if (!fs.existsSync(imagePath)) {
      console.log('❌ Image file not found:', imagePath);
      process.exit(1);
    }

    // Step 3: Upload
    console.log('Step 2: Upload Image to Cloudinary');
    await uploadRealImage(imagePath);

    console.log('════════════════════════════════════════════════');
    console.log('  🎉 ALL TESTS PASSED!');
    console.log('════════════════════════════════════════════════');
    console.log('\n✅ Your Cloudinary is configured correctly!');
    console.log('✅ Image upload API is working!');
    console.log('✅ You can now use the admin dashboard!\n');
    console.log('Next steps:');
    console.log('1. Go to http://localhost:3000/admin/products');
    console.log('2. Click "Add Product"');
    console.log('3. Upload images directly from the UI\n');

  } catch (error) {
    console.log('\n════════════════════════════════════════════════');
    console.log('  ❌ TEST FAILED');
    console.log('════════════════════════════════════════════════');
    console.log('\nError:', error.message);
    console.log('\nPossible issues:');
    console.log('- Server not running (check if restarted)');
    console.log('- Wrong Cloudinary credentials in .env');
    console.log('- Network connection issue\n');
    process.exit(1);
  }
})();
