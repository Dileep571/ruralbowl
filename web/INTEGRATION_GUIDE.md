# Frontend-Backend Integration Guide

## ✅ Integration Complete!

Your Next.js frontend is now connected to the Node.js backend API.

## 📁 Files Created/Updated

### New Files:
1. **`web/.env.local`** - Environment configuration with API URL
2. **`web/src/lib/api.js`** - Main API integration with all endpoints
3. **`web/src/lib/auth.js`** - Authentication helper functions
4. **`web/src/lib/data.js`** - Products and data fetching functions (updated)
5. **`web/src/lib/cart.js`** - Cart management functions
6. **`web/src/lib/orders.js`** - Order management functions

## 🔧 Configuration

### Environment Variables (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 📚 Available API Functions

### Authentication (`auth.js`)
```javascript
import { login, register, logout, getCurrentUser, isAuthenticated, updateProfile } from '@/lib/auth';

// Login
const result = await login(email, password);

// Register
const result = await register(name, email, password, phone, address);

// Logout
logout();

// Get current user
const user = getCurrentUser();

// Check if authenticated
const isAuth = isAuthenticated();
```

### Products (`data.js`)
```javascript
import { getProducts, getProductById, getCategories, searchProducts } from '@/lib/data';

// Get all products
const products = await getProducts();

// Get products by category
const products = await getProductsByCategory('vegetables');

// Get single product
const product = await getProductById(1);

// Get categories
const categories = await getCategories();

// Search products
const results = await searchProducts('tomato');
```

### Cart (`cart.js`)
```javascript
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '@/lib/cart';

// Get cart items
const cart = await getCart();

// Add to cart
const result = await addToCart(productId, quantity);

// Update cart item
const result = await updateCartItem(cartItemId, newQuantity);

// Remove from cart
const result = await removeFromCart(cartItemId);

// Clear cart
const result = await clearCart();
```

### Orders (`orders.js`)
```javascript
import { createOrder, getOrders, getOrderById } from '@/lib/orders';

// Create order
const result = await createOrder({
  shipping_address: 'Your address',
  payment_method: 'cash',
  notes: 'Optional notes'
});

// Get user orders
const orders = await getOrders();

// Get single order
const order = await getOrderById(orderId);
```

## 🔄 How to Use in Components

### Example: Login Component
```javascript
'use client';
import { useState } from 'react';
import { login } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    
    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {error && <p className="text-red-500">{error}</p>}
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input 
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Example: Products List Component
```javascript
'use client';
import { useState, useEffect } from 'react';
import { getProducts } from '@/lib/data';

export default function ProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const data = await getProducts();
      setProducts(data);
      setLoading(false);
    };
    
    fetchProducts();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>₹{product.price}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example: Add to Cart
```javascript
import { addToCart } from '@/lib/cart';

const handleAddToCart = async (productId) => {
  const result = await addToCart(productId, 1);
  
  if (result.success) {
    alert('Added to cart!');
  } else {
    alert('Error: ' + result.error);
  }
};
```

## 🚨 Important Notes

### 1. Authentication
- JWT token is automatically stored in `localStorage` after login
- Token is automatically sent with all protected API requests
- Use `isAuthenticated()` to check if user is logged in
- Use `getCurrentUser()` to get user data

### 2. Error Handling
All API functions handle errors gracefully and return:
- `{ success: true, data: ... }` on success
- `{ success: false, error: 'message' }` on error

### 3. Protected Routes
For pages that require authentication:
```javascript
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export default function ProtectedPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
    }
  }, [router]);

  return <div>Protected content</div>;
}
```

## 🧪 Testing the Integration

1. **Start both servers:**
   ```bash
   # Backend (already running on port 5000)
   cd server
   npm run dev

   # Frontend (in a new terminal)
   cd web
   npm run dev
   ```

2. **Test the connection:**
   - Open http://localhost:3000
   - Try registering a new user
   - Browse products
   - Add items to cart
   - Create an order

3. **Check API responses:**
   - Open browser DevTools > Network tab
   - Watch API calls to http://localhost:5000/api

## 🔍 Debugging Tips

### Check Backend Connection
```javascript
// In browser console
fetch('http://localhost:5000/api/health')
  .then(r => r.json())
  .then(console.log);
// Should return: { status: "OK", message: "RuralBowl API is running" }
```

### Check Authentication
```javascript
// In browser console
localStorage.getItem('token'); // Should show JWT token
localStorage.getItem('user');  // Should show user data
```

### Common Issues

1. **CORS Error**: Make sure backend is running on port 5000
2. **401 Unauthorized**: Token expired or not logged in
3. **Network Error**: Backend not running or wrong URL

## 📝 Next Steps

1. Update your existing components to use the new API functions
2. Replace mock data with real API calls
3. Add loading states and error handling to UI
4. Implement proper authentication guards for protected routes
5. Test all features end-to-end

## 🎯 API Endpoints Available

- ✅ Authentication (login, register, profile)
- ✅ Products (list, detail, categories, search)
- ✅ Cart (add, update, remove, clear)
- ✅ Orders (create, list, detail)
- ✅ Dashboard (calendar, subscriptions)

All endpoints are documented in `server/README.md`
