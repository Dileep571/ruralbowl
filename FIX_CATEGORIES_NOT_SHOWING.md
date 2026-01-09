# 🔧 Fix: Categories Not Showing in Admin Dashboard

## 🎯 Problem Identified

Your categories are not showing in the admin dashboard because:

1. **Missing Column**: The `categories` table is missing the `is_active` column
2. **Schema Mismatch**: Some code expects `is_active` column but it doesn't exist
3. **Empty Table**: The categories table might not have been seeded with default data

## ✅ Solution

### Option 1: Quick Fix - Run SQL Script (Recommended) ⭐

**This is the EASIEST and FASTEST way to fix the issue!**

1. **Open your PostgreSQL client** (pgAdmin, DBeaver, or command line)

2. **Connect to your database** (ruralbowl database)

3. **Run this SQL script**: [`seed-categories.sql`](seed-categories.sql)

   Or copy and run this:
   ```sql
   -- Add missing columns
   DO $$ 
   BEGIN
       IF NOT EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'categories' AND column_name = 'is_active'
       ) THEN
           ALTER TABLE categories ADD COLUMN is_active BOOLEAN DEFAULT true;
           ALTER TABLE categories ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
       END IF;
   END $$;

   -- Update existing categories
   UPDATE categories SET is_active = true WHERE is_active IS NULL;

   -- Insert default categories
   INSERT INTO categories (name, slug, description, image_url, is_active) 
   VALUES
     ('Vegetables', 'vegetables', 'Fresh organic vegetables from local farms', '/images/vegetables-category.jpeg', true),
     ('Rice', 'rice', 'Premium quality rice varieties', '/images/rice-category.jpg', true)
   ON CONFLICT (slug) 
   DO UPDATE SET 
     name = EXCLUDED.name,
     description = EXCLUDED.description,
     image_url = EXCLUDED.image_url,
     is_active = true;

   -- Verify
   SELECT * FROM categories;
   ```

4. **Refresh your admin dashboard** - Categories should now appear!

### Option 2: Reinitialize Database

If you don't mind recreating your database:

```bash
cd server
node src/config/initDb.js
```

This will:
- ✅ Create categories table with `is_active` column
- ✅ Seed default categories (Vegetables, Rice)
- ✅ Fix the schema issue

**⚠️ WARNING**: This will drop and recreate all tables, losing existing data!

### Option 3: Manual Fix via Admin Dashboard

Once you've run the SQL fix (Option 1):

1. Login to admin dashboard: http://localhost:3000/admin
2. Go to Categories section
3. Categories should now be visible
4. You can add/edit/delete categories with images

## 🔍 What Was Fixed

### File Updates:

1. **server/src/config/initDb.js**
   - ✅ Added `is_active` column to categories table
   - ✅ Added `updated_at` column to categories table
   - ✅ Now matches the expected schema

2. **seed-categories.sql** (NEW)
   - ✅ Safe script to add missing columns
   - ✅ Seeds default categories
   - ✅ Verifies the fix worked

### Database Schema Changes:

**Before:**
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**After:**
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,      -- ✅ ADDED
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- ✅ ADDED
);
```

## 🧪 Verify the Fix

### Check Database:
```sql
-- Should show categories with is_active = true
SELECT id, name, slug, is_active FROM categories;

-- Should return 2 (or more)
SELECT COUNT(*) FROM categories WHERE is_active = true;
```

### Check Admin Dashboard:
1. Navigate to: http://localhost:3000/admin/categories
2. You should see:
   - ✅ "Vegetables" category
   - ✅ "Rice" category
   - ✅ Ability to add new categories
   - ✅ Ability to edit/delete categories

### Check API:
```bash
# Should return categories array
curl http://localhost:5000/api/admin/categories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 📊 Default Categories

After running the fix, you'll have these default categories:

| Name | Slug | Description | Image |
|------|------|-------------|-------|
| Vegetables | vegetables | Fresh organic vegetables from local farms | /images/vegetables-category.jpeg |
| Rice | rice | Premium quality rice varieties | /images/rice-category.jpg |

## 🎨 Next Steps

Once categories are showing:

1. **Upload Images via Admin Dashboard**
   - Go to Categories
   - Click "Edit" on each category
   - Upload images from `web/public/images/`
   - Images will be uploaded to Cloudinary

2. **Add More Categories**
   - Click "Add Category" button
   - Fill in name, slug, description
   - Upload category image
   - Save

3. **Assign Products to Categories**
   - Go to Products section
   - Edit products
   - Select appropriate category
   - Save

## 🔧 Technical Details

### Why This Happened:

Your application has **two backend servers**:
- `server/` (main backend, port 5000)
- `web/server/` (alternative backend)

The `web/server/` code expects `is_active` column:
```javascript
// web/server/src/routes/products.js line 90
'SELECT ... FROM categories WHERE is_active = true ORDER BY name'
```

But `server/src/config/initDb.js` was creating the table without this column, causing a mismatch.

### The Fix:
1. ✅ Updated `initDb.js` to include `is_active` and `updated_at` columns
2. ✅ Created SQL migration script to add columns to existing databases
3. ✅ Seeds default categories with `is_active = true`

## 🚨 Troubleshooting

### "Column is_active does not exist" error?
**Solution**: Run the SQL script from Option 1 above.

### Categories still not showing?
**Check**:
1. Is the backend server running? (port 5000)
2. Are you logged in as admin?
3. Check browser console for errors
4. Run: `SELECT * FROM categories;` in your database

### "SASL password must be a string" error?
**Solution**: Check your `server/.env` file has proper database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ruralbowl
DB_USER=your_username
DB_PASSWORD=your_password
```

### Empty categories array in API response?
**Solution**: Categories table is empty. Run the SQL script to seed it.

## 📞 Quick Commands

```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Check database connection
psql -U postgres -d ruralbowl -c "SELECT * FROM categories;"

# Restart backend server
cd server
npm start
```

## ✅ Status After Fix

- ✅ Categories table has proper schema with `is_active` column
- ✅ Default categories (Vegetables, Rice) are seeded
- ✅ Categories visible in admin dashboard
- ✅ Can add/edit/delete categories with images
- ✅ Can upload images to Cloudinary
- ✅ Products can be assigned to categories

**Your categories should now be working! 🎉**
