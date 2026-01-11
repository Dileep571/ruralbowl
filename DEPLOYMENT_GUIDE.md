# RuralBowl Deployment Guide

Complete guide to deploy your RuralBowl application to Render (Backend) and Vercel (Frontend).

## Prerequisites

✅ Your database is already hosted on Neon PostgreSQL (configured in .env)
✅ Images are hosted on Cloudinary
✅ Gmail SMTP for email notifications

---

## 🚀 Part 1: Deploy Backend to Render

### Step 1: Prepare Backend for Deployment

1. **Update server/package.json** (Already configured ✓)
   - The `start` script uses `node src/server.js`
   - All dependencies are listed

2. **Environment Variables** - You'll need to set these in Render dashboard:
   ```
   NODE_ENV=production
   PORT=10000
   
   # Database (Use your existing Neon PostgreSQL credentials)
   DB_HOST=ep-lively-flower-a18w6w64-pooler.ap-southeast-1.aws.neon.tech
   DB_PORT=5432
   DB_NAME=neondb
   DB_USER=neondb_owner
   DB_PASSWORD=npg_j6BbU0FHJhKL
   DB_POOL_MAX=20
   
   # JWT (Render can generate this)
   JWT_SECRET=<auto-generate-or-copy-from-local>
   JWT_EXPIRE=7d
   REFRESH_TOKEN_EXPIRE_DAYS=30
   
   # Frontend URL (Add after deploying to Vercel)
   FRONTEND_URL=https://your-app.vercel.app
   
   # Email Configuration
   EMAIL_USER=pdileep.wd@gmail.com
   EMAIL_PASSWORD=qqzbnlpevcyzqckp
   ADMIN_EMAIL=pdileep.wd@gmail.com
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=denjrgouo
   CLOUDINARY_API_KEY=459492424647913
   CLOUDINARY_API_SECRET=W4YlIs8o3g50DDikgtjVryswOYY
   ```

### Step 2: Deploy to Render

1. **Push code to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Ready for deployment"
   git remote add origin https://github.com/yourusername/ruralbowl.git
   git push -u origin main
   ```

2. **Create Render Account**:
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

3. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `ruralbowl-api`
     - **Region**: Singapore (or closest to your users)
     - **Branch**: `main`
     - **Root Directory**: `server`
     - **Runtime**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `node src/server.js`
     - **Instance Type**: Free (or Starter $7/month for better performance)

4. **Add Environment Variables**:
   - In Render dashboard, go to "Environment" tab
   - Add all variables from Step 1 above
   - Click "Save Changes"

5. **Deploy**:
   - Render will automatically deploy
   - Wait for build to complete (2-3 minutes)
   - Your API will be at: `https://ruralbowl-api.onrender.com`

### Step 3: Test Backend

Visit these URLs to verify:
- Health check: `https://your-api.onrender.com/api/health`
- Products: `https://your-api.onrender.com/api/products`

---

## 🌐 Part 2: Deploy Frontend to Vercel

### Step 1: Prepare Frontend

1. **Update Environment Variable**:
   - You'll set `NEXT_PUBLIC_API_URL` in Vercel dashboard to your Render API URL

2. **Verify next.config.js** (Already configured ✓)
   - Image domains include Cloudinary
   - Security headers are set

### Step 2: Deploy to Vercel

1. **Install Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   ```

2. **Deploy via Vercel Dashboard** (Recommended):
   
   a. Go to [vercel.com](https://vercel.com)
   
   b. Click "Add New" → "Project"
   
   c. Import your GitHub repository
   
   d. Configure project:
      - **Framework Preset**: Next.js (auto-detected)
      - **Root Directory**: `web`
      - **Build Command**: `npm run build` (auto-detected)
      - **Output Directory**: `.next` (auto-detected)
   
   e. **Add Environment Variables**:
      - Click "Environment Variables"
      - Add:
        ```
        NEXT_PUBLIC_API_URL=https://ruralbowl-api.onrender.com/api
        ```
      - Apply to: Production, Preview, Development
   
   f. Click "Deploy"

3. **Alternative: Deploy via CLI**:
   ```bash
   cd web
   vercel
   # Follow the prompts
   # Add environment variable when prompted:
   # NEXT_PUBLIC_API_URL=https://ruralbowl-api.onrender.com/api
   ```

### Step 3: Update Backend CORS

After deploying frontend, update backend environment variable on Render:

1. Go to Render dashboard → Your service → Environment
2. Update `FRONTEND_URL` to your Vercel URL:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. Save and redeploy

---

## ⚙️ Important Configuration Updates

### 1. Update CORS Origins (Backend)

The backend is already configured to use `process.env.FRONTEND_URL`. Just ensure this is set correctly in Render.

### 2. API URL (Frontend)

Vercel will automatically use the environment variable `NEXT_PUBLIC_API_URL` you set.

### 3. Database Connection

Your Neon database is already configured for cloud hosting. No changes needed!

---

## 🔍 Post-Deployment Checklist

- [ ] Backend health check returns 200
- [ ] Frontend loads without errors
- [ ] Login/Register works
- [ ] Products display correctly
- [ ] Images load from Cloudinary
- [ ] Cart functionality works
- [ ] Checkout process works
- [ ] Email notifications work
- [ ] Admin dashboard accessible

---

## 🐛 Troubleshooting

### Backend Issues

**Error: Cannot connect to database**
- Verify Neon database credentials in Render environment variables
- Check if Neon database allows connections from Render IPs

**Error: CORS policy**
- Ensure `FRONTEND_URL` in Render matches your Vercel URL exactly
- Don't include trailing slash

**Error: Module not found**
- Check that all dependencies are in `package.json`
- Ensure `node_modules` is in `.gitignore`

### Frontend Issues

**Error: Failed to fetch from API**
- Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel
- Check that backend is running on Render
- Test API endpoint directly in browser

**Error: Images not loading**
- Verify Cloudinary credentials
- Check `next.config.js` image domains

**Build fails on Vercel**
- Check build logs for specific errors
- Ensure all dependencies are in `package.json`
- Try `npm install && npm run build` locally first

---

## 🔒 Security Recommendations

1. **Environment Variables**:
   - Never commit `.env` files
   - Use Render/Vercel secret management
   - Rotate JWT_SECRET periodically

2. **Database**:
   - Neon already provides SSL connections
   - Consider enabling IP restrictions in Neon dashboard

3. **API Keys**:
   - Rotate Cloudinary keys if exposed
   - Use App-specific passwords for Gmail

4. **HTTPS**:
   - Both Render and Vercel provide SSL automatically ✓

---

## 💰 Cost Estimates

### Free Tier (Good for testing)
- **Render**: Free tier (spins down after inactivity)
- **Vercel**: Free tier (100GB bandwidth, unlimited deployments)
- **Neon**: Free tier (0.5GB storage, shared compute)
- **Cloudinary**: Free tier (25GB storage, 25GB bandwidth)
- **Total**: $0/month

### Production (Recommended)
- **Render**: Starter plan $7/month (always on, 512MB RAM)
- **Vercel**: Pro plan $20/month (1TB bandwidth, team features)
- **Neon**: Pro plan $19/month (dedicated compute, 10GB storage)
- **Cloudinary**: Plus plan $99/month (if needed for high traffic)
- **Total**: ~$46-146/month depending on scale

---

## 🔄 Continuous Deployment

Both Render and Vercel support automatic deployments:

1. Push code to GitHub
2. Both platforms automatically detect changes
3. Run builds and deploy
4. Zero downtime deployments

To disable auto-deploy:
- **Render**: Settings → Auto-Deploy (toggle off)
- **Vercel**: Project Settings → Git → Production Branch (toggle off)

---

## 📝 Next Steps After Deployment

1. **Custom Domain** (Optional):
   - Add custom domain in Vercel dashboard
   - Update DNS records
   - Update `FRONTEND_URL` in Render

2. **Monitoring**:
   - Enable error tracking (Sentry, LogRocket)
   - Set up uptime monitoring (UptimeRobot)
   - Configure Render email alerts

3. **Backups**:
   - Neon provides automatic backups
   - Consider exporting data periodically

4. **Performance**:
   - Enable Vercel Analytics
   - Monitor Render metrics
   - Optimize images with Cloudinary

---

## 📞 Support Resources

- **Render**: [docs.render.com](https://docs.render.com)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Neon**: [neon.tech/docs](https://neon.tech/docs)

---

## Quick Deploy Commands

```bash
# Backend (if using Render CLI)
cd server
render init

# Frontend (if using Vercel CLI)
cd web
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL production
```

---

**Ready to deploy!** Start with Part 1 (Backend to Render), then Part 2 (Frontend to Vercel).
