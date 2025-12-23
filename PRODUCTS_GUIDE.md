# 📦 Adding Products to RuralBowl

## 🎯 3 Ways to Add Products

### Method 1: Quick Script (Easiest for Testing)

1. **Edit the script** with your products:
   ```bash
   # Edit: server/src/config/addProduct.js
   ```

2. **Run the script**:
   ```bash
   cd server
   node src/config/addProduct.js
   ```

3. **Example**: I've added 4 sample products in the script. Just modify the `newProducts` array.

---

### Method 2: Direct Database Insert (SQL)

```sql
INSERT INTO products (name, slug, description, price, unit, category_id, image_url, stock_quantity, is_available)
VALUES 
  ('Fresh Bananas', 'fresh-bananas', 'Ripe organic bananas', 80, 'dozen', 3, '/images/fruits/bananas-1.jpg', 60, true),
  ('Green Peas', 'green-peas', 'Fresh sweet peas', 90, 'kg', 1, '/images/vegetables/peas-1.jpg', 40, true);
```

---

### Method 3: Admin API (Production Ready)

**Upload with image to Cloudinary:**

```javascript
// Using Postman or frontend
POST http://localhost:5000/api/admin/images/upload
Headers: Authorization: Bearer <admin-token>
Body: form-data
  - file: (select image file)
  - folder: ruralbowl/products

Response: { "url": "https://res.cloudinary.com/..." }
```

**Then create product:**
```javascript
POST http://localhost:5000/api/admin/products
Headers: 
  Authorization: Bearer <admin-token>
  Content-Type: application/json
Body: {
  "name": "Fresh Mangoes",
  "slug": "fresh-mangoes",
  "description": "Sweet alphonso mangoes",
  "price": 400,
  "unit": "dozen",
  "category_id": 3,
  "image_url": "https://res.cloudinary.com/your-cloud/image/...",
  "stock_quantity": 50
}
```

---

## 📷 Image Storage Options

### Option A: Cloudinary (Recommended - Already Setup!)

**Benefits:**
- ✅ Automatic image optimization
- ✅ Responsive images (different sizes)
- ✅ CDN delivery (fast worldwide)
- ✅ Free tier: 25GB storage

**Setup:**
1. Get free account: https://cloudinary.com/users/register_free
2. Add to `.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

**Using the API:**
```bash
# Upload image
curl -X POST http://localhost:5000/api/admin/images/upload \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "folder=ruralbowl/vegetables"

# Response:
{
  "url": "https://res.cloudinary.com/your-cloud/image/upload/v123456/ruralbowl/vegetables/xyz.jpg",
  "publicId": "ruralbowl/vegetables/xyz",
  "format": "jpg",
  "width": 1920,
  "height": 1080
}
```

---

### Option B: Local Storage (Development Only)

For quick testing without Cloudinary:

1. **Put images in**: `web/public/images/`
   ```
   web/public/images/
     ├── vegetables/
     │   ├── tomatoes-1.jpg
     │   ├── potatoes-1.jpg
     │   └── onions-1.jpg
     ├── rice/
     │   └── basmati-1.jpg
     └── mangoes/
         └── alphonso-1.jpg
   ```

2. **Use relative URLs** in database:
   ```sql
   image_url: '/images/vegetables/tomatoes-1.jpg'
   ```

3. **Frontend will load**: `http://localhost:3000/images/vegetables/tomatoes-1.jpg`

---

### Option C: External URLs

Simply use direct URLs from any CDN or image host:
```sql
image_url: 'https://example.com/products/mango.jpg'
```

---

## 🚀 Quick Start: Add 4 Products Now

```bash
cd server
node src/config/addProduct.js
```

This will add:
- Fresh Potatoes
- Organic Onions
- Fresh Cauliflower
- Organic Wheat

---

## 🎨 Getting Product Images

### Free Stock Photos:
1. **Pexels**: https://www.pexels.com/search/vegetables/
2. **Unsplash**: https://unsplash.com/s/photos/fresh-produce
3. **Pixabay**: https://pixabay.com/images/search/vegetables/

### Or Use Placeholder:
```
https://via.placeholder.com/400x300.png?text=Product+Name
```

---

## 🔐 Admin Login (for API Method)

**Default credentials:**
- Username: `admin`
- Password: `admin123`

**Get token:**
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Response: { "token": "eyJhbGciOiJIUzI1..." }
```

**Use token for all admin endpoints:**
```bash
Authorization: Bearer eyJhbGciOiJIUzI1...
```

---

## 📝 Product Fields Explained

```javascript
{
  name: "Display name",           // Required
  slug: "url-friendly-name",      // Required, unique
  description: "Product details", // Optional
  price: 120.50,                  // Required (in INR)
  unit: "kg",                     // Required (kg, dozen, piece, liter, etc.)
  category_id: 1,                 // Required (1=vegetables, 2=rice, 3=mangoes)
  image_url: "/images/...",       // Required (Cloudinary URL or local path)
  stock_quantity: 50,             // Required (0 = out of stock)
  is_available: true              // Optional (default: true)
}
```

---

## 🎯 Recommended Workflow

**For Development:**
1. Use local images in `web/public/images/`
2. Run `addProduct.js` script to bulk add
3. Test frontend display

**For Production:**
1. Setup Cloudinary account
2. Upload images via Admin API
3. Store Cloudinary URLs in database
4. Build admin frontend for easy product management

---

## 📊 Check Current Products

```bash
# View all products
node -e "const db = require('./src/config/database'); db.query('SELECT id, name, price, stock_quantity FROM products').then(r => { console.table(r.rows); process.exit(); });"
```

---

## ❓ Need Help?

- **View categories**: `SELECT * FROM categories;`
- **Check admin routes**: Look at `server/src/routes/adminRoutes.js`
- **Image upload API**: `server/src/services/imageUploadService.js`
