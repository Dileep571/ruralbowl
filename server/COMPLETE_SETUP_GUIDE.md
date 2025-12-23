# 🚀 RuralBowl Backend - Complete Setup Guide

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Database Setup](#database-setup)
3. [Environment Configuration](#environment-configuration)
4. [Running the Server](#running-the-server)
5. [Testing APIs](#testing-apis)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## 🏁 Quick Start

### Prerequisites
- ✅ Node.js v16+ installed
- ✅ PostgreSQL 12+ installed and running
- ✅ Cloudinary account (free tier available)
- ✅ Gmail account with App Password

### Installation Steps

```bash
# 1. Navigate to server directory
cd server

# 2. Install dependencies (including new packages)
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Edit .env with your credentials (see Configuration section)
```

---

## 🗄️ Database Setup

### Step 1: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ruralbowl_db;

# Exit
\q
```

### Step 2: Run Migrations

**Option A: Using Node.js Script (Recommended)**
```bash
node src/config/runMigrations.js
```

**Option B: Using psql directly**
```bash
psql -U postgres -d ruralbowl_db -f src/config/migrations.sql
```

### What Gets Created?

The migration script creates:

#### Existing Tables (Preserved)
- ✅ users
- ✅ products
- ✅ categories
- ✅ orders
- ✅ order_items
- ✅ cart

#### New Tables (Added)
- ⭐ **reviews** - Product reviews with 1-5 star ratings, verified purchases, helpful votes
- ⭐ **coupons** - Discount system (percentage/fixed, usage limits, expiry dates)
- ⭐ **coupon_usage** - Tracks coupon redemptions per user
- ⭐ **wishlist** - Save favorite products
- ⭐ **activity_logs** - Audit trail for admin actions
- ⭐ **order_tracking** - Enhanced order status tracking

#### Enhanced Columns
- **products**: Added `images` (JSON array), `average_rating`, `review_count`
- **orders**: Added `subtotal`, `discount_amount`, `coupon_id`, `tracking_number`

#### Database Views (For Analytics)
- `top_rated_products` - Products with rating ≥ 4.0
- `popular_products` - Best sellers
- `sales_summary` - Daily sales aggregation

#### Triggers
- `update_product_rating` - Auto-updates product ratings when reviews change

#### Sample Data
- 3 test coupons (WELCOME10, FLAT50, BIGSALE20)

---

## ⚙️ Environment Configuration

### 1. Copy `.env.example` to `.env`

```bash
cp .env.example .env
```

### 2. Update Values

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ruralbowl_db
DB_USER=postgres
DB_PASSWORD=your_actual_password_here

# JWT Configuration
JWT_SECRET=change_this_to_random_32_character_string_minimum
JWT_EXPIRE=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Email Configuration (Gmail with App Password)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_16_character_app_password_here
ADMIN_EMAIL=admin@ruralbowl.com

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay Configuration (optional, for payments)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 3. Get Cloudinary Credentials

1. Go to https://cloudinary.com and sign up (free tier available)
2. Navigate to Dashboard
3. Copy:
   - Cloud Name
   - API Key
   - API Secret
4. Paste into `.env` file

### 4. Get Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable **2-Factor Authentication** (required)
3. Search for "App passwords"
4. Select "Mail" and "Other (Custom name)"
5. Generate password (16 characters)
6. Copy and paste into `.env` as `EMAIL_PASSWORD`

**Important:** Do NOT use your regular Gmail password!

---

## 🏃 Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Check Server Health
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "RuralBowl API is running"
}
```

---

## 🧪 Testing APIs

### 1. Create Test Admin User

```sql
-- Connect to database
psql -U postgres -d ruralbowl_db

-- Create admin (password: admin123)
INSERT INTO users (name, email, password, role) 
VALUES (
  'Admin User', 
  'admin@ruralbowl.com', 
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
  'admin'
);
```

### 2. Login to Get Token

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ruralbowl.com",
    "password": "admin123"
  }'
```

Copy the `token` from response.

### 3. Test New Features

#### 📝 Reviews API

```bash
# Get product reviews (public)
curl http://localhost:5000/api/products/1/reviews

# Get review statistics
curl http://localhost:5000/api/products/1/reviews/stats

# Create review (requires auth)
curl -X POST http://localhost:5000/api/reviews \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "rating": 5,
    "title": "Excellent quality!",
    "comment": "Fresh and delicious mangoes"
  }'

# Mark review as helpful
curl -X POST http://localhost:5000/api/reviews/1/helpful \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 🎟️ Coupons API

```bash
# Get active coupons
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/coupons/active

# Validate coupon before checkout
curl -X POST http://localhost:5000/api/coupons/validate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WELCOME10",
    "orderAmount": 500
  }'

# Create order with coupon
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shipping_address": "123 Test St",
    "payment_method": "cod",
    "coupon_code": "WELCOME10"
  }'
```

#### ❤️ Wishlist API

```bash
# Get user wishlist
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/wishlist

# Get wishlist count (for badge)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/wishlist/count

# Add to wishlist
curl -X POST http://localhost:5000/api/wishlist \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1}'

# Check if product in wishlist
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/wishlist/check/1

# Move item to cart
curl -X POST http://localhost:5000/api/wishlist/1/move-to-cart \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 2}'

# Clear wishlist
curl -X DELETE http://localhost:5000/api/wishlist \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 📊 Analytics API (Admin Only)

```bash
# Dashboard summary
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:5000/api/admin/analytics/dashboard?period=30"

# Sales chart (daily, weekly, or monthly)
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:5000/api/admin/analytics/sales-chart?period=90&groupBy=week"

# Category performance
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:5000/api/admin/analytics/categories

# Customer analytics
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:5000/api/admin/analytics/customers

# Product performance
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:5000/api/admin/analytics/products?sortBy=revenue"

# Inventory status (low stock alerts)
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:5000/api/admin/analytics/inventory?threshold=10"

# Coupon analytics
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:5000/api/admin/analytics/coupons
```

#### 🖼️ Image Upload API (Admin Only)

```bash
# Upload single image
curl -X POST http://localhost:5000/api/admin/upload/image \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "image=@/path/to/image.jpg"

# Upload multiple images
curl -X POST http://localhost:5000/api/admin/upload/images \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"

# Delete image
curl -X DELETE http://localhost:5000/api/admin/upload/image \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"publicId": "ruralbowl/products/xyz123"}'
```

---

## 🚀 Deployment

### Heroku Deployment

```bash
# 1. Install Heroku CLI
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# 2. Login
heroku login

# 3. Create app
heroku create ruralbowl-api

# 4. Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# 5. Set environment variables
heroku config:set JWT_SECRET=your_secret
heroku config:set CLOUDINARY_CLOUD_NAME=your_cloud_name
heroku config:set CLOUDINARY_API_KEY=your_api_key
heroku config:set CLOUDINARY_API_SECRET=your_api_secret
heroku config:set EMAIL_USER=your_email@gmail.com
heroku config:set EMAIL_PASSWORD=your_app_password
heroku config:set FRONTEND_URL=https://your-frontend-domain.com

# 6. Deploy
git push heroku main

# 7. Run migrations
heroku run node src/config/runMigrations.js

# 8. Check logs
heroku logs --tail
```

### DigitalOcean App Platform

1. Connect GitHub repository
2. Select branch (main)
3. Add PostgreSQL database (Dev or Prod)
4. Configure environment variables in dashboard
5. Click "Create Resources"
6. After deployment, run migrations via console

### AWS (EC2 + RDS)

```bash
# 1. Launch EC2 instance (Ubuntu 22.04)
# 2. SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install PM2 (process manager)
sudo npm install -g pm2

# 5. Clone repository
git clone your-repo-url
cd ruralbowl_app/server

# 6. Install dependencies
npm install

# 7. Configure .env with RDS credentials
nano .env

# 8. Run migrations
node src/config/runMigrations.js

# 9. Start with PM2
pm2 start src/server.js --name ruralbowl-api
pm2 startup
pm2 save

# 10. Setup Nginx reverse proxy (optional)
sudo apt install nginx
# Configure nginx to proxy port 5000
```

---

## 🐛 Troubleshooting

### Database Connection Issues

**Error: ECONNREFUSED**
```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Start PostgreSQL
sudo service postgresql start

# Verify credentials in .env
```

**Error: "password authentication failed"**
- Check `DB_USER` and `DB_PASSWORD` in `.env`
- Verify PostgreSQL user exists:
```sql
psql -U postgres
\du
```

### Migration Issues

**Error: "relation already exists"**
- This is normal when re-running migrations
- Script will skip existing tables automatically

**Error: "column already exists"**
- Tables partially created from previous run
- Solution: Drop table and re-run
```sql
DROP TABLE IF EXISTS reviews CASCADE;
```

### Cloudinary Upload Issues

**Error: "Cloudinary config not found"**
- Verify all three Cloudinary env vars are set:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
- Check for typos in variable names

**Error: "File size too large"**
- Current limit: 5MB per image
- Change in `src/services/imageUploadService.js`:
```javascript
limits: { fileSize: 10 * 1024 * 1024 } // 10MB
```

### Email Sending Issues

**Error: "Invalid login: 535 Authentication failed"**
- Use App Password, NOT regular Gmail password
- Enable 2-Factor Authentication first
- Generate new App Password from Google Account settings

**Email not received**
- Check spam/junk folder
- Verify `EMAIL_USER` is correct
- Test with: `node -e "console.log(process.env.EMAIL_USER)"`

### Server Won't Start

**Error: "Port already in use"**
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or change PORT in .env
```

**Error: "Cannot find module"**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Additional Documentation

- **API Documentation**: See `BACKEND_IMPLEMENTATION_COMPLETE.md`
- **Original Setup**: See `SETUP_GUIDE.md`
- **Database Schema**: See `src/config/migrations.sql`

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to strong random string (32+ chars)
- [ ] Use strong database password (16+ chars)
- [ ] Enable HTTPS with SSL certificate
- [ ] Set `NODE_ENV=production`
- [ ] Update `FRONTEND_URL` to actual domain
- [ ] Run `npm audit fix` to patch vulnerabilities
- [ ] Never commit `.env` file to Git
- [ ] Enable database connection encryption
- [ ] Setup regular database backups
- [ ] Configure Cloudinary security settings

---

## 📦 New Packages Installed

Recently added packages:
```json
{
  "cloudinary": "^2.x.x",
  "multer": "^1.x.x",
  "multer-storage-cloudinary": "^4.x.x"
}
```

All dependencies:
```bash
npm list --depth=0
```

---

## 🎯 Next Steps

After backend setup:

1. ✅ Run migrations
2. ✅ Test all API endpoints
3. ⬜ Build frontend components for new features
4. ⬜ Integrate analytics dashboard (Chart.js or Recharts)
5. ⬜ Add activity logging middleware
6. ⬜ Implement export/import functionality
7. ⬜ Setup monitoring (Sentry, LogRocket)
8. ⬜ Configure CI/CD pipeline

---

## 🆘 Support

Need help?

1. Check this guide first
2. Review `BACKEND_IMPLEMENTATION_COMPLETE.md`
3. Check server logs: `npm run dev` or `heroku logs --tail`
4. Search GitHub Issues
5. Contact: support@ruralbowl.com

---

**Version:** 2.0.0  
**Last Updated:** January 2025  
**Status:** ✅ Production Ready
