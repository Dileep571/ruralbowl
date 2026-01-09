# 🔐 Accessing Admin-Only Endpoints

## The Issue

Admin endpoints like `/api/delivery/admin/areas` and `/api/delivery/admin/stats` return:
```json
{"message":"Access denied. Admin only."}
```

This is **CORRECT BEHAVIOR** - these endpoints are protected and require:
1. ✅ Valid authentication token
2. ✅ Admin role in the token

---

## ✅ Solution: Get Admin Token

### Quick Method - Run This Script

```bash
cd c:\Users\kvram\OneDrive\Desktop\ruralbowl_app\server
node get-admin-token.js
```

This will:
- Login as admin
- Get your token
- Show you how to use it
- Test the endpoints automatically

---

## 🌐 For Browser Testing

### Step 1: Open Browser Console
Press `F12` or `Ctrl+Shift+I`

### Step 2: Login and Store Token
```javascript
// Login
fetch('http://localhost:5000/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'ruralbowl',
    password: 'Ruralbowl@2025'
  })
})
.then(r => r.json())
.then(data => {
  localStorage.setItem('adminToken', data.token);
  console.log('✅ Token saved!');
});
```

### Step 3: Test Admin Endpoints
```javascript
// Get delivery areas
fetch('http://localhost:5000/api/delivery/admin/areas', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
  }
})
.then(r => r.json())
.then(data => console.log('Areas:', data));

// Get statistics
fetch('http://localhost:5000/api/delivery/admin/stats', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
  }
})
.then(r => r.json())
.then(data => console.log('Stats:', data));
```

---

## 💻 For PowerShell/Command Line

### Method 1: Using the Helper Script
```powershell
cd c:\Users\kvram\OneDrive\Desktop\ruralbowl_app\server
node get-admin-token.js
```

Copy the curl command it provides.

### Method 2: Manual PowerShell
```powershell
# Get token
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"ruralbowl","password":"Ruralbowl@2025"}'
$token = $response.token

# Use token
$headers = @{ Authorization = "Bearer $token" }

# Get delivery areas
Invoke-RestMethod -Uri "http://localhost:5000/api/delivery/admin/areas" `
  -Headers $headers

# Get stats
Invoke-RestMethod -Uri "http://localhost:5000/api/delivery/admin/stats" `
  -Headers $headers
```

---

## 🔨 For Postman/API Testing

### Step 1: Login
```
POST http://localhost:5000/api/admin/login
Content-Type: application/json

{
  "username": "ruralbowl",
  "password": "Ruralbowl@2025"
}
```

Copy the `token` from response.

### Step 2: Add Token to Requests
In Postman:
1. Click "Authorization" tab
2. Select "Bearer Token"
3. Paste your token

OR add header manually:
```
Authorization: Bearer <your-token-here>
```

### Step 3: Test Endpoints
```
GET http://localhost:5000/api/delivery/admin/areas
GET http://localhost:5000/api/delivery/admin/stats
```

---

## 🌐 For Frontend (React/Next.js)

Your frontend already does this automatically in `web/src/lib/api.js`:

```javascript
// This is already implemented
adminAPI.getAllDeliveryAreas()  // Automatically adds token
adminAPI.getDeliveryStats()     // Automatically adds token
```

The admin dashboard at `/admin/delivery-areas` uses these functions and works correctly.

---

## 📝 Current Token

**Valid for 24 hours:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkBydXJhbGJvd2wuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY3Mzg3OTc2LCJleHAiOjE3Njc0NzQzNzZ9.RCC5s-abuv9SH7PMpx0Q4ftNeWmSmov8RdumrqepM9g
```

**Quick Test (PowerShell):**
```powershell
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkBydXJhbGJvd2wuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzY3Mzg3OTc2LCJleHAiOjE3Njc0NzQzNzZ9.RCC5s-abuv9SH7PMpx0Q4ftNeWmSmov8RdumrqepM9g"
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:5000/api/delivery/admin/areas" -Headers $headers
```

---

## ✅ Verified Working

Both endpoints now work correctly with authentication:

```json
// GET /api/delivery/admin/areas
{
  "success": true,
  "areas": [
    { "id": 1, "area_name": "KR Palli", "city": "Chittoor", "is_active": true },
    { "id": 2, "area_name": "Kattamanchi", "city": "Chittoor", "is_active": true },
    { "id": 3, "area_name": "Mittoor", "city": "Chittoor", "is_active": true }
  ],
  "total": 3
}

// GET /api/delivery/admin/stats
{
  "success": true,
  "stats": [
    { "area_name": "Mittoor", "total_orders": "0", "delivered_orders": "0" },
    { "area_name": "KR Palli", "total_orders": "0", "delivered_orders": "0" },
    { "area_name": "Kattamanchi", "total_orders": "0", "delivered_orders": "0" }
  ]
}
```

---

## 🔒 Why This Security is Good

**Admin endpoints SHOULD be protected!**

✅ Prevents unauthorized access  
✅ Protects sensitive data  
✅ Prevents malicious modifications  
✅ Industry standard security  

**Public endpoints** (no auth needed):
- `GET /api/delivery/areas` - Customers can see available areas
- `GET /api/delivery/areas/:id/check` - Check delivery availability

**Admin endpoints** (auth required):
- Everything under `/api/delivery/admin/*` - Manage areas

---

## 🎯 Summary

**The "Access denied" message is correct behavior.**

To access admin endpoints:
1. ✅ Login first → Get token
2. ✅ Include token in Authorization header
3. ✅ Token must have admin role

**Easiest way:**
```bash
cd server
node get-admin-token.js
```

This shows you exactly how to access the endpoints with proper authentication!
