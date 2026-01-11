# 🚀 Quick Deployment Checklist

Use this checklist to deploy RuralBowl to production.

## Pre-Deployment

- [ ] All code committed to Git
- [ ] .env files are NOT committed (check .gitignore)
- [ ] Backend runs locally without errors (`cd server && node start.js`)
- [ ] Frontend runs locally without errors (`cd web && npm run build`)
- [ ] Database schema is up to date on Neon
- [ ] All API endpoints tested

## Backend Deployment (Render)

### Setup
- [ ] Create Render account at [render.com](https://render.com)
- [ ] Connect GitHub repository
- [ ] Create new Web Service
- [ ] Set Root Directory: `server`
- [ ] Set Build Command: `npm install`
- [ ] Set Start Command: `node src/server.js`
- [ ] Choose region: Singapore (or closest)

### Environment Variables
Copy these to Render dashboard → Environment tab:

```bash
NODE_ENV=production
PORT=10000

# Database (Your existing Neon credentials)
DB_HOST=ep-lively-flower-a18w6w64-pooler.ap-southeast-1.aws.neon.tech
DB_PORT=5432
DB_NAME=neondb
DB_USER=neondb_owner
DB_PASSWORD=npg_j6BbU0FHJhKL
DB_POOL_MAX=20

# JWT
JWT_SECRET=5169E87444B291E4A9089731A284B197B3BF87B4E206A0332ABB6377FF0BDD412FDFC15BBAB32614B9365AFFD808E02BADA0540E458CDBFBC5436947F867B0E9
JWT_EXPIRE=7d
REFRESH_TOKEN_EXPIRE_DAYS=30

# CORS - Update after deploying frontend
FRONTEND_URL=https://your-app.vercel.app

# Email
EMAIL_USER=pdileep.wd@gmail.com
EMAIL_PASSWORD=qqzbnlpevcyzqckp
ADMIN_EMAIL=pdileep.wd@gmail.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=denjrgouo
CLOUDINARY_API_KEY=459492424647913
CLOUDINARY_API_SECRET=W4YlIs8o3g50DDikgtjVryswOYY
```

### Verify Backend
- [ ] Deployment completes successfully
- [ ] Visit: `https://your-api.onrender.com/api/health`
- [ ] Check logs for errors
- [ ] Test API endpoints

**Your Backend URL**: `https://ruralbowl-api.onrender.com` ✍️ Write it down!

---

## Frontend Deployment (Vercel)

### Setup
- [ ] Create Vercel account at [vercel.com](https://vercel.com)
- [ ] Click "New Project"
- [ ] Import GitHub repository
- [ ] Set Root Directory: `web`
- [ ] Framework: Next.js (auto-detected)

### Environment Variables
Add in Vercel dashboard → Settings → Environment Variables:

```bash
NEXT_PUBLIC_API_URL=https://ruralbowl-api.onrender.com/api
```

Apply to: ✅ Production ✅ Preview ✅ Development

### Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete (2-3 minutes)
- [ ] Visit your site

**Your Frontend URL**: `https://ruralbowl.vercel.app` ✍️ Write it down!

---

## Post-Deployment

### Update Backend CORS
- [ ] Go to Render → Your service → Environment
- [ ] Update `FRONTEND_URL` with your Vercel URL
- [ ] Click "Save" (auto-redeploys)

### Test Everything
- [ ] Homepage loads
- [ ] Products display
- [ ] Images load from Cloudinary
- [ ] Login/Register works
- [ ] Add to cart works
- [ ] Checkout works
- [ ] Email notifications work
- [ ] Admin dashboard works
- [ ] All API calls succeed (check browser console)

### Monitor
- [ ] Check Render logs for backend errors
- [ ] Check Vercel deployment logs
- [ ] Test on mobile device
- [ ] Test on different browsers

---

## If Something Goes Wrong

### Backend not responding
1. Check Render logs for errors
2. Verify all environment variables are set
3. Check Neon database is accessible
4. Test API directly: `curl https://your-api.onrender.com/api/health`

### Frontend not loading
1. Check Vercel deployment logs
2. Verify build succeeded
3. Check `NEXT_PUBLIC_API_URL` is set correctly
4. Open browser console for errors

### CORS errors
1. Verify `FRONTEND_URL` in Render matches Vercel URL exactly
2. No trailing slash in URLs
3. Redeploy backend after changing FRONTEND_URL

### Database errors
1. Check Neon dashboard - database is running
2. Verify credentials in Render environment
3. Check connection pooling settings

---

## URLs to Bookmark

- **Frontend**: https://your-app.vercel.app
- **Backend API**: https://your-api.onrender.com/api
- **Backend Health**: https://your-api.onrender.com/api/health
- **Render Dashboard**: https://dashboard.render.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Neon Dashboard**: https://console.neon.tech

---

## Optional: Custom Domain

### For Frontend (Vercel)
1. Go to Vercel → Your project → Settings → Domains
2. Add your domain (e.g., ruralbowl.com)
3. Update DNS records (Vercel provides instructions)
4. Wait for DNS propagation (5 mins - 48 hours)

### For Backend (Render)
1. Go to Render → Your service → Settings → Custom Domain
2. Add your API subdomain (e.g., api.ruralbowl.com)
3. Update DNS records
4. Update `NEXT_PUBLIC_API_URL` in Vercel

### After Custom Domain
- [ ] Update `FRONTEND_URL` in Render
- [ ] Update `NEXT_PUBLIC_API_URL` in Vercel
- [ ] Test everything again

---

## Cost Breakdown

### Free Tier (Good for testing/MVP)
- Render: Free (spins down after 15 min inactivity)
- Vercel: Free (100GB bandwidth/month)
- Neon: Free (0.5GB storage)
- Cloudinary: Free (25GB/month)
- **Total: $0/month**

⚠️ Note: Free Render service takes 50s to wake up from sleep

### Production Ready
- Render Starter: $7/month (always on, 512MB RAM)
- Vercel Pro: $20/month (optional, for team/analytics)
- Neon Pro: $19/month (optional, for more storage/performance)
- **Total: $7-46/month**

---

## Quick Commands

```bash
# Test backend locally
cd server
node start.js

# Test frontend locally
cd web
npm run build
npm start

# Deploy to Vercel (CLI method)
cd web
vercel --prod

# Check if ports are in use
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess
```

---

**Ready? Start with Backend Deployment, then Frontend, then Post-Deployment steps!**

For detailed instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
