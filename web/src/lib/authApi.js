// Frontend Authentication & API Helper
// Drop this in your Next.js project: web/src/lib/authApi.js

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class AuthAPI {
  constructor() {
    this.token = null;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  // Get authorization headers
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Generic API request
  async request(endpoint, options = {}) {
    const config = {
      ...options,
      headers: this.getHeaders(options.requireAuth !== false),
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle 401 Unauthorized
        if (response.status === 401) {
          this.logout();
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // ============= AUTH =============
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      requireAuth: false,
      body: JSON.stringify({ email, password }),
    });

    this.token = data.token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  }

  async signup(name, email, password, phone) {
    const data = await this.request('/auth/signup', {
      method: 'POST',
      requireAuth: false,
      body: JSON.stringify({ name, email, password, phone }),
    });

    this.token = data.token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  }

  logout() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  getUser() {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  isAuthenticated() {
    return !!this.token;
  }

  // ============= PRODUCTS =============
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/products${query ? '?' + query : ''}`, { requireAuth: false });
  }

  async getProduct(id) {
    return this.request(`/products/${id}`, { requireAuth: false });
  }

  async getCategories() {
    return this.request('/products/categories', { requireAuth: false });
  }

  // ============= CART =============
  async getCart() {
    return this.request('/cart');
  }

  async addToCart(product_id, quantity = 1) {
    return this.request('/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id, quantity }),
    });
  }

  async updateCartItem(id, quantity) {
    return this.request(`/cart/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(id) {
    return this.request(`/cart/${id}`, {
      method: 'DELETE',
    });
  }

  async clearCart() {
    return this.request('/cart', {
      method: 'DELETE',
    });
  }

  // ============= ORDERS =============
  async getOrders() {
    return this.request('/orders');
  }

  async getOrder(id) {
    return this.request(`/orders/${id}`);
  }

  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // ============= SUBSCRIPTIONS =============
  async getSubscriptionPlans() {
    return this.request('/subscriptions/plans', { requireAuth: false });
  }

  async getMySubscriptions() {
    return this.request('/subscriptions');
  }

  async purchaseSubscription(planData) {
    return this.request('/subscriptions/purchase', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  }

  async getSubscriptionCalendar(id, month, year) {
    return this.request(`/subscriptions/${id}/calendar?month=${month}&year=${year}`);
  }

  async skipDelivery(deliveryId, reason) {
    return this.request(`/subscriptions/deliveries/${deliveryId}/skip`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async rescheduleDelivery(deliveryId, new_date) {
    return this.request(`/subscriptions/deliveries/${deliveryId}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify({ new_date }),
    });
  }

  async pauseSubscription(id, pause_start_date, pause_end_date, reason) {
    return this.request(`/subscriptions/${id}/pause`, {
      method: 'PATCH',
      body: JSON.stringify({ pause_start_date, pause_end_date, reason }),
    });
  }

  async resumeSubscription(id) {
    return this.request(`/subscriptions/${id}/resume`, {
      method: 'PATCH',
    });
  }

  async cancelSubscription(id, reason) {
    return this.request(`/subscriptions/${id}/cancel`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });
  }

  // ============= WALLET =============
  async getWalletBalance() {
    return this.request('/wallet/balance');
  }

  async getWallet() {
    return this.request('/wallet');
  }

  async getWalletTransactions(page = 1, limit = 20) {
    return this.request(`/wallet/transactions?page=${page}&limit=${limit}`);
  }

  async addMoneyToWallet(amount, payment_id) {
    return this.request('/wallet/add', {
      method: 'POST',
      body: JSON.stringify({ amount, payment_id }),
    });
  }

  // ============= WISHLIST =============
  async getWishlist() {
    return this.request('/wishlist');
  }

  async addToWishlist(product_id) {
    return this.request('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ product_id }),
    });
  }

  async removeFromWishlist(id) {
    return this.request(`/wishlist/${id}`, {
      method: 'DELETE',
    });
  }

  // ============= REVIEWS =============
  async getProductReviews(productId, page = 1, sortBy = 'recent') {
    return this.request(`/products/${productId}/reviews?page=${page}&sortBy=${sortBy}`, { requireAuth: false });
  }

  async createReview(product_id, rating, title, comment) {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify({ product_id, rating, title, comment }),
    });
  }

  // ============= COUPONS =============
  async getActiveCoupons() {
    return this.request('/coupons/active');
  }

  async validateCoupon(code, order_amount) {
    return this.request('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, order_amount }),
    });
  }

  // ============= DASHBOARD =============
  async getProfile() {
    return this.request('/dashboard/profile');
  }

  async updateProfile(profileData) {
    return this.request('/dashboard/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getDashboardOrders() {
    return this.request('/dashboard/orders');
  }
}

// Export singleton instance
const api = new AuthAPI();
export default api;

// Also export the class for custom instances
export { AuthAPI };
