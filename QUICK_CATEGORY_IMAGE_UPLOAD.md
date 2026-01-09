# 🎯 Quick Reference: Upload Category Images

## Two Ways to Upload Images:

### Method 1: Direct Upload (Recommended) ⭐

1. **Start your servers**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm start

   # Terminal 2 - Frontend  
   cd web
   npm run dev
   ```

2. **Access Admin Dashboard**
   - URL: http://localhost:3000/admin
   - Login with admin credentials

3. **Upload Images**
   - Navigate to "Categories" section
   - Click "Edit" on "Vegetables" category
   - Click the upload area or drag image
   - Select file: `web/public/images/vegetables-category.jpeg`
   - Save category
   - Repeat for "Rice" category with `rice-category.jpg`

**Done! ✅** Images are now hosted on Cloudinary and display on your site.

---

### Method 2: Upload Script (Alternative) 🔧

1. **Run upload script**
   ```bash
   node upload-category-images.js
   ```

2. **Copy the URLs** from output

3. **Update in Admin Dashboard**
   - Edit each category
   - Paste the Cloudinary URL into image field
   - Save

---

## 📋 Checklist

Before uploading, ensure:
- [ ] Backend server is running (port 5000)
- [ ] Frontend server is running (port 3000)
- [ ] Cloudinary credentials in `server/.env`:
  ```
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret
  ```
- [ ] Admin logged in to dashboard
- [ ] Image files exist in `web/public/images/`

---

## 🎨 Current Images to Upload

1. **Vegetables Category**
   - File: `web/public/images/vegetables-category.jpeg`
   - Upload to: Vegetables category

2. **Rice Category**
   - File: `web/public/images/rice-category.jpg`
   - Upload to: Rice category

---

## 🔍 Verify Upload

After uploading, check:
- ✅ Image appears on category card in admin dashboard
- ✅ Image URL starts with `https://res.cloudinary.com/`
- ✅ Image loads quickly (CDN)
- ✅ Image displays correctly on frontend

---

## ❓ Troubleshooting

**Upload fails?**
- Check internet connection
- Verify Cloudinary credentials
- Check file size (must be < 5MB)
- Try refreshing the page

**Image doesn't display?**
- Check browser console for errors
- Verify URL is saved in database
- Try hard refresh (Ctrl+Shift+R)

**Can't find categories page?**
- URL: http://localhost:3000/admin/categories
- Make sure you're logged in as admin

---

## 📞 Need Help?

See detailed documentation:
- `CATEGORY_IMAGE_UPLOAD_GUIDE.md` - Full guide
- `CATEGORY_UPDATE_SUMMARY.md` - Summary of changes
