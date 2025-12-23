// API Configuration and Helper Functions

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const isDev = process.env.NODE_ENV !== 'production';

// Helper function to get auth token from localStorage
const getAuthToken = (isAdminRequest = false) => {
  if (typeof window !== 'undefined') {
    // For admin requests, only use adminToken
    // For user requests, only use token
    if (isAdminRequest) {
      return localStorage.getItem('adminToken');
    }
    return localStorage.getItem('token');
  }
  return null;
};

// Helper to call refresh endpoint and store new token if available
const tryRefresh = async () => {
  try {
    if (isDev) console.log('Attempting token refresh');
    const resp = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await resp.json();
    if (!resp.ok) {
      if (isDev) console.warn('Refresh failed', json);
      return null;
    }
    if (json.token) {
      localStorage.setItem('token', json.token);
      return json.token;
    }
    return null;
  } catch (err) {
    console.error('Refresh error:', err);
    return null;
  }
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  let token = getAuthToken();
  
  const baseHeaders = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    baseHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: baseHeaders,
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
      const newToken = await tryRefresh();
      if (newToken) {
        // retry original request with new token
        const retryHeaders = {
          ...baseHeaders,
          'Authorization': `Bearer ${newToken}`,
        };
        const retryConfig = { ...config, headers: retryHeaders };
        const retryRes = await fetch(`${API_URL}${endpoint}`, retryConfig);
        const retryData = await retryRes.json();
        if (!retryRes.ok) {
          throw new Error(retryData.message || 'Something went wrong');
        }
        return retryData;
      }

      // Refresh failed -> clear local auth and throw
      localStorage.removeItem('token');
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

// Helper function to make admin API requests (always uses adminToken)
const adminApiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken(true); // Get admin token specifically
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
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
    
    // Store token in localStorage after registration
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  login: async (credentials) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Store token in localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  logout: async () => {
    try {
      // Call server to revoke refresh token cookie
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore server errors on logout
      if (isDev) console.warn('Logout request failed', e);
    }
    localStorage.removeItem('token');
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
    return !!getAuthToken();
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
    const response = await apiRequest('/products/categories');
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

  add: async (product_id, quantity = 1) => {
    return apiRequest('/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id, quantity }),
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
    const response = await adminApiRequest('/admin/categories');
    // Backend returns { categories: [...] }
    return response?.categories || response || [];
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
  updateCategory: (id, categoryData) => {
    return adminApiRequest(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
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
};

export default {
  auth: authAPI,
  products: productsAPI,
  cart: cartAPI,
  orders: ordersAPI,
  dashboard: dashboardAPI,
  admin: adminAPI,
};
