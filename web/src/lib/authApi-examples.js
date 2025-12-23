// Example usage of authApi.js in your Next.js components

import api from '@/lib/authApi';
import { useState } from 'react';

// ============================================
// Example 1: Login Page
// ============================================
export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const data = await api.login(email, password);
      console.log('Logged in:', data.user);
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input 
        type="password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
}

// ============================================
// Example 2: Product Card with Add to Cart
// ============================================
export function ProductCard({ product }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAddToCart = async () => {
    // Check if logged in
    if (!api.isAuthenticated()) {
      window.location.href = '/login';
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await api.addToCart(product.id, 1);
      setMessage('✓ Added to cart!');
    } catch (error) {
      setMessage('✗ ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-card">
      <img src={product.image_url} alt={product.name} />
      <h3>{product.name}</h3>
      <p>₹{product.price}/{product.unit}</p>
      <button onClick={handleAddToCart} disabled={loading}>
        {loading ? 'Adding...' : 'Add to Cart'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}

// ============================================
// Example 3: Cart Page
// ============================================
export function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const data = await api.getCart();
      setCart(data);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    try {
      await api.updateCartItem(itemId, newQuantity);
      loadCart(); // Reload cart
    } catch (error) {
      alert('Failed to update: ' + error.message);
    }
  };

  const removeItem = async (itemId) => {
    try {
      await api.removeFromCart(itemId);
      loadCart(); // Reload cart
    } catch (error) {
      alert('Failed to remove: ' + error.message);
    }
  };

  if (loading) return <div>Loading cart...</div>;
  if (!cart || cart.items?.length === 0) return <div>Your cart is empty</div>;

  return (
    <div className="cart-page">
      <h1>Shopping Cart</h1>
      {cart.items.map(item => (
        <div key={item.id} className="cart-item">
          <img src={item.product_image} alt={item.product_name} />
          <h3>{item.product_name}</h3>
          <p>₹{item.price} × {item.quantity}</p>
          <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
          <span>{item.quantity}</span>
          <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
          <button onClick={() => removeItem(item.id)}>Remove</button>
        </div>
      ))}
      <div className="cart-total">
        <h3>Total: ₹{cart.total}</h3>
        <button onClick={() => window.location.href = '/checkout'}>
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

// ============================================
// Example 4: Subscription Plans Page
// ============================================
export function SubscriptionPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await api.getSubscriptionPlans();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (planId) => {
    if (!api.isAuthenticated()) {
      window.location.href = '/login?redirect=/subscriptions';
      return;
    }
    window.location.href = `/subscriptions/purchase/${planId}`;
  };

  if (loading) return <div>Loading plans...</div>;

  return (
    <div className="subscription-plans">
      <h1>Subscription Plans</h1>
      <div className="plans-grid">
        {plans.map(plan => (
          <div key={plan.id} className="plan-card">
            <h3>{plan.name}</h3>
            <p>{plan.description}</p>
            <h2>₹{plan.price}</h2>
            <p>{plan.total_deliveries} deliveries</p>
            <p>{plan.validity_days} days validity</p>
            <button onClick={() => handlePurchase(plan.id)}>
              Subscribe Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Example 5: My Orders Page
// ============================================
export function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
      if (error.message.includes('Session expired')) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading orders...</div>;
  if (orders.length === 0) return <div>No orders yet</div>;

  return (
    <div className="orders-page">
      <h1>My Orders</h1>
      {orders.map(order => (
        <div key={order.id} className="order-card">
          <h3>Order #{order.order_number}</h3>
          <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
          <p>Status: {order.status}</p>
          <p>Total: ₹{order.total}</p>
          <button onClick={() => window.location.href = `/orders/${order.id}`}>
            View Details
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Example 6: Protected Route Component
// ============================================
export function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      if (api.isAuthenticated()) {
        setIsAuthenticated(true);
      } else {
        window.location.href = '/login';
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;

  return <>{children}</>;
}

// Usage:
// <ProtectedRoute>
//   <CartPage />
// </ProtectedRoute>

// ============================================
// Example 7: Wallet Component
// ============================================
export function WalletBalance() {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const data = await api.getWalletBalance();
      setBalance(data.balance);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <span>Loading...</span>;

  return (
    <div className="wallet-balance">
      <span>Wallet: ₹{balance}</span>
    </div>
  );
}

// ============================================
// Example 8: Add to Wishlist
// ============================================
export function WishlistButton({ productId }) {
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleWishlist = async () => {
    if (!api.isAuthenticated()) {
      window.location.href = '/login';
      return;
    }

    setLoading(true);
    try {
      if (inWishlist) {
        await api.removeFromWishlist(productId);
        setInWishlist(false);
      } else {
        await api.addToWishlist(productId);
        setInWishlist(true);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={toggleWishlist} disabled={loading}>
      {inWishlist ? '❤️ In Wishlist' : '🤍 Add to Wishlist'}
    </button>
  );
}
