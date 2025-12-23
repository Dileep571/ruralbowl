# 🛒 Cart Issue Fix - Authentication Required

## Problem: 401 Unauthorized

The cart endpoints require authentication. You need to login first to get a token.

## Solution: Login & Get Token

### Step 1: Login (Choose one user)

**Option A: Login as Customer**
```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@gmail.com\",\"password\":\"test123\"}"
```

**Option B: Login as Admin**
```bash
curl -X POST http://localhost:5000/api/admin/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "test",
    "email": "test@gmail.com",
    "role": "customer"
  }
}
```

### Step 2: Use Token in Cart Requests

Copy the token and use it in the `Authorization` header:

```bash
# Add to cart
curl -X POST http://localhost:5000/api/cart ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -H "Content-Type: application/json" ^
  -d "{\"product_id\":1,\"quantity\":2}"

# Get cart
curl -X GET http://localhost:5000/api/cart ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔧 Frontend Fix

If you're using the frontend (Next.js), make sure you're doing this:

### 1. Login First (web/src/lib/auth.js)
```javascript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();
// Store token
localStorage.setItem('token', data.token);
```

### 2. Use Token in Cart Requests (web/src/lib/cart.js)
```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:5000/api/cart', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` // ⚠️ Must include this!
  },
  body: JSON.stringify({ product_id, quantity })
});
```

---

## 🎯 Quick Test (PowerShell)

Run this to test the full flow:

```powershell
# 1. Login and get token
$loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"test@gmail.com","password":"test123"}' `
  -UseBasicParsing

$token = ($loginResponse.Content | ConvertFrom-Json).token
Write-Host "✅ Token: $token"

# 2. Add product to cart
$cartResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/cart" `
  -Method POST `
  -Headers @{Authorization="Bearer $token"} `
  -ContentType "application/json" `
  -Body '{"product_id":1,"quantity":2}' `
  -UseBasicParsing

Write-Host "✅ Cart Response:"
$cartResponse.Content | ConvertFrom-Json | ConvertTo-Json
```

---

## 📋 Available Test Accounts

| Email | Password | Role |
|-------|----------|------|
| test@gmail.com | test123 | customer |
| admin@ruralbowl.com | admin123 | admin |

---

## 🔍 Common Issues

### Issue 1: "Token is not valid"
- Token expired (7 days by default)
- Login again to get a new token

### Issue 2: "No token provided"
- Check Authorization header format: `Bearer YOUR_TOKEN`
- Make sure there's a space after "Bearer"

### Issue 3: Still 401 after adding token
- Verify token is not expired
- Check you're using the correct endpoint (customer vs admin)
- Ensure token string is complete (no truncation)

---

## ✅ Verification Steps

1. **Check server is running**: http://localhost:5000/api/health
2. **Login works**: Should return `{ "token": "...", "user": {...} }`
3. **Token in header**: Format must be exactly `Authorization: Bearer TOKEN`
4. **Cart endpoint**: http://localhost:5000/api/cart (requires auth)

---

## 🆕 Create New User Account

If you want to create a new test account:

```bash
curl -X POST http://localhost:5000/api/auth/signup ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"John Doe\",\"email\":\"john@example.com\",\"password\":\"password123\",\"phone\":\"9876543210\"}"
```
