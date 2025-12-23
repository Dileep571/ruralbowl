import { productsAPI, dashboardAPI } from '@/lib/api';

// CLEAN REWRITE: Minimal, safe helpers only.

export async function getProducts(params = {}) {
  try {
    const data = await productsAPI.getAll(params);
    return Array.isArray(data) ? data : (data.products || []);
  } catch (err) {
    console.error('getProducts error:', err);
    return [];
  }
}

export async function getProductById(id) {
  if (!id) return null;
  try {
    const data = await productsAPI.getById(id);
    return data?.product || data || null;
  } catch (err) {
    console.error('getProductById error:', err);
    return null;
  }
}

export async function getCategories() {
  try {
    const data = await productsAPI.getCategories();
    return Array.isArray(data) ? data : (data.categories || []);
  } catch (err) {
    console.error('getCategories error:', err);
    return [];
  }
}

export async function getSubscriptionPlans() {
  try {
    const data = await dashboardAPI.getSubscriptionPlans();
    const plans = Array.isArray(data) ? data : (data.plans || []);
    // Ensure each plan has items array for compatibility
    return plans.map(plan => ({
      ...plan,
      items: plan.items || [],
      features: plan.features || []
    }));
  } catch (err) {
    console.warn('Falling back to static plans:', err?.message);
    return [
      {
        id: 'weekly',
        name: 'Weekly Veg Box',
        price: 399,
        originalPrice: 499,
        interval: 'week',
        duration: '1 week',
        description: 'Fresh seasonal vegetables delivered every week',
        features: ['5-6 different seasonal vegetables', 'Serves 2-3 people', 'Free delivery', 'Customizable preferences'],
        items: ['Tomatoes', 'Potatoes', 'Onions', 'Leafy Greens', 'Seasonal Special'],
        popular: true
      },
      {
        id: 'biweekly',
        name: '15 Days Vegetable Plan',
        price: 549,
        originalPrice: 699,
        interval: '15 days',
        duration: '15 days',
        description: 'Perfect for small families, delivered every 15 days',
        features: ['7-8 different seasonal vegetables', 'Serves 3-4 people', 'Free delivery', 'Recipe suggestions included'],
        items: ['Tomatoes', 'Potatoes', 'Onions', 'Carrots', 'Beans', 'Leafy Greens', 'Seasonal Mix'],
        popular: false
      },
      {
        id: 'monthly',
        name: 'Monthly Vegetable Subscription',
        price: 999,
        originalPrice: 1299,
        interval: 'month',
        duration: '1 month',
        description: 'Complete vegetable solution for the entire month',
        features: ['10-12 different seasonal vegetables', 'Serves 4-5 people', 'Free delivery', 'Weekly recipe guides', 'Priority support'],
        items: ['Tomatoes', 'Potatoes', 'Onions', 'Carrots', 'Beans', 'Cabbage', 'Cauliflower', 'Leafy Greens', 'Seasonal Mix', 'Herbs'],
        popular: false
      }
    ];
  }
}

export async function getTestimonials() {
  return [
    { id: 1, name: 'Priyanka Sharma', rating: 5, text: 'The vegetables are always fresh and delivered on time. RuralBowl has made healthy eating so convenient!' },
    { id: 2, name: 'Rahul Kumar', rating: 4, text: 'Great quality products at reasonable prices. The subscription plan is very convenient.' },
    { id: 3, name: 'Anita Reddy', rating: 5, text: 'Love the variety and freshness. The customer service is excellent too!' },
  ];
}
