# 🚀 Quick Start Guide - New Authentication System

## For Developers

### 🔄 What Changed?

**Before**: Tokens stored in `localStorage`
```javascript
// OLD CODE (removed)
localStorage.setItem('token', data.token);
headers['Authorization'] = `Bearer ${token}`;
```

**After**: Tokens in HttpOnly cookies
```javascript
// NEW CODE (automatic)
credentials: 'include'  // Cookies sent automatically
// No token handling needed in your code!
```

---

## 🛠️ Quick Setup (5 Minutes)

### 1. Restart Backend
```bash
cd server
npm run dev
```

### 2. Test Login Flow
```bash
# Terminal test
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"test123"}' \
  -c cookies.txt -v
```

Look for `Set-Cookie` headers in response!

### 3. Clear Browser Storage
- Open DevTools (F12)
- Application → Storage → Clear site data
- Refresh page

### 4. Try Signup/Login
- Go to `/auth/signup`
- Register with email
- Verify OTP
- Check cookies in DevTools

---

## 📝 Key Files Modified

### Backend
1. `server/src/controllers/authController.js` - Cookie handling
2. `server/src/middleware/auth.js` - Read from cookies
3. `server/src/middleware/rateLimiter.js` - **NEW** rate limiting
4. `server/src/routes/authRoutes.js` - Applied rate limiters
5. `server/src/controllers/otpController.js` - OTP hashing

### Frontend
1. `web/src/lib/api.js` - Removed token storage
2. `web/src/lib/auth.js` - Updated function signatures
3. `web/src/lib/authApi.js` - Cookie-based requests
4. `web/src/components/AuthProvider.js` - Removed token state
5. `web/src/app/auth/login/page.js` - Updated login call
6. `web/src/app/auth/signup/page.js` - Updated signup call

---

## 🔐 Environment Variables

Add to `.env`:
```env
ACCESS_TOKEN_COOKIE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30
```

---

## 🧪 Testing Checklist

- [ ] Signup with OTP works
- [ ] Login sets cookies (check Network tab)
- [ ] Protected pages load (cart, dashboard)
- [ ] Logout clears cookies
- [ ] No `token` in localStorage (only `user`)
- [ ] Auto-refresh works after 15 min

---

## ⚠️ Breaking Changes

### For Existing Users
**Action Required**: All users must log out and log back in

### For Developers
1. Remove any manual `Authorization` header setting
2. Add `credentials: 'include'` to all fetch calls
3. Don't access `token` from localStorage (it's gone)

---

## 🆘 Common Issues

**Q: Login works but API calls fail with 401**
A: Add `credentials: 'include'` to fetch config

**Q: Cookies not being sent**
A: Check CORS `credentials: true` is enabled

**Q: Can't see cookies in DevTools**
A: HttpOnly cookies are hidden - check Network tab instead

**Q: Rate limit errors**
A: Wait 15 minutes or reduce limits in `rateLimiter.js`

---

## 📊 Security Features Added

✅ HttpOnly cookies (XSS protection)
✅ Refresh token rotation
✅ Rate limiting (5 attempts per 15 min)
✅ OTP hashing (bcrypt)
✅ CSRF protection (SameSite=Lax)
✅ DB-backed token revocation

---

## 📚 Read Full Documentation
See: `PRODUCTION_AUTH_UPGRADE_COMPLETE.md`

---

**Need Help?** Check the troubleshooting section in the full documentation.
