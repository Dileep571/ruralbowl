# Category Image Upload & Refresh Fix

## Issues Fixed

### 1. **Image Preview Not Persisting**
**Problem**: When uploading an image, it showed temporarily but disappeared after closing/reopening the modal.

**Root Cause**: Variable naming conflict - using `formData` as both state variable and FormData class caused confusion.

**Fix**: 
- Renamed the local FormData instance in `handleImageUpload` to `uploadFormData`
- Image preview now properly sets when editing a category (`handleOpenModal` already had this logic)

### 2. **Category Updates Not Showing on Frontend**
**Problem**: After updating categories in admin dashboard, changes didn't appear on the home page without manual page reload.

**Root Causes**:
1. **Client-side caching**: Next.js and browser were caching category data
2. **Static data loading**: Home page loaded categories once on mount, never refreshed
3. **Dual endpoints**: Admin uses `/admin/categories`, home page uses `/products/categories` (both hit same database)

**Fix**:
- Added cache-busting headers to both `productsAPI.getCategories()` and `adminAPI.getCategories()`:
  ```javascript
  {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    }
  }
  ```

## Files Modified

1. **web/src/app/admin/categories/page.js**
   - Line ~95: Renamed `formData` to `uploadFormData` in `handleImageUpload` function
   - Already had proper image preview logic in `handleOpenModal` (line ~57)

2. **web/src/lib/api.js**
   - Line ~230: Added cache-busting headers to `productsAPI.getCategories()`
   - Line ~450: Added cache-busting headers to `adminAPI.getCategories()`

## How to Test

### Test Image Upload Persistence:
1. Go to Admin Dashboard → Categories
2. Click "Edit" on any category
3. Upload a new image
4. Click "Update Category"
5. Close the modal
6. Click "Edit" again on the same category
7. ✅ **Expected**: Image should show in the modal

### Test Frontend Refresh:
1. Go to Admin Dashboard → Categories
2. Edit a category (change name or upload image)
3. Click "Update Category"
4. Navigate to Home Page (http://localhost:3000)
5. ✅ **Expected**: Changes should be visible in the "Our Categories" section without manual page reload

### Test Cache Busting:
1. Open Browser DevTools → Network tab
2. Filter for "categories" requests
3. Update a category in admin
4. Go to home page
5. ✅ **Expected**: You should see a fresh request for categories (not cached 304)

## API Endpoints

### Admin Endpoint
- **URL**: `GET /api/admin/categories`
- **Auth**: Requires adminToken
- **Returns**: All categories with full details

### Public Endpoint
- **URL**: `GET /api/products/categories`
- **Auth**: None required
- **Returns**: All categories (same data as admin endpoint)

**Note**: Both endpoints query the same `categories` table in PostgreSQL, ensuring data consistency.

## Next Steps (If Issues Persist)

### 1. Restart Backend Server
```bash
cd server
npm start
```

### 2. Run Database Migration
If `is_active` and `updated_at` columns are missing:
```sql
-- Run in PostgreSQL
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing records
UPDATE categories SET is_active = true WHERE is_active IS NULL;
UPDATE categories SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
```

### 3. Clear Browser Cache
- Hard refresh: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
- Or clear cache: DevTools → Application → Clear storage

### 4. Check Console Logs
Look for these debug messages:
- "Image upload successful:" (admin page)
- "Setting image_url in formData:" (admin page)
- "Submitting category data:" (admin page)
- "getCategories raw response:" (API layer)

## Technical Details

### Cache Headers Explained
- `cache: 'no-store'`: Tells Next.js not to cache the response
- `Cache-Control: no-cache, no-store, must-revalidate`: Tells browser and CDN not to cache
- `Pragma: no-cache`: For HTTP/1.0 compatibility

### Why Two Endpoints?
- **Admin endpoint** (`/admin/categories`): Protected route for management operations
- **Public endpoint** (`/products/categories`): Open route for frontend display
- Both use the same database query, ensuring data consistency

## Status
✅ **Completed**: Cache-busting headers added
✅ **Completed**: FormData variable name conflict fixed
✅ **Completed**: Image preview logic verified
⚠️ **Pending**: Backend server restart recommended
⚠️ **Pending**: Database migration if columns missing

## Contact
If issues persist, check:
1. Backend server console for errors
2. Browser console for failed requests
3. Network tab for response status codes
4. Database schema for missing columns
