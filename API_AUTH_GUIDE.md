# 🔐 API Authentication Guide - Fix 401 Errors

## ✅ Test Results

**All APIs are working correctly!** The 401 errors you're seeing are **expected behavior** for protected endpoints.

```
✅ PUBLIC (No Auth):
   - Products         ✓
   - Categories       ✓  
   - Subscription Plans ✓
   - Health Check     ✓

✅ PROTECTED (Requires Auth):
   - Cart             ✓
   - Orders           ✓
   - Subscriptions    ✓
   - Wallet           ✓
   - Wishlist         ✓
```

---

## 🎯 How to Use Protected APIs

### Step 1: Login First

```javascript
// POST http://localhost:5000/api/auth/login
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@gmail.com',
    password: 'test123'
  })
})
.then(res => res.json())
.then(data => {
  // Save token
  localStorage.setItem('token', data.token);
  console.log('Logged in as:', data.user.name);
});
```

### Step 2: Use Token in All Protected Requests

```javascript
const token = localStorage.getItem('token');

// Example: Get Cart
fetch('http://localhost:5000/api/cart', {
  headers: {
    'Authorization': `Bearer ${token}` // ← Add this!
  }
})
.then(res => res.json())
.then(data => console.log('Cart:', data));

// Example: Add to Cart
fetch('http://localhost:5000/api/cart', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` // ← Add this!
  },
  body: JSON.stringify({
    product_id: 1,
    quantity: 2
  })
})
.then(res => res.json())
.then(data => console.log('Added:', data));
```

---

## 📋 API Endpoints Breakdown

### 🌍 PUBLIC (No Login Required)

```bash
GET  /api/health                    # Server health check
GET  /api/products                  # List all products
GET  /api/products/categories       # List categories
GET  /api/products/:id              # Get single product
GET  /api/subscriptions/plans       # Browse subscription plans
POST /api/auth/login                # Login
POST /api/auth/signup               # Register
POST /api/admin/login               # Admin login
```

### 🔒 PROTECTED (Login Required)

**Cart:**
```bash
GET    /api/cart                    # Get cart items
POST   /api/cart                    # Add to cart
PUT    /api/cart/:id                # Update quantity
DELETE /api/cart/:id                # Remove item
DELETE /api/cart                    # Clear cart
```

**Orders:**
```bash
GET    /api/orders                  # My orders
POST   /api/orders                  # Create order
GET    /api/orders/:id              # Order details
```

**Subscriptions:**
```bash
POST   /api/subscriptions/purchase  # Buy subscription
GET    /api/subscriptions           # My subscriptions
GET    /api/subscriptions/:id/calendar  # Delivery calendar
PATCH  /api/subscriptions/deliveries/:id/skip  # Skip delivery
PATCH  /api/subscriptions/deliveries/:id/reschedule  # Reschedule
PATCH  /api/subscriptions/:id/pause # Pause plan
PATCH  /api/subscriptions/:id/resume # Resume plan
DELETE /api/subscriptions/:id/cancel # Cancel (to wallet)
```

**Wallet:**
```bash
GET    /api/wallet/balance          # Get balance
GET    /api/wallet                  # Balance + transactions
GET    /api/wallet/transactions     # Transaction history
POST   /api/wallet/add              # Add money
```

**Wishlist:**
```bash
GET    /api/wishlist                # Get wishlist
POST   /api/wishlist                # Add item
DELETE /api/wishlist/:id            # Remove item
```

**Dashboard:**
```bash
GET    /api/dashboard/orders        # Order history
GET    /api/dashboard/profile       # User profile
PUT    /api/dashboard/profile       # Update profile
```

---

## 🔑 Test Accounts

| Email | Password | Role |
|-------|----------|------|
| test@gmail.com | test123 | Customer |
| admin@ruralbowl.com | admin123 | Admin |

---

## 🛠️ Frontend Implementation

### React/Next.js Example:

**1. Create Auth Context** (src/context/AuthContext.js):
```javascript
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Load token from localStorage
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      // Optionally: verify token and get user data
    }
  }, []);

  const login = async (email, password) => {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      return { success: true };
    }
    return { success: false, error: data.message };
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

**2. Create API Helper** (src/lib/api.js):
```javascript
const BASE_URL = 'http://localhost:5000/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    }
  };
  
  // Add token if available
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  
  return data;
}

// Helper functions
export const getProducts = () => apiRequest('/products');
export const getCart = () => apiRequest('/cart');
export const addToCart = (product_id, quantity) => 
  apiRequest('/cart', {
    method: 'POST',
    body: JSON.stringify({ product_id, quantity })
  });
export const getOrders = () => apiRequest('/orders');
export const getSubscriptionPlans = () => apiRequest('/subscriptions/plans');
```

**3. Use in Components**:
```javascript
import { useAuth } from '@/context/AuthContext';
import { getCart, addToCart } from '@/lib/api';

export default function ProductCard({ product }) {
  const { token } = useAuth();
  
  const handleAddToCart = async () => {
    if (!token) {
      // Redirect to login
      router.push('/login');
      return;
    }
    
    try {
      await addToCart(product.id, 1);
      alert('Added to cart!');
    } catch (error) {
      if (error.message.includes('401')) {
        alert('Please login first');
        router.push('/login');
      } else {
        alert('Error: ' + error.message);
      }
    }
  };
  
  return (
    <div>
      <h3>{product.name}</h3>
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
}
```

---

## 🐛 Debugging 401 Errors

### Common Issues:

**1. Missing Authorization Header**
```javascript
// ❌ Wrong
fetch('/api/cart')

// ✅ Correct
fetch('/api/cart', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

**2. Incorrect Token Format**
```javascript
// ❌ Wrong
'Authorization': token
'Authorization': `${token}`

// ✅ Correct
'Authorization': `Bearer ${token}`
```

**3. Token Expired**
- Tokens expire after 7 days
- Login again to get a new token

**4. Not Logged In**
- Check if token exists: `localStorage.getItem('token')`
- If null, redirect to login page

**5. Wrong Credentials**
- Verify email/password are correct
- Check user exists in database

---

## 🧪 Test with cURL

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@gmail.com\",\"password\":\"test123\"}"
  
# Copy the token from response

# 2. Use token
curl http://localhost:5000/api/cart \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 3. Add to cart
curl -X POST http://localhost:5000/api/cart \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{\"product_id\":1,\"quantity\":2}"
```

---

## 🧪 Test with Postman

1. **Create Collection**: "RuralBowl API"
2. **Add Login Request**:
   - Method: POST
   - URL: `http://localhost:5000/api/auth/login`
   - Body (JSON): `{"email":"test@gmail.com","password":"test123"}`
3. **Copy Token** from response
4. **Add to Collection Variables**: `token = YOUR_TOKEN`
5. **Use in Other Requests**:
   - Headers: `Authorization: Bearer {{token}}`

---

## ✅ Quick Checklist

- [ ] Server running on port 5000?
- [ ] Logged in and have token?
- [ ] Token stored in localStorage/cookies?
- [ ] Authorization header included?
- [ ] Header format: `Bearer TOKEN`?
- [ ] Token not expired (< 7 days)?
- [ ] Using correct endpoint URL?

---

## 📞 Still Having Issues?

Run diagnostics:
```bash
cd server
node test-all-endpoints.js
```

This will test all endpoints and show which ones are working/failing.
