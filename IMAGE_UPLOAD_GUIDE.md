# 📸 Image Upload from Admin Dashboard - Complete Guide

## 🎯 Where Images Are Stored

When you upload images from the admin dashboard, they can be stored in **2 different places** depending on your setup:

---

## Option 1: Cloudinary (Cloud Storage) ☁️

### ✅ Recommended for Production

**Where**: Your images are stored on **Cloudinary's servers** (cloud CDN)

**Benefits**:
- ✅ **Automatic Optimization**: Images are automatically compressed and optimized
- ✅ **Responsive Images**: Different sizes generated automatically (thumbnail, medium, large)
- ✅ **Fast Loading**: CDN delivers images from nearest server to user
- ✅ **No Server Storage**: Saves your server disk space
- ✅ **Transformations**: On-the-fly resizing, cropping, filters
- ✅ **Backup**: Images stored safely in cloud

**Free Tier**:
- 25GB Storage
- 25GB Monthly Bandwidth
- Perfect for small to medium businesses

**Example Image URL**:
```
https://res.cloudinary.com/your-cloud-name/image/upload/v1234567/ruralbowl/products/tomato-abc123.jpg
```

### How It Works:

1. **Admin uploads image** from dashboard
2. Image goes to **your backend** (Express server)
3. Backend **forwards to Cloudinary** using API
4. Cloudinary **stores the image** in cloud
5. Cloudinary returns **URL** to backend
6. Backend saves **URL in database**
7. Frontend displays image using **Cloudinary URL**

**Setup Required**:
```env
# Add to server/.env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Get Free Account**: https://cloudinary.com/users/register_free

---

## Option 2: Local Server Storage 💾

### ⚠️ For Development/Testing Only

**Where**: Images stored in your **project folder** on the server

**Storage Location**:
```
server/uploads/products/
  ├── tomato-1638456789.jpg
  ├── potato-1638456790.jpg
  └── onion-1638456791.jpg
```

**Benefits**:
- ✅ **No external service** needed
- ✅ **Works offline**
- ✅ **No signup required**
- ✅ **Free** (uses your server disk)

**Drawbacks**:
- ❌ **Slow for users** far from server
- ❌ **Uses server disk space**
- ❌ **No automatic optimization**
- ❌ **Manual backups needed**
- ❌ **Doesn't scale well**

**Example Image URL**:
```
http://localhost:5000/uploads/products/tomato-1638456789.jpg
```

---

## 🚀 Current Implementation

Your app is **already configured** to use **Cloudinary** by default!

### Check the Code:

**Backend Upload Service** (`server/src/services/imageUploadService.js`):
```javascript
// Configured for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ruralbowl/products',  // Images go in this folder
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [
      { width: 800, height: 800, crop: 'limit' },  // Auto-resize
      { quality: 'auto', fetch_format: 'auto' }    // Auto-optimize
    ],
  },
});
```

**Upload API Endpoint** (`server/src/routes/adminRoutes.js`):
```javascript
// Single image upload
POST /api/admin/upload/image
Headers: 
  - Authorization: Bearer <admin-token>
  - Content-Type: multipart/form-data
Body: 
  - image: (file)

// Multiple images upload
POST /api/admin/upload/images
Body: 
  - images[]: (multiple files)
```

---

## 📋 Step-by-Step: How to Upload Images

### Method 1: Using Postman/API

1. **Login as Admin**:
```bash
POST http://localhost:5000/api/admin/login
Body: {
  "username": "admin",
  "password": "admin123"
}

Response: { "token": "eyJhbGc..." }
```

2. **Upload Image**:
```bash
POST http://localhost:5000/api/admin/upload/image
Headers:
  - Authorization: Bearer eyJhbGc...
  - Content-Type: multipart/form-data
Body (form-data):
  - Key: "image", Value: [Select file]

Response: {
  "success": true,
  "message": "Image uploaded successfully",
  "image": {
    "url": "https://res.cloudinary.com/.../tomato.jpg",
    "publicId": "ruralbowl/products/tomato_abc123",
    "thumbnail": "https://res.cloudinary.com/.../tomato_thumb.jpg"
  }
}
```

3. **Use URL in Product**:
```bash
POST http://localhost:5000/api/admin/products
Body: {
  "name": "Fresh Tomatoes",
  "image_url": "https://res.cloudinary.com/.../tomato.jpg",
  ...
}
```

### Method 2: From Admin Dashboard (Frontend)

**Expected Flow** (when admin UI is built):

```javascript
// Admin Product Create/Edit Page
const handleImageUpload = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('http://localhost:5000/api/admin/upload/image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    },
    body: formData
  });

  const data = await response.json();
  // data.image.url contains the Cloudinary URL
  setImageUrl(data.image.url);
};

// Then save product with image URL
const createProduct = async () => {
  await fetch('http://localhost:5000/api/admin/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: productName,
      image_url: imageUrl,  // Cloudinary URL from upload
      ...otherFields
    })
  });
};
```

---

## 🔄 Image Upload Flow Diagram

```
[Admin Dashboard]
      ↓ (Upload Image)
[Frontend - Next.js]
      ↓ (FormData with file)
[Backend API - Express]
      ↓ (Multer processes file)
[Cloudinary Service]
      ↓ (Upload to cloud)
[Cloudinary Servers] ← Images stored here!
      ↓ (Return URL)
[Backend API]
      ↓ (Save URL to database)
[PostgreSQL Database]
      ↓ (Product created with image_url)
[Frontend displays]
      ↓ (Load image from Cloudinary)
[User sees image] ✅
```

---

## 📁 File Organization on Cloudinary

Your images are organized in folders:

```
Cloudinary Dashboard
└── ruralbowl/
    ├── products/
    │   ├── tomato_abc123.jpg
    │   ├── potato_def456.jpg
    │   └── onion_ghi789.jpg
    ├── categories/
    │   ├── vegetables_123.jpg
    │   └── fruits_456.jpg
    └── banners/
        └── hero_789.jpg
```

**Folder Structure** (in code):
```javascript
// You can change the folder per upload
uploadToCloudinary(file, 'ruralbowl/products');      // Product images
uploadToCloudinary(file, 'ruralbowl/categories');    // Category images
uploadToCloudinary(file, 'ruralbowl/banners');       // Banner images
```

---

## 🛠️ Image Features Included

### 1. **Automatic Optimization**
```javascript
transformation: [
  { width: 800, height: 800, crop: 'limit' },  // Never larger than 800x800
  { quality: 'auto', fetch_format: 'auto' }    // Best format (WebP/AVIF)
]
```

### 2. **Thumbnails**
```javascript
getThumbnailUrl(publicId);
// Returns: 200x200 thumbnail for fast loading
```

### 3. **File Validation**
```javascript
fileFilter: (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files allowed!'), false);
  }
  cb(null, true);
}
```

### 4. **Size Limit**
```javascript
limits: {
  fileSize: 5 * 1024 * 1024  // 5MB max
}
```

### 5. **Supported Formats**
- ✅ JPG/JPEG
- ✅ PNG
- ✅ WebP
- ✅ GIF

---

## 🎯 What You Need to Do

### For Development (Right Now):

**Option A: Use Cloudinary** (Recommended)
1. Create free account: https://cloudinary.com/users/register_free
2. Get credentials from dashboard
3. Add to `.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. Images will automatically upload to Cloudinary
5. Database will store Cloudinary URLs

**Option B: Use Local Images** (Temporary)
1. Put images in `web/public/images/products/`
2. When creating products, use path: `/images/products/tomato.jpg`
3. Works for development but not recommended for production

---

## 🚨 Common Issues & Solutions

### Issue 1: "Cloudinary credentials not found"
**Solution**: Add credentials to `.env` file
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Issue 2: "File too large"
**Solution**: Reduce image size before upload (max 5MB)
```bash
# Use image compression tools
# Or reduce dimensions to 1920x1080 or smaller
```

### Issue 3: "401 Unauthorized"
**Solution**: Make sure you're logged in as admin
```javascript
Headers: {
  'Authorization': 'Bearer ' + adminToken
}
```

### Issue 4: Images not loading in frontend
**Solution**: Check CORS settings and image URL format
```javascript
// Backend server.js
app.use(cors({
  origin: 'http://localhost:3000'
}));
```

---

## 📊 Database Storage

Images URLs are stored in database like this:

**With Cloudinary**:
```sql
INSERT INTO products (name, image_url, ...)
VALUES (
  'Fresh Tomatoes',
  'https://res.cloudinary.com/your-cloud/image/upload/v123/ruralbowl/products/tomato.jpg',
  ...
);
```

**With Local Storage**:
```sql
INSERT INTO products (name, image_url, ...)
VALUES (
  'Fresh Tomatoes',
  '/uploads/products/tomato-1638456789.jpg',
  ...
);
```

---

## 💡 Best Practices

1. **Image Naming**: Use descriptive names
   ```
   ✅ organic-tomatoes.jpg
   ❌ IMG_1234.jpg
   ```

2. **Image Size**: Optimize before upload
   ```
   ✅ 1920x1080 @ 80% quality
   ❌ 6000x4000 @ 100% quality
   ```

3. **File Format**:
   ```
   ✅ JPG for photos
   ✅ PNG for logos/graphics with transparency
   ✅ WebP for best compression (automatic with Cloudinary)
   ```

4. **Organization**: Use consistent folder structure
   ```
   ruralbowl/products/vegetables/
   ruralbowl/products/fruits/
   ruralbowl/products/rice/
   ```

---

## 🎉 Summary

**Your images will be stored in:**
- ☁️ **Cloudinary** (if configured) - Recommended!
- 💾 **Local server** (if Cloudinary not configured) - Development only

**Current setup**: Ready for Cloudinary, just need to add credentials!

**Database stores**: Only the **URL** to the image, not the actual image file

**Recommended**: Use Cloudinary for automatic optimization, fast delivery, and no storage worries!
