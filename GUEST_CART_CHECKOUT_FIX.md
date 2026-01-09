# 🔧 Critical Fix: Guest Cart & Checkout Breaking Issue

## Problem Identified

When guest (non-logged-in) users added products to cart and tried to checkout, the application would completely break, causing:
1. Checkout page to crash with authentication errors
2. Backend continuously running delivery/cart tasks
3. Infinite error loops

## Root Causes

### Issue 1: Checkout Authentication Error
**Location**: `web/src/app/checkout/page.js`

**Problem**: 
- Checkout was calling `cartAPI.get()` directly
- This API endpoint requires authentication (cookies)
- Guest users have cart stored in `localStorage` only
- Result: 401 errors, infinite redirect loops

**Fix**:
- Replaced direct `cartAPI.get()` with `useCart()` from CartProvider
- Added authentication check at the start of checkout
- Redirects to login with return URL: `/auth/login?redirect=/checkout`
- CartProvider handles both guest (localStorage) and authenticated (server) carts

### Issue 2: Cart Merge Using Old Auth
**Location**: `web/src/components/CartProvider.js`

**Problem**:
- Cart merge was using `localStorage.getItem('token')` for Authorization header
- After cookie upgrade, tokens are in HttpOnly cookies (not localStorage)
- Result: Cart merge failing silently, infinite retry loops

**Fix**:
- Removed `Authorization: Bearer` header
- Added `credentials: 'include'` to send HttpOnly cookies
- Server automatically reads `accessToken` from cookie

## Files Modified

### 1. `web/src/app/checkout/page.js`
**Changes**:
- Added `useCart()` and `useAuth()` hooks
- Removed direct `cartAPI.get()` call
- Added auth check: redirects to login if not authenticated
- Replaced all `items` references with `cart` from CartProvider
- Simplified data loading (no cart fetch needed)

**Before**:
```javascript
const [items, setItems] = useState([]);
const [cartData] = await Promise.all([cartAPI.get(), ...]);
setItems(arr);
```

**After**:
```javascript
const { cart } = useCart();
const { isAuthenticated } = useAuth();

if (!isAuthenticated) {
  router.push('/auth/login?redirect=/checkout');
  return;
}
// Use cart directly from CartProvider
```

### 2. `web/src/components/CartProvider.js`
**Changes**:
- Updated `mergeGuestCartToServer()` to use cookies instead of localStorage token

**Before**:
```javascript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
}
```

**After**:
```javascript
headers: {
  'Content-Type': 'application/json',
},
credentials: 'include', // Send HttpOnly cookies
```

## How It Works Now

### Guest User Flow
1. User adds products to cart → Stored in `localStorage`
2. User clicks "Checkout" → Redirected to `/auth/login?redirect=/checkout`
3. User logs in → Cart automatically merged to server
4. Redirected back to `/checkout` → Cart loads from server
5. Checkout proceeds normally

### Authenticated User Flow
1. User adds products to cart → Sent directly to server
2. User clicks "Checkout" → Loads instantly (cart already in CartProvider)
3. Checkout proceeds normally

## Testing Checklist

- [x] Guest user can add items to cart
- [x] Guest user attempting checkout is redirected to login
- [x] After login, cart items are preserved
- [x] Authenticated user can checkout directly
- [x] No infinite loops in console
- [x] Backend not continuously running tasks
- [x] Cart merge works after login
- [x] Cookies are sent with all authenticated requests

## Additional Benefits

This fix also ensures:
- ✅ No more authentication errors on checkout
- ✅ Proper separation of guest vs authenticated flows
- ✅ Cart state managed centrally by CartProvider
- ✅ Seamless cart persistence across login
- ✅ No infinite API retry loops
- ✅ Better error handling and user feedback

## Related Files

- `web/src/components/CartProvider.js` - Cart state management
- `web/src/app/checkout/page.js` - Checkout page
- `web/src/lib/api.js` - API client with cookie auth
- `server/src/middleware/auth.js` - Cookie-based auth middleware

---

**Status**: ✅ FIXED
**Date**: January 10, 2026
**Impact**: Critical - Prevents checkout from breaking for guest users
