/**
 * Upload Category Images to Cloudinary
 * 
 * This script uploads the existing category images from web/public/images
 * to Cloudinary and prints the URLs that can be used in the admin dashboard.
 * 
 * Usage:
 * 1. Make sure Cloudinary credentials are set in server/.env
 * 2. Run: node upload-category-images.js
 * 3. Copy the URLs and update categories in admin dashboard
 */

require('dotenv').config({ path: './server/.env' });
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Category images to upload
const categoryImages = [
  {
    name: 'Vegetables',
    file: 'web/public/images/vegetables-category.jpeg',
    publicId: 'vegetables-category'
  },
  {
    name: 'Rice',
    file: 'web/public/images/rice-category.jpg',
    publicId: 'rice-category'
  }
];

async function uploadCategoryImages() {
  console.log('🌐 Starting Category Image Upload to Cloudinary...\n');

  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    console.error('❌ Error: Cloudinary credentials not found in server/.env');
    console.log('Please add the following to server/.env:');
    console.log('CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.log('CLOUDINARY_API_KEY=your_api_key');
    console.log('CLOUDINARY_API_SECRET=your_api_secret');
    process.exit(1);
  }

  const uploadedImages = [];

  for (const category of categoryImages) {
    try {
      console.log(`📤 Uploading ${category.name} image...`);
      
      // Check if file exists
      if (!fs.existsSync(category.file)) {
        console.log(`⚠️  File not found: ${category.file}`);
        console.log(`   Skipping ${category.name}...\n`);
        continue;
      }

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(category.file, {
        folder: 'ruralbowl/products',
        public_id: category.publicId,
        overwrite: true,
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });

      console.log(`✅ ${category.name} uploaded successfully!`);
      console.log(`   URL: ${result.secure_url}`);
      console.log(`   Public ID: ${result.public_id}`);
      console.log(`   Size: ${(result.bytes / 1024).toFixed(2)} KB\n`);

      uploadedImages.push({
        name: category.name,
        url: result.secure_url,
        publicId: result.public_id
      });

    } catch (error) {
      console.error(`❌ Error uploading ${category.name}:`, error.message);
      console.log('');
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('📋 UPLOAD SUMMARY');
  console.log('='.repeat(70));

  if (uploadedImages.length === 0) {
    console.log('❌ No images were uploaded. Please check:');
    console.log('   1. Image files exist in web/public/images/');
    console.log('   2. Cloudinary credentials are correct');
    console.log('   3. You have internet connection');
  } else {
    console.log(`✅ Successfully uploaded ${uploadedImages.length} image(s)\n`);
    
    console.log('📝 URLs to update in Admin Dashboard:');
    console.log('-'.repeat(70));
    uploadedImages.forEach(img => {
      console.log(`\n${img.name}:`);
      console.log(`${img.url}`);
    });

    console.log('\n' + '-'.repeat(70));
    console.log('\n💡 Next Steps:');
    console.log('1. Login to Admin Dashboard: http://localhost:3000/admin');
    console.log('2. Go to Categories section');
    console.log('3. Edit each category and paste the URLs above');
    console.log('4. Or use the Upload button to upload images directly');
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

// Run the upload
uploadCategoryImages().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
