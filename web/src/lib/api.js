// API Configuration and Helper Functions

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const isDev = process.env.NODE_ENV !== 'production';

// Helper to call refresh endpoint (cookies handled automatically)
const tryRefresh = async () => {
  try {
    if (isDev) console.log('Attempting token refresh');
    const resp = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Send cookies
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await resp.json();
    if (!resp.ok) {
      if (isDev) console.warn('Refresh failed', json);
      return false;
    }
    // Cookies are set automatically by browser
    return true;
  } catch (err) {
    console.error('Refresh error:', err);
    return false;
  }
};

// Helper function to make API requests with cookie-based auth
const apiRequest = async (endpoint, options = {}) => {
  const baseHeaders = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers: baseHeaders,
    credentials: 'include', // CRITICAL: Send HttpOnly cookies
  };

  if (isDev) console.log(`API Request: ${options.method || 'GET'} ${API_URL}${endpoint}`);

  try {
    let response = await fetch(`${API_URL}${endpoint}`, config);
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }

    if (isDev) console.log(`API Response [${response.status}]:`, data);

    // If access token expired, try refresh and retry once
    if (response.status === 401 && data && typeof data.message === 'string' && data.message.toLowerCase().includes('token expired')) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        // Retry original request (cookies auto-sent)
        const retryRes = await fetch(`${API_URL}${endpoint}`, config);
        const retryData = await retryRes.json();
        if (!retryRes.ok) {
          throw new Error(retryData.message || 'Something went wrong');
        }
        return retryData;
      }

      // Refresh failed -> clear user data and throw
      localStorage.removeItem('user');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      throw new Error(data?.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Helper function to make admin API requests with HttpOnly cookies
const adminApiRequest = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
    credentials: 'include', // CRITICAL: Send HttpOnly cookies for admin auth
  };

  if (isDev) console.log(`Admin API Request: ${options.method || 'GET'} ${API_URL}${endpoint}`);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (isDev) console.log(`Admin API Response [${response.status}]:`, data);

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error('Admin API Error:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  register: async (userData) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    // Store user data in localStorage (for UI display)
    // Tokens are in HttpOnly cookies (NOT accessible via JS)
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  login: async (credentials) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Store user data in localStorage (for UI display)
    // Tokens are in HttpOnly cookies (NOT accessible via JS)
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  logout: async () => {
    try {
      // Call server to revoke refresh token and clear cookies
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore server errors on logout
      if (isDev) console.warn('Logout request failed', e);
    }
    // Only remove user data (tokens are HttpOnly cookies)
    localStorage.removeItem('user');
  },

  getMe: async () => {
    return apiRequest('/auth/me');
  },

  updateProfile: async (profileData) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  getCurrentUser: () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  isAuthenticated: () => {
    // Check if user exists in localStorage
    // (Actual auth is via HttpOnly cookie checked by server)
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('user');
    }
    return false;
  },
};

// Products API
export const productsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await apiRequest(`/products${queryString ? `?${queryString}` : ''}`);
    // Backend returns { products: [...], count: N }
    return response?.products || response || [];
  },

  getById: async (id) => {
    const response = await apiRequest(`/products/${id}`);
    // Backend returns { product: {...} }
    return response?.product || response;
  },

  getCategories: async () => {
    const response = await apiRequest('/products/categories', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
    // Backend returns { categories: [...] }
    return response?.categories || response || [];
  },

  create: async (productData) => {
    const response = await apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
    // Backend returns { product: {...}, message: '...' }
    return response?.product || response;
  },

  update: async (id, productData) => {
    const response = await apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
    // Backend returns { product: {...}, message: '...' }
    return response?.product || response;
  },

  delete: async (id) => {
    return apiRequest(`/products/${id}`, {
      method: 'DELETE',
    });
  },
};

// Cart API
export const cartAPI = {
  get: async () => {
    return apiRequest('/cart');
  },

  add: async (product_id, quantity = 1, variant_id = null) => {
    const body = { product_id, quantity };
    if (variant_id) {
      body.variant_id = variant_id;
    }
    return apiRequest('/cart', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  update: async (id, quantity) => {
    return apiRequest(`/cart/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },

  remove: async (id) => {
    return apiRequest(`/cart/${id}`, {
      method: 'DELETE',
    });
  },

  clear: async () => {
    return apiRequest('/cart', {
      method: 'DELETE',
    });
  },
};

// Orders API
export const ordersAPI = {
  create: async (orderData) => {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  getAll: async () => {
    return apiRequest('/orders');
  },

  getById: async (id) => {
    return apiRequest(`/orders/${id}`);
  },

  getAllOrders: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/orders/all${queryString ? `?${queryString}` : ''}`);
  },

  updateStatus: async (id, status, payment_status) => {
    return apiRequest(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, payment_status }),
    });
  },
};

// Dashboard API
export const dashboardAPI = {
  getCalendar: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/dashboard/calendar${queryString ? `?${queryString}` : ''}`);
  },

  addDelivery: async (deliveryData) => {
    return apiRequest('/dashboard/calendar', {
      method: 'POST',
      body: JSON.stringify(deliveryData),
    });
  },

  updateDelivery: async (id, status) => {
    return apiRequest(`/dashboard/calendar/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  getSubscriptionPlans: async () => {
    return apiRequest('/subscriptions/plans');
  },

  getUserSubscription: async () => {
    return apiRequest('/subscriptions');
  },

  subscribe: async (plan_id, subscriptionData) => {
    return apiRequest('/subscriptions/purchase', {
      method: 'POST',
      body: JSON.stringify(subscriptionData || { plan_id }),
    });
  },
};

// Admin API
export const adminAPI = {
  // Authentication
  login: (username, password) => {
    return apiRequest('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },
  logout: () => {
    return apiRequest('/admin/logout', {
      method: 'POST',
    });
  },

  // Dashboard
  getDashboardStats: () => {
    return adminApiRequest('/admin/dashboard/stats');
  },

  // Users Management
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return adminApiRequest(`/admin/users${query ? `?${query}` : ''}`);
  },
  getUserDetails: (id) => {
    return adminApiRequest(`/admin/users/${id}`);
  },
  updateUser: (id, userData) => {
    return adminApiRequest(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // Orders Management
  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return adminApiRequest(`/admin/orders${query ? `?${query}` : ''}`);
  },
  updateOrderStatus: (id, status) => {
    return adminApiRequest(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  updateOrderPaymentStatus: (id, paymentStatus) => {
    return adminApiRequest(`/admin/orders/${id}/payment-status`, {
      method: 'PATCH',
      body: JSON.stringify({ payment_status: paymentStatus }),
    });
  },

  // Products Management
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return adminApiRequest(`/admin/products${query ? `?${query}` : ''}`);
  },
  getProductById: async (id) => {
    const response = await adminApiRequest(`/admin/products/${id}`);
    // Backend returns { product: {...} }
    return response?.product ? response : { product: response };
  },
  createProduct: async (productData) => {
    const response = await adminApiRequest('/admin/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
    // Backend returns { product: {...}, message: '...' }
    return response?.product || response;
  },
  updateProduct: async (id, productData) => {
    const response = await adminApiRequest(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
    // Backend returns { product: {...}, message: '...' }
    return response?.product || response;
  },
  deleteProduct: (id) => {
    return adminApiRequest(`/admin/products/${id}`, {
      method: 'DELETE',
    });
  },
  updateStock: (id, stock_quantity) => {
    return adminApiRequest(`/admin/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock_quantity }),
    });
  },

  // Categories Management
  getCategories: async () => {
    const response = await adminApiRequest('/admin/categories', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
    console.log('getCategories raw response:', response); // Debug
    // Backend returns { categories: [...] }
    if (response && response.categories) {
      return response; // Return the whole object with categories property
    }
    return Array.isArray(response) ? { categories: response } : { categories: [] };
  },
  getCategoryById: async (id) => {
    const response = await adminApiRequest(`/admin/categories/${id}`);
    // Backend returns { category: {...} }
    return response?.category || response;
  },
  createCategory: (categoryData) => {
    return adminApiRequest('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },
  updateCategory: async (id, categoryData) => {
    console.log('updateCategory called with:', { id, categoryData }); // Debug
    const response = await adminApiRequest(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
    console.log('updateCategory response:', response); // Debug
    return response;
  },
  deleteCategory: (id) => {
    return adminApiRequest(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Subscription Plans Management
  getSubscriptionPlans: async () => {
    const response = await adminApiRequest('/admin/subscriptions/plans');
    return response?.plans || response || [];
  },
  createSubscriptionPlan: (planData) => {
    return adminApiRequest('/admin/subscriptions/plans', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  },
  updateSubscriptionPlan: (id, planData) => {
    return adminApiRequest(`/admin/subscriptions/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(planData),
    });
  },
  deleteSubscriptionPlan: (id) => {
    return adminApiRequest(`/admin/subscriptions/plans/${id}`, {
      method: 'DELETE',
    });
  },
  getSubscriptionAnalytics: () => {
    return adminApiRequest('/admin/subscriptions/analytics');
  },

  // Delivery Areas Management
  getAllDeliveryAreas: async () => {
    const response = await adminApiRequest('/delivery/admin/areas');
    return response || { areas: [] };
  },
  createDeliveryArea: (areaData) => {
    return adminApiRequest('/delivery/admin/areas', {
      method: 'POST',
      body: JSON.stringify(areaData),
    });
  },
  updateDeliveryArea: (id, areaData) => {
    return adminApiRequest(`/delivery/admin/areas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(areaData),
    });
  },
  deleteDeliveryArea: (id) => {
    return adminApiRequest(`/delivery/admin/areas/${id}`, {
      method: 'DELETE',
    });
  },
  toggleDeliveryAreaStatus: (id) => {
    return adminApiRequest(`/delivery/admin/areas/${id}/toggle`, {
      method: 'PATCH',
    });
  },
  getDeliveryStats: async () => {
    const response = await adminApiRequest('/delivery/admin/stats');
    return response || { stats: [] };
  },

  // Preparation Planning
  getPreparationQuantities: async (date) => {
    const response = await adminApiRequest(`/admin/preparation/quantities?date=${date}`);
    return response || { products: [] };
  },
  getMultiDayPreparation: async () => {
    const response = await adminApiRequest('/admin/preparation/multi-day');
    return response || { yesterday: {}, today: {}, tomorrow: {} };
  },
  getTomorrowOrders: async () => {
    const response = await adminApiRequest('/admin/preparation/tomorrow');
    return response || { products: [], tomorrowDate: '', totalOrders: 0, totalProducts: 0, isBeforeCutoff: false };
  },
};

// Delivery API (Public)
export const deliveryAPI = {
  getAreas: async () => {
    const response = await apiRequest('/delivery/areas');
    return response?.areas || [];
  },
  checkAvailability: async (areaId) => {
    return apiRequest(`/delivery/areas/${areaId}/check`);
  },
};

export default {
  auth: authAPI,
  products: productsAPI,
  cart: cartAPI,
  orders: ordersAPI,
  dashboard: dashboardAPI,
  admin: adminAPI,
  delivery: deliveryAPI,
};
