const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';

// Test configuration
let adminToken = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, description) {
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}Step ${step}: ${description}${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
}

// Step 1: Admin Login
async function adminLogin() {
  logStep(1, 'Admin Login');
  
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@ruralbowl.com',
        password: 'admin123',
      }),
    });

    const data = await response.json();
    
    if (data.token) {
      adminToken = data.token;
      log('✓ Admin logged in successfully', 'green');
      log(`  Token: ${adminToken.substring(0, 30)}...`, 'cyan');
      log(`  User: ${data.user.name} (${data.user.email})`, 'cyan');
      log(`  Role: ${data.user.role}`, 'cyan');
      return true;
    } else {
      log('✗ Login failed: ' + data.message, 'red');
      return false;
    }
  } catch (error) {
    log('✗ Login error: ' + error.message, 'red');
    return false;
  }
}

// Step 2: Test Image Upload (with mock file)
async function testImageUpload() {
  logStep(2, 'Test Image Upload API');
  
  try {
    log('Note: Creating a test image file...', 'yellow');
    
    // Create a simple test image (1x1 PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    
    // Save temporarily
    const testImagePath = path.join(__dirname, 'test-image.png');
    fs.writeFileSync(testImagePath, testImageBuffer);
    
    log('✓ Test image created', 'green');
    log('  Uploading to Cloudinary...', 'cyan');

    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImagePath));

    const response = await fetch(`${BASE_URL}/admin/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
      body: formData,
    });

    const data = await response.json();
    
    // Clean up test file
    fs.unlinkSync(testImagePath);
    
    if (data.success) {
      log('✓ Image uploaded successfully!', 'green');
      log(`  URL: ${data.image.url}`, 'cyan');
      log(`  Public ID: ${data.image.publicId}`, 'cyan');
      if (data.image.thumbnail) {
        log(`  Thumbnail: ${data.image.thumbnail}`, 'cyan');
      }
      return data.image;
    } else {
      log('✗ Upload failed: ' + data.message, 'red');
      
      // Check if it's a Cloudinary configuration issue
      if (data.message && data.message.includes('Cloudinary')) {
        log('\n⚠ Cloudinary Configuration Issue:', 'yellow');
        log('  Make sure you have configured Cloudinary credentials in server/.env:', 'yellow');
        log('  - CLOUDINARY_CLOUD_NAME=your_cloud_name', 'yellow');
        log('  - CLOUDINARY_API_KEY=your_api_key', 'yellow');
        log('  - CLOUDINARY_API_SECRET=your_api_secret', 'yellow');
        log('\n  Get free account at: https://cloudinary.com/users/register_free', 'cyan');
      }
      
      return null;
    }
  } catch (error) {
    log('✗ Upload error: ' + error.message, 'red');
    return null;
  }
}

// Step 3: Check Upload Endpoint Status
async function checkUploadEndpoint() {
  logStep(3, 'Check Upload Endpoint Configuration');
  
  try {
    // Try to access the endpoint (should return error without file, but confirms it exists)
    const response = await fetch(`${BASE_URL}/admin/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    log(`  Status: ${response.status}`, 'cyan');
    
    if (response.status === 400 || response.status === 500) {
      log('✓ Upload endpoint exists and is accessible', 'green');
      return true;
    } else if (response.status === 404) {
      log('✗ Upload endpoint not found (404)', 'red');
      log('  Make sure adminRoutes.js is configured correctly', 'yellow');
      return false;
    } else if (response.status === 401 || response.status === 403) {
      log('✗ Authentication issue', 'red');
      return false;
    }
    
    return true;
  } catch (error) {
    log('✗ Endpoint check error: ' + error.message, 'red');
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('\n');
  log('╔═══════════════════════════════════════════════╗', 'cyan');
  log('║     Image Upload API Test - Rural Bowl       ║', 'cyan');
  log('╚═══════════════════════════════════════════════╝', 'cyan');
  
  let allPassed = true;

  // Test 1: Admin Login
  const loginSuccess = await adminLogin();
  if (!loginSuccess) {
    log('\n✗ Tests stopped: Admin login failed', 'red');
    process.exit(1);
  }

  // Test 2: Check endpoint
  const endpointExists = await checkUploadEndpoint();
  if (!endpointExists) {
    allPassed = false;
  }

  // Test 3: Upload image
  const uploadedImage = await testImageUpload();
  if (!uploadedImage) {
    allPassed = false;
  }

  // Summary
  console.log('\n');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('Test Summary', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  
  if (allPassed && uploadedImage) {
    log('✓ ALL TESTS PASSED', 'green');
    log('\nImage Upload API is working correctly!', 'green');
    log('You can now use the admin dashboard to upload product images.', 'cyan');
  } else if (loginSuccess && endpointExists) {
    log('⚠ PARTIAL SUCCESS', 'yellow');
    log('\nEndpoint is configured, but image upload may need Cloudinary setup:', 'yellow');
    log('1. Create free account: https://cloudinary.com/users/register_free', 'cyan');
    log('2. Add credentials to server/.env:', 'cyan');
    log('   CLOUDINARY_CLOUD_NAME=your_cloud_name', 'cyan');
    log('   CLOUDINARY_API_KEY=your_api_key', 'cyan');
    log('   CLOUDINARY_API_SECRET=your_api_secret', 'cyan');
    log('3. Restart the server', 'cyan');
    log('\nAlternatively, you can use direct image URLs for now.', 'yellow');
  } else {
    log('✗ TESTS FAILED', 'red');
    log('\nPlease check the errors above.', 'red');
  }
  
  console.log('\n');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/products`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Main execution
(async () => {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    log('✗ Server is not running on http://localhost:5000', 'red');
    log('Please start the server first:', 'yellow');
    log('  cd server && npm start', 'cyan');
    process.exit(1);
  }
  
  await runTests();
})();
